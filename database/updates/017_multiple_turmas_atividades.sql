-- ==========================================================
-- PERMITIR MÚLTIPLAS TURMAS E FILIAIS EM ATIVIDADES
-- ==========================================================

-- 1. Adicionar filial_id à tabela atividades
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS filial_id uuid REFERENCES public.filiais(id) ON DELETE SET NULL;

-- 2. Criar a tabela de junção atividades_turmas
CREATE TABLE IF NOT EXISTS public.atividades_turmas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    atividade_id uuid NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
    turma_id uuid NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    turno text CHECK (turno IN ('manha', 'tarde', 'integral', 'noturno')),
    horario text,
    created_at timestamptz DEFAULT now()
);

-- 3. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_atividades_turmas_atividade_id ON public.atividades_turmas(atividade_id);
CREATE INDEX IF NOT EXISTS idx_atividades_turmas_turma_id ON public.atividades_turmas(turma_id);

-- 4. Migrar dados existentes de turma_id para a nova tabela
INSERT INTO public.atividades_turmas (atividade_id, turma_id, turno)
SELECT id, turma_id, 'manha'
FROM public.atividades
WHERE turma_id IS NOT NULL;

-- 5. Desabilitar RLS (padrão do projeto)
ALTER TABLE public.atividades_turmas DISABLE ROW LEVEL SECURITY;

-- 6. Comentários
COMMENT ON TABLE public.atividades_turmas IS 'Tabela de junção para vincular atividades a múltiplas turmas';
