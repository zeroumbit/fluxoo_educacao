-- ============================================================================
-- Security V5.3 preflight - run before applying strict migrations.
-- This script only reads metadata.
-- ============================================================================

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT
  table_schema,
  table_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'tenant_id'
ORDER BY table_name;

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
    COALESCE(qual, '') ILIKE '%true%'
    OR COALESCE(with_check, '') ILIKE '%true%'
    OR COALESCE(qual, '') ILIKE '%auth.jwt()%email%'
    OR COALESCE(with_check, '') ILIKE '%auth.jwt()%email%'
  )
ORDER BY tablename, policyname;

SELECT *
FROM public.fn_security_preflight_v5_3();

-- Detailed blockers: SECURITY DEFINER functions without fixed search_path.
-- Review these before strict mode. The generated SQL is the safe hardening
-- operation used by migration 209.
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
