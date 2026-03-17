-- ==============================================================================
-- 🚀 MIGRATION: ADIÇÃO DO PERFIL CONTADOR (READ-ONLY FINANCEIRO)
-- Descrição: Cria o perfil de Contador com acesso somente leitura ao financeiro.
-- ==============================================================================

-- 1. Criar Perfil Contador
INSERT INTO public.perfis_acesso (id, tenant_id, nome, descricao, parent_perfil_id)
VALUES ('a0000001-0000-0000-0000-000000000006', NULL, 'Contador', 'Acesso somente leitura ao financeiro e relatórios', NULL)
ON CONFLICT (id) DO NOTHING;

-- 2. Limpar permissões existentes (caso o script rode novamente)
DELETE FROM public.perfil_permissions WHERE perfil_id = 'a0000001-0000-0000-0000-000000000006';

-- 3. Vincular permissões específicas de LEITURA e EXPORTAÇÃO
INSERT INTO public.perfil_permissions (perfil_id, permission_id, scope_type)
SELECT 'a0000001-0000-0000-0000-000000000006', id, 'toda_escola'::scope_type
FROM public.permissions
WHERE key IN (
    'dashboard.view',
    'financeiro.cobrancas.view',
    'financeiro.fatura.view',
    'financeiro.contas_pagar.view',
    'financeiro.relatorios.view',
    'financeiro.relatorios.export'
);

-- 4. Adicionar o cargo de Contador à tabela de funções padrão (funcoes_escola)
INSERT INTO public.funcoes_escola (nome, categoria, is_padrao, tenant_id)
VALUES ('Contador', 'Administrativo', true, NULL)
ON CONFLICT (tenant_id, nome) DO NOTHING;
