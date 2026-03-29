-- =====================================================
-- Migration 131: Permissões RBAC para Currículos
-- =====================================================
-- Adiciona permissões para gerenciamento de currículos
-- =====================================================

-- Adicionar permissões para currículos
INSERT INTO public.permissions (key, modulo_key, recurso, acao, descricao, requires_approval) VALUES
    -- Gestão - Currículos
    ('gestao.curriculos.view', 'gestao', 'curriculos', 'view', 'Visualizar currículos de profissionais disponíveis', false),
    ('gestao.curriculos.detalhes', 'gestao', 'curriculos', 'detalhes', 'Visualizar detalhes completos do currículo', false),
    ('gestao.curriculos.contatar', 'gestao', 'curriculos', 'contatar', 'Contatar profissional para vaga', false)
ON CONFLICT (key) DO NOTHING;

-- Associar permissões ao perfil de Administrador (gestor)
-- O perfil Administrador deve ter acesso completo a todos os módulos de gestão
INSERT INTO public.perfil_permissions (perfil_id, permission_id, scope_type)
SELECT 
    p.id as perfil_id,
    perm.id as permission_id,
    'toda_escola' as scope_type
FROM public.perfis_acesso p
CROSS JOIN public.permissions perm
WHERE p.nome = 'Administrador'
AND p.tenant_id IS NOT NULL
AND perm.key IN (
    'gestao.curriculos.view',
    'gestao.curriculos.detalhes',
    'gestao.curriculos.contatar'
)
ON CONFLICT (perfil_id, permission_id) DO NOTHING;

-- Comentários
COMMENT ON COLUMN permissions.modulo_key IS 'Módulo ao qual a permissão pertence: dashboard, academico, comunicacao, financeiro, gestao, configuracoes';
