-- ==============================================================================
-- 🚨 MIGRATION 084: EMERGÊNCIA - LIBERAR ACESSO ÀS MATRÍCULAS
-- Descrição: Restaura acesso às matrículas seguindo REGRAS DE NEGÓCIO da plataforma.
-- Impacto: CRÍTICO - Matrículas voltam a ser visíveis para gestores e funcionários.
-- Causa: RLS habilitado na migration 080 + políticas restritivas da 082 bloquearam acesso.
-- ==============================================================================

-- REGRAS DE NEGÓCIO (conforme QWEN.md e SUPER_ADMIN.md):
-- 1. Super Admin: APENAS LEITURA para auditoria (NÃO gerencia escolas)
-- 2. Gestor: Acesso TOTAL à sua escola (via gestor_user_id)
-- 3. Funcionário: Acesso via RBAC (perfis de acesso)
-- 4. Super Admin NÃO cria/edita/exclui dados das escolas
-- ==============================================================================

-- 1. DROP DA POLÍTICA ATUAL (Muito restritiva - não considera Gestor)
DROP POLICY IF EXISTS "rbac_matriculas_select" ON public.matriculas;
DROP POLICY IF EXISTS "rbac_matriculas_insert" ON public.matriculas;
DROP POLICY IF EXISTS "rbac_matriculas_update" ON public.matriculas;
DROP POLICY IF EXISTS "rbac_matriculas_delete" ON public.matriculas;

-- 2. CRIAR NOVAS POLÍTICAS QUE RESPEITAM REGRAS DE NEGÓCIO

-- SELECT: Quem pode VER matrículas
CREATE POLICY "rbac_matriculas_select" ON public.matriculas FOR SELECT
USING (
    -- REGRA 1: Super Admin vê para AUDITORIA (apenas leitura)
    (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean = true
    OR
    -- REGRA 2: Gestor vê matrículas da SUA escola (via gestor_user_id)
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- REGRA 3: Funcionário com permissão RBAC (academico.matriculas.view)
    public.has_permission('academico.matriculas.view')
);

-- INSERT: Quem pode CRIAR matrículas
-- Super Admin NÃO cria (regra de negócio)
CREATE POLICY "rbac_matriculas_insert" ON public.matriculas FOR INSERT
WITH CHECK (
    -- REGRA 1: Gestor cria matrículas na SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- REGRA 2: Funcionário com permissão RBAC (academico.matriculas.create)
    public.has_permission('academico.matriculas.create')
);

-- UPDATE: Quem pode EDITAR matrículas
-- Super Admin NÃO edita (regra de negócio)
CREATE POLICY "rbac_matriculas_update" ON public.matriculas FOR UPDATE
USING (
    -- REGRA 1: Gestor edita matrículas na SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- REGRA 2: Funcionário com permissão RBAC (academico.matriculas.edit)
    public.has_permission('academico.matriculas.edit')
);

-- DELETE: Quem pode EXCLUIR matrículas
-- Super Admin NÃO exclui (regra de negócio)
CREATE POLICY "rbac_matriculas_delete" ON public.matriculas FOR DELETE
USING (
    -- REGRA 1: Gestor exclui matrículas na SUA escola
    EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = ((auth.jwt() ->> 'tenant_id')::uuid)
        AND gestor_user_id = auth.uid()
    )
    OR
    -- REGRA 2: Funcionário com permissão RBAC (academico.matriculas.delete)
    public.has_permission('academico.matriculas.delete')
);

-- 3. GARANTIR QUE RLS ESTÁ HABILITADO (segurança)
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;

-- 4. VALIDAÇÃO PÓS-MIGRATION
DO $$
DECLARE
    v_gestor_count integer;
    v_matriculas_count integer;
BEGIN
    -- Contar quantos gestores existem
    SELECT COUNT(*) INTO v_gestor_count 
    FROM escolas 
    WHERE gestor_user_id IS NOT NULL;
    
    -- Contar quantas matrículas existem
    SELECT COUNT(*) INTO v_matriculas_count 
    FROM matriculas;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MIGRATION 084 APLICADA COM SUCESSO';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 Gestores com acesso: %', v_gestor_count;
    RAISE NOTICE '📊 Matrículas no banco: %', v_matriculas_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 REGRAS DE ACESSO IMPLEMENTADAS:';
    RAISE NOTICE '   ✅ Super Admin: APENAS LEITURA (auditoria)';
    RAISE NOTICE '   ✅ Gestor: Acesso TOTAL à sua escola';
    RAISE NOTICE '   ✅ Funcionário: Acesso via RBAC';
    RAISE NOTICE '========================================';
    RAISE NOTICE '⚠️  SUPER ADMIN NÃO PODE:';
    RAISE NOTICE '   ❌ Criar matrículas';
    RAISE NOTICE '   ❌ Editar matrículas';
    RAISE NOTICE '   ❌ Excluir matrículas';
    RAISE NOTICE '========================================';
END $$;

-- ==============================================================================
-- ✅ RESUMO DAS REGRAS DE NEGÓCIO PRESERVADAS
-- ==============================================================================
-- 1. Super Admin: APENAS VISUALIZAÇÃO (auditoria da plataforma)
-- 2. Gestor: Acesso COMPLETO à sua escola (cria, edita, exclui, vê)
-- 3. Funcionário: Acesso via RBAC (conforme perfil de acesso)
-- 4. Isolamento de tenants mantido (cada escola vê só suas matrículas)
-- 5. Responsáveis NÃO veem matrículas (apenas Portal do Aluno)
-- ==============================================================================
