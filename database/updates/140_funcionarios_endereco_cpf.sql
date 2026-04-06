-- =====================================================
-- 140 - Adicionar campos de endereço e CPF em funcionários
-- =====================================================
-- Objetivo: Permitir que professores/funcionários salvem
-- seus dados pessoais completos (CPF + Endereço) na página
-- "Meu Perfil".
-- =====================================================

-- 1. Adicionar colunas faltantes
DO $$ BEGIN

  -- CPF
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'funcionarios' AND column_name = 'cpf') THEN
    ALTER TABLE funcionarios ADD COLUMN cpf TEXT;
  END IF;

  -- Telefone
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'funcionarios' AND column_name = 'telefone') THEN
    ALTER TABLE funcionarios ADD COLUMN telefone TEXT;
  END IF;

  -- CEP
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'funcionarios' AND column_name = 'cep') THEN
    ALTER TABLE funcionarios ADD COLUMN cep TEXT;
  END IF;

  -- Logradouro
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'funcionarios' AND column_name = 'logradouro') THEN
    ALTER TABLE funcionarios ADD COLUMN logradouro TEXT;
  END IF;

  -- Número
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'funcionarios' AND column_name = 'numero') THEN
    ALTER TABLE funcionarios ADD COLUMN numero TEXT;
  END IF;

  -- Bairro
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'funcionarios' AND column_name = 'bairro') THEN
    ALTER TABLE funcionarios ADD COLUMN bairro TEXT;
  END IF;

  -- Cidade
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'funcionarios' AND column_name = 'cidade') THEN
    ALTER TABLE funcionarios ADD COLUMN cidade TEXT;
  END IF;

  -- Estado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'funcionarios' AND column_name = 'estado') THEN
    ALTER TABLE funcionarios ADD COLUMN estado TEXT;
  END IF;

END $$;

-- 2. Garantir RLS para que o próprio funcionário possa atualizar seus dados
DROP POLICY IF EXISTS "Funcionarios - próprio usuário pode atualizar dados pessoais" ON funcionarios;
CREATE POLICY "Funcionarios - próprio usuário pode atualizar dados pessoais" ON funcionarios
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Garantir RLS para que o próprio funcionário possa ler seus dados
DROP POLICY IF EXISTS "Funcionarios - próprio usuário pode ler" ON funcionarios;
CREATE POLICY "Funcionarios - próprio usuário pode ler" ON funcionarios
  FOR SELECT
  USING (user_id = auth.uid());

-- 4. Comentário nas colunas
COMMENT ON COLUMN funcionarios.cpf IS 'CPF do funcionário (apenas números)';
COMMENT ON COLUMN funcionarios.telefone IS 'Telefone/WhatsApp do funcionário';
COMMENT ON COLUMN funcionarios.cep IS 'CEP do endereço residencial';
COMMENT ON COLUMN funcionarios.logradouro IS 'Rua/Av do endereço';
COMMENT ON COLUMN funcionarios.numero IS 'Número do endereço';
COMMENT ON COLUMN funcionarios.bairro IS 'Bairro';
COMMENT ON COLUMN funcionarios.cidade IS 'Cidade';
COMMENT ON COLUMN funcionarios.estado IS 'Estado/UF';
