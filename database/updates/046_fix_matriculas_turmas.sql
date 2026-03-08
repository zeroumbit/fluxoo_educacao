-- ==========================================================
-- 🛠 FIX: VÍNCULO DIRETO MATRÍCULA <-> TURMA
-- Adiciona coluna turma_id na tabela matriculas para busca ultra-rápida.
-- Sincroniza dados existentes baseados no nome da série/ano e turno.
-- ==========================================================

-- 1. Criação da coluna
ALTER TABLE public.matriculas ADD COLUMN IF NOT EXISTS turma_id uuid REFERENCES public.turmas(id);

-- 2. Sincronização retroativa
-- Mapeia turnos se necessário (manha -> matutino, tarde -> vespertino)
UPDATE public.matriculas m
SET turma_id = t.id
FROM public.turmas t
WHERE m.serie_ano = t.nome
  AND (
    m.turno = t.turno OR
    (m.turno = 'manha' AND t.turno = 'matutino') OR
    (m.turno = 'tarde' AND t.turno = 'vespertino')
  )
  AND m.turma_id IS NULL; -- Apenas onde ainda não foi vinculado

-- 3. Índice para performance na listagem de alunos da turma
CREATE INDEX IF NOT EXISTS idx_matriculas_turma_id ON public.matriculas(turma_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_status ON public.matriculas(status);
