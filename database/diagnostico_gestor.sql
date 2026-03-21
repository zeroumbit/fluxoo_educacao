-- ==============================================================================
-- 🔍 DIAGNÓSTICO: VERIFICAR CONFIGURAÇÃO DA ESCOLA E GESTOR
-- Execute este script para diagnosticar o problema
-- ==============================================================================

-- 1. Verificar escolas e seus gestores
SELECT 
    e.id as escola_id,
    e.razao_social,
    e.gestor_user_id,
    u.email as gestor_email,
    u.created_at as gestor_criado_em
FROM escolas e
LEFT JOIN auth.users u ON u.id = e.gestor_user_id
ORDER BY e.created_at DESC
LIMIT 10;

-- 2. Verificar quantas turmas existem por escola
SELECT 
    e.id as escola_id,
    e.razao_social,
    COUNT(t.id) as total_turmas
FROM escolas e
LEFT JOIN turmas t ON t.tenant_id = e.id
GROUP BY e.id, e.razao_social
ORDER BY total_turmas DESC;

-- 3. Verificar quantas matrículas existem por escola
SELECT 
    e.id as escola_id,
    e.razao_social,
    COUNT(m.id) as total_matriculas
FROM escolas e
LEFT JOIN matriculas m ON m.tenant_id = e.id
GROUP BY e.id, e.razao_social
ORDER BY total_matriculas DESC;

-- 4. Verificar quantas contas a pagar existem por escola
SELECT 
    e.id as escola_id,
    e.razao_social,
    COUNT(cp.id) as total_contas_pagar
FROM escolas e
LEFT JOIN contas_pagar cp ON cp.tenant_id = e.id
GROUP BY e.id, e.razao_social
ORDER BY total_contas_pagar DESC;

-- 5. Verificar políticas atuais de turmas
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'turmas'
ORDER BY policyname;

-- 6. Verificar políticas atuais de matrículas
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'matriculas'
ORDER BY policyname;

-- 7. Verificar políticas atuais de contas_pagar
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'contas_pagar'
ORDER BY policyname;

-- 8. Verificar se RLS está habilitado nas tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename IN ('turmas', 'matriculas', 'contas_pagar', 'alunos', 'cobrancas')
ORDER BY tablename;

-- 9. Script para corrigir gestor_user_id se estiver NULL
-- ATENÇÃO: Substitua 'SEU_EMAIL_AQUI' pelo email do gestor
-- UPDATE escolas 
-- SET gestor_user_id = (SELECT id FROM auth.users WHERE email = 'SEU_EMAIL_AQUI')
-- WHERE gestor_user_id IS NULL;

-- 10. Testar se usuário atual é gestor
SELECT 
    auth.uid() as usuario_atual_id,
    auth.jwt() ->> 'email' as usuario_email,
    auth.jwt() ->> 'tenant_id' as tenant_id_jwt,
    EXISTS (
        SELECT 1 FROM escolas 
        WHERE gestor_user_id = auth.uid()
    ) as is_gestor;
