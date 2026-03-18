-- ==========================================
-- SCHEMA: GRADE ACADÊMICA E ATRIBUIÇÕES
-- Fluxoo Educação — Módulo de Turmas v2
-- ==========================================

-- 1. Tabela de Atribuições (Vínculo Turma <-> Professor <-> Disciplina)
CREATE TABLE IF NOT EXISTS public.turma_professores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    professor_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
    disciplina_id UUID NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,
    carga_horaria_semanal INTEGER DEFAULT 1,
    data_inicio DATE DEFAULT CURRENT_DATE,
    data_fim DATE,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'substituicao')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT turma_prof_disc_unique UNIQUE (turma_id, professor_id, disciplina_id)
);

-- 2. Tabela de Grade Horária Semanal
CREATE TABLE IF NOT EXISTS public.turma_grade_horaria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    disciplina_id UUID NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,
    professor_id UUID REFERENCES public.funcionarios(id) ON DELETE SET NULL,
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 7), -- 1: Segunda, 7: Domingo
    hora_inicio TEXT NOT NULL, -- Formato HH:mm
    hora_fim TEXT NOT NULL,    -- Formato HH:mm
    sala TEXT,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT grade_horaria_unique UNIQUE (turma_id, dia_semana, hora_inicio)
);

-- 3. Habilitar RLS e Criar Políticas Básicas
ALTER TABLE public.turma_professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turma_grade_horaria ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (DROP IF EXISTS para evitar erros em re-execução)
DROP POLICY IF EXISTS "Acesso total turma_professores" ON public.turma_professores;
CREATE POLICY "Acesso total turma_professores" ON public.turma_professores FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total turma_grade_horaria" ON public.turma_grade_horaria;
CREATE POLICY "Acesso total turma_grade_horaria" ON public.turma_grade_horaria FOR ALL USING (true) WITH CHECK (true);

-- 4. Índices para Performance
CREATE INDEX IF NOT EXISTS idx_turma_prof_turma ON public.turma_professores(turma_id);
CREATE INDEX IF NOT EXISTS idx_turma_prof_professor ON public.turma_professores(professor_id);
CREATE INDEX IF NOT EXISTS idx_grade_horaria_turma ON public.turma_grade_horaria(turma_id);

-- 5. Trigger para Updated At
DROP TRIGGER IF EXISTS trg_update_turma_prof_timestamp ON public.turma_professores;
CREATE TRIGGER trg_update_turma_prof_timestamp
BEFORE UPDATE ON public.turma_professores
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_grade_horaria_timestamp ON public.turma_grade_horaria;
CREATE TRIGGER trg_update_grade_horaria_timestamp
BEFORE UPDATE ON public.turma_grade_horaria
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. Adicionar campos de horário à tabela turmas se não existirem
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS horario_inicio TIME;
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS horario_fim TIME;

-- Otimização
CREATE INDEX IF NOT EXISTS idx_turmas_tenant_id ON public.turmas(tenant_id);
