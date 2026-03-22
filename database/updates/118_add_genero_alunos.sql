-- ==========================================================
-- MIGRATION 118: ADD GENERO ALUNOS
-- Adiciona a coluna 'genero' na tabela alunos que estava faltando
-- e quebrava o cadastro de novos alunos.
-- ==========================================================

ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS genero VARCHAR(50) DEFAULT NULL;

-- Recarregar o Schema Cache do PostgREST para reconhecer a nova coluna imediatamente
NOTIFY pgrst, 'reload schema';
