-- ==============================================================================
-- DIAGNÓSTICO: Verificar estrutura das tabelas para migrations 160-162
-- Execute no Supabase SQL Editor
-- ==============================================================================

-- 1. Verificar colunas da tabela aluno_responsavel
SELECT 
    'aluno_responsavel' AS table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'aluno_responsavel'
ORDER BY ordinal_position;

-- 2. Verificar colunas da tabela responsables
SELECT 
    'responsaveis' AS table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'responsaveis'
ORDER BY ordinal_position;

-- 3. Verificar se existem as funções criadas
SELECT 
    routine_name,
    routine_type,
    data_type AS return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('is_my_child_v2', 'is_staff_of_school', 'is_super_admin_v2', 'get_my_responsavel_id')
ORDER BY routine_name;

-- 4. Verificar políticas RLS existentes nas tabelas principais
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('alunos', 'aluno_responsavel', 'responsaveis', 'turmas', 'cobrancas', 'mural_avisos')
ORDER BY tablename, policyname;