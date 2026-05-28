-- =============================================================================
-- 222 - Perfis Essenciais para Escola de Pequeno Porte
-- 
-- Cria perfis RBAC para todos os cargos base de uma escola pequena:
-- Diretor, Porteiro, Merendeira, Psicólogo, Nutricionista, Aux. Serv. Gerais
-- Corrige perfil Secretaria (remove permissões financeiras que não lhe competem)
-- Cria permissões para controle de merenda escolar
-- =============================================================================

-- =============================================================================
-- 1. NOVAS PERMISSÕES: Merenda Escolar
-- =============================================================================
INSERT INTO public.permissions (key, modulo_key, recurso, acao, descricao, requires_approval) VALUES
    ('academico.merenda.view', 'academico', 'merenda', 'view', 'Visualizar controle de merenda escolar', false),
    ('academico.merenda.manage', 'academico', 'merenda', 'manage', 'Gerenciar merenda escolar (cardápios, estoque alimentos)', false)
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- 2. CORREÇÃO: Secretaria - REMOVER permissões financeiras
-- =============================================================================
-- Secretario escolar NÃO deve ter acesso a financeiro (apenas matrículas, alunos, docs, mural)
DELETE FROM public.perfil_permissions pp
USING public.permissions p
WHERE pp.permission_id = p.id
  AND pp.perfil_id = 'a0000001-0000-0000-0000-000000000002'
  AND (p.key LIKE 'financeiro.%');

-- =============================================================================
-- 3. NOVOS PERFIS DE ACESSO
-- =============================================================================

-- Perfil 6: Diretor (acesso total à escola - mesmo nível do Administrador)
INSERT INTO public.perfis_acesso (id, tenant_id, nome, descricao, parent_perfil_id)
VALUES ('a0000001-0000-0000-0000-000000000006', NULL, 'Diretor', 'Acesso total à escola - diretor geral pode visualizar e gerenciar todas as áreas', NULL)
ON CONFLICT DO NOTHING;

-- Perfil 7: Porteiro / Vigia (acesso restrito à portaria)
INSERT INTO public.perfis_acesso (id, tenant_id, nome, descricao, parent_perfil_id)
VALUES ('a0000001-0000-0000-0000-000000000007', NULL, 'Porteiro', 'Acesso exclusivo à portaria - check-in/out de alunos e visitantes', NULL)
ON CONFLICT DO NOTHING;

-- Perfil 8: Merendeiro / Cozinheiro (merenda + almoxarifado)
INSERT INTO public.perfis_acesso (id, tenant_id, nome, descricao, parent_perfil_id)
VALUES ('a0000001-0000-0000-0000-000000000008', NULL, 'Merendeira', 'Acesso ao controle de merenda escolar e almoxarifado de alimentos', NULL)
ON CONFLICT DO NOTHING;

-- Perfil 9: Psicólogo Escolar (alunos + mural, SEM financeiro)
INSERT INTO public.perfis_acesso (id, tenant_id, nome, descricao, parent_perfil_id)
VALUES ('a0000001-0000-0000-0000-000000000009', NULL, 'Psicólogo Escolar', 'Acesso a dados de alunos para avaliação psicopedagógica e comunicados', NULL)
ON CONFLICT DO NOTHING;

-- Perfil 10: Nutricionista (dados dietéticos + merenda + almoxarifado)
INSERT INTO public.perfis_acesso (id, tenant_id, nome, descricao, parent_perfil_id)
VALUES ('a0000001-0000-0000-0000-00000000000a', NULL, 'Nutricionista', 'Acesso a dados nutricionais de alunos, merenda e almoxarifado de alimentos', NULL)
ON CONFLICT DO NOTHING;

-- Perfil 11: Auxiliar de Serviços Gerais (acesso mínimo - apenas dashboard)
INSERT INTO public.perfis_acesso (id, tenant_id, nome, descricao, parent_perfil_id)
VALUES ('a0000001-0000-0000-0000-00000000000b', NULL, 'Auxiliar de Serviços Gerais', 'Acesso mínimo ao sistema - apenas dashboard e perfil próprio', NULL)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 4. VINCULAR PERMISSÕES AOS NOVOS PERFIS
-- =============================================================================

-- 4.1. Diretor: TODAS as permissões (igual Administrador)
INSERT INTO public.perfil_permissions (perfil_id, permission_id, scope_type)
SELECT 'a0000001-0000-0000-0000-000000000006', p.id, 'toda_escola'::scope_type
FROM public.permissions p
ON CONFLICT (perfil_id, permission_id) DO NOTHING;

-- 4.2. Porteiro: apenas portaria + dashboard
INSERT INTO public.perfil_permissions (perfil_id, permission_id, scope_type)
SELECT 'a0000001-0000-0000-0000-000000000007', p.id, 'toda_escola'::scope_type
FROM public.permissions p
WHERE p.key IN (
    'dashboard.view',
    'academico.portaria.view',
    'academico.portaria.manage'
)
ON CONFLICT (perfil_id, permission_id) DO NOTHING;

-- 4.3. Merendeira: merenda + almoxarifado + dashboard
INSERT INTO public.perfil_permissions (perfil_id, permission_id, scope_type)
SELECT 'a0000001-0000-0000-0000-000000000008', p.id, 'toda_escola'::scope_type
FROM public.permissions p
WHERE p.key IN (
    'dashboard.view',
    'academico.merenda.view',
    'academico.merenda.manage',
    'gestao.almoxarifado.view',
    'gestao.almoxarifado.manage'
)
ON CONFLICT (perfil_id, permission_id) DO NOTHING;

-- 4.4. Psicólogo Escolar: alunos (view), turmas (view), mural
INSERT INTO public.perfil_permissions (perfil_id, permission_id, scope_type)
SELECT 'a0000001-0000-0000-0000-000000000009', p.id, 'toda_escola'::scope_type
FROM public.permissions p
WHERE p.key IN (
    'dashboard.view',
    'academico.alunos.view',
    'academico.turmas.view',
    'comunicacao.mural.view'
)
ON CONFLICT (perfil_id, permission_id) DO NOTHING;

-- 4.5. Nutricionista: alunos (view + diet), merenda, almoxarifado
INSERT INTO public.perfil_permissions (perfil_id, permission_id, scope_type)
SELECT 'a0000001-0000-0000-0000-00000000000a', p.id, 'toda_escola'::scope_type
FROM public.permissions p
WHERE p.key IN (
    'dashboard.view',
    'academico.alunos.view',
    'academico.merenda.view',
    'academico.merenda.manage',
    'gestao.almoxarifado.view',
    'gestao.almoxarifado.manage'
)
ON CONFLICT (perfil_id, permission_id) DO NOTHING;

-- 4.6. Auxiliar de Serviços Gerais: apenas dashboard
INSERT INTO public.perfil_permissions (perfil_id, permission_id, scope_type)
SELECT 'a0000001-0000-0000-0000-00000000000b', p.id, 'toda_escola'::scope_type
FROM public.permissions p
WHERE p.key IN (
    'dashboard.view'
)
ON CONFLICT (perfil_id, permission_id) DO NOTHING;
