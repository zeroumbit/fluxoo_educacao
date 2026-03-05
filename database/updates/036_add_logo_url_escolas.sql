-- Adiciona campo para armazenar URL da logomarca da escola
ALTER TABLE public.escolas
ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN public.escolas.logo_url IS 'URL pública da logomarca da escola armazenada no Supabase Storage';
