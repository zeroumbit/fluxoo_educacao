-- =====================================================
-- CORREÇÃO RLS - FUNCIONARIOS (Versão Simplificada)
-- =====================================================
-- Este script usa políticas baseadas em tenant_id direto
-- sem subqueries complexas que causam erro de permissão

-- 1. Habilitar RLS na tabela funcionarios
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Funcionarios - Gestor pode ler" ON funcionarios;
DROP POLICY IF EXISTS "Funcionarios - Gestor pode inserir" ON funcionarios;
DROP POLICY IF EXISTS "Funcionarios - Gestor pode atualizar" ON funcionarios;
DROP POLICY IF EXISTS "Funcionarios - Gestor pode deletar" ON funcionarios;
DROP POLICY IF EXISTS "Funcionarios - Usuário pode ler próprio registro" ON funcionarios;
DROP POLICY IF EXISTS "Funcionarios - Super Admin Full Access" ON funcionarios;
DROP POLICY IF EXISTS "Funcionarios - Authenticated users" ON funcionarios;

-- 3. Criar políticas SIMPLIFICADAS baseadas em auth.jwt()

-- Política para SELECT (qualquer usuário autenticado pode ler seus próprios registros por tenant)
CREATE POLICY "Funcionarios - Leitura por tenant" ON funcionarios
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM escolas 
      WHERE gestor_user_id = auth.uid()
    )
    OR 
    user_id = auth.uid()
  );

-- Política para INSERT (gestor pode criar)
CREATE POLICY "Funcionarios - Inserção por gestor" ON funcionarios
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM escolas 
      WHERE gestor_user_id = auth.uid()
    )
  );

-- Política para UPDATE (gestor pode atualizar)
CREATE POLICY "Funcionarios - Atualização por gestor" ON funcionarios
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM escolas 
      WHERE gestor_user_id = auth.uid()
    )
  );

-- Política para DELETE (gestor pode deletar)
CREATE POLICY "Funcionarios - Exclusão por gestor" ON funcionarios
  FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM escolas 
      WHERE gestor_user_id = auth.uid()
    )
  );

-- Política para funcionário ler próprio registro (mesmo sem ser gestor)
CREATE POLICY "Funcionarios - Leitura próprio registro" ON funcionarios
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- 4. Garantir que a tabela de escolas também tenha RLS configurado corretamente

-- Habilitar RLS em escolas
ALTER TABLE escolas ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas de escolas
DROP POLICY IF EXISTS "Escolas - Gestor pode ler" ON escolas;
DROP POLICY IF EXISTS "Escolas - Public read" ON escolas;
DROP POLICY IF EXISTS "Escolas - Gestor full access" ON escolas;

-- Política para escolas (gestor pode ler sua escola)
CREATE POLICY "Escolas - Gestor pode ler" ON escolas
  FOR SELECT
  TO authenticated
  USING (
    gestor_user_id = auth.uid()
  );

-- Política para escolas (gestor pode atualizar sua escola)
CREATE POLICY "Escolas - Gestor pode atualizar" ON escolas
  FOR UPDATE
  TO authenticated
  USING (
    gestor_user_id = auth.uid()
  );

-- 5. Criar política de bypass para super admin (opcional, se necessário)
-- Esta política permite acesso total se o email for do super admin

-- Primeiro, garantir que super admin tenha acesso
CREATE POLICY "Funcionarios - Super Admin" ON funcionarios
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' LIKE '%@admin.com'
    OR 
    auth.jwt() ->> 'role' = 'super_admin'
  );

CREATE POLICY "Escolas - Super Admin" ON escolas
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' LIKE '%@admin.com'
    OR 
    auth.jwt() ->> 'role' = 'super_admin'
  );

-- 6. Verificar estrutura da tabela funcionarios
-- Adicionar colunas se não existirem

DO $$ BEGIN
  -- tenant_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'tenant_id') THEN
    ALTER TABLE funcionarios ADD COLUMN tenant_id UUID;
  END IF;

  -- user_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'user_id') THEN
    ALTER TABLE funcionarios ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;

  -- status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'status') THEN
    ALTER TABLE funcionarios ADD COLUMN status TEXT DEFAULT 'ativo';
  END IF;

  -- email
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'email') THEN
    ALTER TABLE funcionarios ADD COLUMN email TEXT;
  END IF;

  -- areas_acesso
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'areas_acesso') THEN
    ALTER TABLE funcionarios ADD COLUMN areas_acesso TEXT[];
  END IF;

  -- created_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'created_at') THEN
    ALTER TABLE funcionarios ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- updated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'updated_at') THEN
    ALTER TABLE funcionarios ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 7. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_funcionarios_tenant_id ON funcionarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_user_id ON funcionarios(user_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_status ON funcionarios(status);
CREATE INDEX IF NOT EXISTS idx_funcionarios_tenant_status ON funcionarios(tenant_id, status);

-- 8. Trigger para updated_at
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

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Mostrar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('funcionarios', 'escolas')
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('funcionarios', 'escolas');
