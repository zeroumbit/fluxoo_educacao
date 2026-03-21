-- ==============================================================================
-- 🚨 MIGRATION 081: CORREÇÃO EMERGENCIAL - LOGIN RESPONSÁVEIS (CPF)
-- Descrição: Restaura acesso à tabela responsaveis para login por CPF.
-- Impacto: CRÍTICO - Responsáveis conseguem fazer login no Portal da Família.
-- Causa: Migration 080 habilitou RLS sem querer e bloqueou o acesso.
-- ==============================================================================

-- 1. DESABILITAR RLS NA TABELA RESPONSÁVEIS
-- Necessário para permitir consulta por CPF durante o login
ALTER TABLE public.responsaveis DISABLE ROW LEVEL SECURITY;

-- 2. MANTER RLS DESABILITADO EM TABELAS CRÍTICAS DE AUTENTICAÇÃO
-- Estas tabelas precisam estar acessíveis para o fluxo de login/checkout
ALTER TABLE public.filiais DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- ✅ RESUMO DA CORREÇÃO
-- ==============================================================================
-- - RLS DESABILITADO em: responsaveis, filiais, assinaturas, faturas, alunos
-- - Login por CPF dos responsáveis RESTAURADO
-- - Fluxo de onboarding de escolas PRESERVADO
-- - Demais tabelas mantêm RLS habilitado (segurança)
-- ==============================================================================

-- 3. VALIDAÇÃO PÓS-CORREÇÃO
DO $$
DECLARE
    v_responsaveis_rls boolean;
BEGIN
    -- Verifica se RLS está desabilitado em responsaveis
    SELECT relrowsecurity INTO v_responsaveis_rls
    FROM pg_class
    WHERE relname = 'responsaveis' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    IF NOT v_responsaveis_rls THEN
        RAISE NOTICE '✅ CORREÇÃO APLICADA: RLS desabilitado em responsaveis - Login por CPF restaurado';
    ELSE
        RAISE WARNING '⚠️  ATENÇÃO: RLS ainda está habilitado em responsaveis - Login por CPF pode falhar';
    END IF;
END $$;
