-- =====================================================
-- Script: CORREÇÃO EMERGENCIAL - Liberar Acesso Currículos
-- =====================================================
-- Este script CRIA UMA POLÍTICA BEM PERMISSIVA para teste
-- Execute e teste imediatamente no navegador
-- =====================================================

-- 1. Dropar TODAS as políticas existentes (uma por uma)
DROP POLICY IF EXISTS "curriculos_usuario_own_select" ON public.curriculos;
DROP POLICY IF EXISTS "curriculos_usuario_own_insert" ON public.curriculos;
DROP POLICY IF EXISTS "curriculos_usuario_own_update" ON public.curriculos;
DROP POLICY IF EXISTS "curriculos_gestores_select_public" ON public.curriculos;
DROP POLICY IF EXISTS "curriculos_superadmin_full" ON public.curriculos;
DROP POLICY IF EXISTS "Usuarios podem ver proprio curriculo" ON public.curriculos;
DROP POLICY IF EXISTS "Usuarios podem inserir proprio curriculo" ON public.curriculos;
DROP POLICY IF EXISTS "Usuarios podem editar proprio curriculo" ON public.curriculos;
DROP POLICY IF EXISTS "Gestores podem ver curriculos publicos" ON public.curriculos;
DROP POLICY IF EXISTS "Super Admin pode ver todos os curriculos" ON public.curriculos;
DROP POLICY IF EXISTS "acesso_total_temporario" ON public.curriculos;

-- 2. Criar ÚNICA política bem permissiva para QUALQUER usuário autenticado
-- ISSO É TEMPORÁRIO - APENAS PARA TESTAR SE É RLS
CREATE POLICY "curriculos_acesso_liberado"
    ON public.curriculos
    FOR SELECT
    TO authenticated
    USING (true);

-- 3. Verificar política criada
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'curriculos';

-- =====================================================
-- AGORA TESTE NO NAVEGADOR: /curriculos
-- Se funcionar, o problema era RLS muito restritivo
-- Se NÃO funcionar, o problema é outro (tabela, dados, etc)
-- =====================================================
