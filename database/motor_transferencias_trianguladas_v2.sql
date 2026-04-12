-- migration: motor_transferencias_trianguladas_v2.sql
-- Descrição: Refinamento Enterprise do Motor de Transferências

-- 1. SHORT ID (Friendly ID) NA TABELA ALUNOS
-- Garante a coluna e as restrições rígidas
DO $$
BEGIN
    -- Adiciona a coluna se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alunos' AND column_name = 'codigo_transferencia') THEN
        ALTER TABLE public.alunos ADD COLUMN codigo_transferencia VARCHAR(8);
    END IF;

    -- Adiciona Unique se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alunos_codigo_transferencia_key') THEN
        ALTER TABLE public.alunos ADD CONSTRAINT alunos_codigo_transferencia_key UNIQUE (codigo_transferencia);
    END IF;

    -- Adiciona Check Constraint (Regex para 8 caracteres alfanuméricos maiúsculos)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alunos_codigo_transferencia_check') THEN
        ALTER TABLE public.alunos ADD CONSTRAINT alunos_codigo_transferencia_check CHECK (codigo_transferencia ~ '^[A-Z0-9]{8}$');
    END IF;
END $$;

-- Função PL/pgSQL para geração segura com tratamento de colisão
CREATE OR REPLACE FUNCTION public.fn_gerar_short_id_aluno()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do criador para garantir leitura da tabela inteira no check de colisão
SET search_path = public
AS $$
DECLARE
  novo_codigo VARCHAR(8);
  tentativas INTEGER := 0;
BEGIN
  -- Só gera se estiver nulo
  IF NEW.codigo_transferencia IS NOT NULL THEN
    RETURN NEW;
  END IF;

  LOOP
    -- Gera string aleatória (A-Z, 0-9)
    novo_codigo := array_to_string(ARRAY(
        SELECT substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', (random() * 35)::int + 1, 1)
        FROM generate_series(1, 8)
    ), '');

    -- Verifica por colisão
    IF NOT EXISTS(SELECT 1 FROM public.alunos WHERE codigo_transferencia = novo_codigo) THEN
      NEW.codigo_transferencia := novo_codigo;
      EXIT;
    END IF;

    tentativas := tentativas + 1;
    IF tentativas > 100 THEN
      RAISE EXCEPTION 'Colisão crítica na geração de Short ID após 100 tentativas.';
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gerar_short_id_aluno ON public.alunos;
CREATE TRIGGER trg_gerar_short_id_aluno
BEFORE INSERT ON public.alunos
FOR EACH ROW
EXECUTE FUNCTION public.fn_gerar_short_id_aluno();


-- 2. TABELA DE TRANSFERÊNCIAS (Versão Enterprise)
CREATE TABLE IF NOT EXISTS public.transferencias_escolares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE RESTRICT,
    escola_origem_id UUID NOT NULL, -- UUID do tenant de origem
    
    -- Destino Híbrido
    escola_destino_id UUID, -- NULL se fora do sistema
    escola_destino_nome_manual TEXT,
    escola_destino_cnpj_manual TEXT,
    
    responsavel_id UUID NOT NULL, -- ID do usuário (auth.users) do responsável
    iniciado_por TEXT NOT NULL CHECK (iniciado_por IN ('origem', 'destino', 'responsavel')),
    
    -- Status e Negócio
    status TEXT NOT NULL DEFAULT 'aguardando_responsavel' 
        CHECK (status IN ('aguardando_responsavel', 'aguardando_liberacao_origem', 'concluido', 'recusado', 'cancelado')),
    motivo_solicitacao TEXT NOT NULL,
    justificativa_recusa TEXT,
    
    -- SLA Automático (+30 dias após aprovação)
    prazo_liberacao DATE,

    -- Auditoria Temporal
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    aprovado_em TIMESTAMP WITH TIME ZONE,
    recusado_em TIMESTAMP WITH TIME ZONE,
    cancelado_em TIMESTAMP WITH TIME ZONE,
    concluido_em TIMESTAMP WITH TIME ZONE,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices Críticos
CREATE INDEX IF NOT EXISTS idx_transf_aluno ON public.transferencias_escolares (aluno_id);
CREATE INDEX IF NOT EXISTS idx_transf_origem ON public.transferencias_escolares (escola_origem_id, status);
CREATE INDEX IF NOT EXISTS idx_transf_destino ON public.transferencias_escolares (escola_destino_id) WHERE escola_destino_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transf_responsavel ON public.transferencias_escolares (responsavel_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.fn_set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transferencias_atualizado_em
BEFORE UPDATE ON public.transferencias_escolares
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_atualizado_em();


-- 3. SEGURANÇA E RLS (Strict Mode)
ALTER TABLE public.transferencias_escolares ENABLE ROW LEVEL SECURITY;

-- Limpeza de políticas
DROP POLICY IF EXISTS "select_transferencias" ON public.transferencias_escolares;
DROP POLICY IF EXISTS "insert_transferencias" ON public.transferencias_escolares;
DROP POLICY IF EXISTS "update_transferencias" ON public.transferencias_escolares;

-- Política de Leitura: Baseada em contexto JWT (tenant_id) ou auth.uid()
CREATE POLICY "select_transferencias" ON public.transferencias_escolares
FOR SELECT TO authenticated
USING (
    -- Super Admin
    (auth.jwt() ->> 'is_super_admin')::boolean = TRUE
    OR
    -- Escola de Origem
    (escola_origem_id = (auth.jwt() ->> 'tenant_id')::uuid)
    OR
    -- Escola de Destino (Se existir no sistema)
    (escola_destino_id = (auth.jwt() ->> 'tenant_id')::uuid)
    OR
    -- Responsável (Dono da aprovação)
    (responsavel_id = auth.uid())
);

-- Política de Inserção: Permitida para escolas ou responsáveis
CREATE POLICY "insert_transferencias" ON public.transferencias_escolares
FOR INSERT TO authenticated
WITH CHECK (
    (escola_origem_id = (auth.jwt() ->> 'tenant_id')::uuid)
    OR
    (escola_destino_id = (auth.jwt() ->> 'tenant_id')::uuid)
    OR
    (responsavel_id = auth.uid())
);

-- POLÍTICA DE UPDATE LOCAL: NEGADA (Bloqueamos updates diretos via API PostgREST)
-- A alteração de estado DEVE ser feita via RPC para garantir auditoria dos timestamps.


-- 4. FUNÇÕES RPC PARA TRANSIÇÃO DE ESTADO (Server-Side Logic)

-- Aprovar Transferência
CREATE OR REPLACE FUNCTION public.aprovar_transferencia(p_transferencia_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER -- Executa com as permissões do usuário mas lógica interna é blindada
AS $$
DECLARE
    v_responsavel_id UUID;
    v_status TEXT;
BEGIN
    -- Seleciona dados para validação
    SELECT responsavel_id, status INTO v_responsavel_id, v_status
    FROM public.transferencias_escolares
    WHERE id = p_transferencia_id;

    -- Validação de Identidade (Apenas o responsável pode aprovar)
    IF v_responsavel_id <> auth.uid() THEN
        RAISE EXCEPTION 'Permissão negada: Apenas o responsável vinculado pode aprovar esta transferência.';
    END IF;

    -- Validação de Estado
    IF v_status <> 'aguardando_responsavel' THEN
        RAISE EXCEPTION 'Operação inválida: A transferência não está em estado de aprovação pendente.';
    END IF;

    -- Update Atômico e Seguro
    UPDATE public.transferencias_escolares
    SET 
        status = 'aguardando_liberacao_origem',
        aprovado_em = now(),
        prazo_liberacao = CURRENT_DATE + INTERVAL '30 days'
    WHERE id = p_transferencia_id;

END;
$$;

-- Recusar Transferência
CREATE OR REPLACE FUNCTION public.recusar_transferencia(p_transferencia_id UUID, p_justificativa TEXT)
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

    IF v_responsavel_id <> auth.uid() THEN
        RAISE EXCEPTION 'Permissão negada: Apenas o responsável vinculado pode recusar esta transferência.';
    END IF;

    UPDATE public.transferencias_escolares
    SET 
        status = 'recusado',
        recusado_em = now(),
        justificativa_recusa = p_justificativa
    WHERE id = p_transferencia_id;
END;
$$;

-- COMENTÁRIOS DE SEGURANÇA
COMMENT ON TABLE public.transferencias_escolares IS 'Tabela central de transferências com lógica hibrida (dentro/fora do sistema) e auditoria temporal.';
COMMENT ON FUNCTION public.aprovar_transferencia IS 'Transiciona a transferência para aguardando_liberacao_origem e define o SLA de 30 dias.';
COMMENT ON FUNCTION public.recusar_transferencia IS 'Encerra a solicitação por parte do responsável com justificativa obrigatória.';
