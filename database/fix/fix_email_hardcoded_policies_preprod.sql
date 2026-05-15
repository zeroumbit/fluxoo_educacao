-- ============================================================================
-- FIX: Remover email hardcoded de policies RLS
--
-- Diagnostico:
--   Policies ainda dependiam de auth.jwt()->>'email' = 'zeroumbit@gmail.com'.
--
-- Regra preservada:
--   - Super Admin deve ser autorizado por claims/app_metadata via
--     public.check_is_super_admin(), nunca por email.
--   - solicitacoes_upgrade preserva leitura/escrita do proprio tenant.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Policies antigas "Super Admin total access on ..."
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Super Admin total access on audit_logs" ON public.audit_logs;
CREATE POLICY "Super Admin total access on audit_logs"
ON public.audit_logs
FOR ALL
TO authenticated
USING (public.check_is_super_admin())
WITH CHECK (public.check_is_super_admin());

DROP POLICY IF EXISTS "Super Admin total access on historico_assinatura" ON public.historico_assinatura;
CREATE POLICY "Super Admin total access on historico_assinatura"
ON public.historico_assinatura
FOR ALL
TO authenticated
USING (public.check_is_super_admin())
WITH CHECK (public.check_is_super_admin());

DROP POLICY IF EXISTS "Super Admin total access on modulos" ON public.modulos;
CREATE POLICY "Super Admin total access on modulos"
ON public.modulos
FOR ALL
TO authenticated
USING (public.check_is_super_admin())
WITH CHECK (public.check_is_super_admin());

DROP POLICY IF EXISTS "Super Admin total access on plano_modulo" ON public.plano_modulo;
CREATE POLICY "Super Admin total access on plano_modulo"
ON public.plano_modulo
FOR ALL
TO authenticated
USING (public.check_is_super_admin())
WITH CHECK (public.check_is_super_admin());

DROP POLICY IF EXISTS "Super Admin total access on planos" ON public.planos;
CREATE POLICY "Super Admin total access on planos"
ON public.planos
FOR ALL
TO authenticated
USING (public.check_is_super_admin())
WITH CHECK (public.check_is_super_admin());

DROP POLICY IF EXISTS "Super Admin total access on solicitacoes_upgrade" ON public.solicitacoes_upgrade;
CREATE POLICY "Super Admin total access on solicitacoes_upgrade"
ON public.solicitacoes_upgrade
FOR ALL
TO authenticated
USING (public.check_is_super_admin())
WITH CHECK (public.check_is_super_admin());

-- ---------------------------------------------------------------------------
-- Policies universais com email hardcoded
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Universal_Modify_ConfigRecebimento" ON public.configuracao_recebimento;
CREATE POLICY "Universal_Modify_ConfigRecebimento"
ON public.configuracao_recebimento
FOR ALL
TO authenticated
USING (public.check_is_super_admin())
WITH CHECK (public.check_is_super_admin());

DROP POLICY IF EXISTS "Universal_Modify_Upgrade" ON public.solicitacoes_upgrade;
CREATE POLICY "Universal_Modify_Upgrade"
ON public.solicitacoes_upgrade
FOR ALL
TO authenticated
USING (
  public.check_is_super_admin()
  OR tenant_id = public.get_jwt_tenant_id()
)
WITH CHECK (
  public.check_is_super_admin()
  OR tenant_id = public.get_jwt_tenant_id()
);

COMMIT;

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
