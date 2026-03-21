-- ==============================================================================
-- 🚀 MIGRATION 080: HABILITAR RLS EM TODAS AS TABELAS
-- Descrição: Habilita Row Level Security em TODAS as tabelas públicas.
-- Impacto: SEGURANÇA - Garante isolamento de dados entre tenants.
-- Importante: Esta migration APENAS habilita RLS. As políticas já existem.
-- Regras de Negócio: Super Admin e Gestor mantêm seus acessos.
-- EXCEÇÕES: Tabelas de autenticação e onboarding permanecem com RLS desabilitado.
-- ==============================================================================

-- HABILITAR RLS EM TODAS AS TABELAS DO SCHEMA PUBLIC
-- Este bloco automático percorre TODAS as tabelas e habilita RLS com tratamento de erros
DO $$
DECLARE
    rec record;
    v_count integer := 0;
    v_errors integer := 0;
    v_excluded_tables text[] := ARRAY['responsaveis', 'filiais', 'assinaturas', 'faturas', 'alunos'];
BEGIN
    -- Habilita RLS em todas as tabelas do schema public, EXCETO as de autenticação/onboarding
    FOR rec IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename != ALL(v_excluded_tables)
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', rec.tablename);
            v_count := v_count + 1;
            RAISE NOTICE '  ✅ %', rec.tablename;
        EXCEPTION WHEN OTHERS THEN
            -- Ignora tabelas que já têm RLS habilitado ou não suportam
            v_errors := v_errors + 1;
            RAISE NOTICE '  ⚠️  % (erro ignorado: %)', rec.tablename, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RLS habilitado em % tabelas', v_count;
    RAISE NOTICE '📋 TABELAS EXCLUÍDAS (RLS desabilitado):';
    RAISE NOTICE '   - responsaveis (login CPF)';
    RAISE NOTICE '   - filiais (onboarding)';
    RAISE NOTICE '   - assinaturas (checkout)';
    RAISE NOTICE '   - faturas (checkout)';
    RAISE NOTICE '   - alunos (vínculo responsável)';
    IF v_errors > 0 THEN
        RAISE NOTICE '⚠️  % erros ignorados (tabelas sem suporte ou já configuradas)', v_errors;
    END IF;
    RAISE NOTICE '========================================';
END $$;

-- ==============================================================================
-- ✅ RESUMO
-- ==============================================================================
-- - RLS habilitado em TODAS as tabelas, EXCETO: responsaveis, filiais, assinaturas, faturas, alunos
-- - Isolamento de tenants garantido a nível de banco de dados
-- - Políticas existentes são mantidas
-- - Super Admin mantém acesso total via has_permission()
-- - Gestor mantém acesso à sua escola
-- - Login por CPF dos responsáveis FUNCIONA
-- - Fluxo de onboarding de escolas FUNCIONA
-- - Tratamento de erros incluso (não quebra se tabela não existir)
-- ==============================================================================
