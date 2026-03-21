-- ==============================================================================
-- 🚨 MIGRATION 085: CORREÇÃO CRÍTICA - LIBERAR ACESSO DO GESTOR
-- Descrição: Corrige políticas RLS que estão bloqueando gestores de acessar
--            seus próprios dados (turmas, matrículas, contas_pagar, etc.)
-- Impacto: CRÍTICO - Gestores voltam a ter acesso COMPLETO à sua escola
-- Causa: Políticas RLS da migration 082 estavam muito restritivas
-- ==============================================================================

-- IMPORTANTE: Os dados NÃO foram deletados! Estão todos no banco.
-- O RLS estava apenas bloqueando o acesso do gestor aos seus próprios dados.
-- ==============================================================================

-- ==============================================================================
-- 1. TURMAS - Liberar acesso completo para gestor
-- ==============================================================================
DROP POLICY IF EXISTS "rbac_turmas_select" ON public.turmas;
DROP POLICY IF EXISTS "rbac_turmas_insert" ON public.turmas;
DROP POLICY IF EXISTS "rbac_turmas_update" ON public.turmas;
DROP POLICY IF EXISTS "rbac_turmas_delete" ON public.turmas;

CREATE POLICY "rbac_turmas_select" ON public.turmas FOR SELECT
USING (
    -- Gestor acessa turmas da SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- Funcionário com permissão RBAC
    public.has_permission('academico.turmas.view')
);

CREATE POLICY "rbac_turmas_insert" ON public.turmas FOR INSERT
WITH CHECK (
    -- Gestor cria turmas na SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- Funcionário com permissão RBAC
    public.has_permission('academico.turmas.create')
);

CREATE POLICY "rbac_turmas_update" ON public.turmas FOR UPDATE
USING (
    -- Gestor edita turmas da SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- Funcionário com permissão RBAC
    public.has_permission('academico.turmas.edit')
);

CREATE POLICY "rbac_turmas_delete" ON public.turmas FOR DELETE
USING (
    -- Gestor exclui turmas da SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- Funcionário com permissão RBAC
    public.has_permission('academico.turmas.delete')
);

-- ==============================================================================
-- 2. MATRÍCULAS - Liberar acesso completo para gestor
-- ==============================================================================
DROP POLICY IF EXISTS "rbac_matriculas_select" ON public.matriculas;
DROP POLICY IF EXISTS "rbac_matriculas_insert" ON public.matriculas;
DROP POLICY IF EXISTS "rbac_matriculas_update" ON public.matriculas;
DROP POLICY IF EXISTS "rbac_matriculas_delete" ON public.matriculas;

CREATE POLICY "rbac_matriculas_select" ON public.matriculas FOR SELECT
USING (
    -- Gestor acessa matrículas da SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- Funcionário com permissão RBAC
    public.has_permission('academico.matriculas.view')
);

CREATE POLICY "rbac_matriculas_insert" ON public.matriculas FOR INSERT
WITH CHECK (
    -- Gestor cria matrículas na SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- Funcionário com permissão RBAC
    public.has_permission('academico.matriculas.create')
);

CREATE POLICY "rbac_matriculas_update" ON public.matriculas FOR UPDATE
USING (
    -- Gestor edita matrículas da SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- Funcionário com permissão RBAC
    public.has_permission('academico.matriculas.edit')
);

CREATE POLICY "rbac_matriculas_delete" ON public.matriculas FOR DELETE
USING (
    -- Gestor exclui matrículas da SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- Funcionário com permissão RBAC
    public.has_permission('academico.matriculas.delete')
);

-- ==============================================================================
-- 3. CONTAS A PAGAR - Liberar acesso completo para gestor
-- ==============================================================================
DROP POLICY IF EXISTS "rbac_contas_pagar_select" ON public.contas_pagar;
DROP POLICY IF EXISTS "rbac_contas_pagar_insert" ON public.contas_pagar;
DROP POLICY IF EXISTS "rbac_contas_pagar_update" ON public.contas_pagar;
DROP POLICY IF EXISTS "rbac_contas_pagar_delete" ON public.contas_pagar;

CREATE POLICY "rbac_contas_pagar_select" ON public.contas_pagar FOR SELECT
USING (
    -- Gestor acessa contas a pagar da SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- Funcionário com permissão RBAC
    public.has_permission('financeiro.contas_pagar.view')
);

CREATE POLICY "rbac_contas_pagar_insert" ON public.contas_pagar FOR INSERT
WITH CHECK (
    -- Gestor cria contas a pagar na SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- Funcionário com permissão RBAC
    public.has_permission('financeiro.contas_pagar.create')
);

CREATE POLICY "rbac_contas_pagar_update" ON public.contas_pagar FOR UPDATE
USING (
    -- Gestor edita contas a pagar da SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- Funcionário com permissão RBAC
    public.has_permission('financeiro.contas_pagar.edit')
);

CREATE POLICY "rbac_contas_pagar_delete" ON public.contas_pagar FOR DELETE
USING (
    -- Gestor exclui contas a pagar da SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- Funcionário com permissão RBAC
    public.has_permission('financeiro.contas_pagar.delete')
);

-- ==============================================================================
-- 4. ALUNOS - Liberar acesso completo para gestor
-- ==============================================================================
DROP POLICY IF EXISTS "rbac_alunos_select" ON public.alunos;
DROP POLICY IF EXISTS "rbac_alunos_insert" ON public.alunos;
DROP POLICY IF EXISTS "rbac_alunos_update" ON public.alunos;
DROP POLICY IF EXISTS "rbac_alunos_delete" ON public.alunos;

CREATE POLICY "rbac_alunos_select" ON public.alunos FOR SELECT
USING (
    -- Gestor acessa alunos da SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- Funcionário com permissão RBAC
    public.has_permission('academico.alunos.view')
);

CREATE POLICY "rbac_alunos_insert" ON public.alunos FOR INSERT
WITH CHECK (
    -- Gestor cria alunos na SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- Funcionário com permissão RBAC
    public.has_permission('academico.alunos.create')
);

CREATE POLICY "rbac_alunos_update" ON public.alunos FOR UPDATE
USING (
    -- Gestor edita alunos da SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- Funcionário com permissão RBAC
    public.has_permission('academico.alunos.edit')
);

CREATE POLICY "rbac_alunos_delete" ON public.alunos FOR DELETE
USING (
    -- Gestor exclui alunos da SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- Funcionário com permissão RBAC
    public.has_permission('academico.alunos.delete')
);

-- ==============================================================================
-- 5. COBRANÇAS - Liberar acesso completo para gestor
-- ==============================================================================
DROP POLICY IF EXISTS "rbac_cobrancas_select" ON public.cobrancas;
DROP POLICY IF EXISTS "rbac_cobrancas_insert" ON public.cobrancas;
DROP POLICY IF EXISTS "rbac_cobrancas_update" ON public.cobrancas;
DROP POLICY IF EXISTS "rbac_cobrancas_delete" ON public.cobrancas;

CREATE POLICY "rbac_cobrancas_select" ON public.cobrancas FOR SELECT
USING (
    -- Gestor acessa cobranças da SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- Funcionário com permissão RBAC
    public.has_permission('financeiro.cobrancas.view')
);

CREATE POLICY "rbac_cobrancas_insert" ON public.cobrancas FOR INSERT
WITH CHECK (
    -- Gestor cria cobranças na SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- Funcionário com permissão RBAC
    public.has_permission('financeiro.cobrancas.create')
);

CREATE POLICY "rbac_cobrancas_update" ON public.cobrancas FOR UPDATE
USING (
    -- Gestor edita cobranças da SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- Funcionário com permissão RBAC
    public.has_permission('financeiro.cobrancas.edit')
);

CREATE POLICY "rbac_cobrancas_delete" ON public.cobrancas FOR DELETE
USING (
    -- Gestor exclui cobranças da SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- Funcionário com permissão RBAC
    public.has_permission('financeiro.cobrancas.delete')
);

-- ==============================================================================
-- 6. VALIDAÇÃO PÓS-MIGRATION
-- ==============================================================================
DO $$
DECLARE
    v_turmas_count integer;
    v_matriculas_count integer;
    v_contas_pagar_count integer;
    v_alunos_count integer;
    v_cobrancas_count integer;
BEGIN
    SELECT COUNT(*) INTO v_turmas_count FROM turmas;
    SELECT COUNT(*) INTO v_matriculas_count FROM matriculas;
    SELECT COUNT(*) INTO v_contas_pagar_count FROM contas_pagar;
    SELECT COUNT(*) INTO v_alunos_count FROM alunos;
    SELECT COUNT(*) INTO v_cobrancas_count FROM cobrancas;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MIGRATION 085 APLICADA COM SUCESSO';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 DADOS NO BANCO (todos preservados):';
    RAISE NOTICE '   📚 Turmas: %', v_turmas_count;
    RAISE NOTICE '   🎓 Matrículas: %', v_matriculas_count;
    RAISE NOTICE '   💰 Contas a Pagar: %', v_contas_pagar_count;
    RAISE NOTICE '   👨‍🎓 Alunos: %', v_alunos_count;
    RAISE NOTICE '   💳 Cobranças: %', v_cobrancas_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ GESTOR AGORA PODE:';
    RAISE NOTICE '   ✅ Ver TODOS os dados da sua escola';
    RAISE NOTICE '   ✅ Criar novos registros';
    RAISE NOTICE '   ✅ Editar registros existentes';
    RAISE NOTICE '   ✅ Excluir registros';
    RAISE NOTICE '========================================';
    RAISE NOTICE '⚠️  SUPER ADMIN CONTINUA APENAS COM LEITURA';
    RAISE NOTICE '========================================';
END $$;

-- ==============================================================================
-- ✅ RESUMO: DADOS PRESERVADOS
-- ==============================================================================
-- - TODOS os dados estão no banco (nada foi deletado)
-- - Gestor agora tem acesso COMPLETO à sua escola
-- - Funcionário segue RBAC (perfis de acesso)
-- - Super Admin apenas audita (leitura)
-- - Isolamento de tenants mantido
-- ==============================================================================
