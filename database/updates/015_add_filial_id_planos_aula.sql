-- ==========================================
-- ADICIONAR CAMPO FILIAL_ID EM PLANOS_DE_AULA
-- ==========================================
-- Permite vincular o plano de aula a uma unidade específica

ALTER TABLE public.planos_aula
ADD COLUMN IF NOT EXISTS filial_id uuid REFERENCES public.filiais(id) ON DELETE SET NULL;

-- Adicionar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_planos_aula_filial_id ON public.planos_aula(filial_id);

-- Adicionar comentário
COMMENT ON COLUMN public.planos_aula.filial_id IS 'Unidade/filial onde o plano de aula foi aplicado';
