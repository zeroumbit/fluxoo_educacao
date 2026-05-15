-- ============================================================================
-- Fluxoo Edu - Controle seguro de migrations em producao
-- Execute no Supabase SQL Editor antes de validar/aplicar migrations.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.migrations (
  id bigserial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  applied_at timestamptz NOT NULL DEFAULT now(),
  description text,
  checksum text,
  applied_by uuid DEFAULT auth.uid()
);

ALTER TABLE public.migrations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.migrations IS
  'Controle interno de migrations aplicadas. Consultar via service_role ou SQL Editor; nao expor para anon/authenticated.';

CREATE INDEX IF NOT EXISTS idx_migrations_name ON public.migrations (name);
CREATE INDEX IF NOT EXISTS idx_migrations_applied_at ON public.migrations (applied_at DESC);

-- Remove politicas antigas permissivas caso existam. A service_role continua
-- acessando por bypass administrativo; usuarios comuns nao devem ler este estado.
DROP POLICY IF EXISTS "migrations_select_all" ON public.migrations;
DROP POLICY IF EXISTS "migrations_insert_all" ON public.migrations;
DROP POLICY IF EXISTS "migrations_update_all" ON public.migrations;
DROP POLICY IF EXISTS "migrations_delete_all" ON public.migrations;

COMMIT;

SELECT
  'migrations_control_ready' AS status,
  COUNT(*) AS registered_migrations
FROM public.migrations;
