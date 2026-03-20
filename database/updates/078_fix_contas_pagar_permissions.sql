-- ==============================================================================
-- 🔧 FIX: CORRIGIR PERMISSÕES CONTAS A PAGAR
-- Problema: Migration 067 criou RLS exigindo permissão que não existe
-- Solução: Cadastrar permissões de Contas a Pagar no sistema RBAC
-- ==============================================================================

-- 1. Cadastrar as permissões de Contas a Pagar (se não existirem)
INSERT INTO public.permissions (key, modulo_key, recurso, acao, descricao)
VALUES 
    ('financeiro.contas_pagar.view', 'financeiro', 'contas_pagar', 'view', 'Visualizar contas a pagar'),
    ('financeiro.contas_pagar.create', 'financeiro', 'contas_pagar', 'create', 'Criar novas contas a pagar'),
    ('financeiro.contas_pagar.edit', 'financeiro', 'contas_pagar', 'edit', 'Editar contas a pagar'),
    ('financeiro.contas_pagar.pay', 'financeiro', 'contas_pagar', 'pay', 'Registrar pagamento de contas'),
    ('financeiro.contas_pagar.delete', 'financeiro', 'contas_pagar', 'delete', 'Excluir contas a pagar')
ON CONFLICT (key) DO NOTHING;

-- 2. Atualizar a política RLS para usar permissões existentes
-- Se não tiver a permissão view, usa as permissões específicas como fallback
DROP POLICY IF EXISTS "rbac_contas_pagar_select" ON public.contas_pagar;
CREATE POLICY "rbac_contas_pagar_select" ON public.contas_pagar FOR SELECT
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (
        public.has_permission('financeiro.contas_pagar.view')
        OR public.has_permission('financeiro.contas_pagar.create')
        OR public.has_permission('financeiro.contas_pagar.edit')
        OR public.has_permission('financeiro.contas_pagar.pay')
        OR public.has_permission('financeiro.contas_pagar.delete')
    )
);

-- 3. Garantir que gestores tenham acesso total
-- Vincular permissões ao perfil de Gestor (se existir)
DO $$
DECLARE
    v_gestor_perfil_id UUID;
BEGIN
    -- Tentar encontrar o perfil de Gestor
    SELECT id INTO v_gestor_perfil_id 
    FROM public.perfis_acesso 
    WHERE nome ILIKE '%gestor%' 
    LIMIT 1;
    
    -- Se encontrou, vincular permissões
    IF v_gestor_perfil_id IS NOT NULL THEN
        INSERT INTO public.perfil_permissions (perfil_id, permission_id, scope_type)
        SELECT 
            v_gestor_perfil_id,
            p.id,
            'toda_escola'::scope_type
        FROM public.permissions p
        WHERE p.key LIKE 'financeiro.contas_pagar.%'
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 4. Script de verificação (opcional - para debug)
-- SELECT * FROM public.permissions WHERE key LIKE 'financeiro.contas_pagar%';
-- SELECT * FROM public.perfil_permissions pp
-- JOIN public.perfis_acesso pa ON pa.id = pp.perfil_id
-- JOIN public.permissions p ON p.id = pp.permission_id
-- WHERE p.key LIKE 'financeiro.contas_pagar%';
