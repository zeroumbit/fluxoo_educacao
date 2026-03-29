-- =====================================================
-- Script: Por Que 403? - Diagnóstico
-- =====================================================
-- Execute e veja POR QUE está recebendo 403
-- =====================================================

-- 1. Quem é você?
SELECT 
    auth.uid() as seu_user_id,
    au.email as seu_email,
    au.raw_user_meta_data->>'role' as seu_role
FROM auth.users au
WHERE au.id = auth.uid();

-- 2. Você é gestor de alguma escola?
SELECT 
    e.id as escola_id,
    e.razao_social as escola_nome,
    e.status_assinatura as status,
    e.gestor_user_id as gestor_id
FROM public.escolas e
WHERE e.gestor_user_id = auth.uid();

-- 3. Quais políticas existem agora?
SELECT 
    policyname as nome_policy,
    cmd as operacao,
    roles as roles
FROM pg_policies 
WHERE tablename = 'curriculos'
ORDER BY policyname;

-- 4. Quantos currículos públicos/ativos/disponíveis existem?
SELECT 
    count(*) as total,
    count(*) FILTER (WHERE is_publico = true AND is_ativo = true AND disponibilidade_emprego = true) as visiveis
FROM public.curriculos;

-- 5. Teste: Você consegue ver ALGUM currículo?
SELECT 
    c.id,
    c.is_publico,
    c.is_ativo,
    c.disponibilidade_emprego,
    'Se aparecer aqui, você TEM acesso' as resultado
FROM public.curriculos c
WHERE c.is_publico = true 
  AND c.is_ativo = true 
  AND c.disponibilidade_emprego = true
LIMIT 5;

-- =====================================================
-- RESULTADOS ESPERADOS:
-- 
-- Se você É GESTOR e escola está ATIVA:
-- - Query 2 deve retornar 1 ou mais escolas
-- - Query 5 deve retornar currículos (se existirem)
--
-- Se você NÃO É GESTOR:
-- - Query 2 retorna vazio
-- - Query 5 retorna vazio (403 esperado)
--
-- Se você É SUPER_ADMIN:
-- - Query 1 mostra role = 'super_admin'
-- - Query 5 deve retornar todos os currículos
-- =====================================================
