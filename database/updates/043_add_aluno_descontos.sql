-- Adiciona campos de desconto para alunos
ALTER TABLE public.alunos 
ADD COLUMN IF NOT EXISTS desconto_valor numeric(10,2),
ADD COLUMN IF NOT EXISTS desconto_tipo text CHECK (desconto_tipo IN ('valor', 'porcentagem')),
ADD COLUMN IF NOT EXISTS desconto_inicio date,
ADD COLUMN IF NOT EXISTS desconto_fim date;

COMMENT ON COLUMN public.alunos.desconto_tipo IS 'Tipo de desconto aplicado: valor fixo (R$) ou porcentagem (%)';
COMMENT ON COLUMN public.alunos.desconto_valor IS 'Valor ou percentual do desconto';
COMMENT ON COLUMN public.alunos.desconto_inicio IS 'Data de início da validade do desconto';
COMMENT ON COLUMN public.alunos.desconto_fim IS 'Data de fim da validade do desconto';
