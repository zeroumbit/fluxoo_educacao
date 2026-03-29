-- ==========================================
-- 115. ADICIONA VALIDADE DO PLANO
-- ==========================================
-- Adiciona campo validade_meses para definir duração do plano em meses
-- NULL = Indefinido

ALTER TABLE public.planos 
ADD COLUMN IF NOT EXISTS validade_meses integer NULL;

-- Adiciona comentário na coluna
COMMENT ON COLUMN public.planos.validade_meses IS 'Duração do plano em meses. NULL = Indefinido';

-- Adiciona constraint para validar valores (1-12 ou NULL)
ALTER TABLE public.planos 
ADD CONSTRAINT chk_planos_validade_meses 
CHECK (validade_meses IS NULL OR (validade_meses >= 1 AND validade_meses <= 12));
