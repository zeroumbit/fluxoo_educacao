-- ==============================================================================
-- 🚀 MIGRATION 083: MATERIALIZED VIEW - FECHAMENTO MENSAL
-- Descrição: Converte view em MATERIALIZED VIEW com refresh automático.
-- Impacto: PERFORMANCE - Dados cacheados para relatórios financeiros.
-- Atualização: Automática via triggers em cobranças e contas_pagar.
-- ==============================================================================

-- 1. DROP DA VIEW ANTIGA
DROP VIEW IF EXISTS public.mv_fechamento_mensal CASCADE;

-- 2. CRIAR MATERIALIZED VIEW
CREATE MATERIALIZED VIEW public.mv_fechamento_mensal AS
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

-- 3. CRIAR ÍNDICE ÚNICO PARA REFRESH CONCURRENT
CREATE UNIQUE INDEX idx_fechamento_mensal_tenant_mes ON public.mv_fechamento_mensal(tenant_id, mes);

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_fechamento_mensal_mes ON public.mv_fechamento_mensal(mes DESC);
CREATE INDEX idx_fechamento_mensal_tenant ON public.mv_fechamento_mensal(tenant_id);

-- 5. FUNÇÃO PARA REFRESH DA MATERIALIZED VIEW
CREATE OR REPLACE FUNCTION public.refresh_fechamento_mensal()
RETURNS trigger AS $$
BEGIN
    -- Refresh concorrente (não bloqueia leituras)
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_fechamento_mensal;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. TRIGGERS PARA REFRESH AUTOMÁTICO EM COBRANÇAS
DROP TRIGGER IF EXISTS trg_refresh_fechamento_cobrancas ON public.cobrancas;
CREATE TRIGGER trg_refresh_fechamento_cobrancas
    AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.cobrancas
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.refresh_fechamento_mensal();

-- 7. TRIGGERS PARA REFRESH AUTOMÁTICO EM CONTAS A PAGAR
DROP TRIGGER IF EXISTS trg_refresh_fechamento_contas_pagar ON public.contas_pagar;
CREATE TRIGGER trg_refresh_fechamento_contas_pagar
    AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.contas_pagar
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.refresh_fechamento_mensal();

-- 8. COMENTÁRIOS
COMMENT ON MATERIALIZED VIEW public.mv_fechamento_mensal IS
    'Relatório financeiro completo: integra receitas (cobranças) e despesas (contas_pagar) por competência mensal. Atualização automática via triggers.';

COMMENT ON FUNCTION public.refresh_fechamento_mensal() IS
    'Função para refresh automático da materialized view mv_fechamento_mensal. Acionada por triggers em cobranças e contas_pagar.';

-- 9. PERMISSÕES
GRANT SELECT ON public.mv_fechamento_mensal TO authenticated;

-- ==============================================================================
-- ✅ RESUMO
-- ==============================================================================
-- - View convertida para MATERIALIZED VIEW (dados cacheados)
-- - Índice único criado para permitir refresh concorrente
-- - Refresh automático via triggers em cobranças e contas_pagar
-- - Performance melhorada (sem recálculo a cada consulta)
-- - Dados sempre atualizados (trigger após INSERT/UPDATE/DELETE)
-- ==============================================================================

-- 10. VALIDAÇÃO PÓS-MIGRATION
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM public.mv_fechamento_mensal;
    RAISE NOTICE '✅ MATERIALIZED VIEW criada com % registros', v_count;
END $$;
