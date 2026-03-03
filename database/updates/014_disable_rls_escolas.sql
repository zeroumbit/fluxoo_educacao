-- ==========================================================
-- CORREÇÃO: LIBERAR ACESSO À TABELA ESCOLAS PARA GESTORES
-- Resolve o problema do tenant_id vindo vazio e escola null
-- ==========================================================

-- 1. Desabilitar RLS na tabela escolas para evitar bloqueios no onboarding
ALTER TABLE public.escolas DISABLE ROW LEVEL SECURITY;

-- 2. Garantir que outras tabelas de apoio estejam liberadas
ALTER TABLE public.filiais DISABLE ROW LEVEL SECURITY;

-- Comentário: A tabela 'escolas_configuracoes' foi removida do script pois 
-- não foi encontrada no banco. O foco agora é liberar 'escolas' e 'filiais'.
