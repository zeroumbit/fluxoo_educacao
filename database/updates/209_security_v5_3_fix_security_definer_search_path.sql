-- ============================================================================
-- Security V5.3 - Fix SECURITY DEFINER functions without fixed search_path
-- ============================================================================
-- Goal:
--   Remove the remaining preflight critical before strict mode by pinning an
--   explicit search_path on existing SECURITY DEFINER functions in public.
--
-- Safety:
--   - Idempotent.
--   - Does not replace function bodies.
--   - Does not change RLS policies or table data.
--   - Keeps public/auth/extensions available for legacy functions that use
--     unqualified public objects or Supabase auth helpers.
--
-- Recommended order:
--   1. Backup.
--   2. Apply 207_security_v5_3_safe_foundation.sql.
--   3. Apply this migration.
--   4. Run database/scripts/security_v5_3_preflight.sql again.
--   5. Apply 208_security_v5_3_strict_super_admin_claims.sql only if there are
--      no critical blockers.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_function record;
BEGIN
  FOR v_function IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS identity_arguments
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND NOT EXISTS (
        SELECT 1
        FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
        WHERE cfg LIKE 'search_path=%'
      )
    ORDER BY n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public, auth, extensions',
      v_function.schema_name,
      v_function.function_name,
      v_function.identity_arguments
    );

    RAISE NOTICE 'Fixed search_path for %.%(%)',
      v_function.schema_name,
      v_function.function_name,
      v_function.identity_arguments;
  END LOOP;
END;
$$;

COMMIT;
