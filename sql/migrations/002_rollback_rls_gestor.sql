-- ============================================================
-- ROLLBACK: Remover políticas de gestor
-- Execute para reverter as alterações
-- ============================================================

-- Remover políticas de configuracoes_escola
DROP POLICY IF EXISTS "gestor_config_select" ON configuracoes_escola;
DROP POLICY IF EXISTS "gestor_config_insert" ON configuracoes_escola;
DROP POLICY IF EXISTS "gestor_config_update" ON configuracoes_escola;
DROP POLICY IF EXISTS "gestor_config_delete" ON configuracoes_escola;

-- Remover políticas de configuracoes_escola_historico
DROP POLICY IF EXISTS "gestor_historico_select" ON configuracoes_escola_historico;

-- Remover políticas de filiais
DROP POLICY IF EXISTS "gestor_filiais_all" ON filiais;

-- Remover políticas de super_admin
DROP POLICY IF EXISTS "super_admin_all_config" ON configuracoes_escola;
DROP POLICY IF EXISTS "super_admin_all_filiais" ON filiais;

-- Remover função helper
DROP FUNCTION IF EXISTS is_gestor_da_escola(uuid);

-- Verificar políticas restantes
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('configuracoes_escola', 'configuracoes_escola_historico', 'filiais')
ORDER BY tablename, policyname;