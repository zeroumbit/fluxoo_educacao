-- ==============================================================================
-- 🚨 MIGRATION 162: MARKETPLACE E CURRÍCULOS (FIX PERMISSION DENIED)
-- Descrição: Restaura o RLS do Marketplace sem usar dependência de auth.users.
-- ==============================================================================

-- 1. CURRÍCULOS
ALTER TABLE public.curriculos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "curriculos_superadmin_select_v2" ON public.curriculos;
    DROP POLICY IF EXISTS "curriculos_superadmin_manage_v2" ON public.curriculos;
    DROP POLICY IF EXISTS "owner_curriculos" ON public.curriculos;
    DROP POLICY IF EXISTS "todos_autenticados_veem_curriculos_ativos" ON public.curriculos;
    DROP POLICY IF EXISTS "curriculos_superadmin_select" ON public.curriculos;
    DROP POLICY IF EXISTS "curriculos_superadmin_manage" ON public.curriculos;
    DROP POLICY IF EXISTS "curriculos_owner_select" ON public.curriculos;
    DROP POLICY IF EXISTS "curriculos_portal_familia_select" ON public.curriculos;
END $$;

CREATE POLICY "super_admins_curriculos" ON public.curriculos FOR ALL TO authenticated USING (public.is_super_admin_v2());
CREATE POLICY "owner_curriculos" ON public.curriculos FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "todos_autenticados_veem_curriculos_ativos" ON public.curriculos FOR SELECT TO authenticated USING (is_ativo = true);


-- 2. LOJISTAS
ALTER TABLE public.lojistas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Lojistas: super adm tem acesso total" ON public.lojistas;
    DROP POLICY IF EXISTS "Lojistas: usuario ve seu proprio registro" ON public.lojistas;
    DROP POLICY IF EXISTS "Lojistas: usuario edita seu proprio registro" ON public.lojistas;
    DROP POLICY IF EXISTS "super_admins_lojistas" ON public.lojistas;
    DROP POLICY IF EXISTS "owner_lojistas" ON public.lojistas;
    DROP POLICY IF EXISTS "todos_autenticados_veem_lojistas_ativos" ON public.lojistas;
END $$;

CREATE POLICY "super_admins_lojistas" ON public.lojistas FOR ALL TO authenticated USING (public.is_super_admin_v2());
CREATE POLICY "owner_lojistas" ON public.lojistas FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "todos_autenticados_veem_lojistas_ativos" ON public.lojistas FOR SELECT TO authenticated USING (status = 'ativo');

-- 3. PERMISSÕES DE LEITURA GERAL
GRANT SELECT ON public.curriculos TO authenticated, anon;
GRANT SELECT ON public.lojistas TO authenticated, anon;
