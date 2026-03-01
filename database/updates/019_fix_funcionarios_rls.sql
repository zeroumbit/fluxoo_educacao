-- =====================================================
-- FUNCIONARIOS - RLS E ESTRUTURA COMPLETA
-- =====================================================

-- 1. Habilitar RLS na tabela funcionarios
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;

-- 2. Criar políticas para funcionários
-- Política para SELECT (leitura)
DROP POLICY IF EXISTS "Funcionarios - Gestor pode ler" ON funcionarios;
CREATE POLICY "Funcionarios - Gestor pode ler" ON funcionarios
  FOR SELECT
  USING (
    tenant_id = (
      SELECT e.id 
      FROM escolas e 
      WHERE e.gestor_user_id = auth.uid()
    )
  );

-- Política para INSERT (criação)
DROP POLICY IF EXISTS "Funcionarios - Gestor pode inserir" ON funcionarios;
CREATE POLICY "Funcionarios - Gestor pode inserir" ON funcionarios
  FOR INSERT
  WITH CHECK (
    tenant_id = (
      SELECT e.id 
      FROM escolas e 
      WHERE e.gestor_user_id = auth.uid()
    )
  );

-- Política para UPDATE (atualização)
DROP POLICY IF EXISTS "Funcionarios - Gestor pode atualizar" ON funcionarios;
CREATE POLICY "Funcionarios - Gestor pode atualizar" ON funcionarios
  FOR UPDATE
  USING (
    tenant_id = (
      SELECT e.id 
      FROM escolas e 
      WHERE e.gestor_user_id = auth.uid()
    )
  );

-- Política para DELETE (exclusão lógica)
DROP POLICY IF EXISTS "Funcionarios - Gestor pode deletar" ON funcionarios;
CREATE POLICY "Funcionarios - Gestor pode deletar" ON funcionarios
  FOR DELETE
  USING (
    tenant_id = (
      SELECT e.id 
      FROM escolas e 
      WHERE e.gestor_user_id = auth.uid()
    )
  );

-- 3. Garantir que a tabela tenha todas as colunas necessárias
-- Adicionar colunas se não existirem
DO $$ BEGIN
  -- Garantir tenant_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'tenant_id') THEN
    ALTER TABLE funcionarios ADD COLUMN tenant_id UUID REFERENCES escolas(id);
  END IF;

  -- Garantir status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'status') THEN
    ALTER TABLE funcionarios ADD COLUMN status TEXT DEFAULT 'ativo';
  END IF;

  -- Garantir user_id para vínculo com auth.users
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'user_id') THEN
    ALTER TABLE funcionarios ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;

  -- Garantir email
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'email') THEN
    ALTER TABLE funcionarios ADD COLUMN email TEXT;
  END IF;

  -- Garantir areas_acesso
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'areas_acesso') THEN
    ALTER TABLE funcionarios ADD COLUMN areas_acesso TEXT[];
  END IF;

  -- Garantir salario_bruto
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'salario_bruto') THEN
    ALTER TABLE funcionarios ADD COLUMN salario_bruto NUMERIC(10,2);
  END IF;

  -- Garantir dia_pagamento
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'dia_pagamento') THEN
    ALTER TABLE funcionarios ADD COLUMN dia_pagamento INTEGER;
  END IF;

  -- Garantir data_admissao
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'data_admissao') THEN
    ALTER TABLE funcionarios ADD COLUMN data_admissao DATE;
  END IF;

  -- Garantir como_chamado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'como_chamado') THEN
    ALTER TABLE funcionarios ADD COLUMN como_chamado TEXT;
  END IF;

  -- Garantir funcao
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'funcao') THEN
    ALTER TABLE funcionarios ADD COLUMN funcao TEXT;
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

-- 4. Criar trigger para atualizar updated_at automaticamente
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

-- 5. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_funcionarios_tenant_id ON funcionarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_status ON funcionarios(status);
CREATE INDEX IF NOT EXISTS idx_funcionarios_user_id ON funcionarios(user_id);

-- =====================================================
-- PERMISSÕES PARA FUNCIONÁRIOS ACESSAREM O SISTEMA
-- =====================================================

-- Criar policy para funcionários autenticados lerem seus próprios dados
DROP POLICY IF EXISTS "Funcionarios - Usuário pode ler próprio registro" ON funcionarios;
CREATE POLICY "Funcionarios - Usuário pode ler próprio registro" ON funcionarios
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- =====================================================
-- INTEGRAÇÃO COM MÓDULOS DO SISTEMA
-- =====================================================

-- Garantir que a tabela de escolas tenha a coluna gestor_user_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'escolas' AND column_name = 'gestor_user_id') THEN
    ALTER TABLE escolas ADD COLUMN gestor_user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Policy para escolas (garantir que gestor possa ler sua escola)
DROP POLICY IF EXISTS "Escolas - Gestor pode ler" ON escolas;
CREATE POLICY "Escolas - Gestor pode ler" ON escolas
  FOR SELECT
  USING (
    gestor_user_id = auth.uid()
  );

-- =====================================================
-- DADOS INICIAIS (opcional)
-- =====================================================

-- Comentar: Executar apenas se necessário
-- INSERT INTO funcionarios (tenant_id, nome_completo, funcao, status)
-- VALUES ('<tenant_id>', 'Funcionário Exemplo', 'Professor', 'ativo');
