-- ------------------------------------------------------------------------------
-- 0. FUNÇÕES AUXILIARES DE SUPORT (FIX PARA ERRO 42883)
-- ------------------------------------------------------------------------------
-- Se o sistema usa claims do JWT para o tenant_id, esta função ajuda no RLS.
CREATE OR REPLACE FUNCTION public.uid_tenant() 
RETURNS uuid AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid;
$$ LANGUAGE sql STABLE;

-- ------------------------------------------------------------------------------
-- 1. TIPOS DE DADOS CUSTOMIZADOS (ENUMS)
-- ------------------------------------------------------------------------------
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_solicitante_transferencia') THEN
        CREATE TYPE tipo_solicitante_transferencia AS ENUM ('pais', 'escola_destino', 'escola_origem');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_transferencia') THEN
        CREATE TYPE status_transferencia AS ENUM (
            'pendente_pais',       -- Aguardando aprovação da família
            'pendente_destino',    -- Família pediu, aguardando escola B aceitar
            'pendente_origem',     -- Aguardando escola A liberar documentos/handover
            'recusada',            -- Alguém negou (Pais ou Escola B)
            'cancelada',           -- Solicitante desistiu
            'concluida'            -- Processo finalizado com sucesso
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'severidade_advertencia') THEN
        CREATE TYPE severidade_advertencia AS ENUM ('baixa', 'media', 'alta', 'bloqueio');
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. ATUALIZAÇÃO DA TABELA DE ESCOLAS (TENANTS) - COMPLIANCE E REPUTAÇÃO
-- ------------------------------------------------------------------------------
-- Adiciona as colunas de "Kill Switch" e "Score" na tabela de escolas existente
ALTER TABLE public.escolas 
ADD COLUMN IF NOT EXISTS permissao_solicitacao_ativa BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS reputacao_rede INTEGER DEFAULT 100 CHECK (reputacao_rede >= 0 AND reputacao_rede <= 100);

COMMENT ON COLUMN public.escolas.permissao_solicitacao_ativa IS 'Kill Switch do Super Admin para bloquear captação ativa indevida.';
COMMENT ON COLUMN public.escolas.reputacao_rede IS 'Score de 0 a 100 baseado no comportamento ético da escola na rede Fluxoo.';

-- ------------------------------------------------------------------------------
-- 3. TABELA DE ADVERTÊNCIAS E AUDITORIA DO SUPER ADMIN
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.advertencias_escola (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    motivo TEXT NOT NULL,
    severidade severidade_advertencia NOT NULL,
    criado_por UUID NOT NULL, -- Referência ao Super Admin que aplicou a punição
    metadata JSONB, -- Para guardar links de denúncias ou prints (provas)
    resolvido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. TABELA CORE: MOTOR DE TRANSFERÊNCIAS (BILATERAIS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transferencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação Central
    aluno_id UUID NOT NULL REFERENCES public.alunos(id),
    origem_tenant_id UUID NOT NULL REFERENCES public.escolas(id),
    destino_tenant_id UUID NOT NULL REFERENCES public.escolas(id),
    
    -- Metadados da Solicitação
    solicitante_tipo tipo_solicitante_transferencia NOT NULL,
    status status_transferencia DEFAULT 'pendente_pais',
    
    -- Consentimentos (Obrigatórios para o avanço do fluxo)
    aprovacao_responsavel BOOLEAN DEFAULT FALSE,
    aprovacao_escola_destino BOOLEAN DEFAULT FALSE,
    
    -- Detalhes Operacionais
    token_transferencia TEXT UNIQUE, -- Gerado para migração de dados segura
    motivo_solicitacao TEXT,
    observacoes_recusa TEXT,
    
    -- Datas e Auditoria
    data_solicitacao TIMESTAMPTZ DEFAULT NOW(),
    data_conclusao TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. BLINDAGEM DE BANCO DE DADOS (ZERO TRUST) E FUNÇÕES
-- ------------------------------------------------------------------------------

-- Função para Validar se a Escola pode solicitar alunos
CREATE OR REPLACE FUNCTION public.fn_pode_solicitar_transferencia(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_permitido BOOLEAN;
BEGIN
    SELECT permissao_solicitacao_ativa INTO v_permitido 
    FROM public.escolas 
    WHERE id = p_tenant_id;
    
    RETURN COALESCE(v_permitido, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Trigger Function: Impede inserção de transferência se a escola destino (que está captando) estiver bloqueada
CREATE OR REPLACE FUNCTION public.fn_trava_solicitacao_indevida()
RETURNS TRIGGER AS $$
BEGIN
    -- Se a escola de destino é quem está solicitando ativamente um aluno
    IF NEW.solicitante_tipo = 'escola_destino' THEN
        IF NOT public.fn_pode_solicitar_transferencia(NEW.destino_tenant_id) THEN
            RAISE EXCEPTION 'Ação Bloqueada (Compliance): Sua instituição está temporariamente suspensa de realizar solicitações ativas de alunos por violação das diretrizes da rede Fluxoo.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Anexa a Trigger à tabela de transferências
DROP TRIGGER IF EXISTS trg_validar_permissao_solicitacao ON public.transferencias;
CREATE TRIGGER trg_validar_permissao_solicitacao
BEFORE INSERT ON public.transferencias
FOR EACH ROW
EXECUTE FUNCTION public.fn_trava_solicitacao_indevida();

-- Trigger Function: Atualiza a data de 'updated_at'
CREATE OR REPLACE FUNCTION public.fn_set_transferencia_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_transferencias_updated_at ON public.transferencias;
CREATE TRIGGER trg_transferencias_updated_at
BEFORE UPDATE ON public.transferencias
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_transferencia_updated_at();

-- ------------------------------------------------------------------------------
-- 6. SEGURANÇA MULTI-TENANT (ROW LEVEL SECURITY - RLS)
-- ------------------------------------------------------------------------------

ALTER TABLE public.advertencias_escola ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transferencias ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para Transferências:
-- Uma escola só pode ver a transferência se ela for a Origem ou o Destino
CREATE POLICY "Visibilidade Bilateral de Transferencias"
ON public.transferencias
FOR SELECT
USING (
    origem_tenant_id = public.uid_tenant() 
    OR 
    destino_tenant_id = public.uid_tenant()
);

-- A escola só pode inserir transferências onde ela é Origem ou Destino
CREATE POLICY "Insercao de Transferencias"
ON public.transferencias
FOR INSERT
WITH CHECK (
    origem_tenant_id = public.uid_tenant() 
    OR 
    destino_tenant_id = public.uid_tenant()
);

-- ------------------------------------------------------------------------------
-- 7. ÍNDICES DE PERFORMANCE PARA DASHBOARDS (MATCHING E LISTAGENS)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_transferencias_origem ON public.transferencias(origem_tenant_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_destino ON public.transferencias(destino_tenant_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_status ON public.transferencias(status);
CREATE INDEX IF NOT EXISTS idx_transferencias_aluno ON public.transferencias(aluno_id);
CREATE INDEX IF NOT EXISTS idx_escolas_reputacao ON public.escolas(reputacao_rede);

-- ------------------------------------------------------------------------------
-- 8. VIEW ANALÍTICA: NOTIFICAÇÕES DE TRANSFERÊNCIA (ZERO COST AI)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_notificacoes_transferencia AS
SELECT 
    t.id AS transferencia_id,
    t.status,
    t.solicitante_tipo,
    t.aprovacao_responsavel,
    t.data_solicitacao,
    a.nome_completo AS aluno_nome,
    e_origem.id AS origem_id,
    e_origem.razao_social AS escola_origem,
    e_destino.id AS destino_id,
    e_destino.razao_social AS escola_destino,
    e_destino.reputacao_rede AS destino_reputacao
FROM public.transferencias t
JOIN public.alunos a ON t.aluno_id = a.id
JOIN public.escolas e_origem ON t.origem_tenant_id = e_origem.id
JOIN public.escolas e_destino ON t.destino_tenant_id = e_destino.id;
