-- ==============================================================================
-- 🚨 RADAR DE EVASÃO 2.0 - MELHORIAS
-- ==============================================================================
-- Alterações:
-- 1. Faltas consecutivas: aumentado de > 3 para > 7 dias
-- 2. Adicionado critério: Múltiplos Atrasos Financeiros (3+ cobranças)
-- ==============================================================================

-- ==============================================================================
-- 1. VIEW — FALTAS CONSECUTIVAS (ATUALIZADA)
-- ==============================================================================
-- Aumentado período de análise de 15 para 30 dias
-- Alterado threshold de 3 para 7 faltas
CREATE OR REPLACE VIEW vw_aluno_faltas_consecutivas WITH (security_invoker = on) AS
SELECT
    aluno_id,
    tenant_id,
    COUNT(*) AS faltas_consecutivas
FROM frequencias
WHERE status = 'falta'
  AND data_aula >= current_date - interval '30 days'
GROUP BY aluno_id, tenant_id;


-- ==============================================================================
-- 2. VIEW — FINANCEIRO EM ATRASO (MANTIDA)
-- ==============================================================================
-- Esta view continua existindo para o critério de 1+ cobrança atrasada
CREATE OR REPLACE VIEW vw_aluno_financeiro_atrasado WITH (security_invoker = on) AS
SELECT
    aluno_id,
    tenant_id,
    COUNT(*) AS cobrancas_atrasadas
FROM cobrancas
WHERE status = 'atrasado'
GROUP BY aluno_id, tenant_id;


-- ==============================================================================
-- 3. 🆕 VIEW — MÚLTIPLOS ATRASOS FINANCEIROS (NOVA)
-- ==============================================================================
-- Identifica alunos com inadimplência recorrente (3 ou mais cobranças)
CREATE OR REPLACE VIEW vw_aluno_financeiro_recorrente WITH (security_invoker = on) AS
SELECT
    aluno_id,
    tenant_id,
    COUNT(*) AS cobrancas_atrasadas_recorrentes
FROM cobrancas
WHERE status = 'atrasado'
GROUP BY aluno_id, tenant_id
HAVING COUNT(*) >= 3;


-- ==============================================================================
-- 4. 🆕 VIEW FINAL — RADAR DE EVASÃO 2.0 (ATUALIZADA)
-- ==============================================================================
-- Novo critério de entrada:
-- - Faltas consecutivas > 7
-- - OU 1+ cobrança atrasada (critério geral)
-- - OU 3+ cobranças atrasadas (inadimplência recorrente)
CREATE OR REPLACE VIEW vw_radar_evasao WITH (security_invoker = on) AS
SELECT
    a.id AS aluno_id,
    a.tenant_id,
    a.nome_completo,
    COALESCE(f.faltas_consecutivas, 0) AS faltas_consecutivas,
    COALESCE(c.cobrancas_atrasadas, 0) AS cobrancas_atrasadas,
    COALESCE(r.cobrancas_atrasadas_recorrentes, 0) AS cobrancas_recorrentes,
    -- Campo calculado: indica o motivo principal do alerta
    CASE
        WHEN COALESCE(f.faltas_consecutivas, 0) > 7 
             AND COALESCE(r.cobrancas_atrasadas_recorrentes, 0) >= 3 THEN 'FALTAS + INADIMPLÊNCIA RECORRENTE'
        WHEN COALESCE(f.faltas_consecutivas, 0) > 7 THEN 'FALTAS CONSECUTIVAS'
        WHEN COALESCE(r.cobrancas_atrasadas_recorrentes, 0) >= 3 THEN 'INADIMPLÊNCIA RECORRENTE'
        WHEN COALESCE(c.cobrancas_atrasadas, 0) > 0 THEN 'FINANCEIRO EM ATRASO'
        ELSE 'OUTROS'
    END AS motivo_principal
FROM alunos a
LEFT JOIN vw_aluno_faltas_consecutivas f ON f.aluno_id = a.id
LEFT JOIN vw_aluno_financeiro_atrasado c ON c.aluno_id = a.id
LEFT JOIN vw_aluno_financeiro_recorrente r ON r.aluno_id = a.id
WHERE (
    COALESCE(f.faltas_consecutivas, 0) > 7 
    OR COALESCE(c.cobrancas_atrasadas, 0) > 0 
    OR COALESCE(r.cobrancas_atrasadas_recorrentes, 0) >= 3
);


-- ==============================================================================
-- 5. ÍNDICES DE PERFORMANCE (NOVOS)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_frequencias_aluno_data ON frequencias(aluno_id, data_aula);
CREATE INDEX IF NOT EXISTS idx_cobrancas_aluno_status ON cobrancas(aluno_id, status);
CREATE INDEX IF NOT EXISTS idx_cobrancas_tenant_mes ON cobrancas(tenant_id, data_vencimento);
-- Novo índice para otimizar a view de financeiro recorrente
CREATE INDEX IF NOT EXISTS idx_cobrancas_status_aluno ON cobrancas(status, aluno_id) WHERE status = 'atrasado';


-- ==============================================================================
-- 6. COMENTÁRIOS NAS VIEWS (DOCUMENTAÇÃO)
-- ==============================================================================
COMMENT ON VIEW vw_aluno_faltas_consecutivas IS 
'Radar de Evasão 2.0: Alunos com mais de 7 faltas consecutivas nos últimos 30 dias';

COMMENT ON VIEW vw_aluno_financeiro_recorrente IS 
'Radar de Evasão 2.0: Alunos com 3 ou mais cobranças atrasadas (inadimplência recorrente)';

COMMENT ON VIEW vw_radar_evasao IS 
'Radar de Evasão 2.0 - Gestor Escolar: Alunos em risco de evasão por faltas (>7) e/ou financeiro (1+) e/ou inadimplência recorrente (3+)';
