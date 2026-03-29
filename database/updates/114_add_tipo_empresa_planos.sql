-- ==========================================
-- 114. ADICIONA TIPO DE EMPRESA AOS PLANOS
-- ==========================================
-- Adiciona campo tipo_empresa para definir quais tipos de empresas verão este plano
-- Opções: 'escolas', 'lojistas', 'profissionais'

ALTER TABLE public.planos 
ADD COLUMN IF NOT EXISTS tipo_empresa text NOT NULL DEFAULT 'escolas' 
CHECK (tipo_empresa IN ('escolas', 'lojistas', 'profissionais'));

-- Adiciona comentário na coluna
COMMENT ON COLUMN public.planos.tipo_empresa IS 'Tipo de empresa que verá este plano: escolas, lojistas ou profissionais';

-- Cria índice para filtragem por tipo de empresa
CREATE INDEX IF NOT EXISTS idx_planos_tipo_empresa ON public.planos(tipo_empresa);
