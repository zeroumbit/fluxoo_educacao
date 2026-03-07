-- Adicionar coluna categoria na tabela de contas a pagar
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Geral';

COMMENT ON COLUMN public.contas_pagar.categoria IS 'Categoria da despesa (ex: Folha de Pagamento, Utilidades, Aluguel, etc.)';
