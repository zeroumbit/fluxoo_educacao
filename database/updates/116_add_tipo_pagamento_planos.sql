-- ==========================================
-- 116. ADICIONA TIPO DE PAGAMENTO E REGRA DE PLANO ÚNICO
-- ==========================================
-- Adiciona campo tipo_pagamento para definir método de pagamento do plano
-- Opções: 'gratuito', 'pix', 'mercado_pago', 'pix_manual'
-- Regra: Apenas 1 plano ativo por combinação (tipo_empresa + tipo_pagamento)

-- 1. Adiciona coluna tipo_pagamento
ALTER TABLE public.planos 
ADD COLUMN IF NOT EXISTS tipo_pagamento text NOT NULL DEFAULT 'gratuito' 
CHECK (tipo_pagamento IN ('gratuito', 'pix', 'mercado_pago', 'pix_manual'));

-- Adiciona comentário na coluna
COMMENT ON COLUMN public.planos.tipo_pagamento IS 'Método de pagamento: gratuito, pix, mercado_pago, pix_manual';

-- 2. Cria índice para filtragem por tipo de pagamento
CREATE INDEX IF NOT EXISTS idx_planos_tipo_pagamento ON public.planos(tipo_pagamento);

-- 3. Cria índice composto para validação da regra de plano único
CREATE INDEX IF NOT EXISTS idx_planos_empresa_pagamento_status ON public.planos(tipo_empresa, tipo_pagamento, status);

-- 4. Identifica e marca como inativos os planos duplicados (mantém o mais antigo ativo)
-- Executa apenas em planos que estão duplicados e ativos
WITH duplicados AS (
  SELECT 
    id,
    tipo_empresa,
    tipo_pagamento,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY tipo_empresa, tipo_pagamento ORDER BY created_at ASC) as rn
  FROM public.planos
  WHERE status = true
)
UPDATE public.planos p
SET status = false, updated_at = now()
FROM duplicados d
WHERE p.id = d.id 
  AND d.rn > 1
  AND p.status = true;

-- 5. Cria a constraint exclusiva para garantir 1 plano ativo por (tipo_empresa + tipo_pagamento)
-- Agora seguro pois os duplicados foram resolvidos
DROP INDEX IF EXISTS public.idx_planos_unique_ativo;

CREATE UNIQUE INDEX idx_planos_unique_ativo 
ON public.planos(tipo_empresa, tipo_pagamento) 
WHERE status = true;

COMMENT ON INDEX public.idx_planos_unique_ativo IS 'Garante apenas 1 plano ativo por combinação tipo_empresa + tipo_pagamento';
