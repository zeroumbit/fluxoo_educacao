-- ==============================================================================
-- 🛡️ MIGRATION 153: CORREÇÃO DE RECURSÃO INFINITA EM RLS
-- Descrição: Remove subconsultas diretas entre tabelas com dependências circulares
--            (escolas <-> usuarios_sistema) que causavam erro 500 no Supabase.
-- ==============================================================================

-- 1. CORREÇÃO EM 'escolas' (Removendo subquery para usuarios_sistema)
DROP POLICY IF EXISTS "Usuários veem sua própria escola" ON public.escolas;
CREATE POLICY "Usuários veem sua própria escola" ON public.escolas
FOR SELECT TO authenticated
USING (
    id::text = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::text
    OR (auth.jwt() ->> 'role' = 'super_admin')
    OR public.has_permission('escolas.view')
);

-- 2. CORREÇÃO EM 'filiais' (Removendo subquery para usuarios_sistema)
DROP POLICY IF EXISTS "Usuários veem filiais do seu tenant" ON public.filiais;
CREATE POLICY "Usuários veem filiais do seu tenant" ON public.filiais
FOR ALL TO authenticated
USING (
    tenant_id::text = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::text
    OR (auth.jwt() ->> 'role' = 'super_admin')
    OR public.has_permission('config.escola.manage')
);

-- 3. AJUSTE EM 'responsaveis' (Garantir que portal funcione)
DROP POLICY IF EXISTS "Responsáveis veem seus próprios dados" ON public.responsaveis;
CREATE POLICY "Responsáveis veem seus próprios dados" ON public.responsaveis
FOR ALL TO authenticated
USING (
    id = auth.uid() 
    OR (auth.jwt() ->> 'role' = 'super_admin')
    OR public.has_permission('academico.responsaveis.view')
);

-- 4. AJUSTE EM 'assinaturas' E 'faturas'
DROP POLICY IF EXISTS "Usuários veem suas assinaturas" ON public.assinaturas;
CREATE POLICY "Usuários veem suas assinaturas" ON public.assinaturas
FOR SELECT TO authenticated
USING (
    tenant_id::text = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::text
    OR (auth.jwt() ->> 'role' = 'super_admin')
);

DROP POLICY IF EXISTS "Usuários veem suas faturas" ON public.faturas;
CREATE POLICY "Usuários veem suas faturas" ON public.faturas
FOR SELECT TO authenticated
USING (
    tenant_id::text = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::text
    OR (auth.jwt() ->> 'role' = 'super_admin')
);

-- 5. ADICIONAR RLS EM 'alunos' (Que estava faltando hardening)
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rbac_alunos_select_v2" ON public.alunos;
CREATE POLICY "rbac_alunos_select_v2" ON public.alunos FOR SELECT
USING (
    tenant_id::text = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::text
    OR (auth.jwt() ->> 'role' = 'responsavel' AND EXISTS (
        SELECT 1 FROM public.aluno_responsavel ar 
        WHERE ar.aluno_id = public.alunos.id 
        AND ar.responsavel_id = (SELECT id FROM public.responsaveis WHERE user_id = auth.uid() LIMIT 1)
    ))
    OR (auth.jwt() ->> 'role' = 'super_admin')
    OR public.has_permission('academico.alunos.view')
);

-- NOTA: O uso de public.has_permission() é seguro aqui pois a função é SECURITY DEFINER 
-- e não disparará o RLS das tabelas que ela consulta internamente.
