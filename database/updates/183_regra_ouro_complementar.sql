-- ==============================================================================
-- 🛡️ MIGRATION 183: REGRA DE OURO COMPLEMENTAR
-- Corrige tabelas secundárias que ainda davam WRITE ao SuperAdmin
-- Aplica a mesma segregação: SuperAdmin = SELECT only
-- ==============================================================================

BEGIN;

-- ============================================================
-- 1. ESCOLAS (Infraestrutura - SuperAdmin pode gerenciar tenants)
-- ============================================================
DO $$ BEGIN
  DROP POLICY IF EXISTS "Leitura livre - Escolas" ON public.escolas;
  DROP POLICY IF EXISTS "Universal_Select_Escolas" ON public.escolas;
  DROP POLICY IF EXISTS "Universal_Update_Escolas" ON public.escolas;
END $$;

-- Leitura livre para todos autenticados (necessário para JOINs)
CREATE POLICY "Read_Escolas" ON public.escolas FOR SELECT TO authenticated USING (true);
-- Onboarding: anon pode inserir escola
CREATE POLICY "Onboard_Insert_Escolas" ON public.escolas FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Staff pode editar SUA escola
CREATE POLICY "Staff_Update_Escolas" ON public.escolas FOR UPDATE TO authenticated
USING (public.check_is_tenant_staff(id)) WITH CHECK (public.check_is_tenant_staff(id));
-- SuperAdmin pode criar/suspender/editar escolas (gestão de tenants)
CREATE POLICY "SA_Manage_Escolas" ON public.escolas FOR ALL TO authenticated
USING (public.check_is_super_admin()) WITH CHECK (public.check_is_super_admin());

-- ============================================================
-- 2. FILIAIS e DISCIPLINAS (Leitura livre)
-- ============================================================
DO $$ BEGIN
  DROP POLICY IF EXISTS "Leitura livre - Filiais" ON public.filiais;
  DROP POLICY IF EXISTS "Leitura livre - Disciplinas" ON public.disciplinas;
  DROP POLICY IF EXISTS "RP_Filiais_Gestor" ON public.filiais;
  DROP POLICY IF EXISTS "onboarding_insert_filiais" ON public.filiais;
END $$;

CREATE POLICY "Read_Filiais" ON public.filiais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff_CRUD_Filiais" ON public.filiais FOR ALL TO authenticated
USING (public.check_is_tenant_staff(tenant_id)) WITH CHECK (public.check_is_tenant_staff(tenant_id));
CREATE POLICY "SA_Read_Filiais" ON public.filiais FOR SELECT TO authenticated
USING (public.check_is_super_admin());
CREATE POLICY "Onboard_Insert_Filiais" ON public.filiais FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Read_Disciplinas" ON public.disciplinas FOR SELECT TO authenticated USING (true);

-- ============================================================
-- 3. FUNCIONARIOS (Staff CRUD, SuperAdmin READ)
-- ============================================================
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'funcionarios'
  ) LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.funcionarios';
  END LOOP;
END $$;

CREATE POLICY "Staff_CRUD_Funcionarios" ON public.funcionarios FOR ALL TO authenticated
USING (public.check_is_tenant_staff(tenant_id)) WITH CHECK (public.check_is_tenant_staff(tenant_id));

CREATE POLICY "SA_Read_Funcionarios" ON public.funcionarios FOR SELECT TO authenticated
USING (public.check_is_super_admin());

-- Funcionário pode ver SEU PRÓPRIO registro (essencial para login)
CREATE POLICY "Self_Read_Funcionarios" ON public.funcionarios FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- ============================================================
-- 4. USUARIOS_SISTEMA (Staff CRUD, SuperAdmin READ)
-- ============================================================
DO $$ BEGIN
  DROP POLICY IF EXISTS "Permissao_usuarios_sistema" ON public.usuarios_sistema;
END $$;

CREATE POLICY "Staff_CRUD_UsuariosSistema" ON public.usuarios_sistema FOR ALL TO authenticated
USING (public.check_is_tenant_staff(tenant_id)) WITH CHECK (public.check_is_tenant_staff(tenant_id));

CREATE POLICY "SA_Read_UsuariosSistema" ON public.usuarios_sistema FOR SELECT TO authenticated
USING (public.check_is_super_admin());

-- Self-read para login inicial
CREATE POLICY "Self_Read_UsuariosSistema" ON public.usuarios_sistema FOR SELECT TO authenticated
USING (id = auth.uid());

-- ============================================================
-- 5. BOLETINS (Staff CRUD, SuperAdmin READ, Resp READ)
-- ============================================================
DO $$
DECLARE r RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'boletins' AND schemaname = 'public') THEN
    FOR r IN (
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'boletins'
    ) LOOP
      EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.boletins';
    END LOOP;

    CREATE POLICY "Staff_CRUD_Boletins" ON public.boletins FOR ALL TO authenticated
    USING (public.check_is_tenant_staff(tenant_id)) WITH CHECK (public.check_is_tenant_staff(tenant_id));

    CREATE POLICY "SA_Read_Boletins" ON public.boletins FOR SELECT TO authenticated
    USING (public.check_is_super_admin());

    CREATE POLICY "Resp_Read_Boletins" ON public.boletins FOR SELECT TO authenticated
    USING (public.is_my_child_v2(aluno_id));
  END IF;
END $$;

-- ============================================================
-- 6. TABELAS SECUNDÁRIAS (Corrigir migration 164)
-- ============================================================
DO $$ BEGIN
  -- atividades_turmas
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'atividades_turmas' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "tenant_acesso_atividades_turmas" ON public.atividades_turmas;
    CREATE POLICY "Staff_CRUD_AtividadesTurmas" ON public.atividades_turmas FOR ALL TO authenticated
    USING (public.check_is_tenant_staff(tenant_id)) WITH CHECK (public.check_is_tenant_staff(tenant_id));
    CREATE POLICY "SA_Read_AtividadesTurmas" ON public.atividades_turmas FOR SELECT TO authenticated
    USING (public.check_is_super_admin());
  END IF;

  -- planos_aula_turmas
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'planos_aula_turmas' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "tenant_acesso_planos_aula_turmas" ON public.planos_aula_turmas;
    CREATE POLICY "Staff_CRUD_PlanosAulaTurmas" ON public.planos_aula_turmas FOR ALL TO authenticated
    USING (public.check_is_tenant_staff(tenant_id)) WITH CHECK (public.check_is_tenant_staff(tenant_id));
    CREATE POLICY "SA_Read_PlanosAulaTurmas" ON public.planos_aula_turmas FOR SELECT TO authenticated
    USING (public.check_is_super_admin());
  END IF;

  -- planos_aula
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'planos_aula' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "Universal_Select_PlanosAula" ON public.planos_aula;
    DROP POLICY IF EXISTS "Universal_Update_PlanosAula" ON public.planos_aula;
    DROP POLICY IF EXISTS "Universal_Insert_PlanosAula" ON public.planos_aula;
    CREATE POLICY "Staff_CRUD_PlanosAula" ON public.planos_aula FOR ALL TO authenticated
    USING (public.check_is_tenant_staff(tenant_id)) WITH CHECK (public.check_is_tenant_staff(tenant_id));
    CREATE POLICY "SA_Read_PlanosAula" ON public.planos_aula FOR SELECT TO authenticated
    USING (public.check_is_super_admin());
  END IF;

  -- notificacoes (global)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notificacoes' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "tenant_acesso_notificacoes" ON public.notificacoes;
    CREATE POLICY "Staff_CRUD_Notificacoes" ON public.notificacoes FOR ALL TO authenticated
    USING (public.check_is_tenant_staff(tenant_id)) WITH CHECK (public.check_is_tenant_staff(tenant_id));
    CREATE POLICY "SA_Read_Notificacoes" ON public.notificacoes FOR SELECT TO authenticated
    USING (public.check_is_super_admin());
  END IF;

  -- almoxarifado_itens
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'almoxarifado_itens' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "tenant_acesso_almoxarifado_itens" ON public.almoxarifado_itens;
    CREATE POLICY "Staff_CRUD_Almoxarifado" ON public.almoxarifado_itens FOR ALL TO authenticated
    USING (public.check_is_tenant_staff(tenant_id)) WITH CHECK (public.check_is_tenant_staff(tenant_id));
    CREATE POLICY "SA_Read_Almoxarifado" ON public.almoxarifado_itens FOR SELECT TO authenticated
    USING (public.check_is_super_admin());
  END IF;

  -- fornecedores
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'fornecedores' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "tenant_acesso_fornecedores" ON public.fornecedores;
    CREATE POLICY "Staff_CRUD_Fornecedores" ON public.fornecedores FOR ALL TO authenticated
    USING (public.check_is_tenant_staff(tenant_id)) WITH CHECK (public.check_is_tenant_staff(tenant_id));
    CREATE POLICY "SA_Read_Fornecedores" ON public.fornecedores FOR SELECT TO authenticated
    USING (public.check_is_super_admin());
  END IF;
END $$;

-- ============================================================
-- 7. CONFIGURACOES_ESCOLA (Staff CRUD, SA READ, Resp READ)
-- ============================================================
DO $$
DECLARE r RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'configuracoes_escola' AND schemaname = 'public') THEN
    FOR r IN (
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'configuracoes_escola'
    ) LOOP
      EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.configuracoes_escola';
    END LOOP;

    ALTER TABLE public.configuracoes_escola ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Staff_CRUD_ConfigEscola" ON public.configuracoes_escola FOR ALL TO authenticated
    USING (public.check_is_tenant_staff(tenant_id)) WITH CHECK (public.check_is_tenant_staff(tenant_id));

    CREATE POLICY "SA_Read_ConfigEscola" ON public.configuracoes_escola FOR SELECT TO authenticated
    USING (public.check_is_super_admin());

    CREATE POLICY "Resp_Read_ConfigEscola" ON public.configuracoes_escola FOR SELECT TO authenticated
    USING (tenant_id IN (SELECT a.tenant_id FROM public.alunos a WHERE public.is_my_child_v2(a.id)));
  END IF;
END $$;

COMMIT;
