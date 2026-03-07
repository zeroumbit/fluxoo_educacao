-- =============================================================================
-- 038: Dashboard Radar RLS Fix
-- Garante que as views do Radar de Evasão respeitam tenant_id (RLS por filtro)
-- e que a vw_radar_evasao filtra corretamente por tenant.
-- =============================================================================

-- Recriar a view de faltas consecutivas com tenant_id garantido
CREATE OR REPLACE VIEW vw_aluno_faltas_consecutivas WITH (security_invoker = on) AS
SELECT
    aluno_id,
    tenant_id,
    COUNT(*) AS faltas_consecutivas
FROM frequencias
WHERE status = 'falta'
  AND data_aula >= current_date - interval '21 days'
GROUP BY aluno_id, tenant_id;

-- Recriar a view de cobranças atrasadas com tenant_id garantido
CREATE OR REPLACE VIEW vw_aluno_financeiro_atrasado WITH (security_invoker = on) AS
SELECT
    aluno_id,
    tenant_id,
    COUNT(*) AS cobrancas_atrasadas
FROM cobrancas
WHERE status = 'atrasado'
GROUP BY aluno_id, tenant_id;

-- Recriar a view principal Radar de Evasão
-- Inclui alunos com >= 3 faltas nos últimos 21 dias OU >= 1 cobrança atrasada
CREATE OR REPLACE VIEW vw_radar_evasao WITH (security_invoker = on) AS
SELECT
    a.id         AS aluno_id,
    a.tenant_id,
    a.nome_completo,
    COALESCE(f.faltas_consecutivas, 0) AS faltas_consecutivas,
    COALESCE(c.cobrancas_atrasadas, 0) AS cobrancas_atrasadas
FROM alunos a
LEFT JOIN vw_aluno_faltas_consecutivas f
       ON f.aluno_id = a.id AND f.tenant_id = a.tenant_id
LEFT JOIN vw_aluno_financeiro_atrasado c
       ON c.aluno_id = a.id AND c.tenant_id = a.tenant_id
WHERE a.status = 'ativo'
  AND (
    COALESCE(f.faltas_consecutivas, 0) >= 3
    OR COALESCE(c.cobrancas_atrasadas, 0) >= 1
  );

-- Índice adicional para acelerar consultas do mural
CREATE INDEX IF NOT EXISTS idx_mural_avisos_tenant_created
    ON mural_avisos (tenant_id, created_at DESC);

-- Índice para frequências por status e data
CREATE INDEX IF NOT EXISTS idx_frequencias_tenant_status_data
    ON frequencias (tenant_id, status, data_aula DESC);

-- Índice para cobranças atrasadas por tenant
CREATE INDEX IF NOT EXISTS idx_cobrancas_tenant_atrasado
    ON cobrancas (tenant_id, status)
    WHERE status = 'atrasado';
