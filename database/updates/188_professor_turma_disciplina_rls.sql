-- ==============================================================================
-- 🛡️ MIGRATION 188: PROFESSOR_TURMA_DISCIPLINA — RLS GRANULAR
-- Objetivo:
--   Criar tabela de vínculo professor↔turma↔disciplina e aplicar RLS granular
--   que garante que cada professor acessa APENAS seu escopo pedagógico.
-- Regras:
--   R1: Gestor vê e gerencia todos os vínculos (check_is_tenant_staff)
--   R2: SuperAdmin apenas SELECT
--   Professor: vê apenas seus próprios vínculos
-- ==============================================================================

BEGIN;

-- ============================================================
-- 1. TABELA professor_turma_disciplina
-- ============================================================

CREATE TABLE IF NOT EXISTS public.professor_turma_disciplina (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  tenant_id         UUID NOT NULL,

  professor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professor_id      UUID,                       -- FK para funcionarios.id (opcional)
  turma_id          UUID NOT NULL,
  disciplina_id     UUID NOT NULL,

  ano_letivo        TEXT NOT NULL,              -- ex: '2026'
  status            TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),

  -- Quem criou este vínculo
  criado_por        UUID REFERENCES auth.users(id),
  atualizado_em     TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.professor_turma_disciplina IS
  'Vínculo explícito entre professor, turma e disciplina. '
  'Base para RLS granular que restringe professor ao seu escopo pedagógico.';

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_ptd_professor ON public.professor_turma_disciplina (professor_user_id, status);
CREATE INDEX IF NOT EXISTS idx_ptd_turma     ON public.professor_turma_disciplina (turma_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_ptd_disciplina ON public.professor_turma_disciplina (disciplina_id, turma_id);
CREATE INDEX IF NOT EXISTS idx_ptd_tenant    ON public.professor_turma_disciplina (tenant_id);

-- ============================================================
-- 2. RLS
-- ============================================================

ALTER TABLE public.professor_turma_disciplina ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'professor_turma_disciplina') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.professor_turma_disciplina';
  END LOOP;
END $$;

-- Staff (Gestor/Admin) gerencia todos os vínculos do seu tenant
CREATE POLICY "Staff_CRUD_ProfTurmaDisciplina" ON public.professor_turma_disciplina
FOR ALL TO authenticated
USING  (public.check_is_tenant_staff(tenant_id))
WITH CHECK (
  public.check_is_tenant_staff(tenant_id)
  AND public.validate_tenant_context(tenant_id)
);

-- Professor vê apenas seus próprios vínculos
CREATE POLICY "Prof_Self_Read_ProfTurmaDisciplina" ON public.professor_turma_disciplina
FOR SELECT TO authenticated
USING (professor_user_id = auth.uid());

-- SuperAdmin: apenas leitura (R2)
CREATE POLICY "SA_Read_ProfTurmaDisciplina" ON public.professor_turma_disciplina
FOR SELECT TO authenticated
USING (public.check_is_super_admin());

-- ============================================================
-- 3. VIEW PARA PROFESSOR — SEU ESCOPO PEDAGÓGICO
-- ============================================================

CREATE OR REPLACE VIEW public.vw_professor_escopo AS
SELECT
  ptd.id,
  ptd.turma_id,
  ptd.disciplina_id,
  ptd.ano_letivo,
  ptd.status,
  ptd.tenant_id
FROM public.professor_turma_disciplina ptd
WHERE ptd.professor_user_id = auth.uid()
  AND ptd.status = 'ativo';

COMMENT ON VIEW public.vw_professor_escopo IS
  'Escopo pedagógico do professor logado. Apenas suas turmas e disciplinas ativas.';

GRANT SELECT ON public.vw_professor_escopo TO authenticated;

-- ============================================================
-- 4. RLS NAS TURMAS — PROFESSOR VÊ APENAS SUAS TURMAS
-- Complementa a função check_professor_turma() da migration 185
-- ============================================================

DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'turmas') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.turmas';
  END LOOP;
END $$;

CREATE POLICY "Staff_CRUD_Turmas" ON public.turmas FOR ALL TO authenticated
USING  (public.check_is_tenant_staff(tenant_id))
WITH CHECK (
  public.check_is_tenant_staff(tenant_id)
  AND public.validate_tenant_context(tenant_id)
);

CREATE POLICY "SA_Read_Turmas" ON public.turmas FOR SELECT TO authenticated
USING (public.check_is_super_admin());

-- Professor vê apenas suas turmas vinculadas
CREATE POLICY "Prof_Read_Turmas" ON public.turmas FOR SELECT TO authenticated
USING (
  id IN (
    SELECT turma_id FROM public.professor_turma_disciplina
    WHERE professor_user_id = auth.uid() AND status = 'ativo'
  )
);

-- Responsável vê turmas dos filhos (R3)
CREATE POLICY "Resp_Read_Turmas" ON public.turmas FOR SELECT TO authenticated
USING (
  id IN (
    SELECT m.turma_id FROM public.matriculas m
    WHERE public.is_my_child_v2(m.aluno_id)
  )
);

-- ============================================================
-- 5. FUNÇÃO: RETORNAR TURMAS DO PROFESSOR LOGADO
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_turmas_professor()
RETURNS TABLE (turma_id UUID, disciplina_id UUID, ano_letivo TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT turma_id, disciplina_id, ano_letivo
  FROM public.professor_turma_disciplina
  WHERE professor_user_id = auth.uid()
    AND status = 'ativo';
$$;

COMMENT ON FUNCTION public.fn_turmas_professor IS
  'Retorna o escopo pedagógico do professor logado (suas turmas e disciplinas).';

COMMIT;

-- ==============================================================================
-- ✅ RESUMO MIGRATION 188
-- professor_turma_disciplina: Tabela de vínculos com RLS
-- vw_professor_escopo: View do escopo pedagógico do professor
-- Turmas: Professor vê apenas suas turmas via vínculo explícito
-- fn_turmas_professor(): Helper para queries de escopo
-- Gestor (R1): Acesso total ao tenant via check_is_tenant_staff
-- SuperAdmin (R2): Apenas SELECT
-- Responsável (R3): Via is_my_child_v2
-- ==============================================================================
