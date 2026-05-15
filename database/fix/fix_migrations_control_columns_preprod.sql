-- ============================================================================
-- FIX: compatibilizar public.migrations com o baseline de producao
--
-- O banco ja tinha public.migrations, mas sem checksum/applied_by.
-- Este script adiciona apenas metadados de controle; nao executa migrations.
-- ============================================================================

BEGIN;

ALTER TABLE public.migrations
ADD COLUMN IF NOT EXISTS checksum text;

ALTER TABLE public.migrations
ADD COLUMN IF NOT EXISTS applied_by uuid DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS idx_migrations_name
ON public.migrations (name);

CREATE INDEX IF NOT EXISTS idx_migrations_applied_at
ON public.migrations (applied_at DESC);

COMMIT;

SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'migrations'
  AND column_name IN ('name', 'applied_at', 'description', 'checksum', 'applied_by')
ORDER BY column_name;
