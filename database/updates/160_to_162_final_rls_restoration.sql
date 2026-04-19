-- ==============================================================================
-- 🚩 MIGRATION 160: SECURITY HELPERS V2 - Fluxoo EDU
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_my_responsavel_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.responsaveis WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_my_child_v2(p_aluno_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS ( SELECT 1 FROM public.aluno_responsavel ar WHERE ar.aluno_id = p_aluno_id AND ar.responsavel_id = public.get_my_responsavel_id() );
$$;

CREATE OR REPLACE FUNCTION public.is_staff_of_school(p_tenant_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS ( SELECT 1 FROM public.usuarios_sistema us WHERE us.tenant_id = p_tenant_id AND us.id = auth.uid() AND us.status = 'ativo' );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin_v2() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean, false) OR COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean, false) OR (auth.jwt() ->> 'role') = 'super_admin';
$$;

-- ==============================================================================
-- 🚨 MIGRATION 161: RLS CORE RESTORATION (BLINDAGEM SEGURA)
-- ==============================================================================
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN DROP POLICY IF EXISTS "Leitura livre - Escolas" ON public.escolas; DROP POLICY IF EXISTS "Leitura livre - Filiais" ON public.filiais; DROP POLICY IF EXISTS "Leitura livre - Disciplinas" ON public.disciplinas; END $$;
CREATE POLICY "Leitura livre - Escolas" ON public.escolas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura livre - Filiais" ON public.filiais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura livre - Disciplinas" ON public.disciplinas FOR SELECT TO authenticated USING (true);

ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Staff ve alunos" ON public.alunos; DROP POLICY IF EXISTS "Pais veem apenas seus filhos" ON public.alunos; END $$;
CREATE POLICY "Staff ve alunos" ON public.alunos FOR ALL TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2());
CREATE POLICY "Pais veem apenas seus filhos" ON public.alunos FOR SELECT TO authenticated USING ( (SELECT public.is_my_child_v2(id)) );

ALTER TABLE public.aluno_responsavel ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Staff acesso aluno_responsavel" ON public.aluno_responsavel; DROP POLICY IF EXISTS "Responsavel ve apenas seus vinculos" ON public.aluno_responsavel; END $$;
CREATE POLICY "Staff acesso aluno_responsavel" ON public.aluno_responsavel FOR ALL TO authenticated USING ( public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2() );
CREATE POLICY "Responsavel ve apenas seus vinculos" ON public.aluno_responsavel FOR SELECT TO authenticated USING ( responsavel_id = public.get_my_responsavel_id() );

ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Responsaveis Multi-Acesso" ON public.responsaveis; END $$;
CREATE POLICY "Responsaveis Multi-Acesso" ON public.responsaveis FOR ALL TO authenticated USING (user_id = auth.uid() OR id = auth.uid() OR public.is_super_admin_v2() OR EXISTS (SELECT 1 FROM public.aluno_responsavel ar JOIN public.alunos a ON a.id = ar.aluno_id WHERE ar.responsavel_id = public.responsaveis.id AND public.is_staff_of_school(a.tenant_id)));

ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Staff gerencia turmas" ON public.turmas; DROP POLICY IF EXISTS "Pais veem turmas" ON public.turmas; DROP POLICY IF EXISTS "Staff gerencia matriculas" ON public.matriculas; DROP POLICY IF EXISTS "Pais veem matriculas" ON public.matriculas; END $$;
CREATE POLICY "Staff gerencia turmas" ON public.turmas FOR ALL TO authenticated USING ( tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2() );
CREATE POLICY "Pais veem turmas" ON public.turmas FOR SELECT TO authenticated USING ( id IN (SELECT turma_id FROM public.matriculas WHERE public.is_my_child_v2(aluno_id)) );
CREATE POLICY "Staff gerencia matriculas" ON public.matriculas FOR ALL TO authenticated USING ( tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2() );
CREATE POLICY "Pais veem matriculas" ON public.matriculas FOR SELECT TO authenticated USING ( public.is_my_child_v2(aluno_id) );

ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_financeira ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Staff gerencia financeiro" ON public.cobrancas; DROP POLICY IF EXISTS "Pais veem cobrancas" ON public.cobrancas; DROP POLICY IF EXISTS "Staff_assinaturas" ON public.assinaturas; DROP POLICY IF EXISTS "Staff_faturas" ON public.faturas; DROP POLICY IF EXISTS "Staff_config_financeira" ON public.config_financeira; END $$;
CREATE POLICY "Staff gerencia financeiro" ON public.cobrancas FOR ALL TO authenticated USING ( tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2() );
CREATE POLICY "Pais veem cobrancas" ON public.cobrancas FOR SELECT TO authenticated USING ( public.is_my_child_v2(aluno_id) );
CREATE POLICY "Staff_assinaturas" ON public.assinaturas FOR ALL TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2());
CREATE POLICY "Staff_faturas" ON public.faturas FOR ALL TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2());
CREATE POLICY "Staff_config_financeira" ON public.config_financeira FOR ALL TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2());

ALTER TABLE public.mural_avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frequencias ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Staff_mural" ON public.mural_avisos; DROP POLICY IF EXISTS "Pais_mural" ON public.mural_avisos; DROP POLICY IF EXISTS "Staff_frequencias" ON public.frequencias; DROP POLICY IF EXISTS "Pais_frequencias" ON public.frequencias; END $$;
CREATE POLICY "Staff_mural" ON public.mural_avisos FOR ALL TO authenticated USING ( tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2() );
CREATE POLICY "Pais_mural" ON public.mural_avisos FOR SELECT TO authenticated USING ( tenant_id IN (SELECT a.tenant_id FROM public.alunos a WHERE public.is_my_child_v2(a.id)) );
CREATE POLICY "Staff_frequencias" ON public.frequencias FOR ALL TO authenticated USING ( tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2() );
CREATE POLICY "Pais_frequencias" ON public.frequencias FOR SELECT TO authenticated USING ( public.is_my_child_v2(aluno_id) );

ALTER TABLE public.usuarios_sistema ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Permissao_usuarios_sistema" ON public.usuarios_sistema; END $$;
CREATE POLICY "Permissao_usuarios_sistema" ON public.usuarios_sistema FOR ALL TO authenticated USING ( tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR id = auth.uid() OR public.is_super_admin_v2() );

-- ==============================================================================
-- 🚨 MIGRATION 162: MARKETPLACE E CURRÍCULOS (FIX PERMISSION DENIED)
-- ==============================================================================
ALTER TABLE public.curriculos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "curriculos_superadmin_select_v2" ON public.curriculos; DROP POLICY IF EXISTS "curriculos_superadmin_manage_v2" ON public.curriculos; DROP POLICY IF EXISTS "owner_curriculos" ON public.curriculos; DROP POLICY IF EXISTS "todos_autenticados_veem_curriculos_ativos" ON public.curriculos; DROP POLICY IF EXISTS "curriculos_superadmin_select" ON public.curriculos; DROP POLICY IF EXISTS "curriculos_superadmin_manage" ON public.curriculos; DROP POLICY IF EXISTS "curriculos_owner_select" ON public.curriculos; DROP POLICY IF EXISTS "curriculos_portal_familia_select" ON public.curriculos; END $$;
CREATE POLICY "super_admins_curriculos" ON public.curriculos FOR ALL TO authenticated USING (public.is_super_admin_v2());
CREATE POLICY "owner_curriculos" ON public.curriculos FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "todos_autenticados_veem_curriculos_ativos" ON public.curriculos FOR SELECT TO authenticated USING (is_ativo = true);

ALTER TABLE public.lojistas ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Lojistas: super adm tem acesso total" ON public.lojistas; DROP POLICY IF EXISTS "Lojistas: usuario ve seu proprio registro" ON public.lojistas; DROP POLICY IF EXISTS "Lojistas: usuario edita seu proprio registro" ON public.lojistas; DROP POLICY IF EXISTS "super_admins_lojistas" ON public.lojistas; DROP POLICY IF EXISTS "owner_lojistas" ON public.lojistas; DROP POLICY IF EXISTS "todos_autenticados_veem_lojistas_ativos" ON public.lojistas; END $$;
CREATE POLICY "super_admins_lojistas" ON public.lojistas FOR ALL TO authenticated USING (public.is_super_admin_v2());
CREATE POLICY "owner_lojistas" ON public.lojistas FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "todos_autenticados_veem_lojistas_ativos" ON public.lojistas FOR SELECT TO authenticated USING (status = 'ativo');

GRANT SELECT ON public.curriculos TO authenticated, anon;
GRANT SELECT ON public.lojistas TO authenticated, anon;
