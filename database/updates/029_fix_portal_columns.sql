-- Migration 029: Correção emergencial de colunas na tabela aluno_responsavel
-- Adiciona colunas necessárias para o Portal do Responsável (is_financeiro, is_academico, status)

-- 1. Tabela aluno_responsavel
-- Adicionar as colunas de permissão e status que o portal espera
ALTER TABLE public.aluno_responsavel 
ADD COLUMN IF NOT EXISTS is_financeiro boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_academico boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo';

-- Criar índices para melhorar o desempenho das consultas no portal
CREATE INDEX IF NOT EXISTS idx_aluno_responsavel_responsavel_id ON public.aluno_responsavel(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_aluno_responsavel_aluno_id ON public.aluno_responsavel(aluno_id);
CREATE INDEX IF NOT EXISTS idx_aluno_responsavel_status ON public.aluno_responsavel(status);

-- 2. Garantir que os registros existentes tenham status 'ativo'
UPDATE public.aluno_responsavel 
SET status = 'ativo' 
WHERE status IS NULL;

-- 3. Tabela responsaveis
-- Garantir que a coluna 'status' exista e esteja correta
ALTER TABLE public.responsaveis 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo';

UPDATE public.responsaveis 
SET status = 'ativo' 
WHERE status IS NULL;
