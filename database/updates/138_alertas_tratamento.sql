-- =====================================================
-- 🚨 MIGRATION 138: ALERTAS TRATAMENTO (Radar de Evasão)
-- Descrição: Migra status de alertas de localStorage para
--            banco de dados, permitindo sincronização entre
--            gestores e dispositivos.
-- =====================================================

-- 1. Tabela de tratamento de alertas
CREATE TABLE IF NOT EXISTS public.alertas_tratamento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    aluno_id TEXT NOT NULL,
    usuario_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'tratado', 'arquivado')),
    observacao TEXT,
    data_criacao TIMESTAMPTZ DEFAULT NOW(),
    data_atualizacao TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, aluno_id, usuario_id)
);

-- 2. Índice para performance
CREATE INDEX IF NOT EXISTS idx_alertas_tenant_aluno ON public.alertas_tratamento(tenant_id, aluno_id);
CREATE INDEX IF NOT EXISTS idx_alertas_usuario ON public.alertas_tratamento(usuario_id);

-- 3. Trigger para atualizar data_atualizacao automaticamente
CREATE OR REPLACE FUNCTION fn_atualizar_data_alerta()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_atualizar_data_alerta ON public.alertas_tratamento;
CREATE TRIGGER trg_atualizar_data_alerta
    BEFORE UPDATE ON public.alertas_tratamento
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_data_alerta();

-- 4. RLS Policies
ALTER TABLE public.alertas_tratamento ENABLE ROW LEVEL SECURITY;

-- Drop policies existentes (idempotente)
DROP POLICY IF EXISTS "alertas_gestor_select" ON public.alertas_tratamento;
DROP POLICY IF EXISTS "alertas_gestor_insert" ON public.alertas_tratamento;
DROP POLICY IF EXISTS "alertas_gestor_update" ON public.alertas_tratamento;
DROP POLICY IF EXISTS "alertas_gestor_delete" ON public.alertas_tratamento;

-- Gestores podem ver todos os alertas da sua escola
CREATE POLICY "alertas_gestor_select"
    ON public.alertas_tratamento
    FOR SELECT
    TO authenticated
    USING (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id');

-- Gestores podem inserir alertas na sua escola
CREATE POLICY "alertas_gestor_insert"
    ON public.alertas_tratamento
    FOR INSERT
    TO authenticated
    WITH CHECK (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id');

-- Gestores podem atualizar alertas da sua escola
CREATE POLICY "alertas_gestor_update"
    ON public.alertas_tratamento
    FOR UPDATE
    TO authenticated
    USING (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id')
    WITH CHECK (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id');

-- Gestores podem deletar alertas da sua escola
CREATE POLICY "alertas_gestor_delete"
    ON public.alertas_tratamento
    FOR DELETE
    TO authenticated
    USING (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id');

-- 5. Histórico de ações (audit log)
CREATE TABLE IF NOT EXISTS public.alertas_historico (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    alerta_id TEXT NOT NULL,
    aluno_nome TEXT NOT NULL,
    status_anterior TEXT,
    status_novo TEXT NOT NULL,
    observacao TEXT,
    usuario_id TEXT NOT NULL,
    usuario_nome TEXT,
    data_acao TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alertas_hist_tenant ON public.alertas_historico(tenant_id, alerta_id);
CREATE INDEX IF NOT EXISTS idx_alertas_hist_data ON public.alertas_historico(data_acao DESC);

-- RLS para histórico
ALTER TABLE public.alertas_historico ENABLE ROW LEVEL SECURITY;

-- Drop policies existentes (idempotente)
DROP POLICY IF EXISTS "alertas_hist_gestor_select" ON public.alertas_historico;
DROP POLICY IF EXISTS "alertas_hist_gestor_insert" ON public.alertas_historico;

CREATE POLICY "alertas_hist_gestor_select"
    ON public.alertas_historico
    FOR SELECT
    TO authenticated
    USING (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id');

CREATE POLICY "alertas_hist_gestor_insert"
    ON public.alertas_historico
    FOR INSERT
    TO authenticated
    WITH CHECK (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id');
