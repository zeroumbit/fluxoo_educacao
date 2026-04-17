-- ==============================================================================
-- 🛡️ MIGRATION 154: BLINDAGEM RLS DEFINITIVA (ANTI-RECURSÃO)
-- Descrição: Implementa helpers seguros para evitar loops entre RLS e RBAC.
--            Remove dependências de public.has_permission() em tabelas base.
-- ==============================================================================

-- 1. HELPER: BUSCAR TENANT_ID DE FORMA SEGURA (Evita recursão)
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(
        COALESCE(
            auth.jwt()->'user_metadata'->>'tenant_id',
            auth.jwt()->'app_metadata'->>'tenant_id',
            auth.jwt()->>'tenant_id'
        ),
        ''
    )::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. HELPER: VERIFICAR SE É SUPER_ADMIN SEM RECURSÃO
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean, false)
        OR COALESCE((auth.jwt() ->> 'is_super_admin')::boolean, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RECONSTRUÇÃO DAS POLÍTICAS (SEM HAS_PERMISSION EM TABELAS INFRA)

-- ESCOLAS
DROP POLICY IF EXISTS "Usuários veem sua própria escola" ON public.escolas;
CREATE POLICY "RLS_Escolas_Isolation" ON public.escolas
FOR SELECT TO authenticated
USING (
    id = public.get_my_tenant_id()
    OR public.is_super_admin()
    OR gestor_user_id = auth.uid()
);

-- FILIAIS
DROP POLICY IF EXISTS "Usuários veem filiais do seu tenant" ON public.filiais;
CREATE POLICY "RLS_Filiais_Isolation" ON public.filiais
FOR ALL TO authenticated
USING (
    tenant_id = public.get_my_tenant_id()
    OR public.is_super_admin()
);

-- RESPONSAVEIS
DROP POLICY IF EXISTS "Responsáveis veem seus próprios dados" ON public.responsaveis;
CREATE POLICY "RLS_Responsaveis_Isolation" ON public.responsaveis
FOR ALL TO authenticated
USING (
    id = auth.uid() 
    OR (auth.jwt() ->> 'role' = 'responsavel' AND user_id = auth.uid())
    OR public.is_super_admin()
);

-- ASSINATURAS E FATURAS
DROP POLICY IF EXISTS "Usuários veem suas assinaturas" ON public.assinaturas;
CREATE POLICY "RLS_Assinaturas_Isolation" ON public.assinaturas
FOR SELECT TO authenticated
USING (
    tenant_id = public.get_my_tenant_id()
    OR public.is_super_admin()
);

DROP POLICY IF EXISTS "Usuários veem suas faturas" ON public.faturas;
CREATE POLICY "RLS_Faturas_Isolation" ON public.faturas
FOR SELECT TO authenticated
USING (
    tenant_id = public.get_my_tenant_id()
    OR public.is_super_admin()
);

-- 4. ALUNOS (Simplificação para evitar loops em views como radar_evasao)
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rbac_alunos_select_v2" ON public.alunos;
DROP POLICY IF EXISTS "rbac_alunos_select" ON public.alunos;
DROP POLICY IF EXISTS "RP_Alunos_Pais" ON public.alunos;
DROP POLICY IF EXISTS "RP_Alunos_Gestor" ON public.alunos;

CREATE POLICY "RLS_Alunos_Staff" ON public.alunos FOR SELECT
USING (
    tenant_id = public.get_my_tenant_id()
    OR public.is_super_admin()
);

CREATE POLICY "RLS_Alunos_Portal" ON public.alunos FOR SELECT
USING (
    (auth.jwt() ->> 'role' = 'responsavel') 
    AND id IN (
        SELECT ar.aluno_id FROM public.aluno_responsavel ar 
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        WHERE r.user_id = auth.uid()
    )
);

-- 5. REVISÃO DO HAS_PERMISSION (Para garantir que não use RLS circular)
-- Nota: has_permission é SECURITY DEFINER, então ele ignora RLS ao consultar usuarios_sistema.
-- O problema era quando a TABELA ESCOLA (usada pelo RLS de usuarios_sistema) chamava has_permission.
-- Ao remover has_permission das políticas de 'escolas', o ciclo foi quebrado definitivamente.

-- 6. DISCIPLINAS (Consertar o erro 500 em disciplinas)
ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "disciplinas_select_isolation" ON public.disciplinas;
CREATE POLICY "disciplinas_select_isolation" ON public.disciplinas FOR SELECT
USING (
    tenant_id IS NULL 
    OR tenant_id = public.get_my_tenant_id()
    OR public.is_super_admin()
);

-- Comentário Final
COMMENT ON FUNCTION public.get_my_tenant_id() IS 'Helper para RLS que evita recursão infinita ao não consultar tabelas dependentes.';
