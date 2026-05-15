-- ============================================================================
-- FIX: Habilitar RLS nas tabelas public apontadas pelo preflight
--
-- Tabelas reportadas sem RLS:
--   - claims_migration_log
--   - gateway_config
--   - job_logs
--   - livros
--   - migrations
--   - webhook_events_log
--
-- Politica adotada:
--   - tabelas operacionais sensiveis/logs: service_role e Super Admin leitura;
--   - gateway_config: Super Admin gerencia, usuarios autenticados leem gateways
--     ativos para validar configuracao da escola;
--   - livros: acesso por tenant/staff/super admin e responsavel vinculado.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- claims_migration_log: controle interno de migracao de claims
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.claims_migration_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "claims_migration_log_service_role_all" ON public.claims_migration_log;
CREATE POLICY "claims_migration_log_service_role_all"
ON public.claims_migration_log
FOR ALL
TO authenticated
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "claims_migration_log_super_admin_select" ON public.claims_migration_log;
CREATE POLICY "claims_migration_log_super_admin_select"
ON public.claims_migration_log
FOR SELECT
TO authenticated
USING (public.check_is_super_admin());

-- ---------------------------------------------------------------------------
-- gateway_config: configuracao global dos gateways
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.gateway_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gateway_config_super_admin_all" ON public.gateway_config;
CREATE POLICY "gateway_config_super_admin_all"
ON public.gateway_config
FOR ALL
TO authenticated
USING (public.check_is_super_admin())
WITH CHECK (public.check_is_super_admin());

DROP POLICY IF EXISTS "gateway_config_authenticated_active_select" ON public.gateway_config;
CREATE POLICY "gateway_config_authenticated_active_select"
ON public.gateway_config
FOR SELECT
TO authenticated
USING (ativo_global = true OR public.check_is_super_admin());

-- ---------------------------------------------------------------------------
-- job_logs: logs de jobs, somente service_role escreve; Super Admin consulta
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.job_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_logs_service_role_all" ON public.job_logs;
CREATE POLICY "job_logs_service_role_all"
ON public.job_logs
FOR ALL
TO authenticated
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "job_logs_super_admin_select" ON public.job_logs;
CREATE POLICY "job_logs_super_admin_select"
ON public.job_logs
FOR SELECT
TO authenticated
USING (public.check_is_super_admin());

-- ---------------------------------------------------------------------------
-- migrations: controle interno; nao expor a usuarios comuns
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.migrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "migrations_service_role_all" ON public.migrations;
CREATE POLICY "migrations_service_role_all"
ON public.migrations
FOR ALL
TO authenticated
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "migrations_super_admin_select" ON public.migrations;
CREATE POLICY "migrations_super_admin_select"
ON public.migrations
FOR SELECT
TO authenticated
USING (public.check_is_super_admin());

-- ---------------------------------------------------------------------------
-- webhook_events_log: idempotencia/logs de Edge Function
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.webhook_events_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhook_events_log_service_role_all" ON public.webhook_events_log;
CREATE POLICY "webhook_events_log_service_role_all"
ON public.webhook_events_log
FOR ALL
TO authenticated
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "webhook_events_log_super_admin_select" ON public.webhook_events_log;
CREATE POLICY "webhook_events_log_super_admin_select"
ON public.webhook_events_log
FOR SELECT
TO authenticated
USING (public.check_is_super_admin());

-- ---------------------------------------------------------------------------
-- livros: dados de tenant, visiveis para staff/super admin/responsavel vinculado
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.livros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "livros_tenant_staff_super_admin_select" ON public.livros;
CREATE POLICY "livros_tenant_staff_super_admin_select"
ON public.livros
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_jwt_tenant_id()
  OR public.is_staff_of_school(tenant_id)
  OR public.check_is_super_admin()
  OR EXISTS (
    SELECT 1
    FROM public.alunos a
    JOIN public.aluno_responsavel ar ON ar.aluno_id = a.id
    JOIN public.responsaveis r ON r.id = ar.responsavel_id
    WHERE a.tenant_id = public.livros.tenant_id
      AND r.user_id = auth.uid()
      AND COALESCE(ar.status, 'ativo') = 'ativo'
  )
);

DROP POLICY IF EXISTS "livros_tenant_staff_super_admin_write" ON public.livros;
CREATE POLICY "livros_tenant_staff_super_admin_write"
ON public.livros
FOR ALL
TO authenticated
USING (
  public.is_staff_of_school(tenant_id)
  OR public.check_is_super_admin()
)
WITH CHECK (
  public.is_staff_of_school(tenant_id)
  OR public.check_is_super_admin()
);

COMMIT;

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'claims_migration_log',
    'gateway_config',
    'job_logs',
    'livros',
    'migrations',
    'webhook_events_log'
  )
ORDER BY tablename;
