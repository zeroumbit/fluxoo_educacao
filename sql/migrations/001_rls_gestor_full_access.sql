-- ============================================================
-- RLS: Gestor Full Access - Escola e Filiais
-- Versao: 1.0.0
-- Aplicar: Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. FUNÇÃO HELPER PARA VERIFICAR GESTOR
-- ============================================================

CREATE OR REPLACE FUNCTION is_gestor_da_escola(p_tenant_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM escolas 
    WHERE id = p_tenant_id 
    AND gestor_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. POLÍTICAS PARA CONFIGURACOES_ESCOLA
-- ============================================================

DROP POLICY IF EXISTS "gestor_config_select" ON configuracoes_escola;
CREATE POLICY "gestor_config_select" ON configuracoes_escola
FOR SELECT USING (
  is_gestor_da_escola(tenant_id)
);

DROP POLICY IF EXISTS "gestor_config_insert" ON configuracoes_escola;
CREATE POLICY "gestor_config_insert" ON configuracoes_escola
FOR INSERT WITH CHECK (
  is_gestor_da_escola(tenant_id)
);

DROP POLICY IF EXISTS "gestor_config_update" ON configuracoes_escola;
CREATE POLICY "gestor_config_update" ON configuracoes_escola
FOR UPDATE USING (
  is_gestor_da_escola(tenant_id)
);

DROP POLICY IF EXISTS "gestor_config_delete" ON configuracoes_escola;
CREATE POLICY "gestor_config_delete" ON configuracoes_escola
FOR DELETE USING (
  is_gestor_da_escola(tenant_id)
);

-- ============================================================
-- 3. POLÍTICAS PARA CONFIGURACOES_ESCOLA_HISTORICO
-- ============================================================

DROP POLICY IF EXISTS "gestor_historico_select" ON configuracoes_escola_historico;
CREATE POLICY "gestor_historico_select" ON configuracoes_escola_historico
FOR SELECT USING (
  is_gestor_da_escola(tenant_id)
);

-- ============================================================
-- 4. POLÍTICAS PARA FILIAIS
-- ============================================================

DROP POLICY IF EXISTS "gestor_filiais_all" ON filiais;
CREATE POLICY "gestor_filiais_all" ON filiais
FOR ALL USING (
  is_gestor_da_escola(tenant_id)
);

-- ============================================================
-- 5. SUPER ADMIN (acesso total)
-- ============================================================

DROP POLICY IF EXISTS "super_admin_all_config" ON configuracoes_escola;
CREATE POLICY "super_admin_all_config" ON configuracoes_escola
FOR ALL USING (
  auth.jwt()->>'email' LIKE '%fluxoo.com%' OR 
  auth.jwt()->>'role' = 'super_admin'
);

DROP POLICY IF EXISTS "super_admin_all_filiais" ON filiais;
CREATE POLICY "super_admin_all_filiais" ON filiais
FOR ALL USING (
  auth.jwt()->>'email' LIKE '%fluxoo.com%' OR 
  auth.jwt()->>'role' = 'super_admin'
);

-- ============================================================
-- VERIFICACAO
-- ============================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('configuracoes_escola', 'configuracoes_escola_historico', 'filiais')
ORDER BY tablename, policyname;

-- Teste rapido
SELECT 'Migration aplicada com sucesso' AS status;