-- =====================================================
-- Script: Diagnóstico Completo - Currículos
-- =====================================================
-- Execute e me envie o RESULTADO COMPLETO
-- =====================================================

-- 1. Tabela existe?
SELECT 
    'TABELA' as tipo,
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'curriculos';

-- 2. Quantas políticas existem?
SELECT 
    'POLÍTICAS' as tipo,
    count(*) as quantidade
FROM pg_policies 
WHERE tablename = 'curriculos';

-- 3. QUAIS políticas existem? (IMPORTANTE!)
SELECT 
    'POLICIA' as tipo,
    policyname as nome,
    cmd as operacao,
    roles as roles,
    CASE WHEN qual IS NOT NULL THEN substr(qual, 1, 200) END as usando,
    CASE WHEN with_check IS NOT NULL THEN substr(with_check, 1, 200) END as com_check
FROM pg_policies 
WHERE tablename = 'curriculos'
ORDER BY policyname;

-- 4. Usuário atual é gestor?
SELECT 
    'USUÁRIO' as tipo,
    auth.uid() as user_id,
    au.email as user_email,
    au.raw_user_meta_data->>'role' as user_role,
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE gestor_user_id = auth.uid()
    ) as is_gestor,
    (SELECT status_assinatura FROM public.escolas WHERE gestor_user_id = auth.uid() LIMIT 1) as status_escola;

-- 5. Existem currículos na tabela?
SELECT 
    'DADOS' as tipo,
    count(*) as total_curriculos,
    count(*) FILTER (WHERE is_publico = true) as publicos,
    count(*) FILTER (WHERE is_ativo = true) as ativos,
    count(*) FILTER (WHERE disponibilidade_emprego = true) as disponiveis,
    count(*) FILTER (WHERE is_publico = true AND is_ativo = true AND disponibilidade_emprego = true) as todos_filtros;

-- 6. Testar query MANUALMENTE com políticas
-- Esta query mostra o que o usuário PODE VER
SELECT 
    'TESTE' as tipo,
    c.id,
    c.is_publico,
    c.is_ativo,
    c.disponibilidade_emprego,
    CASE 
        WHEN auth.uid() = c.user_id THEN 'OWNER'
        WHEN EXISTS (SELECT 1 FROM public.escolas WHERE gestor_user_id = auth.uid() AND status_assinatura = 'ativa') THEN 'GESTOR'
        WHEN EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND (au.raw_user_meta_data->>'role') = 'super_admin') THEN 'SUPER_ADMIN'
        ELSE 'SEM_PERMISSAO'
    END as permissao_usuario,
    CASE 
        WHEN c.is_publico = true AND c.is_ativo = true AND c.disponibilidade_emprego = true THEN 'VISIVEL'
        ELSE 'NAO_VISIVEL'
    END as status_curriculo
FROM public.curriculos c
LIMIT 5;

-- =====================================================
-- Se NÃO houver políticas ou estiverem erradas,
-- execute o script: database/curriculos_rls_producao.sql
-- =====================================================
