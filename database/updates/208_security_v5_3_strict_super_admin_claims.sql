-- ============================================================================
-- Migration 208: Enterprise Security V5.3 - strict Super Admin claims
--
-- Aplique somente depois de:
--   SELECT * FROM public.fn_security_preflight_v5_3();
-- retornar zero linhas critical.
--
-- Esta migration aborta se algum Super Admin ainda depender de user_metadata.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_legacy_count integer;
BEGIN
  SELECT count(*) INTO v_legacy_count
  FROM auth.users u
  WHERE (
      u.raw_user_meta_data->>'role' = 'super_admin'
      OR lower(COALESCE(u.raw_user_meta_data->>'is_super_admin', 'false')) = 'true'
    )
    AND NOT (
      u.raw_app_meta_data->>'role' = 'super_admin'
      OR lower(COALESCE(u.raw_app_meta_data->>'is_super_admin', 'false')) = 'true'
    );

  IF v_legacy_count > 0 THEN
    RAISE EXCEPTION
      'Abortado: % usuario(s) Super Admin ainda dependem de user_metadata. Migre para app_metadata antes do modo estrito.',
      v_legacy_count;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.check_is_super_admin_strict();
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.check_is_super_admin_strict();
$$;

COMMENT ON FUNCTION public.check_is_super_admin IS
  'Modo estrito V5.3: Super Admin apenas por auth.jwt().app_metadata.';

COMMIT;
