-- [MANDATORY] Atualização da tabela 'escolas' para o novo fluxo de cadastro
-- Este script deve ser executado para suportar o novo formulário de 5 passos

-- 1. Adicionar campos de endereço e gestor na tabela escolas
ALTER TABLE public.escolas 
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT,
ADD COLUMN IF NOT EXISTS nome_gestor TEXT,
ADD COLUMN IF NOT EXISTS cpf_gestor TEXT;

-- 2. Garantir que o e-mail do gestor seja salvo para auditoria
-- (Já existe, mas reforçamos a importância)
COMMENT ON COLUMN public.escolas.email_gestor IS 'E-mail corporativo do gestor principal';
COMMENT ON COLUMN public.escolas.nome_gestor IS 'Nome completo do gestor da unidade';
COMMENT ON COLUMN public.escolas.cpf_gestor IS 'CPF do gestor responsável';

-- 3. Caso a tabela 'planos' ainda não tenha status default
ALTER TABLE public.planos 
ALTER COLUMN status SET DEFAULT true;

-- NOTA SOBRE SENHAS: 
-- As senhas não são salvas na tabela 'escolas'. 
-- Elas são gerenciadas de forma segura pelo Supabase Auth (tabela auth.users).
-- O campo 'auth.uid()' do usuário será vinculado à escola ou funcionário oportunamente.
