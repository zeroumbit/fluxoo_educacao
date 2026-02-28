-- ==========================================================
-- CORREÇÃO: ADICIONAR COLUNA SENHA_HASH EM RESPONSÁVEIS E ALINHAR CEP
-- ==========================================================

-- Adiciona a coluna senha_hash na tabela responsaveis se não existir
ALTER TABLE public.responsaveis ADD COLUMN IF NOT EXISTS senha_hash text;

-- Opcional (se não havia user_id vinculado ou caso precise futuramente):
-- ALTER TABLE public.responsaveis ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Comentário da coluna
COMMENT ON COLUMN public.responsaveis.senha_hash IS 'Senha criptografada ou temporária para o portal do responsável';
