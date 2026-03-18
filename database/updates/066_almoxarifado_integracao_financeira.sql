-- ==============================================================================
-- 🚀 MIGRATION 066: INTEGRAÇÃO ALMOXARIFADO → FINANCEIRO
-- Descrição: Adiciona colunas para vincular entradas de material a contas a pagar.
-- ==============================================================================

ALTER TABLE public.almoxarifado_movimentacoes 
ADD COLUMN IF NOT EXISTS fornecedor TEXT,
ADD COLUMN IF NOT EXISTS valor_total NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS gerar_financeiro BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS vencimento_financeiro DATE,
ADD COLUMN IF NOT EXISTS financeiro_id UUID REFERENCES public.contas_pagar(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.almoxarifado_movimentacoes.gerar_financeiro IS 'Se TRUE, o sistema tentará criar uma conta a pagar ao salvar a entrada.';
COMMENT ON COLUMN public.almoxarifado_movimentacoes.financeiro_id IS 'Vínculo com a conta gerada no módulo financeiro.';
