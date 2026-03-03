-- ==========================================================
-- VINCULAR GESTOR À ESCOLA (CORREÇÃO DE TENANT_ID VAZIO)
-- ==========================================================

-- Este comando garante que o usuário atual seja o gestor da escola.
-- Substitua 'SEU_USER_ID_AQUI' pelo ID que aparece no console (F12) 
-- se ele for diferente do ID abaixo.

UPDATE public.escolas 
SET gestor_user_id = '8387e730-2213-4d0e-84e3-46a58fa9b793'
WHERE id = '5a68b8cb-c580-4c55-b09e-3db228f21ef0';

-- Verificação:
-- SELECT id, razao_social, gestor_user_id FROM public.escolas;
