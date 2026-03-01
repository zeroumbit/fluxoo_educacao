-- ==========================================================
-- CORREÇÃO: LIBERAR ACESSO À TABELA FREQUENCIAS (RLS)
-- Resolve o erro 403 Forbidden ao salvar frequência
-- ==========================================================

-- 1. Garantir que RLS está habilitado
ALTER TABLE public.frequencias ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Pais veem frequencia dos filhos" ON public.frequencias;
DROP POLICY IF EXISTS "Funcionarios e Gestores - Frequencias CRUD" ON public.frequencias;
DROP POLICY IF EXISTS "Gestores podem gerenciar frequencias" ON public.frequencias;
DROP POLICY IF EXISTS "Funcionarios podem gerenciar frequencias" ON public.frequencias;
DROP POLICY IF EXISTS "Staff podem gerenciar frequencias" ON public.frequencias;

-- 3. POLÍTICA PARA PAIS (SELECT apenas)
-- Permite que o pai veja a frequência apenas dos seus filhos vinculados
CREATE POLICY "Pais veem frequencia dos filhos" 
ON public.frequencias FOR SELECT 
TO authenticated 
USING (aluno_id IN (
    SELECT aluno_id FROM public.aluno_responsavel 
    WHERE responsavel_id IN (SELECT id FROM public.responsaveis WHERE user_id = auth.uid())
));

-- 4. POLÍTICA PARA GESTORES E FUNCIONÁRIOS (CONTROLE TOTAL)
-- Permite que gestores e funcionários operem dados do seu próprio tenant_id
CREATE POLICY "Staff podem gerenciar frequencias" 
ON public.frequencias FOR ALL 
TO authenticated 
USING (
    -- Usuário é o gestor da escola (tenant)
    EXISTS (
        SELECT 1 FROM public.escolas 
        WHERE id = frequencias.tenant_id 
        AND gestor_user_id = auth.uid()
    )
    OR
    -- OU Usuário é um funcionário vinculado a este tenant
    EXISTS (
        SELECT 1 FROM public.funcionarios 
        WHERE tenant_id = frequencias.tenant_id 
        AND user_id = auth.uid()
    )
    OR
    -- OU Super Admin (via JWT)
    (auth.jwt() ->> 'role' = 'super_admin')
)
WITH CHECK (
    -- Garantir que ao inserir/atualizar, o tenant_id pertença ao usuário
    EXISTS (
        SELECT 1 FROM public.escolas 
        WHERE id = tenant_id 
        AND gestor_user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.funcionarios 
        WHERE tenant_id = tenant_id 
        AND user_id = auth.uid()
    )
    OR
    -- OU Super Admin (via JWT)
    (auth.jwt() ->> 'role' = 'super_admin')
);

-- Verificação final: listar políticas ativas na tabela
-- SELECT * FROM pg_policies WHERE tablename = 'frequencias';
