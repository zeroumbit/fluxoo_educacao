-- =====================================================
-- MIGRATION COMPLETA: Identidade única do aluno (codigo_transferencia)
-- DATA: 2026-04-12
-- DESCRIÇÃO: O codigo_transferencia é a IDENTIDADE ÚNICA do aluno 
--            na plataforma (como um CPF). Gerado automaticamente no 
--            cadastro, único GLOBALMENTE (cross-tenant), nunca alterável.
-- =====================================================

-- ============================================================
-- PARTE 1: Colunas faltantes
-- ============================================================

-- 1a. Coluna 'rg'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'alunos' AND column_name = 'rg'
  ) THEN
    ALTER TABLE alunos ADD COLUMN rg TEXT;
    RAISE NOTICE '✅ Coluna rg adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna rg já existe';
  END IF;
END $$;

-- 1b. Coluna 'genero' (e migrar de 'sexo' se existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'alunos' AND column_name = 'sexo'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'alunos' AND column_name = 'genero'
    ) THEN
      UPDATE alunos SET genero = sexo WHERE sexo IS NOT NULL AND genero IS NULL;
      RAISE NOTICE '✅ Dados migrados de sexo para genero';
    END IF;
    ALTER TABLE alunos DROP COLUMN sexo;
    RAISE NOTICE '✅ Coluna sexo removida';
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'alunos' AND column_name = 'genero'
  ) THEN
    ALTER TABLE alunos ADD COLUMN genero TEXT;
    RAISE NOTICE '✅ Coluna genero adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna genero já existe';
  END IF;
END $$;

-- 1c. Coluna 'foto_url'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'alunos' AND column_name = 'foto_url'
  ) THEN
    ALTER TABLE alunos ADD COLUMN foto_url TEXT;
    RAISE NOTICE '✅ Coluna foto_url adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna foto_url já existe';
  END IF;
END $$;

-- ============================================================
-- PARTE 2: Trigger para gerar codigo_transferencia
-- ============================================================

-- 2a. Garantir que a coluna codigo_transferencia existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'alunos' AND column_name = 'codigo_transferencia'
  ) THEN
    ALTER TABLE alunos ADD COLUMN codigo_transferencia VARCHAR(8);
    RAISE NOTICE '✅ Coluna codigo_transferencia adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna codigo_transferencia já existe';
  END IF;
END $$;

-- 2b. Constraint UNIQUE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'alunos_codigo_transferencia_key'
  ) THEN
    ALTER TABLE alunos ADD CONSTRAINT alunos_codigo_transferencia_key UNIQUE (codigo_transferencia);
    RAISE NOTICE '✅ Constraint UNIQUE adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Constraint UNIQUE já existe';
  END IF;
END $$;

-- 2c. CHECK pattern
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'alunos_codigo_transferencia_check'
  ) THEN
    ALTER TABLE alunos ADD CONSTRAINT alunos_codigo_transferencia_check CHECK (codigo_transferencia ~ '^[A-Z0-9]{8}$');
    RAISE NOTICE '✅ Constraint CHECK adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Constraint CHECK já existe';
  END IF;
END $$;

-- 2d. Função para gerar código
CREATE OR REPLACE FUNCTION public.gerar_codigo_transferencia()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  novo_codigo TEXT;
  codigo_existe BOOLEAN;
  tentativas INTEGER := 0;
BEGIN
  -- Se já tem código válido, não sobrescreve
  IF NEW.codigo_transferencia IS NOT NULL AND NEW.codigo_transferencia != '' AND LENGTH(NEW.codigo_transferencia) = 8 THEN
    RETURN NEW;
  END IF;

  -- Gera código aleatório único GLOBALMENTE (cross-tenant)
  LOOP
    novo_codigo := upper(
      substring(md5(random()::text || clock_timestamp()::text) from 1 for 8)
    );
    -- Garante que só tem letras e números
    novo_codigo := regexp_replace(novo_codigo, '[^A-Z0-9]', 'X', 'g');
    novo_codigo := RPAD(substring(novo_codigo from 1 for 8), 8, 'X');

    -- Verifica unicidade GLOBAL (toda a plataforma)
    SELECT EXISTS(
      SELECT 1 FROM alunos WHERE codigo_transferencia = novo_codigo
    ) INTO codigo_existe;

    IF NOT codigo_existe THEN
      NEW.codigo_transferencia := novo_codigo;
      EXIT;
    END IF;

    tentativas := tentativas + 1;
    IF tentativas > 50 THEN
      RAISE WARNING 'Muitas tentativas ao gerar codigo_transferencia';
      EXIT;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- 2e. Trigger (apenas INSERT, nunca UPDATE para preservar código)
DROP TRIGGER IF EXISTS trg_gerar_codigo_transferencia_alunos ON alunos;
CREATE TRIGGER trg_gerar_codigo_transferencia_alunos
  BEFORE INSERT ON alunos
  FOR EACH ROW
  EXECUTE FUNCTION gerar_codigo_transferencia();

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger codigo_transferencia criado';
END $$;

-- 2f. Gerar códigos para alunos existentes que não têm
DO $$
DECLARE
  r RECORD;
  v_codigo TEXT;
  v_existe BOOLEAN;
  v_count INTEGER := 0;
BEGIN
  FOR r IN SELECT id FROM alunos WHERE deleted_at IS NULL AND (codigo_transferencia IS NULL OR codigo_transferencia = '') LOOP
    -- Gera código único
    LOOP
      v_codigo := upper(
        substring(md5(random()::text || clock_timestamp()::text || r.id::text) from 1 for 8)
      );
      v_codigo := regexp_replace(v_codigo, '[^A-Z0-9]', 'X', 'g');
      v_codigo := RPAD(substring(v_codigo from 1 for 8), 8, 'X');
      
      SELECT NOT EXISTS(SELECT 1 FROM alunos WHERE codigo_transferencia = v_codigo) INTO v_existe;
      
      IF v_existe THEN
        UPDATE alunos SET codigo_transferencia = v_codigo WHERE id = r.id;
        v_count := v_count + 1;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '✅ Códigos gerados para % alunos existentes', v_count;
END $$;

-- ============================================================
-- PARTE 3: RPC buscar_aluno_transferencia
-- ============================================================

-- Drop TODAS as variantes existentes
DROP FUNCTION IF EXISTS public.buscar_aluno_transferencia CASCADE;

-- Criação da função RPC (busca apenas pelo código de identidade do aluno)
CREATE OR REPLACE FUNCTION public.buscar_aluno_transferencia(p_codigo TEXT)
RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Busca APENAS pelo codigo_transferencia (identidade única do aluno)
    SELECT jsonb_build_object(
        'id', a.id,
        'tenant_id', a.tenant_id,
        'filial_id', a.filial_id,
        'nome_completo', a.nome_completo,
        'data_nascimento', a.data_nascimento,
        'cpf', a.cpf,
        'status', a.status,
        'codigo_transferencia', a.codigo_transferencia,
        'created_at', a.created_at,
        'responsaveis', COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', r.id,
                        'nome', r.nome,
                        'cpf', r.cpf,
                        'email', r.email,
                        'telefone', r.telefone,
                        'parentesco', ar.grau_parentesco,
                        'is_financeiro', ar.is_financeiro
                    )
                )
                FROM public.aluno_responsavel ar
                INNER JOIN public.responsaveis r ON r.id = ar.responsavel_id
                WHERE ar.aluno_id = a.id
                  AND ar.status = 'ativo'
            ),
            '[]'::jsonb
        ),
        'filial', (
            SELECT jsonb_build_object(
                'id', f.id,
                'nome_unidade', f.nome_unidade,
                'cidade', f.cidade,
                'estado', f.estado
            )
            FROM public.filiais f
            WHERE f.id = a.filial_id
        )
    ) INTO v_result
    FROM public.alunos a
    WHERE a.codigo_transferencia = UPPER(p_codigo)
      AND a.deleted_at IS NULL;

    IF v_result IS NULL THEN
        RETURN;
    END IF;

    RETURN NEXT v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.buscar_aluno_transferencia(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buscar_aluno_transferencia(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_aluno_transferencia(TEXT) TO anon;

COMMENT ON FUNCTION public.buscar_aluno_transferencia IS 'Busca aluno por código de transferência. Retorna JSONB com dados do aluno + responsáveis + filial.';

DO $$
BEGIN
  RAISE NOTICE '✅ RPC buscar_aluno_transferencia criada';
END $$;

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================

DO $$
DECLARE
  v_colunas_ok BOOLEAN;
  v_rpc_ok BOOLEAN;
  v_trigger_ok BOOLEAN;
BEGIN
  -- Colunas
  SELECT NOT EXISTS (
    SELECT column_name
    FROM unnest(ARRAY['rg', 'genero', 'foto_url', 'codigo_transferencia']) AS expected(column_name)
    EXCEPT
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'alunos'
  ) INTO v_colunas_ok;

  -- RPC
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'buscar_aluno_transferencia' AND routine_schema = 'public'
  ) INTO v_rpc_ok;

  -- Trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'alunos'::regclass AND tgname = 'trg_gerar_codigo_transferencia_alunos'
  ) INTO v_trigger_ok;

  IF v_colunas_ok AND v_rpc_ok AND v_trigger_ok THEN
    RAISE NOTICE '✅ TODAS AS CORREÇÕES APLICADAS COM SUCESSO';
  ELSE
    RAISE WARNING '⚠️ Algumas verificações falharam - colunas:%, rpc:%, trigger:%', 
      v_colunas_ok, v_rpc_ok, v_trigger_ok;
  END IF;
END $$;
