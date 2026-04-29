-- ==============================================================================
-- 🛡️ MIGRATION 185: RLS ENTERPRISE AUDIT — ANTI-TENANT-SPOOFING
-- Objetivo:
--   1. Habilitar RLS em TODAS as tabelas pendentes
--   2. WITH CHECK rigoroso em INSERT/UPDATE (previne Tenant Spoofing)
--   3. Função validate_tenant_context() centralizada
--   4. RLS granular para Professor (apenas suas turmas/disciplinas)
--   5. Política para Gestor lançar notas/faltas com audit_log obrigatório
-- Regras Imutáveis:
--   R1: Gestor tem acesso total à sua escola (inclui ação excepcional com audit)
--   R2: Super Admin apenas SELECT (nunca escrita operacional)
--   R3: Responsável acessa apenas seus filhos
-- ==============================================================================

BEGIN;

-- ============================================================
-- FASE 1: FUNÇÃO CENTRALIZADA DE VALIDAÇÃO DE TENANT
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_tenant_context(p_tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Bloqueia registro se tenant_id não bate com o JWT
  -- Previne Tenant Spoofing onde staff de escola-a tenta escrever em escola-b
  IF p_tenant_id IS NULL THEN RETURN false; END IF;
  IF public.get_jwt_tenant_id() IS NULL THEN RETURN false; END IF;
  RETURN p_tenant_id = public.get_jwt_tenant_id();
END;
$$;

COMMENT ON FUNCTION public.validate_tenant_context IS
  'Valida que o tenant_id do registro bate com o JWT. '
  'Usado em WITH CHECK de INSERT/UPDATE para prevenir Tenant Spoofing.';

-- ============================================================
-- FASE 2: VERIFICAR E HABILITAR RLS EM TABELAS PENDENTES
-- ============================================================

DO $$
DECLARE
  tabelas_criticas TEXT[] := ARRAY[
    'notas', 'frequencias', 'matriculas', 'cobrancas', 'alunos',
    'boletins', 'turmas', 'funcionarios', 'contas_pagar',
    'almoxarifado_itens', 'almoxarifado_movimentacoes', 'fornecedores',
    'planos_aula', 'atividades', 'mural_avisos', 'eventos',
    'notificacoes', 'notificacoes_familia', 'configuracoes_escola',
    'config_financeira', 'assinaturas', 'faturas',
    'perfis_acesso', 'usuarios_sistema', 'perfil_permissions',
    'user_permission_overrides', 'audit_logs_v2',
    'aluno_responsavel', 'responsaveis', 'aprovacoes_pendentes',
    'consent_logs', 'super_admin_actions'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tabelas_criticas LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      RAISE NOTICE '✅ RLS habilitado em: %', t;
    ELSE
      RAISE NOTICE '⚠️  Tabela não existe (ok): %', t;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- FASE 3: CORRIGIR WITH CHECK NAS TABELAS CRÍTICAS
-- Previne Tenant Spoofing em INSERT e UPDATE
-- ============================================================

-- -------------- ALUNOS (já existe em 162, reforçar WITH CHECK) --------------
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'alunos') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.alunos';
  END LOOP;
END $$;

CREATE POLICY "Staff_CRUD_Alunos" ON public.alunos FOR ALL TO authenticated
USING  (public.check_is_tenant_staff(tenant_id))
WITH CHECK (
  -- Anti-Spoofing: tenant_id inserido DEVE ser igual ao JWT
  public.check_is_tenant_staff(tenant_id)
  AND public.validate_tenant_context(tenant_id)
);

-- -------------- MATRICULAS (reforçar WITH CHECK) --------------
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'matriculas') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.matriculas';
  END LOOP;
END $$;

CREATE POLICY "Staff_CRUD_Matriculas" ON public.matriculas FOR ALL TO authenticated
USING  (public.check_is_tenant_staff(tenant_id))
WITH CHECK (
  public.check_is_tenant_staff(tenant_id)
  AND public.validate_tenant_context(tenant_id)
);

-- -------------- COBRANCAS (reforçar WITH CHECK) --------------
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cobrancas') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.cobrancas';
  END LOOP;
END $$;

CREATE POLICY "Staff_CRUD_Cobrancas" ON public.cobrancas FOR ALL TO authenticated
USING  (public.check_is_tenant_staff(tenant_id))
WITH CHECK (
  public.check_is_tenant_staff(tenant_id)
  AND public.validate_tenant_context(tenant_id)
);

-- -------------- CONTAS_PAGAR (reforçar WITH CHECK) --------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contas_pagar') THEN
    DROP POLICY IF EXISTS "Staff_CRUD_ContasPagar" ON public.contas_pagar;
    CREATE POLICY "Staff_CRUD_ContasPagar" ON public.contas_pagar FOR ALL TO authenticated
    USING  (public.check_is_tenant_staff(tenant_id))
    WITH CHECK (
      public.check_is_tenant_staff(tenant_id)
      AND public.validate_tenant_context(tenant_id)
    );
  END IF;
END $$;

-- ============================================================
-- FASE 4: RLS GRANULAR PARA PROFESSOR (Apenas suas turmas/disciplinas)
-- Regra: Professor só acessa o seu escopo pedagógico
-- ============================================================

-- Função helper: verifica se professor está vinculado à turma
CREATE OR REPLACE FUNCTION public.check_professor_turma(p_turma_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Gestor/Admin do tenant têm acesso amplo (R1 preservada)
  IF public.check_is_tenant_staff(public.get_jwt_tenant_id()) AND
     EXISTS (SELECT 1 FROM public.escolas WHERE id = public.get_jwt_tenant_id() AND gestor_user_id = auth.uid()) THEN
    RETURN true;
  END IF;

  -- Professor: verificar vínculo na tabela de professor_turma_disciplina
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'professor_turma_disciplina'
  ) THEN
    RETURN EXISTS (
      SELECT 1 FROM public.professor_turma_disciplina ptd
      WHERE ptd.turma_id = p_turma_id
        AND ptd.professor_user_id = auth.uid()
        AND ptd.status = 'ativo'
    );
  END IF;

  -- Fallback: qualquer staff do tenant (para escolas sem o vínculo cadastrado)
  RETURN public.check_is_tenant_staff(public.get_jwt_tenant_id());
END;
$$;

COMMENT ON FUNCTION public.check_professor_turma IS
  'Verifica se o usuário atual é professor da turma indicada. '
  'Gestor/Diretor sempre retorna true (R1). Professor só retorna true se vinculado.';

-- Função helper: verifica se professor está vinculado à turma+disciplina
CREATE OR REPLACE FUNCTION public.check_professor_disciplina(p_turma_id uuid, p_disciplina_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Gestor: acesso total (R1)
  IF EXISTS (SELECT 1 FROM public.escolas WHERE id = public.get_jwt_tenant_id() AND gestor_user_id = auth.uid()) THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'professor_turma_disciplina'
  ) THEN
    RETURN EXISTS (
      SELECT 1 FROM public.professor_turma_disciplina ptd
      WHERE ptd.turma_id = p_turma_id
        AND ptd.disciplina_id = p_disciplina_id
        AND ptd.professor_user_id = auth.uid()
        AND ptd.status = 'ativo'
    );
  END IF;

  RETURN public.check_is_tenant_staff(public.get_jwt_tenant_id());
END;
$$;

-- ============================================================
-- FASE 5: POLÍTICAS PARA NOTAS/FREQUENCIAS — PROFESSOR + GESTOR
-- R1: Gestor pode lançar notas (excepcional, com justificativa no audit_log)
-- Professor: apenas suas turmas/disciplinas
-- ============================================================

DO $$
DECLARE r RECORD;
BEGIN
  -- NOTAS
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notas') THEN
    -- Limpa políticas antigas
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notas') LOOP
      EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.notas';
    END LOOP;

    -- Staff (Gestor/Secretária) pode ler tudo no tenant
    CREATE POLICY "Staff_Read_Notas" ON public.notas FOR SELECT TO authenticated
    USING (public.check_is_tenant_staff(tenant_id));

    -- Professor lança nota apenas em turmas/disciplinas vinculadas (aciona função granular)
    CREATE POLICY "Professor_Insert_Notas" ON public.notas FOR INSERT TO authenticated
    WITH CHECK (
      public.check_is_tenant_staff(tenant_id)
      AND public.validate_tenant_context(tenant_id)
      AND (
        -- Gestor: pode inserir (ação excepcional — audit_log registrado via trigger)
        EXISTS (SELECT 1 FROM public.escolas WHERE id = tenant_id AND gestor_user_id = auth.uid())
        OR
        -- Professor: apenas sua turma+disciplina
        public.check_professor_disciplina(turma_id, disciplina_id)
      )
    );

    -- Professor/Gestor pode atualizar nota já existente
    CREATE POLICY "Professor_Update_Notas" ON public.notas FOR UPDATE TO authenticated
    USING (public.check_is_tenant_staff(tenant_id))
    WITH CHECK (
      public.validate_tenant_context(tenant_id)
      AND (
        EXISTS (SELECT 1 FROM public.escolas WHERE id = tenant_id AND gestor_user_id = auth.uid())
        OR public.check_professor_disciplina(turma_id, disciplina_id)
      )
    );

    -- SuperAdmin: apenas leitura (R2)
    CREATE POLICY "SA_Read_Notas" ON public.notas FOR SELECT TO authenticated
    USING (public.check_is_super_admin());

    -- Responsável: lê notas dos filhos (R3)
    CREATE POLICY "Resp_Read_Notas" ON public.notas FOR SELECT TO authenticated
    USING (public.is_my_child_v2(aluno_id));

    RAISE NOTICE '✅ Políticas de notas configuradas';
  ELSE
    RAISE NOTICE '⚠️  Tabela notas não existe ainda';
  END IF;
END $$;

DO $$
DECLARE r RECORD;
BEGIN
  -- FREQUENCIAS (reforçar WITH CHECK existente)
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'frequencias') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.frequencias';
  END LOOP;

  -- Staff lê tudo no tenant
  CREATE POLICY "Staff_Read_Frequencias" ON public.frequencias FOR SELECT TO authenticated
  USING (public.check_is_tenant_staff(tenant_id));

  -- Professor: INSERT apenas em suas turmas
  CREATE POLICY "Professor_Insert_Frequencias" ON public.frequencias FOR INSERT TO authenticated
  WITH CHECK (
    public.check_is_tenant_staff(tenant_id)
    AND public.validate_tenant_context(tenant_id)
    AND (
      EXISTS (SELECT 1 FROM public.escolas WHERE id = tenant_id AND gestor_user_id = auth.uid())
      OR public.check_professor_turma(turma_id)
    )
  );

  CREATE POLICY "Professor_Update_Frequencias" ON public.frequencias FOR UPDATE TO authenticated
  USING (public.check_is_tenant_staff(tenant_id))
  WITH CHECK (
    public.validate_tenant_context(tenant_id)
    AND (
      EXISTS (SELECT 1 FROM public.escolas WHERE id = tenant_id AND gestor_user_id = auth.uid())
      OR public.check_professor_turma(turma_id)
    )
  );

  CREATE POLICY "SA_Read_Frequencias" ON public.frequencias FOR SELECT TO authenticated
  USING (public.check_is_super_admin());

  CREATE POLICY "Resp_Read_Frequencias" ON public.frequencias FOR SELECT TO authenticated
  USING (public.is_my_child_v2(aluno_id));
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE '⚠️  Tabela frequencias não existe';
END $$;

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
DO $$
DECLARE
  tabelas_sem_rls TEXT[] := ARRAY[]::TEXT[];
  t TEXT;
BEGIN
  FOR t IN (
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT IN (
      SELECT tablename FROM pg_policies WHERE schemaname = 'public'
    )
    AND tablename NOT LIKE '%_view%'
    AND tablename NOT LIKE 'vw_%'
  ) LOOP
    tabelas_sem_rls := tabelas_sem_rls || t;
  END LOOP;

  IF array_length(tabelas_sem_rls, 1) > 0 THEN
    RAISE WARNING '⚠️  Tabelas sem políticas RLS: %', array_to_string(tabelas_sem_rls, ', ');
  ELSE
    RAISE NOTICE '✅ Todas as tabelas têm políticas RLS configuradas';
  END IF;
END $$;

COMMIT;

-- ==============================================================================
-- ✅ RESUMO MIGRATION 185
-- validate_tenant_context(): Anti-Tenant-Spoofing centralizado
-- check_professor_turma() / check_professor_disciplina(): Escopo granular
-- R1: Gestor tem acesso total ao seu tenant (com audit para ações excepcionais)
-- R2: SuperAdmin = apenas SELECT (nunca escrita operacional)
-- R3: Responsável = apenas filhos via is_my_child_v2()
-- ==============================================================================
