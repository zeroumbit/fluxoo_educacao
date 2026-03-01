-- ==========================================================
-- PERMITIR MÚLTIPLAS TURMAS E HORÁRIOS EM PLANOS DE AULA
-- ==========================================================

-- 1. Criar a tabela de junção planos_aula_turmas
CREATE TABLE IF NOT EXISTS public.planos_aula_turmas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    plano_aula_id uuid NOT NULL REFERENCES public.planos_aula(id) ON DELETE CASCADE,
    turma_id uuid NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    turno text NOT NULL CHECK (turno IN ('manha', 'tarde', 'integral', 'noturno')),
    horario text, -- Campo opcional para horário específico (ex: 08:00 - 09:40)
    created_at timestamptz DEFAULT now()
);

-- 2. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_planos_aula_turmas_plano_id ON public.planos_aula_turmas(plano_aula_id);
CREATE INDEX IF NOT EXISTS idx_planos_aula_turmas_turma_id ON public.planos_aula_turmas(turma_id);

-- 3. Migrar dados existentes (opcional, se já houver dados)
-- Insere na nova tabela o que estava na coluna turma_id da planos_aula
-- Assume 'manha' como padrão para os existentes se não houver informação
INSERT INTO public.planos_aula_turmas (plano_aula_id, turma_id, turno)
SELECT id, turma_id, 'manha' 
FROM public.planos_aula 
WHERE turma_id IS NOT NULL;

-- 4. Desabilitar RLS para evitar bloqueios iniciais (conforme padrão do projeto)
ALTER TABLE public.planos_aula_turmas DISABLE ROW LEVEL SECURITY;

-- 5. Adicionar comentários
COMMENT ON TABLE public.planos_aula_turmas IS 'Tabela de junção para vincular planos de aula a múltiplas turmas e turnos';
COMMENT ON COLUMN public.planos_aula_turmas.turno IS 'Turno da aula para esta turma específica';
