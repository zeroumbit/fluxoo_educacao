-- ============================================================================
-- Emergency rollback for migration 208.
--
-- Use only if a production Super Admin was locked out after strict mode.
-- This restores the temporary compatibility fallback while you migrate claims to
-- app_metadata. It does not re-enable email-based authorization.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    lower(COALESCE(auth.jwt()->'app_metadata'->>'is_super_admin', 'false')) = 'true'
    OR (auth.jwt()->'app_metadata'->>'role') = 'super_admin'
    OR lower(COALESCE(auth.jwt()->'user_metadata'->>'is_super_admin', 'false')) = 'true'
    OR (auth.jwt()->'user_metadata'->>'role') = 'super_admin';
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.check_is_super_admin();
$$;

COMMIT;
