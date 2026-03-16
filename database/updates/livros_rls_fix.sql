-- ==========================================================
-- CORREÇÃO: ROW LEVEL SECURITY PARA O MÓDULO DE LIVROS (VERSÃO FINAL)
-- Resolve o erro 403 Forbidden e garante que os livros apareçam no portal
-- ==========================================================

-- 1. DISCIPLINAS
DROP POLICY IF EXISTS "Gestores e Funcionarios - CRUD Disciplinas" ON public.disciplinas;
DROP POLICY IF EXISTS "Pais veem disciplinas vinculadas" ON public.disciplinas;

CREATE POLICY "Gestores e Funcionarios - CRUD Disciplinas" 
ON public.disciplinas FOR ALL 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.escolas WHERE id = disciplinas.tenant_id AND gestor_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.funcionarios WHERE tenant_id = disciplinas.tenant_id AND user_id = auth.uid()) OR
    (auth.jwt() ->> 'role' = 'super_admin')
);

CREATE POLICY "Pais veem disciplinas vinculadas" 
ON public.disciplinas FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.alunos a
        JOIN public.aluno_responsavel ar ON ar.aluno_id = a.id
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        WHERE a.tenant_id = disciplinas.tenant_id AND r.user_id = auth.uid()
    )
);

-- 2. LIVROS
DROP POLICY IF EXISTS "Gestores e Funcionarios - CRUD Livros" ON public.livros;
DROP POLICY IF EXISTS "Pais veem livros da escola" ON public.livros;

CREATE POLICY "Gestores e Funcionarios - CRUD Livros" 
ON public.livros FOR ALL 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.escolas WHERE id = livros.tenant_id AND gestor_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.funcionarios WHERE tenant_id = livros.tenant_id AND user_id = auth.uid()) OR
    (auth.jwt() ->> 'role' = 'super_admin')
);

CREATE POLICY "Pais veem livros da escola" 
ON public.livros FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.alunos a
        JOIN public.aluno_responsavel ar ON ar.aluno_id = a.id
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        WHERE a.tenant_id = livros.tenant_id AND r.user_id = auth.uid()
    )
);

-- 3. LIVROS_TURMAS
DROP POLICY IF EXISTS "Gestores e Funcionarios - CRUD Livros Turmas" ON public.livros_turmas;
DROP POLICY IF EXISTS "Pais veem livros_turmas da escola" ON public.livros_turmas;

CREATE POLICY "Gestores e Funcionarios - CRUD Livros Turmas" 
ON public.livros_turmas FOR ALL 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.escolas WHERE id = livros_turmas.tenant_id AND gestor_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.funcionarios WHERE tenant_id = livros_turmas.tenant_id AND user_id = auth.uid()) OR
    (auth.jwt() ->> 'role' = 'super_admin')
);

CREATE POLICY "Pais veem livros_turmas da escola" 
ON public.livros_turmas FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.alunos a
        JOIN public.aluno_responsavel ar ON ar.aluno_id = a.id
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        WHERE a.tenant_id = livros_turmas.tenant_id AND r.user_id = auth.uid()
    )
);

-- 4. TURMAS (Essencial para a View funcionar no Portal)
DROP POLICY IF EXISTS "Pais veem turmas vinculadas" ON public.turmas;
CREATE POLICY "Pais veem turmas vinculadas" 
ON public.turmas FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.alunos a
        JOIN public.aluno_responsavel ar ON ar.aluno_id = a.id
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        WHERE a.tenant_id = turmas.tenant_id AND r.user_id = auth.uid()
    )
);

-- 5. LIVROS_FILIAIS
DROP POLICY IF EXISTS "Gestores e Funcionarios - CRUD Livros Filiais" ON public.livros_filiais;
CREATE POLICY "Gestores e Funcionarios - CRUD Livros Filiais" 
ON public.livros_filiais FOR ALL 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.escolas WHERE id = livros_filiais.tenant_id AND gestor_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.funcionarios WHERE tenant_id = livros_filiais.tenant_id AND user_id = auth.uid()) OR
    (auth.jwt() ->> 'role' = 'super_admin')
);
