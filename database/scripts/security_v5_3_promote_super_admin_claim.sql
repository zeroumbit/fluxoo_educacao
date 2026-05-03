-- ============================================================================
-- Security V5.3 - Promote Super Admin to app_metadata claims
-- ============================================================================
-- Alinhado ao Plano de Implementação de Segurança Enterprise V5.3
-- Fase 1.3: Super Admin nunca por e-mail
--
-- Este script:
--   1. Atualiza raw_app_meta_data com role e is_super_admin
--   2. Remove claims de autorização de raw_user_meta_data
--   3. Valida se exatamente 1 usuário foi promovido
--
-- AVISO: Faça backup antes (Fase 0.1 do plano)
-- pg_dump "$SUPABASE_DB_URL" > backup-pre-security-v5-$(date +%Y%m%d-%H%M).sql
-- ============================================================================

BEGIN;

-- Atualizar claims de Super Admin apenas em app_metadata
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object(
    'role', 'super_admin',
    'is_super_admin', true
  ),
  -- Remover claims de autorização de user_metadata (Fase 1.3)
  raw_user_meta_data =
    COALESCE(raw_user_meta_data, '{}'::jsonb)
    - 'role'
    - 'is_super_admin'
    - 'tenant_id'
WHERE lower(email) = lower('zeroumbit@gmail.com');

-- Validação transacional (Princípio 5: rollback em alterações críticas)
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM auth.users
  WHERE lower(email) = lower('zeroumbit@gmail.com')
    AND raw_app_meta_data->>'role' = 'super_admin'
    AND lower(COALESCE(raw_app_meta_data->>'is_super_admin', 'false')) = 'true';

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Super Admin claim not updated. Check the email before running.';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- PÓS-EXECUÇÃO:
-- 1. Faça logout no aplicativo
-- 2. Faça login novamente para renovar o JWT
-- 3. Confirme que /admin/dashboard abre o Super Admin layout
--
-- Verificação:
-- SELECT email, raw_app_meta_data, raw_user_meta_data
-- FROM auth.users
-- WHERE lower(email) = lower('zeroumbit@gmail.com');
-- ============================================================================
