-- ==============================================================================
-- 🔬 DIAGNÓSTICO PROFUNDO — SÉRGIO DIAS (user_id: c0c84ed5-175d-4003-96ac-d0822f7b66b7)
-- ==============================================================================

-- 1. O código no AuthContext busca nesta ordem: escola → funcionario → usuarios_sistema → responsavel
-- Se Sérgio aparecer em qualquer das primeiras 3, ele NUNCA chega a ser identificado como responsavel.

-- Verifica se está em usuarios_sistema (BLOQUEADOR PRINCIPAL)
SELECT 'usuarios_sistema' as tabela, id::text, tenant_id::text 
FROM public.usuarios_sistema 
WHERE id = 'c0c84ed5-175d-4003-96ac-d0822f7b66b7'
UNION ALL
-- Verifica se está como funcionario
SELECT 'funcionarios' as tabela, id::text, tenant_id::text 
FROM public.funcionarios 
WHERE user_id = 'c0c84ed5-175d-4003-96ac-d0822f7b66b7'
UNION ALL
-- Verifica se está em responsaveis com o user_id correto
SELECT 'responsaveis' as tabela, id::text, tenant_id::text 
FROM public.responsaveis 
WHERE user_id = 'c0c84ed5-175d-4003-96ac-d0822f7b66b7';

-- 2. Listar TODAS as políticas ativas na tabela responsaveis
-- Se houver conflito, o 500 continua
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'responsaveis';
