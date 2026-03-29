-- =====================================================
-- Script: Diagnosticar Problemas RLS - Currículos
-- =====================================================
-- Execute para verificar o status da tabela e políticas
-- =====================================================

-- 1. Verificar se tabela existe
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'curriculos';

-- 2. Verificar políticas RLS existentes
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
WHERE tablename = 'curriculos';

-- 3. Verificar se usuário autenticado é gestor
SELECT 
    auth.uid() as user_id,
    au.raw_user_meta_data->>'role' as user_role,
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE gestor_user_id = auth.uid()
    ) as is_gestor
FROM auth.users au
WHERE au.id = auth.uid();

-- 4. Testar query direta (sem RLS)
SELECT count(*) FROM public.curriculos;

-- 5. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'curriculos'
ORDER BY ordinal_position;

-- 6. Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'curriculos';

-- =====================================================
-- Se as políticas NÃO aparecerem no passo 2, execute:
-- =====================================================

-- Dropar políticas antigas
DROP POLICY IF EXISTS "Usuarios podem ver proprio curriculo" ON public.curriculos;
DROP POLICY IF EXISTS "Usuarios podem inserir proprio curriculo" ON public.curriculos;
DROP POLICY IF EXISTS "Usuarios podem editar proprio curriculo" ON public.curriculos;
DROP POLICY IF EXISTS "Gestores podem ver curriculos publicos" ON public.curriculos;
DROP POLICY IF EXISTS "Super Admin pode ver todos os curriculos" ON public.curriculos;

-- Criar política para permitir acesso ANTES de configurar RLS corretamente
-- POLÍTICA TEMPORÁRIA PARA TESTE - REMOVER EM PRODUÇÃO
CREATE POLICY "acesso_total_temporario"
    ON public.curriculos
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- Resultado esperado:
-- - Tabela deve existir
-- - RLS deve estar enabled
-- - Pelo menos 1 política deve existir
-- =====================================================
