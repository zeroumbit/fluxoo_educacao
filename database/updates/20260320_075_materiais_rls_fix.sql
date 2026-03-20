-- ==========================================================
-- CORREÇÃO: ROW LEVEL SECURITY PARA O MÓDULO DE MATERIAIS ESCOLARES
-- Resolve o erro 403 Forbidden e garante que os materiais apareçam
-- ==========================================================

-- 1. MATERIAIS_ESCOLARES
DROP POLICY IF EXISTS "Leitura de materiais permitida" ON public.materiais_escolares;
DROP POLICY IF EXISTS "Gestores e Funcionarios - CRUD Materiais" ON public.materiais_escolares;
DROP POLICY IF EXISTS "Pais veem materiais da escola" ON public.materiais_escolares;

CREATE POLICY "Gestores e Funcionarios - CRUD Materiais" 
ON public.materiais_escolares FOR ALL 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.escolas WHERE id = materiais_escolares.tenant_id AND gestor_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.funcionarios WHERE tenant_id = materiais_escolares.tenant_id AND user_id = auth.uid()) OR
    (auth.jwt() ->> 'role' = 'super_admin')
);

CREATE POLICY "Pais veem materiais da escola" 
ON public.materiais_escolares FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.alunos a
        JOIN public.aluno_responsavel ar ON ar.aluno_id = a.id
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        WHERE a.tenant_id = materiais_escolares.tenant_id AND r.user_id = auth.uid()
    )
);

-- 2. MATERIAIS_TURMAS
DROP POLICY IF EXISTS "Leitura de materiais_turmas permitida" ON public.materiais_turmas;
DROP POLICY IF EXISTS "Gestores e Funcionarios - CRUD Materiais Turmas" ON public.materiais_turmas;
DROP POLICY IF EXISTS "Pais veem materiais_turmas da escola" ON public.materiais_turmas;

CREATE POLICY "Gestores e Funcionarios - CRUD Materiais Turmas" 
ON public.materiais_turmas FOR ALL 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.escolas WHERE id = materiais_turmas.tenant_id AND gestor_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.funcionarios WHERE tenant_id = materiais_turmas.tenant_id AND user_id = auth.uid()) OR
    (auth.jwt() ->> 'role' = 'super_admin')
);

CREATE POLICY "Pais veem materiais_turmas da escola" 
ON public.materiais_turmas FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.alunos a
        JOIN public.aluno_responsavel ar ON ar.aluno_id = a.id
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        WHERE a.tenant_id = materiais_turmas.tenant_id AND r.user_id = auth.uid()
    )
);

-- FALLBACK EMERGENCIAL (OPCIONAL SE O ACIMA FALHAR):
-- Se o usuário anon estiver tentando ler (o que não deve acontecer no portal admin)
-- CREATE POLICY "Anon read" ON public.materiais_escolares FOR SELECT USING (true);
