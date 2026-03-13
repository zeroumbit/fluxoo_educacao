-- Migration 056: Adiciona data_ingresso na tabela alunos
-- Descrição: Campo para registrar quando o aluno ingressou na escola
--            Usado para cálculo de mensalidade proporcional

ALTER TABLE public.alunos 
ADD COLUMN IF NOT EXISTS data_ingresso date DEFAULT CURRENT_DATE;

COMMENT ON COLUMN public.alunos.data_ingresso IS 'Data de ingresso do aluno na escola (para cálculo de proporcionalidade e faturas)';

-- Atualizar registros existentes com a data de criação
UPDATE public.alunos 
SET data_ingresso = created_at::date
WHERE data_ingresso IS NULL;
