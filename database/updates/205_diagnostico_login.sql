-- ==============================================================================
-- 🔍 DIAGNÓSTICO DE LOGIN - CPF 91776040325
-- ==============================================================================

-- 1. Verificar se o registro existe e tem email/user_id
SELECT id, nome, cpf, email, user_id, tenant_id, status
FROM public.responsaveis
WHERE regexp_replace(cpf, '\D', '', 'g') = '91776040325';

-- 2. Tentar encontrar o user_id perdido via logs de auditoria ou outras tabelas
SELECT DISTINCT responsavel_id, detalhes->>'cpf' as cpf_log
FROM public.portal_audit_log
WHERE detalhes->>'cpf' = '91776040325'
ORDER BY responsavel_id DESC;

-- 3. Verificar se existe usuário no Auth com este CPF (se o email for conhecido)
-- Nota: Se você souber o email, procure por ele no dashboard do Supabase (Authentication).
