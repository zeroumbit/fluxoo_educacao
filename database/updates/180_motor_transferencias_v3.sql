-- ============================================================
-- 180_motor_transferencias_v3.sql
-- Motor de Transferências Trianguladas V3
-- Suporta 3 fluxos: Origem, Destino, Responsável
-- Estratégia de conclusão: CÓPIA (escola origem mantém histórico)
-- ============================================================

-- ─── 1. NOVOS STATUS E COLUNAS ────────────────────────────────

-- Atualizar CHECK constraint com novos status
ALTER TABLE public.transferencias_escolares
  DROP CONSTRAINT IF EXISTS transferencias_escolares_status_check;

ALTER TABLE public.transferencias_escolares
  ADD CONSTRAINT transferencias_escolares_status_check
  CHECK (status IN (
    'aguardando_responsavel',
    'aguardando_aceite_destino',
    'aguardando_liberacao_origem',
    'concluido',
    'recusado',
    'cancelado',
    'expirado'
  ));

-- Novas colunas para controle de prazos e aceite
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transferencias_escolares' AND column_name = 'prazo_responsavel') THEN
        ALTER TABLE public.transferencias_escolares ADD COLUMN prazo_responsavel DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transferencias_escolares' AND column_name = 'prazo_aceite_destino') THEN
        ALTER TABLE public.transferencias_escolares ADD COLUMN prazo_aceite_destino DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transferencias_escolares' AND column_name = 'aceite_destino_em') THEN
        ALTER TABLE public.transferencias_escolares ADD COLUMN aceite_destino_em TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transferencias_escolares' AND column_name = 'recusado_por') THEN
        ALTER TABLE public.transferencias_escolares ADD COLUMN recusado_por TEXT;
    END IF;
END $$;

-- Adicionar CHECK para recusado_por se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transferencias_escolares_recusado_por_check') THEN
        ALTER TABLE public.transferencias_escolares
          ADD CONSTRAINT transferencias_escolares_recusado_por_check
          CHECK (recusado_por IS NULL OR recusado_por IN ('responsavel', 'escola_origem', 'escola_destino'));
    END IF;
END $$;

-- Garantir que iniciado_por aceita 'responsavel'
ALTER TABLE public.transferencias_escolares
  DROP CONSTRAINT IF EXISTS transferencias_escolares_iniciado_por_check;

ALTER TABLE public.transferencias_escolares
  ADD CONSTRAINT transferencias_escolares_iniciado_por_check
  CHECK (iniciado_por IN ('origem', 'destino', 'responsavel'));


-- ─── 2. RPC: APROVAR TRANSFERÊNCIA (V3 - Roteamento condicional) ──

CREATE OR REPLACE FUNCTION public.aprovar_transferencia(p_transferencia_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_responsavel_id UUID;
    v_status         TEXT;
    v_iniciado_por   TEXT;
    v_destino_id     UUID;
BEGIN
    SELECT responsavel_id, status, iniciado_por, escola_destino_id
    INTO v_responsavel_id, v_status, v_iniciado_por, v_destino_id
    FROM public.transferencias_escolares
    WHERE id = p_transferencia_id;

    -- Validação: apenas o responsável vinculado pode aprovar
    IF v_responsavel_id IS NOT NULL AND v_responsavel_id <> auth.uid() THEN
        RAISE EXCEPTION 'Permissão negada: apenas o responsável vinculado pode aprovar.';
    END IF;

    -- Validação: só pode aprovar se aguardando responsável
    IF v_status <> 'aguardando_responsavel' THEN
        RAISE EXCEPTION 'Operação inválida: a transferência não está aguardando aprovação. Status: %', v_status;
    END IF;

    -- Roteamento condicional por quem iniciou
    IF v_iniciado_por = 'origem' AND v_destino_id IS NOT NULL THEN
        -- Escola ORIGEM iniciou → próximo passo é escola DESTINO aceitar
        UPDATE public.transferencias_escolares
        SET
            status              = 'aguardando_aceite_destino',
            aprovado_em         = now(),
            prazo_aceite_destino = CURRENT_DATE + INTERVAL '7 days' -- ~5 dias úteis
        WHERE id = p_transferencia_id;

    ELSIF v_iniciado_por = 'destino' THEN
        -- Escola DESTINO iniciou → destino já aceitou implicitamente → vai para origem liberar
        UPDATE public.transferencias_escolares
        SET
            status           = 'aguardando_liberacao_origem',
            aprovado_em      = now(),
            prazo_liberacao   = CURRENT_DATE + INTERVAL '30 days'
        WHERE id = p_transferencia_id;

    ELSIF v_iniciado_por = 'responsavel' THEN
        -- RESPONSÁVEL iniciou → vai para escola origem liberar
        UPDATE public.transferencias_escolares
        SET
            status           = 'aguardando_liberacao_origem',
            aprovado_em      = now(),
            prazo_liberacao   = CURRENT_DATE + INTERVAL '30 days'
        WHERE id = p_transferencia_id;

    ELSE
        -- Fallback: escola origem iniciou mas destino fora do sistema
        UPDATE public.transferencias_escolares
        SET
            status           = 'aguardando_liberacao_origem',
            aprovado_em      = now(),
            prazo_liberacao   = CURRENT_DATE + INTERVAL '30 days'
        WHERE id = p_transferencia_id;
    END IF;
END;
$$;


-- ─── 3. RPC: RECUSAR TRANSFERÊNCIA (V3 - rastreia quem recusou) ──

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
    v_status         TEXT;
BEGIN
    IF p_justificativa IS NULL OR trim(p_justificativa) = '' THEN
        RAISE EXCEPTION 'A justificativa de recusa é obrigatória.';
    END IF;

    SELECT responsavel_id, status INTO v_responsavel_id, v_status
    FROM public.transferencias_escolares
    WHERE id = p_transferencia_id;

    -- Apenas o responsável pode recusar quando está aguardando_responsavel
    IF v_status <> 'aguardando_responsavel' THEN
        RAISE EXCEPTION 'Operação inválida: a transferência não está aguardando aprovação do responsável.';
    END IF;

    IF v_responsavel_id IS NOT NULL AND v_responsavel_id <> auth.uid() THEN
        RAISE EXCEPTION 'Permissão negada: apenas o responsável vinculado pode recusar.';
    END IF;

    UPDATE public.transferencias_escolares
    SET
        status              = 'recusado',
        recusado_em         = now(),
        recusado_por        = 'responsavel',
        justificativa_recusa = p_justificativa
    WHERE id = p_transferencia_id;
END;
$$;


-- ─── 4. RPC: ESCOLA DESTINO ACEITA ─────────────────────────────

CREATE OR REPLACE FUNCTION public.aceitar_transferencia_destino(p_transferencia_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_escola_destino_id UUID;
    v_status            TEXT;
    v_tenant_id         UUID;
BEGIN
    v_tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;

    SELECT escola_destino_id, status
    INTO v_escola_destino_id, v_status
    FROM public.transferencias_escolares
    WHERE id = p_transferencia_id;

    -- Validação: apenas a escola destino pode aceitar
    IF v_escola_destino_id <> v_tenant_id THEN
        RAISE EXCEPTION 'Permissão negada: apenas a escola de destino pode aceitar esta transferência.';
    END IF;

    -- Validação: só pode aceitar se está aguardando aceite
    IF v_status <> 'aguardando_aceite_destino' THEN
        RAISE EXCEPTION 'Operação inválida: transferência não aguarda aceite da escola destino. Status: %', v_status;
    END IF;

    UPDATE public.transferencias_escolares
    SET
        status              = 'aguardando_liberacao_origem',
        aceite_destino_em   = now(),
        prazo_liberacao      = CURRENT_DATE + INTERVAL '30 days'
    WHERE id = p_transferencia_id;
END;
$$;

COMMENT ON FUNCTION public.aceitar_transferencia_destino IS
  'Escola destino aceita a transferência. Transiciona para aguardando_liberacao_origem com prazo de 30 dias.';


-- ─── 5. RPC: ESCOLA DESTINO RECUSA ─────────────────────────────

CREATE OR REPLACE FUNCTION public.recusar_transferencia_destino(
    p_transferencia_id UUID,
    p_justificativa    TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_escola_destino_id UUID;
    v_status            TEXT;
    v_tenant_id         UUID;
BEGIN
    IF p_justificativa IS NULL OR trim(p_justificativa) = '' THEN
        RAISE EXCEPTION 'A justificativa de recusa é obrigatória.';
    END IF;

    v_tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;

    SELECT escola_destino_id, status
    INTO v_escola_destino_id, v_status
    FROM public.transferencias_escolares
    WHERE id = p_transferencia_id;

    IF v_escola_destino_id <> v_tenant_id THEN
        RAISE EXCEPTION 'Permissão negada: apenas a escola de destino pode recusar.';
    END IF;

    IF v_status <> 'aguardando_aceite_destino' THEN
        RAISE EXCEPTION 'Operação inválida: transferência não aguarda aceite da escola destino.';
    END IF;

    UPDATE public.transferencias_escolares
    SET
        status              = 'recusado',
        recusado_em         = now(),
        recusado_por        = 'escola_destino',
        justificativa_recusa = p_justificativa
    WHERE id = p_transferencia_id;
END;
$$;

COMMENT ON FUNCTION public.recusar_transferencia_destino IS
  'Escola destino recusa a transferência com justificativa obrigatória.';


-- ─── 6. RPC: CONCLUIR COM INTEGRAÇÃO (Cópia de dados) ──────────

CREATE OR REPLACE FUNCTION public.concluir_transferencia_integrar(p_transferencia_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER  -- Precisa de permissão elevada para inserir em outro tenant
SET search_path = public
AS $$
DECLARE
    v_transf              RECORD;
    v_aluno_origem        RECORD;
    v_tenant_id           UUID;
    v_novo_aluno_id       UUID;
    v_responsavel_record  RECORD;
BEGIN
    v_tenant_id := (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid;

    -- Buscar transferência
    SELECT * INTO v_transf
    FROM public.transferencias_escolares
    WHERE id = p_transferencia_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transferência não encontrada.';
    END IF;

    -- Validação: apenas a escola de origem pode concluir
    IF v_transf.escola_origem_id <> v_tenant_id THEN
        RAISE EXCEPTION 'Permissão negada: apenas a escola de origem pode concluir a transferência.';
    END IF;

    -- Validação: deve estar aguardando liberação
    IF v_transf.status <> 'aguardando_liberacao_origem' THEN
        RAISE EXCEPTION 'Operação inválida: transferência não está aguardando liberação. Status: %', v_transf.status;
    END IF;

    -- Buscar dados do aluno na escola de origem
    SELECT * INTO v_aluno_origem
    FROM public.alunos
    WHERE id = v_transf.aluno_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Aluno não encontrado.';
    END IF;

    -- Se a escola destino está no sistema, copiar dados do aluno
    IF v_transf.escola_destino_id IS NOT NULL THEN
        -- Criar CÓPIA do aluno na escola destino (novo UUID, novo tenant)
        INSERT INTO public.alunos (
            tenant_id,
            nome_completo,
            data_nascimento,
            cpf,
            rg,
            genero,
            naturalidade,
            nacionalidade,
            endereco,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            cep,
            telefone,
            email,
            foto_url,
            necessidades_especiais,
            observacoes,
            status
        )
        VALUES (
            v_transf.escola_destino_id,
            v_aluno_origem.nome_completo,
            v_aluno_origem.data_nascimento,
            v_aluno_origem.cpf,
            v_aluno_origem.rg,
            v_aluno_origem.genero,
            v_aluno_origem.naturalidade,
            v_aluno_origem.nacionalidade,
            v_aluno_origem.endereco,
            v_aluno_origem.numero,
            v_aluno_origem.complemento,
            v_aluno_origem.bairro,
            v_aluno_origem.cidade,
            v_aluno_origem.estado,
            v_aluno_origem.cep,
            v_aluno_origem.telefone,
            v_aluno_origem.email,
            v_aluno_origem.foto_url,
            v_aluno_origem.necessidades_especiais,
            'Transferido de: ' || (SELECT razao_social FROM public.escolas WHERE id = v_transf.escola_origem_id),
            'ativo'
        )
        RETURNING id INTO v_novo_aluno_id;

        -- Copiar vínculos com responsáveis
        FOR v_responsavel_record IN
            SELECT responsavel_id, grau_parentesco, is_principal
            FROM public.aluno_responsavel
            WHERE aluno_id = v_transf.aluno_id
        LOOP
            INSERT INTO public.aluno_responsavel (aluno_id, responsavel_id, grau_parentesco, is_principal)
            VALUES (v_novo_aluno_id, v_responsavel_record.responsavel_id, v_responsavel_record.grau_parentesco, v_responsavel_record.is_principal)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Inativar matrícula na escola de origem
    UPDATE public.matriculas
    SET status = 'transferido'
    WHERE aluno_id = v_transf.aluno_id
      AND tenant_id = v_transf.escola_origem_id
      AND status = 'ativa';

    -- Inativar aluno na escola de origem (mantém dados históricos)
    UPDATE public.alunos
    SET status = 'transferido'
    WHERE id = v_transf.aluno_id;

    -- Marcar transferência como concluída
    UPDATE public.transferencias_escolares
    SET
        status       = 'concluido',
        concluido_em = now()
    WHERE id = p_transferencia_id;

    RETURN 'concluido';
END;
$$;

COMMENT ON FUNCTION public.concluir_transferencia_integrar IS
  'Escola origem conclui a transferência: copia dados do aluno para escola destino, inativa na origem, preserva histórico.';


-- ─── 7. ATUALIZAR TRIGGER DE NOTIFICAÇÕES ──────────────────────

CREATE OR REPLACE FUNCTION public.fn_transferencia_status_changed()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Notificar com base no novo status
        BEGIN
            PERFORM public.fn_criar_notificacao_transferencia(
                NEW.id,
                CASE
                    WHEN NEW.status = 'aguardando_responsavel' THEN 'solicitacao'
                    WHEN NEW.status = 'aguardando_aceite_destino' THEN 'aguardando_aceite_destino'
                    WHEN NEW.status = 'aguardando_liberacao_origem' THEN 'aprovacao'
                    WHEN NEW.status = 'concluido' THEN 'liberacao'
                    WHEN NEW.status = 'recusado' THEN 'recusa'
                    ELSE NULL
                END
            );
        EXCEPTION WHEN OTHERS THEN
            -- Não falhar a transação se a notificação falhar
            RAISE WARNING 'Falha ao criar notificação de transferência: %', SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger para cobrir INSERT também
DROP TRIGGER IF EXISTS trg_transferencia_notificacao ON public.transferencias_escolares;
CREATE TRIGGER trg_transferencia_notificacao
AFTER INSERT OR UPDATE OF status ON public.transferencias_escolares
FOR EACH ROW
EXECUTE FUNCTION public.fn_transferencia_status_changed();


-- ─── 8. VERIFICAÇÃO ────────────────────────────────────────────

DO $$
BEGIN
    RAISE NOTICE '✅ 180_motor_transferencias_v3.sql aplicado com sucesso.';
    RAISE NOTICE '   - Status expandidos: aguardando_aceite_destino, expirado';
    RAISE NOTICE '   - Colunas: prazo_responsavel, prazo_aceite_destino, aceite_destino_em, recusado_por';
    RAISE NOTICE '   - RPCs: aceitar_transferencia_destino, recusar_transferencia_destino';
    RAISE NOTICE '   - RPC: concluir_transferencia_integrar (CÓPIA de dados)';
    RAISE NOTICE '   - RPC: aprovar_transferencia V3 (roteamento condicional)';
    RAISE NOTICE '   - Trigger: notificações expandidas';
END $$;
