-- ==============================================================================
-- 🛡️ MIGRATION 162: REGRA DE OURO - SEGREGAÇÃO SUPERADMIN
-- SuperAdmin: SELECT global (auditoria/suporte) | ZERO escrita operacional
-- Staff (Gestor/Funcionário): CRUD completo no seu tenant
-- Responsável: Acesso aos dados dos filhos (INTACTO)
-- ==============================================================================

BEGIN;

-- ============================================================
-- FASE 1: FUNÇÕES HELPER (Base de tudo)
-- ============================================================

-- 1A. Verificação inline de SuperAdmin (sem dependência externa)
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COALESCE((auth.jwt()->'app_metadata'->>'is_super_admin')::boolean, false) OR
    COALESCE((auth.jwt()->'user_metadata'->>'is_super_admin')::boolean, false) OR
    COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) OR
    (auth.jwt()->'user_metadata'->>'role') = 'super_admin';
$$;

-- Alias para compatibilidade com código legado
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.check_is_super_admin(); $$;

-- 1B. Extração robusta do tenant_id do JWT (múltiplas localizações)
CREATE OR REPLACE FUNCTION public.get_jwt_tenant_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT NULLIF(COALESCE(
    auth.jwt()->'user_metadata'->>'tenant_id',
    auth.jwt()->'app_metadata'->>'tenant_id',
    auth.jwt()->>'tenant_id'
  ), '')::uuid;
$$;

-- 1C. Staff do Tenant (Gestor direto OU Funcionário ativo)
CREATE OR REPLACE FUNCTION public.check_is_tenant_staff(p_tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_tenant_id IS NULL THEN RETURN false; END IF;
  RETURN (
    -- Via JWT claim
    p_tenant_id = public.get_jwt_tenant_id()
    OR
    -- Via tabela usuarios_sistema
    EXISTS (SELECT 1 FROM public.usuarios_sistema us
            WHERE us.tenant_id = p_tenant_id AND us.id = auth.uid() AND us.status = 'ativo')
    OR
    -- Via gestor direto da escola
    EXISTS (SELECT 1 FROM public.escolas e
            WHERE e.id = p_tenant_id AND e.gestor_user_id = auth.uid())
  );
END;
$$;

-- ============================================================
-- FASE 2: LIMPEZA TOTAL DE POLÍTICAS NAS TABELAS OPERACIONAIS
-- ============================================================
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN (
      'alunos','aluno_responsavel','responsaveis','matriculas','turmas',
      'cobrancas','frequencias','mural_avisos','eventos',
      'notificacoes_familia','config_financeira','contas_pagar',
      'assinaturas','faturas','audit_logs_v2'
    )
  ) LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
  END LOOP;
END $$;

-- ============================================================
-- FASE 3: POLÍTICAS OPERACIONAIS (SuperAdmin = READ ONLY)
-- Padrão por tabela:
--   P1: Staff CRUD (check_is_tenant_staff) - SEM super_admin
--   P2: SuperAdmin READ-ONLY (check_is_super_admin)
--   P3: Responsável READ (onde aplicável)
--   P4: Responsável UPDATE (onde aplicável)
-- ============================================================

-- ------------------ ALUNOS ------------------
CREATE POLICY "Staff_CRUD_Alunos" ON public.alunos FOR ALL TO authenticated
USING (public.check_is_tenant_staff(tenant_id))
WITH CHECK (public.check_is_tenant_staff(tenant_id));

CREATE POLICY "SA_Read_Alunos" ON public.alunos FOR SELECT TO authenticated
USING (public.check_is_super_admin());

CREATE POLICY "Resp_Read_Alunos" ON public.alunos FOR SELECT TO authenticated
USING (public.is_my_child_v2(id));

-- ------------------ ALUNO_RESPONSAVEL ------------------
CREATE POLICY "Staff_CRUD_AlunoResp" ON public.aluno_responsavel FOR ALL TO authenticated
USING (public.check_is_tenant_staff(tenant_id))
WITH CHECK (public.check_is_tenant_staff(tenant_id));

CREATE POLICY "SA_Read_AlunoResp" ON public.aluno_responsavel FOR SELECT TO authenticated
USING (public.check_is_super_admin());

CREATE POLICY "Resp_Read_AlunoResp" ON public.aluno_responsavel FOR SELECT TO authenticated
USING (responsavel_id = public.get_my_responsavel_id());

-- ------------------ RESPONSAVEIS ------------------
CREATE POLICY "Staff_CRUD_Responsaveis" ON public.responsaveis FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.aluno_responsavel ar
    JOIN public.alunos a ON a.id = ar.aluno_id
    WHERE ar.responsavel_id = responsaveis.id
    AND public.check_is_tenant_staff(a.tenant_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.aluno_responsavel ar
    JOIN public.alunos a ON a.id = ar.aluno_id
    WHERE ar.responsavel_id = responsaveis.id
    AND public.check_is_tenant_staff(a.tenant_id)
  )
);

-- Staff pode INSERIR novos responsáveis (ainda sem vínculo)
CREATE POLICY "Staff_Insert_Responsaveis" ON public.responsaveis FOR INSERT TO authenticated
WITH CHECK (
  public.get_jwt_tenant_id() IS NOT NULL
  OR EXISTS (SELECT 1 FROM public.escolas WHERE gestor_user_id = auth.uid())
);

CREATE POLICY "SA_Read_Responsaveis" ON public.responsaveis FOR SELECT TO authenticated
USING (public.check_is_super_admin());

CREATE POLICY "Resp_Self_Responsaveis" ON public.responsaveis FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ------------------ MATRICULAS ------------------
CREATE POLICY "Staff_CRUD_Matriculas" ON public.matriculas FOR ALL TO authenticated
USING (public.check_is_tenant_staff(tenant_id))
WITH CHECK (public.check_is_tenant_staff(tenant_id));

CREATE POLICY "SA_Read_Matriculas" ON public.matriculas FOR SELECT TO authenticated
USING (public.check_is_super_admin());

CREATE POLICY "Resp_Read_Matriculas" ON public.matriculas FOR SELECT TO authenticated
USING (public.is_my_child_v2(aluno_id));

-- ------------------ TURMAS ------------------
CREATE POLICY "Staff_CRUD_Turmas" ON public.turmas FOR ALL TO authenticated
USING (public.check_is_tenant_staff(tenant_id))
WITH CHECK (public.check_is_tenant_staff(tenant_id));

CREATE POLICY "SA_Read_Turmas" ON public.turmas FOR SELECT TO authenticated
USING (public.check_is_super_admin());

CREATE POLICY "Resp_Read_Turmas" ON public.turmas FOR SELECT TO authenticated
USING (id IN (SELECT turma_id FROM public.matriculas WHERE public.is_my_child_v2(aluno_id)));

-- ------------------ COBRANCAS ------------------
CREATE POLICY "Staff_CRUD_Cobrancas" ON public.cobrancas FOR ALL TO authenticated
USING (public.check_is_tenant_staff(tenant_id))
WITH CHECK (public.check_is_tenant_staff(tenant_id));

CREATE POLICY "SA_Read_Cobrancas" ON public.cobrancas FOR SELECT TO authenticated
USING (public.check_is_super_admin());

CREATE POLICY "Resp_Read_Cobrancas" ON public.cobrancas FOR SELECT TO authenticated
USING (public.is_my_child_v2(aluno_id));

CREATE POLICY "Resp_Update_Cobrancas" ON public.cobrancas FOR UPDATE TO authenticated
USING (public.is_my_child_v2(aluno_id))
WITH CHECK (public.is_my_child_v2(aluno_id));

-- ------------------ FREQUENCIAS ------------------
CREATE POLICY "Staff_CRUD_Frequencias" ON public.frequencias FOR ALL TO authenticated
USING (public.check_is_tenant_staff(tenant_id))
WITH CHECK (public.check_is_tenant_staff(tenant_id));

CREATE POLICY "SA_Read_Frequencias" ON public.frequencias FOR SELECT TO authenticated
USING (public.check_is_super_admin());

CREATE POLICY "Resp_Read_Frequencias" ON public.frequencias FOR SELECT TO authenticated
USING (public.is_my_child_v2(aluno_id));

-- ------------------ MURAL_AVISOS ------------------
CREATE POLICY "Staff_CRUD_Mural" ON public.mural_avisos FOR ALL TO authenticated
USING (public.check_is_tenant_staff(tenant_id))
WITH CHECK (public.check_is_tenant_staff(tenant_id));

CREATE POLICY "SA_Read_Mural" ON public.mural_avisos FOR SELECT TO authenticated
USING (public.check_is_super_admin());

CREATE POLICY "Resp_Read_Mural" ON public.mural_avisos FOR SELECT TO authenticated
USING (tenant_id IN (SELECT a.tenant_id FROM public.alunos a WHERE public.is_my_child_v2(a.id)));

-- ------------------ EVENTOS ------------------
CREATE POLICY "Staff_CRUD_Eventos" ON public.eventos FOR ALL TO authenticated
USING (public.check_is_tenant_staff(tenant_id))
WITH CHECK (public.check_is_tenant_staff(tenant_id));

CREATE POLICY "SA_Read_Eventos" ON public.eventos FOR SELECT TO authenticated
USING (public.check_is_super_admin());

CREATE POLICY "Resp_Read_Eventos" ON public.eventos FOR SELECT TO authenticated
USING (tenant_id IN (SELECT a.tenant_id FROM public.alunos a WHERE public.is_my_child_v2(a.id)));

-- ------------------ NOTIFICACOES_FAMILIA ------------------
CREATE POLICY "Staff_CRUD_NotifFamilia" ON public.notificacoes_familia FOR ALL TO authenticated
USING (public.check_is_tenant_staff(tenant_id))
WITH CHECK (public.check_is_tenant_staff(tenant_id));

CREATE POLICY "SA_Read_NotifFamilia" ON public.notificacoes_familia FOR SELECT TO authenticated
USING (public.check_is_super_admin());

CREATE POLICY "Resp_Read_NotifFamilia" ON public.notificacoes_familia FOR SELECT TO authenticated
USING (responsavel_id IN (SELECT id FROM public.responsaveis WHERE user_id = auth.uid()));

CREATE POLICY "Resp_Update_NotifFamilia" ON public.notificacoes_familia FOR UPDATE TO authenticated
USING (responsavel_id IN (SELECT id FROM public.responsaveis WHERE user_id = auth.uid()))
WITH CHECK (responsavel_id IN (SELECT id FROM public.responsaveis WHERE user_id = auth.uid()));

-- ------------------ CONFIG_FINANCEIRA ------------------
CREATE POLICY "Staff_CRUD_ConfigFin" ON public.config_financeira FOR ALL TO authenticated
USING (public.check_is_tenant_staff(tenant_id))
WITH CHECK (public.check_is_tenant_staff(tenant_id));

CREATE POLICY "SA_Read_ConfigFin" ON public.config_financeira FOR SELECT TO authenticated
USING (public.check_is_super_admin());

CREATE POLICY "Resp_Read_ConfigFin" ON public.config_financeira FOR SELECT TO authenticated
USING (tenant_id IN (SELECT a.tenant_id FROM public.alunos a WHERE public.is_my_child_v2(a.id)));

-- ------------------ CONTAS_PAGAR ------------------
DO $$ BEGIN
  CREATE POLICY "Staff_CRUD_ContasPagar" ON public.contas_pagar FOR ALL TO authenticated
  USING (public.check_is_tenant_staff(tenant_id))
  WITH CHECK (public.check_is_tenant_staff(tenant_id));

  CREATE POLICY "SA_Read_ContasPagar" ON public.contas_pagar FOR SELECT TO authenticated
  USING (public.check_is_super_admin());
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'contas_pagar não existe, pulando';
END $$;

-- ============================================================
-- FASE 4: TABELAS DE INFRAESTRUTURA (SuperAdmin TEM escrita)
-- ============================================================

-- ASSINATURAS (SuperAdmin gerencia billing)
CREATE POLICY "Staff_CRUD_Assinaturas" ON public.assinaturas FOR ALL TO authenticated
USING (public.check_is_tenant_staff(tenant_id))
WITH CHECK (public.check_is_tenant_staff(tenant_id));

CREATE POLICY "SA_Full_Assinaturas" ON public.assinaturas FOR ALL TO authenticated
USING (public.check_is_super_admin())
WITH CHECK (public.check_is_super_admin());

CREATE POLICY "Onboard_Insert_Assinaturas" ON public.assinaturas FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- FATURAS (SuperAdmin gerencia billing)
CREATE POLICY "Staff_CRUD_Faturas" ON public.faturas FOR ALL TO authenticated
USING (public.check_is_tenant_staff(tenant_id))
WITH CHECK (public.check_is_tenant_staff(tenant_id));

CREATE POLICY "SA_Full_Faturas" ON public.faturas FOR ALL TO authenticated
USING (public.check_is_super_admin())
WITH CHECK (public.check_is_super_admin());

CREATE POLICY "Onboard_Insert_Faturas" ON public.faturas FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- AUDIT_LOGS_V2 (SuperAdmin lê tudo, todos podem inserir)
DO $$ BEGIN
  ALTER TABLE public.audit_logs_v2 ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "SA_Read_AuditLogs" ON public.audit_logs_v2 FOR SELECT TO authenticated
  USING (public.check_is_super_admin());

  CREATE POLICY "Staff_Read_AuditLogs" ON public.audit_logs_v2 FOR SELECT TO authenticated
  USING (public.check_is_tenant_staff(tenant_id));

  CREATE POLICY "Public_Insert_AuditLogs" ON public.audit_logs_v2 FOR INSERT TO authenticated
  WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'audit_logs_v2 não existe, pulando';
END $$;

COMMIT;

-- ==============================================================================
-- ✅ RESUMO DA REGRA DE OURO
-- SuperAdmin: SELECT em tudo (auditoria), ZERO escrita em tabelas operacionais
-- SuperAdmin: Escrita APENAS em assinaturas, faturas (billing/infraestrutura)
-- Staff: CRUD completo via check_is_tenant_staff (JWT + usuarios_sistema + gestor)
-- Responsável: Leitura dos filhos via is_my_child_v2, self-access, update limitado
-- ==============================================================================
