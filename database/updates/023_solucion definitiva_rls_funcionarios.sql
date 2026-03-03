-- =====================================================
-- SOLUÇÃO DEFININITIVA - RLS FUNCIONARIOS E ESCOLAS
-- =====================================================
-- Este script resolve o erro "permission denied for table users"
-- usando uma abordagem que NÃO depende de joins nas policies

-- ============================================
-- PARTE 1: CONFIGURAÇÃO DA TABELA ESCOLAS
-- ============================================

-- Habilitar RLS em escolas
ALTER TABLE escolas ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas de escolas
DROP POLICY IF EXISTS "Escolas - Gestor pode ler" ON escolas;
DROP POLICY IF EXISTS "Escolas - Gestor pode atualizar" ON escolas;
DROP POLICY IF EXISTS "Escolas - Public read" ON escolas;
DROP POLICY IF EXISTS "Escolas - Super Admin" ON escolas;

-- Política para gestor ler SUA escola
CREATE POLICY "escolas_gestor_read" ON escolas
  FOR SELECT
  TO authenticated
  USING (gestor_user_id = auth.uid());

-- Política para gestor atualizar SUA escola
CREATE POLICY "escolas_gestor_update" ON escolas
  FOR UPDATE
  TO authenticated
  USING (gestor_user_id = auth.uid());

-- Política para super admin (acesso total)
CREATE POLICY "escolas_super_admin" ON escolas
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- ============================================
-- PARTE 2: CONFIGURAÇÃO DA TABELA FUNCIONARIOS
-- ============================================

-- Habilitar RLS em funcionarios
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "funcionarios_gestor_read" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_gestor_insert" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_gestor_update" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_gestor_delete" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_user_read" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_super_admin" ON funcionarios;

-- ============================================
-- POLÍTICAS PRINCIPAIS - SEM JOINS COMPLEXOS
-- ============================================

-- Política de LEITURA: Gestor pode ler funcionários da SUA escola
-- OU funcionário pode ler seu próprio registro
CREATE POLICY "funcionarios_gestor_read" ON funcionarios
  FOR SELECT
  TO authenticated
  USING (
    -- Gestor da escola pode ler
    EXISTS (
      SELECT 1 FROM escolas
      WHERE escolas.id = funcionarios.tenant_id
      AND escolas.gestor_user_id = auth.uid()
    )
    -- OU funcionário pode ler seu próprio registro
    OR funcionarios.user_id = auth.uid()
  );

-- Política de INSERT: Apenas gestor da escola pode inserir
CREATE POLICY "funcionarios_gestor_insert" ON funcionarios
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE escolas.id = funcionarios.tenant_id
      AND escolas.gestor_user_id = auth.uid()
    )
  );

-- Política de UPDATE: Apenas gestor da escola pode atualizar
CREATE POLICY "funcionarios_gestor_update" ON funcionarios
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE escolas.id = funcionarios.tenant_id
      AND escolas.gestor_user_id = auth.uid()
    )
  );

-- Política de DELETE: Apenas gestor da escola pode deletar
CREATE POLICY "funcionarios_gestor_delete" ON funcionarios
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE escolas.id = funcionarios.tenant_id
      AND escolas.gestor_user_id = auth.uid()
    )
  );

-- Política para super admin (acesso total a tudo)
CREATE POLICY "funcionarios_super_admin" ON funcionarios
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- ============================================
-- PARTE 3: GARANTIR ESTRUTURA DA TABELA
-- ============================================

DO $$ BEGIN
  -- Garantir tenant_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'tenant_id') THEN
    ALTER TABLE funcionarios ADD COLUMN tenant_id UUID;
    ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES escolas(id);
  END IF;

  -- Garantir user_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'user_id') THEN
    ALTER TABLE funcionarios ADD COLUMN user_id UUID;
  END IF;

  -- Garantir status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'status') THEN
    ALTER TABLE funcionarios ADD COLUMN status TEXT DEFAULT 'ativo';
  END IF;

  -- Garantir email
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'email') THEN
    ALTER TABLE funcionarios ADD COLUMN email TEXT;
  END IF;

  -- Garantir areas_acesso
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'areas_acesso') THEN
    ALTER TABLE funcionarios ADD COLUMN areas_acesso TEXT[];
  END IF;

  -- Garantir created_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'created_at') THEN
    ALTER TABLE funcionarios ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Garantir updated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'updated_at') THEN
    ALTER TABLE funcionarios ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- ============================================
-- PARTE 4: ÍNDICES E TRIGGERS
-- ============================================

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_funcionarios_tenant_id ON funcionarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_user_id ON funcionarios(user_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_status ON funcionarios(status);
CREATE INDEX IF NOT EXISTS idx_funcionarios_tenant_status ON funcionarios(tenant_id, status);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION funcionarios_updated_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON funcionarios;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON funcionarios
  FOR EACH ROW
  EXECUTE FUNCTION funcionarios_updated_at_trigger();

-- ============================================
-- PARTE 5: VERIFICAÇÃO
-- ============================================

-- Mostrar resumo
DO $$
BEGIN
  RAISE NOTICE '=== CONFIGURAÇÃO RLS - FUNCIONARIOS ===';
  RAISE NOTICE 'RLS habilitado: %', (SELECT rowsecurity FROM pg_tables WHERE tablename = 'funcionarios');
  RAISE NOTICE 'Polícias criadas: %', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'funcionarios');
END $$;

-- Listar políticas
SELECT 
  policyname AS "Política",
  cmd AS "Operação",
  roles AS "Roles",
  CASE 
    WHEN qual IS NOT NULL THEN '✓'
    ELSE '✗'
  END AS "Tem USING",
  CASE 
    WHEN with_check IS NOT NULL THEN '✓'
    ELSE '✗'
  END AS "Tem WITH CHECK"
FROM pg_policies 
WHERE tablename = 'funcionarios'
ORDER BY cmd, policyname;

-- ============================================
-- PARTE 6: TESTE
-- ============================================

-- Para testar, execute no SQL Editor (como usuário autenticado):
-- SELECT * FROM funcionarios LIMIT 10;

-- Se funcionar, as políticas estão corretas!
