-- ============================================================================
-- FIX: Helpers de seguranca V2 ausentes
-- Contexto:
--   O preflight encontrou check_is_super_admin, check_is_super_admin_strict,
--   get_jwt_tenant_id e is_super_admin, mas nao encontrou:
--     - public.is_staff_of_school(uuid)
--     - public.is_super_admin_v2()
--
-- Regras preservadas:
--   - Gestor/staff acessa apenas o proprio tenant.
--   - Super Admin e autorizado por app_metadata, com compatibilidade legada
--     para user_metadata enquanto as migrations antigas ainda dependem disso.
--   - SECURITY DEFINER sempre com search_path fixo.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.is_staff_of_school(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios_sistema us
    WHERE us.tenant_id = p_tenant_id
      AND us.id = auth.uid()
      AND COALESCE(us.status, 'ativo') = 'ativo'
  );
$$;

COMMENT ON FUNCTION public.is_staff_of_school(uuid) IS
  'Helper RLS: verifica se o usuario autenticado pertence ao tenant informado sem recursao.';

CREATE OR REPLACE FUNCTION public.is_super_admin_v2()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
  SELECT
    lower(COALESCE(auth.jwt()->'app_metadata'->>'is_super_admin', 'false')) = 'true'
    OR (auth.jwt()->'app_metadata'->>'role') = 'super_admin'
    OR lower(COALESCE(auth.jwt()->'user_metadata'->>'is_super_admin', 'false')) = 'true'
    OR (auth.jwt()->'user_metadata'->>'role') = 'super_admin';
$$;

COMMENT ON FUNCTION public.is_super_admin_v2() IS
  'Helper RLS compatibilidade: Super Admin por app_metadata, com fallback temporario para user_metadata legado.';

COMMIT;

SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_staff_of_school', 'is_super_admin_v2')
ORDER BY routine_name;
