-- ==============================================================================
-- 🚀 MIGRATION 082: HARDENING RBAC - VALIDAÇÃO DE GESTOR NO BANCO
-- Descrição: Adiciona validação explícita de gestor na função has_permission().
-- Impacto: SEGURANÇA - Gestor agora é validado no banco, não só no frontend.
-- Regra de Negócio: Gestor tem acesso total à sua escola (via gestor_user_id).
-- ==============================================================================

-- 1. ATUALIZAR FUNÇÃO has_permission() PARA VALIDAR GESTOR EXPLICITAMENTE
CREATE OR REPLACE FUNCTION public.has_permission(p_permission_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_metadata JSONB := auth.jwt() -> 'user_metadata';
    v_user_id UUID := auth.uid();
    v_tenant_id TEXT;
    v_is_gestor BOOLEAN;
BEGIN
    -- 1. Validar usuário autenticado
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- 2. Super Admin Bypass (Apenas via Claim is_super_admin)
    IF (v_user_metadata ->> 'is_super_admin')::boolean = true THEN
        RETURN TRUE;
    END IF;

    -- 3. Obter tenant_id do usuário
    v_tenant_id := v_user_metadata ->> 'tenant_id';

    -- 4. Verificar se é gestor da escola (validação no banco)
    SELECT EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id::text = v_tenant_id
        AND gestor_user_id = v_user_id
    ) INTO v_is_gestor;

    -- 5. Gestor tem acesso total na sua própria escola
    IF v_is_gestor THEN
        RETURN TRUE;
    END IF;

    -- 6. Funcionário: Validar permissão específica via RBAC
    RETURN EXISTS (
        SELECT 1 FROM public.fn_resolve_user_permissions(v_user_id)
        WHERE permission_key = p_permission_key
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ATUALIZAR POLÍTICAS RLS PARA USAR has_permission() EM TODAS AS TABELAS CRÍTICAS

-- ALUNOS (atualizar política existente)
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

DROP POLICY IF EXISTS "rbac_alunos_update" ON public.alunos;
CREATE POLICY "rbac_alunos_update" ON public.alunos FOR UPDATE
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('academico.alunos.edit')
);

DROP POLICY IF EXISTS "rbac_alunos_delete" ON public.alunos;
CREATE POLICY "rbac_alunos_delete" ON public.alunos FOR DELETE
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('academico.alunos.delete')
);

-- COBRANÇAS
DROP POLICY IF EXISTS "rbac_cobrancas_select" ON public.cobrancas;
CREATE POLICY "rbac_cobrancas_select" ON public.cobrancas FOR SELECT
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('financeiro.cobrancas.view')
);

DROP POLICY IF EXISTS "rbac_cobrancas_insert" ON public.cobrancas;
CREATE POLICY "rbac_cobrancas_insert" ON public.cobrancas FOR INSERT
WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('financeiro.cobrancas.create')
);

DROP POLICY IF EXISTS "rbac_cobrancas_update" ON public.cobrancas;
CREATE POLICY "rbac_cobrancas_update" ON public.cobrancas FOR UPDATE
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('financeiro.cobrancas.edit')
);

DROP POLICY IF EXISTS "rbac_cobrancas_delete" ON public.cobrancas;
CREATE POLICY "rbac_cobrancas_delete" ON public.cobrancas FOR DELETE
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('financeiro.cobrancas.delete')
);

-- CONTAS A PAGAR
DROP POLICY IF EXISTS "rbac_contas_pagar_select" ON public.contas_pagar;
CREATE POLICY "rbac_contas_pagar_select" ON public.contas_pagar FOR SELECT
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('financeiro.contas_pagar.view')
);

DROP POLICY IF EXISTS "rbac_contas_pagar_insert" ON public.contas_pagar;
CREATE POLICY "rbac_contas_pagar_insert" ON public.contas_pagar FOR INSERT
WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('financeiro.contas_pagar.create')
);

DROP POLICY IF EXISTS "rbac_contas_pagar_update" ON public.contas_pagar;
CREATE POLICY "rbac_contas_pagar_update" ON public.contas_pagar FOR UPDATE
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('financeiro.contas_pagar.edit')
);

DROP POLICY IF EXISTS "rbac_contas_pagar_delete" ON public.contas_pagar;
CREATE POLICY "rbac_contas_pagar_delete" ON public.contas_pagar FOR DELETE
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('financeiro.contas_pagar.delete')
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

-- MATRÍCULAS
DROP POLICY IF EXISTS "rbac_matriculas_select" ON public.matriculas;
CREATE POLICY "rbac_matriculas_select" ON public.matriculas FOR SELECT
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('academico.matriculas.view')
);

DROP POLICY IF EXISTS "rbac_matriculas_insert" ON public.matriculas;
CREATE POLICY "rbac_matriculas_insert" ON public.matriculas FOR INSERT
WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('academico.matriculas.create')
);

DROP POLICY IF EXISTS "rbac_matriculas_update" ON public.matriculas;
CREATE POLICY "rbac_matriculas_update" ON public.matriculas FOR UPDATE
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('academico.matriculas.edit')
);

-- PLANOS DE AULA
DROP POLICY IF EXISTS "rbac_planos_aula_select" ON public.planos_aula;
CREATE POLICY "rbac_planos_aula_select" ON public.planos_aula FOR SELECT
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('academico.planos_aula.view')
);

DROP POLICY IF EXISTS "rbac_planos_aula_manage" ON public.planos_aula;
CREATE POLICY "rbac_planos_aula_manage" ON public.planos_aula FOR ALL
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('academico.planos_aula.manage')
);

-- ATIVIDADES
DROP POLICY IF EXISTS "rbac_atividades_select" ON public.atividades;
CREATE POLICY "rbac_atividades_select" ON public.atividades FOR SELECT
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('academico.atividades.view')
);

DROP POLICY IF EXISTS "rbac_atividades_manage" ON public.atividades;
CREATE POLICY "rbac_atividades_manage" ON public.atividades FOR ALL
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('academico.atividades.manage')
);

-- MURAL DE AVISOS
DROP POLICY IF EXISTS "rbac_mural_select" ON public.mural_avisos;
CREATE POLICY "rbac_mural_select" ON public.mural_avisos FOR SELECT
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('comunicacao.mural.view')
);

DROP POLICY IF EXISTS "rbac_mural_manage" ON public.mural_avisos;
CREATE POLICY "rbac_mural_manage" ON public.mural_avisos FOR ALL
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('comunicacao.mural.manage')
);

-- FREQUÊNCIA
DROP POLICY IF EXISTS "rbac_frequencia_select" ON public.frequencias;
CREATE POLICY "rbac_frequencia_select" ON public.frequencias FOR SELECT
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('academico.frequencia.view')
);

DROP POLICY IF EXISTS "rbac_frequencia_manage" ON public.frequencias;
CREATE POLICY "rbac_frequencia_manage" ON public.frequencias FOR ALL
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('academico.frequencia.manage')
);

-- BOLETINS
DROP POLICY IF EXISTS "rbac_boletins_select" ON public.boletins;
CREATE POLICY "rbac_boletins_select" ON public.boletins FOR SELECT
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('academico.boletins.view')
);

DROP POLICY IF EXISTS "rbac_boletins_manage" ON public.boletins;
CREATE POLICY "rbac_boletins_manage" ON public.boletins FOR ALL
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('academico.boletins.manage')
);

-- DOCUMENTOS
DROP POLICY IF EXISTS "rbac_documentos_select" ON public.documento_templates;
CREATE POLICY "rbac_documentos_select" ON public.documento_templates FOR SELECT
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('documentos.templates.view')
);

DROP POLICY IF EXISTS "rbac_documentos_manage" ON public.documento_templates;
CREATE POLICY "rbac_documentos_manage" ON public.documento_templates FOR ALL
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('documentos.templates.manage')
);

-- AUTORIZAÇÕES
DROP POLICY IF EXISTS "rbac_autorizacoes_select" ON public.autorizacoes_modelos;
CREATE POLICY "rbac_autorizacoes_select" ON public.autorizacoes_modelos FOR SELECT
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('comunicacao.autorizacoes.view')
);

DROP POLICY IF EXISTS "rbac_autorizacoes_manage" ON public.autorizacoes_modelos;
CREATE POLICY "rbac_autorizacoes_manage" ON public.autorizacoes_modelos FOR ALL
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('comunicacao.autorizacoes.manage')
);

-- FUNCIONÁRIOS
DROP POLICY IF EXISTS "rbac_funcionarios_select" ON public.funcionarios;
CREATE POLICY "rbac_funcionarios_select" ON public.funcionarios FOR SELECT
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('gestao.funcionarios.view')
);

DROP POLICY IF EXISTS "rbac_funcionarios_manage" ON public.funcionarios;
CREATE POLICY "rbac_funcionarios_manage" ON public.funcionarios FOR ALL
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('gestao.funcionarios.manage')
);

-- ==============================================================================
-- ✅ RESUMO
-- ==============================================================================
-- - Função has_permission() agora valida gestor explicitamente no banco
-- - Gestor tem acesso total à sua escola (via gestor_user_id)
-- - Super Admin tem acesso total (via claim is_super_admin)
-- - Funcionário segue matriz RBAC (via fn_resolve_user_permissions)
-- - Todas as tabelas críticas com políticas RLS usando has_permission()
-- - Validação de permissões agora é feita NO BANCO, não só no frontend
-- ==============================================================================
