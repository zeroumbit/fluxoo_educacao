-- ==============================================================================
-- 🛡️ MIGRATION 187: CUSTOM CLAIMS — MIGRAÇÃO PARA app_metadata
-- Objetivo:
--   Migrar is_super_admin de user_metadata (editável pelo usuário) para
--   app_metadata (somente service_role pode alterar).
--   Período de convivência: verificar ambos por segurança durante a transição.
-- Regras Imutáveis: R1, R2, R3 não afetadas — apenas onde o claim mora muda.
-- ==============================================================================

BEGIN;

-- ============================================================
-- 1. ATUALIZAR FUNÇÃO check_is_super_admin() PARA PRIORIZAR app_metadata
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    -- PRIMÁRIO: app_metadata (só service_role pode alterar — mais seguro)
    COALESCE((auth.jwt()->'app_metadata'->>'is_super_admin')::boolean, false)
    OR
    -- SECUNDÁRIO: role no app_metadata (compatibilidade)
    (auth.jwt()->'app_metadata'->>'role') = 'super_admin'
    OR
    -- CONVIVÊNCIA (remover após 2 sprints — migração completa):
    COALESCE((auth.jwt()->'user_metadata'->>'is_super_admin')::boolean, false)
    OR
    (auth.jwt()->'user_metadata'->>'role') = 'super_admin';
$$;

-- Manter alias para compatibilidade com código legado
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.check_is_super_admin(); $$;

-- ============================================================
-- 2. ATUALIZAR get_jwt_tenant_id() PARA VERIFICAR app_metadata PRIMEIRO
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_jwt_tenant_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT NULLIF(COALESCE(
    auth.jwt()->'app_metadata'->>'tenant_id',
    auth.jwt()->'user_metadata'->>'tenant_id',
    auth.jwt()->>'tenant_id'
  ), '')::uuid;
$$;

-- ============================================================
-- 3. ATUALIZAR check_is_tenant_staff() PARA USAR FUNÇÕES ATUALIZADAS
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_is_tenant_staff(p_tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_tenant_id IS NULL THEN RETURN false; END IF;
  RETURN (
    -- Via JWT claim (app_metadata ou user_metadata — função já trata ambos)
    p_tenant_id = public.get_jwt_tenant_id()
    OR
    -- Via tabela usuarios_sistema (RBAC V2)
    EXISTS (
      SELECT 1 FROM public.usuarios_sistema us
      WHERE us.tenant_id = p_tenant_id
        AND us.id = auth.uid()
        AND us.status = 'ativo'
    )
    OR
    -- Via gestor direto da escola (vínculo mais forte)
    EXISTS (
      SELECT 1 FROM public.escolas e
      WHERE e.id = p_tenant_id
        AND e.gestor_user_id = auth.uid()
    )
  );
END;
$$;

-- ============================================================
-- 4. TABELA DE CONTROLE: RASTREAR USUÁRIOS MIGRADOS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.claims_migration_log (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL,
  migrated_at TIMESTAMPTZ DEFAULT NOW(),
  status     TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'migrated', 'failed'))
);

COMMENT ON TABLE public.claims_migration_log IS
  'Rastreamento de usuários cujos claims foram migrados de user_metadata para app_metadata. '
  'Pode ser removida após 2 sprints de convivência.';

-- ============================================================
-- 5. FUNÇÃO AUXILIAR: IDENTIFICAR SUPER ADMINS A MIGRAR
-- (Executar manualmente via Supabase Dashboard ou Edge Function)
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_listar_super_admins_para_migrar()
RETURNS TABLE (user_id UUID, email TEXT, current_metadata JSONB)
LANGUAGE sql SECURITY DEFINER SET search_path = auth, public
AS $$
  SELECT
    u.id,
    u.email,
    u.raw_user_meta_data
  FROM auth.users u
  WHERE (u.raw_user_meta_data->>'role') = 'super_admin'
     OR (u.raw_user_meta_data->>'is_super_admin')::boolean = true
  ORDER BY u.created_at;
$$;

COMMENT ON FUNCTION public.fn_listar_super_admins_para_migrar IS
  'Lista usuários Super Admin que precisam ter seus claims migrados para app_metadata. '
  'A migração real requer service_role key e deve ser feita via Edge Function ou Dashboard.';

-- ============================================================
-- 6. NOTA SOBRE O PROCESSO DE MIGRAÇÃO
-- ============================================================
-- A migração de user_metadata para app_metadata NÃO pode ser feita
-- diretamente em SQL pois requer service_role key para alterar app_metadata.
--
-- Processo recomendado (executar no Supabase Dashboard > SQL Editor com service_role):
--
-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data || '{"is_super_admin": true}'
-- WHERE (raw_user_meta_data->>'role') = 'super_admin'
--    OR (raw_user_meta_data->>'is_super_admin')::boolean = true;
--
-- Após executar:
-- 1. Verificar com fn_listar_super_admins_para_migrar()
-- 2. Testar login com conta super admin
-- 3. Após 2 sprints, remover verificação de user_metadata de check_is_super_admin()
-- ============================================================

COMMIT;

-- ==============================================================================
-- ✅ RESUMO MIGRATION 187
-- check_is_super_admin(): Prioriza app_metadata, mantém convivência com user_metadata
-- get_jwt_tenant_id(): Prioriza app_metadata
-- check_is_tenant_staff(): Usa funções atualizadas
-- claims_migration_log: Rastreamento da migração
-- fn_listar_super_admins_para_migrar(): Helper para identificar usuários a migrar
-- ==============================================================================
