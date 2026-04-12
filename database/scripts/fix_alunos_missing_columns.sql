-- =====================================================
-- MIGRATION: Adicionar colunas faltantes na tabela alunos
-- DATA: 2026-04-12
-- DESCRIÇÃO: Adiciona colunas que estão no schema TypeScript
--            mas não existem no banco de dados.
-- Colunas adicionadas:
--   - rg (string | null)
--   - genero (string | null) - pode já existir como 'sexo'
-- =====================================================

-- 1. Adicionar coluna 'rg' se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'alunos' AND column_name = 'rg'
  ) THEN
    ALTER TABLE alunos ADD COLUMN rg TEXT;
    RAISE NOTICE '✅ Coluna rg adicionada à tabela alunos';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna rg já existe na tabela alunos';
  END IF;
END $$;

-- 2. Adicionar coluna 'genero' se não existir (caso exista apenas 'sexo')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'alunos' AND column_name = 'genero'
  ) THEN
    ALTER TABLE alunos ADD COLUMN genero TEXT;
    RAISE NOTICE '✅ Coluna genero adicionada à tabela alunos';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna genero já existe na tabela alunos';
  END IF;
END $$;

-- 3. Se existir coluna 'sexo', migrar dados para 'genero' e depois renomear
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'alunos' AND column_name = 'sexo'
  ) THEN
    -- Migrar dados de sexo para genero (se genero existir)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'alunos' AND column_name = 'genero'
    ) THEN
      UPDATE alunos SET genero = sexo WHERE sexo IS NOT NULL AND genero IS NULL;
      RAISE NOTICE '✅ Dados migrados de sexo para genero';
    END IF;
    -- Remover coluna sexo após migração
    ALTER TABLE alunos DROP COLUMN sexo;
    RAISE NOTICE '✅ Coluna sexo removida (dados migrados para genero)';
  END IF;
END $$;

-- 4. Garantir que foto_url existe (pode ser que esteja como 'foto' ou similar)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'alunos' AND column_name = 'foto_url'
  ) THEN
    ALTER TABLE alunos ADD COLUMN foto_url TEXT;
    RAISE NOTICE '✅ Coluna foto_url adicionada à tabela alunos';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna foto_url já existe na tabela alunos';
  END IF;
END $$;

-- 5. Garantir índice para busca por CPF
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'alunos' AND indexname = 'idx_alunos_cpf'
  ) THEN
    CREATE INDEX idx_alunos_cpf ON alunos(cpf) WHERE cpf IS NOT NULL;
    RAISE NOTICE '✅ Índice idx_alunos_cpf criado';
  ELSE
    RAISE NOTICE 'ℹ️ Índice idx_alunos_cpf já existe';
  END IF;
END $$;

-- Verificação final
DO $$
DECLARE
  colunas_faltantes TEXT[];
BEGIN
  SELECT array_agg(column_name)
  INTO colunas_faltantes
  FROM (
    SELECT column_name
    FROM unnest(ARRAY[
      'id', 'tenant_id', 'filial_id', 'nome_completo', 'nome_social',
      'data_nascimento', 'cpf', 'rg', 'genero', 'foto_url',
      'patologias', 'medicamentos', 'observacoes_saude', 'status',
      'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado',
      'desconto_valor', 'desconto_tipo', 'desconto_inicio', 'desconto_fim',
      'valor_mensalidade_atual', 'data_ingresso', 'codigo_transferencia',
      'created_at', 'updated_at'
    ]) AS expected_cols(column_name)
    EXCEPT
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'alunos'
  ) missing;

  IF colunas_faltantes IS NOT NULL THEN
    RAISE WARNING '⚠️ Colunas ainda faltando na tabela alunos: %', array_to_string(colunas_faltantes, ', ');
  ELSE
    RAISE NOTICE '✅ Todas as colunas esperadas estão presentes na tabela alunos';
  END IF;
END $$;
