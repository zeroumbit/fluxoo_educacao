-- ============================================================================
-- FIX: SECURITY DEFINER sem search_path fixo
-- Preflight encontrou:
--   - public.fn_resolver_notificacao_pix_pago()
-- ============================================================================

BEGIN;

ALTER FUNCTION public.fn_resolver_notificacao_pix_pago()
SET search_path = public, auth, extensions;

COMMIT;

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
