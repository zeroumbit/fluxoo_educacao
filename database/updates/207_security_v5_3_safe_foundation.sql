-- ============================================================================
-- Migration 207: Enterprise Security V5.3 - safe foundation
-- Projeto: Fluxoo EDU
--
-- Intencao:
--   - adicionar controles de seguranca sem substituir policies operacionais em
--     massa;
--   - criar preflight para evitar lockout/quebra antes do modo estrito;
--   - manter compatibilidade temporaria onde o banco ainda depende de claims
--     legados, mas expor helpers estritos para a proxima etapa.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Helpers centrais
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_is_super_admin_strict()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    lower(COALESCE(auth.jwt()->'app_metadata'->>'is_super_admin', 'false')) = 'true'
    OR (auth.jwt()->'app_metadata'->>'role') = 'super_admin';
$$;

COMMENT ON FUNCTION public.check_is_super_admin_strict IS
  'Super Admin apenas por app_metadata. Use no modo estrito apos migrar claims legados.';

CREATE OR REPLACE FUNCTION public.get_jwt_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant text;
BEGIN
  v_tenant := NULLIF(COALESCE(
    auth.jwt()->'app_metadata'->>'tenant_id',
    auth.jwt()->'user_metadata'->>'tenant_id',
    auth.jwt()->>'tenant_id'
  ), '');

  IF v_tenant IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN v_tenant::uuid;
EXCEPTION WHEN invalid_text_representation THEN
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.get_jwt_tenant_id IS
  'Tenant do JWT. Prioriza app_metadata e mantem fallback legado apenas para transicao segura.';

CREATE OR REPLACE FUNCTION public.validate_tenant_context(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_tenant_id IS NOT NULL
    AND public.get_jwt_tenant_id() IS NOT NULL
    AND p_tenant_id = public.get_jwt_tenant_id();
$$;

CREATE OR REPLACE FUNCTION public.require_aal2()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(auth.jwt()->>'aal', '') = 'aal2';
$$;

CREATE OR REPLACE FUNCTION public.is_my_child(p_aluno_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.aluno_responsavel ar
    JOIN public.responsaveis r ON r.id = ar.responsavel_id
    WHERE ar.aluno_id = p_aluno_id
      AND r.user_id = auth.uid()
      AND COALESCE(ar.status, 'ativo') = 'ativo'
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Login attempts: identidade primeiro, IP apenas sinal secundario
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  tenant_id uuid,
  ip_address text,
  user_agent text,
  success boolean DEFAULT false,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier_created
  ON public.login_attempts (lower(identifier), created_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_created
  ON public.login_attempts (ip_address, created_at DESC);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS login_attempts_select_admin_v5_3 ON public.login_attempts;
CREATE POLICY login_attempts_select_admin_v5_3
ON public.login_attempts
FOR SELECT
TO authenticated
USING (
  public.check_is_super_admin()
  OR (tenant_id IS NOT NULL AND tenant_id = public.get_jwt_tenant_id())
);

CREATE OR REPLACE FUNCTION public.fn_login_precheck(
  p_identifier text,
  p_user_agent text DEFAULT NULL,
  p_ip_address text DEFAULT NULL
)
RETURNS TABLE (
  allowed boolean,
  delay_ms integer,
  retry_after_seconds integer,
  reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_identifier text := lower(trim(COALESCE(p_identifier, '')));
  v_failures integer;
  v_last_failure timestamptz;
  v_retry integer;
BEGIN
  IF v_identifier = '' THEN
    RETURN QUERY SELECT true, 0, 0, NULL::text;
    RETURN;
  END IF;

  SELECT count(*), max(created_at)
    INTO v_failures, v_last_failure
  FROM public.login_attempts
  WHERE lower(identifier) = v_identifier
    AND success = false
    AND created_at >= now() - interval '15 minutes';

  IF v_failures >= 30 THEN
    v_retry := GREATEST(0, 900 - EXTRACT(EPOCH FROM (now() - v_last_failure))::integer);
    RETURN QUERY SELECT false, 0, v_retry, 'Muitas tentativas falhas. Tente novamente mais tarde.'::text;
    RETURN;
  END IF;

  IF v_failures >= 20 THEN
    RETURN QUERY SELECT true, 3000, 0, 'Delay progressivo aplicado por tentativas falhas.'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 0, 0, NULL::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_login_record_attempt(
  p_identifier text,
  p_success boolean,
  p_reason text DEFAULT NULL,
  p_tenant_id uuid DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_ip_address text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.login_attempts (
    identifier,
    tenant_id,
    ip_address,
    user_agent,
    success,
    reason,
    created_at
  )
  VALUES (
    lower(trim(p_identifier)),
    p_tenant_id,
    p_ip_address,
    left(p_user_agent, 512),
    COALESCE(p_success, false),
    left(p_reason, 512),
    now()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_login_precheck(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_login_record_attempt(text, boolean, text, uuid, text, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. IPs confiaveis por tenant
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tenant_trusted_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.escolas(id),
  ip_address text NOT NULL,
  description text,
  reason text,
  active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  last_used_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_tenant_trusted_ips_tenant_active
  ON public.tenant_trusted_ips (tenant_id, active);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_trusted_ips_unique_active
  ON public.tenant_trusted_ips (tenant_id, ip_address)
  WHERE active = true;

ALTER TABLE public.tenant_trusted_ips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_trusted_ips_staff_select_v5_3 ON public.tenant_trusted_ips;
CREATE POLICY tenant_trusted_ips_staff_select_v5_3
ON public.tenant_trusted_ips
FOR SELECT
TO authenticated
USING (
  public.check_is_super_admin()
  OR tenant_id = public.get_jwt_tenant_id()
);

DROP POLICY IF EXISTS tenant_trusted_ips_staff_write_v5_3 ON public.tenant_trusted_ips;
CREATE POLICY tenant_trusted_ips_staff_write_v5_3
ON public.tenant_trusted_ips
FOR ALL
TO authenticated
USING (
  public.check_is_super_admin()
  OR tenant_id = public.get_jwt_tenant_id()
)
WITH CHECK (
  tenant_id = public.get_jwt_tenant_id()
  AND expires_at IS NOT NULL
);

-- ---------------------------------------------------------------------------
-- 4. Security logs tecnicos
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  tenant_id uuid,
  user_id uuid,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info'
    CHECK (severity IN ('debug', 'info', 'warning', 'critical')),
  source text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_security_logs_created
  ON public.security_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_logs_tenant_created
  ON public.security_logs (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_logs_critical
  ON public.security_logs (severity, created_at DESC)
  WHERE severity IN ('warning', 'critical');

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS security_logs_select_v5_3 ON public.security_logs;
CREATE POLICY security_logs_select_v5_3
ON public.security_logs
FOR SELECT
TO authenticated
USING (
  public.check_is_super_admin()
  OR (tenant_id IS NOT NULL AND tenant_id = public.get_jwt_tenant_id())
);

CREATE OR REPLACE FUNCTION public.fn_registrar_security_log(
  p_event_type text,
  p_severity text DEFAULT 'info',
  p_source text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_tenant_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_metadata jsonb;
BEGIN
  v_metadata := COALESCE(p_metadata, '{}'::jsonb)
    - 'password' - 'senha' - 'token' - 'access_token' - 'refresh_token'
    - 'cpf' - 'cnpj';

  INSERT INTO public.security_logs (
    tenant_id,
    user_id,
    event_type,
    severity,
    source,
    metadata
  )
  VALUES (
    COALESCE(p_tenant_id, public.get_jwt_tenant_id()),
    auth.uid(),
    p_event_type,
    COALESCE(NULLIF(p_severity, ''), 'info'),
    p_source,
    v_metadata
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_registrar_security_log(text, text, text, jsonb, uuid)
TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Audit log: cliente nao insere direto na trilha juridica
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'audit_log'
  ) THEN
    ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Authenticated_Insert_AuditLog" ON public.audit_log;
    DROP POLICY IF EXISTS audit_log_insert_direct_v5_3 ON public.audit_log;

    REVOKE INSERT, UPDATE, DELETE ON public.audit_log FROM anon, authenticated;

    DROP POLICY IF EXISTS audit_log_select_tenant_v5_3 ON public.audit_log;
    CREATE POLICY audit_log_select_tenant_v5_3
    ON public.audit_log
    FOR SELECT
    TO authenticated
    USING (
      public.check_is_super_admin()
      OR tenant_id = public.get_jwt_tenant_id()
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 6. Webhook rate limit distribuido / idempotencia auxiliar
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.webhook_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway text NOT NULL,
  key text NOT NULL,
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gateway, key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_updated
  ON public.webhook_rate_limits (updated_at DESC);

ALTER TABLE public.webhook_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS webhook_rate_limits_sa_select_v5_3 ON public.webhook_rate_limits;
CREATE POLICY webhook_rate_limits_sa_select_v5_3
ON public.webhook_rate_limits
FOR SELECT
TO authenticated
USING (public.check_is_super_admin());

-- ---------------------------------------------------------------------------
-- 7. Bucket privado para a proxima etapa de comprovantes
--    Nao altera o bucket atual para nao quebrar URLs existentes.
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'comprovantes_privados',
  'comprovantes_privados',
  false,
  5242880,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

DROP POLICY IF EXISTS comprovantes_privados_insert_tenant_v5_3 ON storage.objects;
CREATE POLICY comprovantes_privados_insert_tenant_v5_3
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'comprovantes_privados'
  AND (storage.foldername(name))[1] = public.get_jwt_tenant_id()::text
);

DROP POLICY IF EXISTS comprovantes_privados_select_tenant_v5_3 ON storage.objects;
CREATE POLICY comprovantes_privados_select_tenant_v5_3
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'comprovantes_privados'
  AND (
    public.check_is_super_admin()
    OR (storage.foldername(name))[1] = public.get_jwt_tenant_id()::text
  )
);

-- ---------------------------------------------------------------------------
-- 8. Preflight: rode antes de ativar modo estrito em producao
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_security_preflight_v5_3()
RETURNS TABLE (
  check_name text,
  severity text,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, storage
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM auth.users u
  WHERE (
      u.raw_user_meta_data->>'role' = 'super_admin'
      OR lower(COALESCE(u.raw_user_meta_data->>'is_super_admin', 'false')) = 'true'
    )
    AND NOT (
      u.raw_app_meta_data->>'role' = 'super_admin'
      OR lower(COALESCE(u.raw_app_meta_data->>'is_super_admin', 'false')) = 'true'
    );

  IF v_count > 0 THEN
    RETURN QUERY SELECT
      'legacy_super_admin_claims'::text,
      'critical'::text,
      format('%s usuario(s) ainda dependem de user_metadata para Super Admin.', v_count);
  END IF;

  SELECT count(*) INTO v_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = false
    AND tablename NOT LIKE 'vw_%';

  IF v_count > 0 THEN
    RETURN QUERY SELECT
      'tables_without_rls'::text,
      'warning'::text,
      format('%s tabela(s) publicas sem RLS habilitado.', v_count);
  END IF;

  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (
      COALESCE(qual, '') ILIKE '%true%'
      OR COALESCE(with_check, '') ILIKE '%true%'
    );

  IF v_count > 0 THEN
    RETURN QUERY SELECT
      'policies_with_true'::text,
      'warning'::text,
      format('%s policy/policies contem USING/WITH CHECK true. Revise sensibilidade.', v_count);
  END IF;

  SELECT count(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND NOT EXISTS (
      SELECT 1
      FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
      WHERE cfg LIKE 'search_path=%'
    );

  IF v_count > 0 THEN
    RETURN QUERY SELECT
      'security_definer_without_search_path'::text,
      'critical'::text,
      format('%s funcao/funcoes SECURITY DEFINER sem search_path fixo.', v_count);
  END IF;

  SELECT count(*) INTO v_count
  FROM storage.buckets
  WHERE id IN ('comprovantes', 'publico')
    AND public = true;

  IF v_count > 0 THEN
    RETURN QUERY SELECT
      'public_buckets_for_receipts'::text,
      'warning'::text,
      'Buckets legados publicos ainda existem para compatibilidade. Migrar comprovantes para comprovantes_privados antes de bloquear.';
  END IF;

  RETURN QUERY SELECT
    'preflight_complete'::text,
    'info'::text,
    'Preflight finalizado. Corrija severidade critical antes do modo estrito.';
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_security_preflight_v5_3() TO authenticated;

COMMIT;
