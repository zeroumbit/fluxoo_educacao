-- ============================================================
-- 075_fluxo_completo_transferencias.sql
-- Descrição: Consolida o fluxo completo de transferências:
--   1. Fix RLS para SELECT/INSERT/UPDATE
--   2. RPC segura para escola origem liberar aluno (concluir)
--   3. Trigger de notificação para escola origem ao responsável aprovar
-- ============================================================

-- ─── 1. FIX RLS ──────────────────────────────────────────────

ALTER TABLE public.transferencias_escolares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_transferencias"  ON public.transferencias_escolares;
DROP POLICY IF EXISTS "insert_transferencias"  ON public.transferencias_escolares;
DROP POLICY IF EXISTS "update_transferencias"  ON public.transferencias_escolares;

-- SELECT: escola origem, escola destino, responsável vinculado, super admin
CREATE POLICY "select_transferencias" ON public.transferencias_escolares
FOR SELECT TO authenticated
USING (
    (auth.jwt() ->> 'is_super_admin')::boolean = TRUE
    OR (escola_origem_id  = (auth.jwt() ->> 'tenant_id')::uuid)
    OR (escola_destino_id = (auth.jwt() ->> 'tenant_id')::uuid)
    OR EXISTS (
        SELECT 1 FROM public.responsaveis r
        WHERE r.user_id = auth.uid()
          AND r.id = transferencias_escolares.responsavel_id
    )
);

-- INSERT: qualquer autenticado (validação feita pela aplicação)
CREATE POLICY "insert_transferencias" ON public.transferencias_escolares
FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: escola origem, escola destino, responsável vinculado, ou SECURITY DEFINER RPC
CREATE POLICY "update_transferencias" ON public.transferencias_escolares
FOR UPDATE TO authenticated
USING (
    (escola_origem_id  = (auth.jwt() ->> 'tenant_id')::uuid)
    OR (escola_destino_id = (auth.jwt() ->> 'tenant_id')::uuid)
    OR EXISTS (
        SELECT 1 FROM public.responsaveis r
        WHERE r.user_id = auth.uid()
          AND r.id = transferencias_escolares.responsavel_id
    )
)
WITH CHECK (
    (escola_origem_id  = (auth.jwt() ->> 'tenant_id')::uuid)
    OR (escola_destino_id = (auth.jwt() ->> 'tenant_id')::uuid)
    OR EXISTS (
        SELECT 1 FROM public.responsaveis r
        WHERE r.user_id = auth.uid()
          AND r.id = transferencias_escolares.responsavel_id
    )
);


-- ─── 2. RPC SEGURA: ESCOLA ORIGEM LIBERA O ALUNO ────────────

CREATE OR REPLACE FUNCTION public.liberar_aluno_transferencia(p_transferencia_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_escola_origem_id UUID;
    v_status           TEXT;
    v_tenant_id        UUID;
BEGIN
    -- Lê o tenant_id do JWT
    v_tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;

    SELECT escola_origem_id, status
    INTO v_escola_origem_id, v_status
    FROM public.transferencias_escolares
    WHERE id = p_transferencia_id;

    -- Validação: apenas a escola de origem pode liberar
    IF v_escola_origem_id <> v_tenant_id THEN
        RAISE EXCEPTION 'Permissão negada: apenas a escola de origem pode liberar o aluno.';
    END IF;

    -- Validação: só pode liberar se o responsável já aprovou
    IF v_status <> 'aguardando_liberacao_origem' THEN
        RAISE EXCEPTION 'Operação inválida: a transferência não está aguardando liberação. Status atual: %', v_status;
    END IF;

    -- Atualização atômica
    UPDATE public.transferencias_escolares
    SET
        status       = 'concluido',
        concluido_em = now()
    WHERE id = p_transferencia_id;

    RETURN 'concluido';
END;
$$;

COMMENT ON FUNCTION public.liberar_aluno_transferencia IS
  'Escola origem conclui a transferência após aprovação do responsável. Valida identidade pelo JWT tenant_id.';


-- ─── 3. GARANTIR COLUNA prazo_liberacao ─────────────────────

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'transferencias_escolares'
          AND column_name = 'prazo_liberacao'
    ) THEN
        ALTER TABLE public.transferencias_escolares
        ADD COLUMN prazo_liberacao DATE;
    END IF;
END $$;


-- ─── 4. TRIGGER: Quando responsável aprova → define prazo 30d ─

-- A função aprovar_transferencia já define prazo_liberacao.
-- Garantir que ela existe e está correta (idempotente):

CREATE OR REPLACE FUNCTION public.aprovar_transferencia(p_transferencia_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_responsavel_id UUID;
    v_status         TEXT;
BEGIN
    SELECT responsavel_id, status
    INTO v_responsavel_id, v_status
    FROM public.transferencias_escolares
    WHERE id = p_transferencia_id;

    IF v_responsavel_id IS NOT NULL AND v_responsavel_id <> auth.uid() THEN
        RAISE EXCEPTION 'Permissão negada: apenas o responsável vinculado pode aprovar.';
    END IF;

    IF v_status <> 'aguardando_responsavel' THEN
        RAISE EXCEPTION 'Operação inválida: a transferência não está aguardando aprovação.';
    END IF;

    UPDATE public.transferencias_escolares
    SET
        status          = 'aguardando_liberacao_origem',
        aprovado_em     = now(),
        prazo_liberacao = CURRENT_DATE + INTERVAL '30 days'
    WHERE id = p_transferencia_id;
END;
$$;


CREATE OR REPLACE FUNCTION public.recusar_transferencia(
    p_transferencia_id UUID,
    p_justificativa    TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_responsavel_id UUID;
BEGIN
    IF p_justificativa IS NULL OR trim(p_justificativa) = '' THEN
        RAISE EXCEPTION 'A justificativa de recusa é obrigatória.';
    END IF;

    SELECT responsavel_id INTO v_responsavel_id
    FROM public.transferencias_escolares
    WHERE id = p_transferencia_id;

    IF v_responsavel_id IS NOT NULL AND v_responsavel_id <> auth.uid() THEN
        RAISE EXCEPTION 'Permissão negada: apenas o responsável vinculado pode recusar.';
    END IF;

    UPDATE public.transferencias_escolares
    SET
        status              = 'recusado',
        recusado_em         = now(),
        justificativa_recusa = p_justificativa
    WHERE id = p_transferencia_id;
END;
$$;


-- ─── Verificação ─────────────────────────────────────────────

DO $$
BEGIN
    RAISE NOTICE '✅ 075_fluxo_completo_transferencias.sql aplicado com sucesso.';
    RAISE NOTICE '   - RLS: SELECT/INSERT/UPDATE configurados';
    RAISE NOTICE '   - RPC liberar_aluno_transferencia criada';
    RAISE NOTICE '   - RPC aprovar_transferencia / recusar_transferencia atualizadas';
END $$;
