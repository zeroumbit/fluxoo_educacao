-- ============================================================
-- 130: Configurações - Histórico Campo-a-Campo
-- Rastreia cada campo alterado individualmente, diferente do
-- histórico de vigências (configuracoes_escola_historico)
-- ============================================================

-- Criação da tabela
CREATE TABLE IF NOT EXISTS configuracoes_historico (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    categoria   TEXT NOT NULL CHECK (categoria IN ('academica', 'financeira', 'operacional', 'conduta', 'calendario')),
    campo       TEXT NOT NULL,
    valor_anterior  TEXT,
    valor_novo      TEXT NOT NULL,
    alterado_por    UUID,
    alterado_em     TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_config_hist_tenant ON configuracoes_historico(tenant_id);
CREATE INDEX IF NOT EXISTS idx_config_hist_campo  ON configuracoes_historico(campo);
CREATE INDEX IF NOT EXISTS idx_config_hist_em     ON configuracoes_historico(alterado_em DESC);

-- RLS: somente o próprio tenant lê
ALTER TABLE configuracoes_historico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS config_hist_select ON configuracoes_historico;
CREATE POLICY config_hist_select ON configuracoes_historico
    FOR SELECT
    USING (
        tenant_id = (
            SELECT schools.id FROM escolas schools
            WHERE schools.id::text = (auth.jwt() ->> 'tenant_id')
            LIMIT 1
        )
    );

DROP POLICY IF EXISTS config_hist_insert ON configuracoes_historico;
CREATE POLICY config_hist_insert ON configuracoes_historico
    FOR INSERT
    WITH CHECK (
        tenant_id = (
            SELECT schools.id FROM escolas schools
            WHERE schools.id::text = (auth.jwt() ->> 'tenant_id')
            LIMIT 1
        )
    );
