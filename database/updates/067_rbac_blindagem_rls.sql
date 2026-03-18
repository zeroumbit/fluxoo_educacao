-- ==============================================================================
-- 🚀 MIGRATION 067: BLINDAGEM DE RLS (RBAC LAYER)
-- Descrição: Implementa validação de permissões diretamente no banco de dados.
-- ==============================================================================

-- 1. Helper Function: Verificar permissão de forma performática
CREATE OR REPLACE FUNCTION public.has_permission(p_permission_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_metadata JSONB := auth.jwt() -> 'user_metadata';
BEGIN
    -- 1.1 Super Admin Bypass (Apenas via Claim is_super_admin)
    IF (v_user_metadata ->> 'is_super_admin')::boolean = true THEN
        RETURN TRUE;
    END IF;

    -- 1.3 RBAC Resolve
    RETURN EXISTS (
        SELECT 1 FROM public.fn_resolve_user_permissions(auth.uid())
        WHERE permission_key = p_permission_key
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ativar RLS nas tabelas principais (caso não estejam)
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.almoxarifado_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.almoxarifado_movimentacoes ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Blindagem (Exemplos)

-- ALUNOS
DROP POLICY IF EXISTS "rbac_alunos_select" ON public.alunos;
CREATE POLICY "rbac_alunos_select" ON public.alunos FOR SELECT
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('academico.alunos.view')
);

DROP POLICY IF EXISTS "rbac_alunos_insert" ON public.alunos;
CREATE POLICY "rbac_alunos_insert" ON public.alunos FOR INSERT
WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('academico.alunos.create')
);

-- FINANCEIRO (COBRANÇAS)
DROP POLICY IF EXISTS "rbac_cobrancas_select" ON public.cobrancas;
CREATE POLICY "rbac_cobrancas_select" ON public.cobrancas FOR SELECT
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('financeiro.cobrancas.view')
);

-- FINANCEIRO (CONTAS A PAGAR)
DROP POLICY IF EXISTS "rbac_contas_pagar_select" ON public.contas_pagar;
CREATE POLICY "rbac_contas_pagar_select" ON public.contas_pagar FOR SELECT
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('financeiro.contas_pagar.view')
);

-- ALMOXARIFADO
DROP POLICY IF EXISTS "rbac_almoxarifado_view" ON public.almoxarifado_itens;
CREATE POLICY "rbac_almoxarifado_view" ON public.almoxarifado_itens FOR SELECT
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('gestao.almoxarifado.view')
);

DROP POLICY IF EXISTS "rbac_almoxarifado_manage" ON public.almoxarifado_itens;
CREATE POLICY "rbac_almoxarifado_manage" ON public.almoxarifado_itens FOR ALL
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('gestao.almoxarifado.manage')
);
