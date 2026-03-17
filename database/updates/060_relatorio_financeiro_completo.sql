-- ==========================================================
-- 📊 MIGRATION 060: RELATÓRIO FINANCEIRO COMPLETO
-- Descrição: Integra Contas a Receber e Contas a Pagar
--            no relatório de fechamento mensal
-- ==========================================================

-- Drop da view antiga
DROP VIEW IF EXISTS public.mv_fechamento_mensal CASCADE;

-- Nova view com receitas (cobranças) e despesas (contas_pagar)
CREATE OR REPLACE VIEW public.mv_fechamento_mensal WITH (security_invoker = on) AS
WITH receitas AS (
    -- Total de RECEITAS (Contas a Receber dos alunos)
    SELECT 
        tenant_id,
        DATE_TRUNC('month', data_vencimento) AS mes,
        SUM(valor) AS total_receitas_previsto,
        SUM(CASE WHEN status = 'pago' THEN COALESCE(valor_pago, valor) ELSE 0 END) AS total_receitas_recebido,
        SUM(CASE WHEN status IN ('a_vencer', 'atrasado') THEN valor ELSE 0 END) AS total_receitas_aberto
    FROM cobrancas
    GROUP BY tenant_id, DATE_TRUNC('month', data_vencimento)
),
despesas AS (
    -- Total de DESPESAS (Contas a Pagar da escola)
    SELECT 
        tenant_id,
        DATE_TRUNC('month', data_vencimento) AS mes,
        SUM(valor) AS total_despesas_previsto,
        SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END) AS total_despesas_pago,
        SUM(CASE WHEN status IN ('pendente', 'atrasado', 'ativo') THEN valor ELSE 0 END) AS total_despesas_aberto
    FROM contas_pagar
    GROUP BY tenant_id, DATE_TRUNC('month', data_vencimento)
)
SELECT 
    COALESCE(r.tenant_id, d.tenant_id) AS tenant_id,
    COALESCE(r.mes, d.mes) AS mes,
    
    -- Receitas
    COALESCE(r.total_receitas_previsto, 0) AS total_receitas_previsto,
    COALESCE(r.total_receitas_recebido, 0) AS total_receitas_recebido,
    COALESCE(r.total_receitas_aberto, 0) AS total_receitas_aberto,
    
    -- Despesas
    COALESCE(d.total_despesas_previsto, 0) AS total_despesas_previsto,
    COALESCE(d.total_despesas_pago, 0) AS total_despesas_pago,
    COALESCE(d.total_despesas_aberto, 0) AS total_despesas_aberto,
    
    -- Totais consolidados (nomenclatura antiga para retrocompatibilidade)
    COALESCE(r.total_receitas_previsto, 0) AS total_previsto,
    COALESCE(r.total_receitas_recebido, 0) AS total_recebido,
    COALESCE(r.total_receitas_aberto, 0) AS total_em_aberto,
    
    -- SALDO DO FLUXO DE CAIXA (Receitas - Despesas)
    COALESCE(r.total_receitas_recebido, 0) - COALESCE(d.total_despesas_pago, 0) AS saldo,
    
    -- Saldo previsto (o que deveria sobrar se tudo for pago)
    COALESCE(r.total_receitas_previsto, 0) - COALESCE(d.total_despesas_previsto, 0) AS saldo_previsto
    
FROM receitas r
FULL OUTER JOIN despesas d ON r.tenant_id = d.tenant_id AND r.mes = d.mes
ORDER BY mes DESC;

-- Comentários na view
COMMENT ON VIEW public.mv_fechamento_mensal IS 
    'Relatório financeiro completo: integra receitas (cobranças) e despesas (contas_pagar) por competência mensal';

-- Garantir permissões
GRANT SELECT ON public.mv_fechamento_mensal TO authenticated;

-- ==========================================================
-- ÍNDICES PARA PERFORMANCE (se ainda não existirem)
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_cobrancas_tenant_vencimento ON cobrancas(tenant_id, data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_tenant_vencimento ON contas_pagar(tenant_id, data_vencimento);

-- ==========================================================
-- OBSERVAÇÕES:
-- 1. A view usa FULL OUTER JOIN para incluir meses que tenham
--    apenas receitas OU apenas despesas
-- 2. deleted_at IS NULL garante que registros excluídos não
--    apareçam no relatório
-- 3. Para atualizar os dados, execute no SQL Editor:
--    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_fechamento_mensal;
--    (Se converter para materialized view no futuro)
-- ==========================================================
