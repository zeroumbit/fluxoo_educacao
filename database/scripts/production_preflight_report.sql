-- ============================================================================
-- Fluxoo Edu - Relatorio pre-producao Supabase
-- Execute no SQL Editor e confira os resultados antes do deploy.
-- Este script e somente leitura, exceto pela leitura da tabela public.migrations.
-- ============================================================================

-- 1. Tabela de controle de migrations
SELECT
  EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'migrations'
  ) AS migrations_table_exists;

SELECT
  name,
  applied_at,
  description
FROM public.migrations
ORDER BY applied_at DESC, name;

-- 2. Tabelas public sem RLS habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

-- 3. Politicas que ainda mencionam email no JWT
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    COALESCE(qual, '') ILIKE '%email%'
    OR COALESCE(with_check, '') ILIKE '%email%'
  )
ORDER BY tablename, policyname;

-- 4. Funcoes SECURITY DEFINER sem search_path fixo
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  l.lanname AS language_name,
  p.proconfig AS current_config,
  format(
    'ALTER FUNCTION %I.%I(%s) SET search_path = public, auth, extensions;',
    n.nspname,
    p.proname,
    pg_get_function_identity_arguments(p.oid)
  ) AS suggested_sql
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname = 'public'
  AND p.prosecdef = true
  AND NOT EXISTS (
    SELECT 1
    FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
    WHERE cfg LIKE 'search_path=%'
  )
ORDER BY n.nspname, p.proname, pg_get_function_identity_arguments(p.oid);

-- 5. Helpers esperados por migrations recentes
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'check_is_super_admin',
    'check_is_super_admin_strict',
    'get_jwt_tenant_id',
    'is_super_admin',
    'is_super_admin_v2',
    'is_staff_of_school'
  )
ORDER BY routine_name;
