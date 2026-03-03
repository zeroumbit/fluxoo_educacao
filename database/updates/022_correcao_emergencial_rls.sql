-- =====================================================
-- CORREÇÃO EMERGENCIAL - RLS FUNCIONARIOS
-- =====================================================
-- Use este script se o anterior não funcionar
-- Esta versão usa políticas MAIS PERMISSIVAS para teste

-- 1. Habilitar RLS
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'funcionarios'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON funcionarios', pol.policyname);
    END LOOP;
END $$;

-- 3. Política TEMPORÁRIA - PERMISSIVA PARA TESTE
-- Esta política permite que QUALQUER usuário autenticado acesse TODOS os funcionários
-- USE APENAS PARA TESTAR - depois substitua por políticas mais restritivas

DROP POLICY IF EXISTS "Funcionarios - Authenticated read" ON funcionarios;
CREATE POLICY "Funcionarios - Authenticated read" ON funcionarios
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Funcionarios - Authenticated insert" ON funcionarios;
CREATE POLICY "Funcionarios - Authenticated insert" ON funcionarios
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Funcionarios - Authenticated update" ON funcionarios;
CREATE POLICY "Funcionarios - Authenticated update" ON funcionarios
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Funcionarios - Authenticated delete" ON funcionarios;
CREATE POLICY "Funcionarios - Authenticated delete" ON funcionarios
  FOR DELETE
  TO authenticated
  USING (true);

-- 4. Verificar se funcionou
-- Execute no SQL Editor: SELECT * FROM funcionarios;

-- =====================================================
-- APÓS TESTAR, SUBSTITUA POR POLÍTICAS RESTRITIVAS:
-- =====================================================

-- Para produção, use este script mais seguro:

/*
-- Remover políticas permissivas
DROP POLICY IF EXISTS "Funcionarios - Authenticated read" ON funcionarios;
DROP POLICY IF EXISTS "Funcionarios - Authenticated insert" ON funcionarios;
DROP POLICY IF EXISTS "Funcionarios - Authenticated update" ON funcionarios;
DROP POLICY IF EXISTS "Funcionarios - Authenticated delete" ON funcionarios;

-- Criar políticas restritivas (somente gestor do tenant)
CREATE POLICY "Funcionarios - Gestor read" ON funcionarios
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE id = funcionarios.tenant_id
      AND gestor_user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Funcionarios - Gestor insert" ON funcionarios
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE id = tenant_id
      AND gestor_user_id = auth.uid()
    )
  );

CREATE POLICY "Funcionarios - Gestor update" ON funcionarios
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE id = funcionarios.tenant_id
      AND gestor_user_id = auth.uid()
    )
  );

CREATE POLICY "Funcionarios - Gestor delete" ON funcionarios
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE id = funcionarios.tenant_id
      AND gestor_user_id = auth.uid()
    )
  );
*/
