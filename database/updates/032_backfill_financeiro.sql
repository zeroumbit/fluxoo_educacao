-- Migration 032: Controle de Responsabilidade Financeira
-- Adiciona a coluna se não existir e garante que os registros atuais tenham acesso

-- 1. Garantir que as colunas existam na tabela de vínculo
ALTER TABLE public.aluno_responsavel 
ADD COLUMN IF NOT EXISTS is_financeiro boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_academico boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo';

-- 2. Atualizar todos os registros existentes para 'Sim' (true) 
-- para evitar que pais percam acesso repentinamente
UPDATE public.aluno_responsavel 
SET is_financeiro = true, is_academico = true, status = 'ativo'
WHERE is_financeiro IS NULL OR is_academico IS NULL;

-- 3. Caso queira que apenas o PRIMEIRO responsável seja o financeiro (opcional, mas aqui vamos deixar todos como true por segurança)
-- UPDATE public.aluno_responsavel SET is_financeiro = false WHERE ... (lógica complexa se houver muitos)
