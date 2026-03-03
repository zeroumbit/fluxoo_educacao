-- Migration to add user_id to responsaveis table for portal access
ALTER TABLE public.responsaveis 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Also ensuring primary_acesso and terms columns exist if needed for portal
ALTER TABLE public.responsaveis 
ADD COLUMN IF NOT EXISTS primeiro_acesso boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS termos_aceitos boolean DEFAULT false;

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_responsaveis_user_id ON public.responsaveis(user_id);
CREATE INDEX IF NOT EXISTS idx_responsaveis_cpf ON public.responsaveis(cpf);
