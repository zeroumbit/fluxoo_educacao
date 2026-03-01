-- =====================================================
-- ALMOXARIFADO - RLS E ESTRUTURA COMPLETA
-- =====================================================
-- Políticas apenas para GESTOR da escola
-- Super Admin NÃO interfere nos dados das escolas

-- 1. Habilitar RLS nas tabelas de almoxarifado
ALTER TABLE almoxarifado_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE almoxarifado_movimentacoes ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "almoxarifado_itens_gestor_read" ON almoxarifado_itens;
DROP POLICY IF EXISTS "almoxarifado_itens_gestor_insert" ON almoxarifado_itens;
DROP POLICY IF EXISTS "almoxarifado_itens_gestor_update" ON almoxarifado_itens;
DROP POLICY IF EXISTS "almoxarifado_itens_gestor_delete" ON almoxarifado_itens;

DROP POLICY IF EXISTS "almoxarifado_movimentacoes_gestor_read" ON almoxarifado_movimentacoes;
DROP POLICY IF EXISTS "almoxarifado_movimentacoes_gestor_insert" ON almoxarifado_movimentacoes;
DROP POLICY IF EXISTS "almoxarifado_movimentacoes_gestor_delete" ON almoxarifado_movimentacoes;

-- 3. Criar políticas para almoxarifado_itens (APENAS GESTOR)
CREATE POLICY "almoxarifado_itens_gestor_read" ON almoxarifado_itens
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE escolas.id = almoxarifado_itens.tenant_id
      AND escolas.gestor_user_id = auth.uid()
    )
  );

CREATE POLICY "almoxarifado_itens_gestor_insert" ON almoxarifado_itens
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE escolas.id = almoxarifado_itens.tenant_id
      AND escolas.gestor_user_id = auth.uid()
    )
  );

CREATE POLICY "almoxarifado_itens_gestor_update" ON almoxarifado_itens
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE escolas.id = almoxarifado_itens.tenant_id
      AND escolas.gestor_user_id = auth.uid()
    )
  );

CREATE POLICY "almoxarifado_itens_gestor_delete" ON almoxarifado_itens
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE escolas.id = almoxarifado_itens.tenant_id
      AND escolas.gestor_user_id = auth.uid()
    )
  );

-- 4. Criar políticas para almoxarifado_movimentacoes (APENAS GESTOR)
CREATE POLICY "almoxarifado_movimentacoes_gestor_read" ON almoxarifado_movimentacoes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE escolas.id = almoxarifado_movimentacoes.tenant_id
      AND escolas.gestor_user_id = auth.uid()
    )
  );

CREATE POLICY "almoxarifado_movimentacoes_gestor_insert" ON almoxarifado_movimentacoes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE escolas.id = almoxarifado_movimentacoes.tenant_id
      AND escolas.gestor_user_id = auth.uid()
    )
  );

CREATE POLICY "almoxarifado_movimentacoes_gestor_delete" ON almoxarifado_movimentacoes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escolas
      WHERE escolas.id = almoxarifado_movimentacoes.tenant_id
      AND escolas.gestor_user_id = auth.uid()
    )
  );

-- 5. Garantir estrutura das tabelas
DO $$ BEGIN
  -- almoxarifado_itens
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'almoxarifado_itens' AND column_name = 'tenant_id') THEN
    ALTER TABLE almoxarifado_itens ADD COLUMN tenant_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'almoxarifado_itens' AND column_name = 'nome') THEN
    ALTER TABLE almoxarifado_itens ADD COLUMN nome TEXT NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'almoxarifado_itens' AND column_name = 'categoria') THEN
    ALTER TABLE almoxarifado_itens ADD COLUMN categoria TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'almoxarifado_itens' AND column_name = 'quantidade') THEN
    ALTER TABLE almoxarifado_itens ADD COLUMN quantidade INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'almoxarifado_itens' AND column_name = 'alerta_estoque_minimo') THEN
    ALTER TABLE almoxarifado_itens ADD COLUMN alerta_estoque_minimo INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'almoxarifado_itens' AND column_name = 'custo_unitario') THEN
    ALTER TABLE almoxarifado_itens ADD COLUMN custo_unitario NUMERIC(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'almoxarifado_itens' AND column_name = 'created_at') THEN
    ALTER TABLE almoxarifado_itens ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'almoxarifado_itens' AND column_name = 'updated_at') THEN
    ALTER TABLE almoxarifado_itens ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- almoxarifado_movimentacoes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'almoxarifado_movimentacoes' AND column_name = 'tenant_id') THEN
    ALTER TABLE almoxarifado_movimentacoes ADD COLUMN tenant_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'almoxarifado_movimentacoes' AND column_name = 'item_id') THEN
    ALTER TABLE almoxarifado_movimentacoes ADD COLUMN item_id UUID REFERENCES almoxarifado_itens(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'almoxarifado_movimentacoes' AND column_name = 'tipo') THEN
    ALTER TABLE almoxarifado_movimentacoes ADD COLUMN tipo TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'almoxarifado_movimentacoes' AND column_name = 'quantidade') THEN
    ALTER TABLE almoxarifado_movimentacoes ADD COLUMN quantidade INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'almoxarifado_movimentacoes' AND column_name = 'justificativa') THEN
    ALTER TABLE almoxarifado_movimentacoes ADD COLUMN justificativa TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'almoxarifado_movimentacoes' AND column_name = 'created_at') THEN
    ALTER TABLE almoxarifado_movimentacoes ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_almoxarifado_itens_tenant_id ON almoxarifado_itens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_almoxarifado_itens_nome ON almoxarifado_itens(nome);
CREATE INDEX IF NOT EXISTS idx_almoxarifado_itens_categoria ON almoxarifado_itens(categoria);
CREATE INDEX IF NOT EXISTS idx_almoxarifado_movimentacoes_tenant_id ON almoxarifado_movimentacoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_almoxarifado_movimentacoes_item_id ON almoxarifado_movimentacoes(item_id);
CREATE INDEX IF NOT EXISTS idx_almoxarifado_movimentacoes_tipo ON almoxarifado_movimentacoes(tipo);

-- 7. Trigger para updated_at
CREATE OR REPLACE FUNCTION almoxarifado_itens_updated_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON almoxarifado_itens;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON almoxarifado_itens
  FOR EACH ROW
  EXECUTE FUNCTION almoxarifado_itens_updated_at_trigger();

-- 8. Verificação final
DO $$
BEGIN
  RAISE NOTICE '=== CONFIGURAÇÃO RLS - ALMOXARIFADO ===';
  RAISE NOTICE 'RLS habilitado em almoxarifado_itens: %', (SELECT rowsecurity FROM pg_tables WHERE tablename = 'almoxarifado_itens');
  RAISE NOTICE 'RLS habilitado em almoxarifado_movimentacoes: %', (SELECT rowsecurity FROM pg_tables WHERE tablename = 'almoxarifado_movimentacoes');
  RAISE NOTICE 'Polícias criadas: %', (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('almoxarifado_itens', 'almoxarifado_movimentacoes'));
END $$;

-- Listar políticas
SELECT 
  tablename,
  policyname AS "Política",
  cmd AS "Operação"
FROM pg_policies 
WHERE tablename IN ('almoxarifado_itens', 'almoxarifado_movimentacoes')
ORDER BY tablename, policyname;
