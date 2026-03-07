-- =============================================================================
-- 039: Adiciona data_fim ao mural_avisos
-- Avisos com data_fim no passado somem da dashboard e do portal dashboard.
-- Ficam visíveis apenas nas páginas de listagem completa (/mural e /portal/avisos)
-- =============================================================================

ALTER TABLE mural_avisos
  ADD COLUMN IF NOT EXISTS data_inicio date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS data_fim    date DEFAULT NULL;

-- Índice para filtros por vigência
CREATE INDEX IF NOT EXISTS idx_mural_avisos_vigencia
  ON mural_avisos (tenant_id, data_fim ASC NULLS LAST, created_at DESC);

COMMENT ON COLUMN mural_avisos.data_inicio IS 'Data de início da vigência do aviso. Padrão: data de criação.';
COMMENT ON COLUMN mural_avisos.data_fim    IS 'Data de encerramento da vigência. NULL = sem prazo. Após esta data, o aviso some das dashboards mas permanece visível nas páginas de listagem.';
