-- ==============================================================================
-- 1. VIEW BASE — USO DE COTA (Health Score)
-- ==============================================================================
CREATE OR REPLACE VIEW vw_tenant_uso_cota WITH (security_invoker = on) AS
SELECT
    t.id AS tenant_id,
    t.razao_social,
    p.limite_alunos_contratado,
    COUNT(a.id) AS alunos_ativos,
    CASE 
        WHEN p.limite_alunos_contratado > 0 THEN (COUNT(a.id)::numeric / p.limite_alunos_contratado) * 100 
        ELSE 0 
    END AS percentual_uso
FROM escolas t
JOIN assinaturas p ON p.tenant_id = t.id AND p.status = 'ativa'
LEFT JOIN alunos a ON a.tenant_id = t.id AND a.status = 'ativo'
GROUP BY t.id, t.razao_social, p.limite_alunos_contratado;


-- ==============================================================================
-- 2. VIEW BASE — STATUS FINANCEIRO SAAS (Health Score)
-- ==============================================================================
CREATE OR REPLACE VIEW vw_tenant_financeiro WITH (security_invoker = on) AS
SELECT
    tenant_id,
    MAX(data_vencimento) AS ultimo_vencimento,
    BOOL_OR(status = 'atrasado') AS possui_atraso
FROM faturas
GROUP BY tenant_id;


-- ==============================================================================
-- 3. VIEW FINAL — HEALTH SCORE (Visão para Super Admin)
-- ==============================================================================
CREATE OR REPLACE VIEW vw_tenant_health_score WITH (security_invoker = on) AS
SELECT
    u.tenant_id,
    u.razao_social,
    u.percentual_uso,
    CASE
        WHEN f.possui_atraso THEN 20
        ELSE 40
    END
    +
    CASE
        WHEN u.percentual_uso > 90 THEN 40
        WHEN u.percentual_uso > 70 THEN 30
        ELSE 20
    END AS health_score
FROM vw_tenant_uso_cota u
LEFT JOIN vw_tenant_financeiro f ON f.tenant_id = u.tenant_id;


-- ==============================================================================
-- 4. VIEW — FALTAS CONSECUTIVAS (Radar de Evasão)
-- ==============================================================================
CREATE OR REPLACE VIEW vw_aluno_faltas_consecutivas WITH (security_invoker = on) AS
SELECT
    aluno_id,
    COUNT(*) AS faltas_consecutivas
FROM frequencias
WHERE status = 'falta'
  AND data_aula >= current_date - interval '15 days'
GROUP BY aluno_id;


-- ==============================================================================
-- 5. VIEW — FINANCEIRO EM ATRASO (Radar de Evasão)
-- ==============================================================================
CREATE OR REPLACE VIEW vw_aluno_financeiro_atrasado WITH (security_invoker = on) AS
SELECT
    aluno_id,
    COUNT(*) AS cobrancas_atrasadas
FROM cobrancas
WHERE status = 'atrasado'
GROUP BY aluno_id;


-- ==============================================================================
-- 6. VIEW FINAL — RADAR DE EVASÃO (Visão para Gestor Escolar)
-- ==============================================================================
CREATE OR REPLACE VIEW vw_radar_evasao WITH (security_invoker = on) AS
SELECT
    a.id AS aluno_id,
    a.nome_completo,
    COALESCE(f.faltas_consecutivas, 0) AS faltas_consecutivas,
    COALESCE(c.cobrancas_atrasadas, 0) AS cobrancas_atrasadas
FROM alunos a
LEFT JOIN vw_aluno_faltas_consecutivas f ON f.aluno_id = a.id
LEFT JOIN vw_aluno_financeiro_atrasado c ON c.aluno_id = a.id
WHERE (COALESCE(f.faltas_consecutivas, 0) > 3 OR COALESCE(c.cobrancas_atrasadas, 0) > 0);


-- ==============================================================================
-- 7. MATERIALIZED VIEW MENSAL — FECHAMENTO DE CAIXA
-- ==============================================================================
DROP MATERIALIZED VIEW IF EXISTS mv_fechamento_mensal;

CREATE MATERIALIZED VIEW mv_fechamento_mensal AS
SELECT
    tenant_id,
    DATE_TRUNC('month', data_vencimento) AS mes,
    SUM(valor) AS total_previsto,
    SUM(CASE WHEN status = 'pago' THEN COALESCE(valor_pago, valor) ELSE 0 END) AS total_recebido,
    (
        SUM(valor) -
        SUM(CASE WHEN status = 'pago' THEN COALESCE(valor_pago, valor) ELSE 0 END)
    ) AS total_em_aberto
FROM cobrancas
GROUP BY tenant_id, DATE_TRUNC('month', data_vencimento);


-- ==============================================================================
-- 8. VIEW DE TEMPO MÉDIO — FILA VIRTUAL (Se existir a tabela)
-- ==============================================================================
-- Removido temporariamente para evitar erros caso a tabela 'fila_virtual' não exista
-- no seu schema base atual. Se desejar, descomente e ajuste.


-- ==============================================================================
-- 9. TRIGGER DE ATUALIZAÇÃO DE STATUS (Régua de Cobrança Automatizada)
-- ==============================================================================
CREATE OR REPLACE FUNCTION fn_atualizar_status_cobranca()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'a_vencer' AND NEW.data_vencimento < current_date THEN
        NEW.status := 'atrasado';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_atualiza_status ON cobrancas;

CREATE TRIGGER trg_atualiza_status
BEFORE UPDATE ON cobrancas
FOR EACH ROW
EXECUTE FUNCTION fn_atualizar_status_cobranca();


-- ==============================================================================
-- 10. ÍNDICES OBRIGATÓRIOS (Performance)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_alunos_tenant ON alunos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_frequencias_aluno_data ON frequencias(aluno_id, data_aula);
CREATE INDEX IF NOT EXISTS idx_cobrancas_aluno_status ON cobrancas(aluno_id, status);
CREATE INDEX IF NOT EXISTS idx_cobrancas_tenant_mes ON cobrancas(tenant_id, data_vencimento);
