-- ==============================================================================
-- 🚀 MIGRATION 173: FIX RLS FUNCIONARIOS (ROBUST)
-- Descrição: Corrige o erro 403 (Forbidden) permitindo que gestores gerenciem
--            funcionários com base no vínculo direto na tabela de escolas,
--            sem depender exclusivamente de metadados do JWT.
-- ==============================================================================

-- 1. Remover políticas que dependem apenas de uid_tenant() para INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Acesso por Tenant (INSERT)" ON public.funcionarios;
DROP POLICY IF EXISTS "Acesso por Tenant (SELECT)" ON public.funcionarios;
DROP POLICY IF EXISTS "Acesso por Tenant (UPDATE)" ON public.funcionarios;
DROP POLICY IF EXISTS "Acesso por Tenant (DELETE)" ON public.funcionarios;

-- 2. Recriar políticas com verificação robusta (JWT + Tabela Escolas)

-- SELECT: Verificação por JWT ou por ser Gestor da Escola
CREATE POLICY "funcionarios_select_policy" ON public.funcionarios
FOR SELECT
TO authenticated
USING (
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
    OR 
    auth.jwt() ->> 'role' = 'super_admin'
    OR
    EXISTS (
        SELECT 1 FROM public.escolas e 
        WHERE e.id = funcionarios.tenant_id 
        AND e.gestor_user_id = auth.uid()
    )
    OR
    user_id = auth.uid()
);

-- INSERT: Gestor da escola ou Super Admin
CREATE POLICY "funcionarios_insert_policy" ON public.funcionarios
FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
    OR 
    auth.jwt() ->> 'role' = 'super_admin'
    OR
    EXISTS (
        SELECT 1 FROM public.escolas e 
        WHERE e.id = tenant_id 
        AND e.gestor_user_id = auth.uid()
    )
);

-- UPDATE: Gestor da escola ou Super Admin
CREATE POLICY "funcionarios_update_policy" ON public.funcionarios
FOR UPDATE
TO authenticated
USING (
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
    OR 
    auth.jwt() ->> 'role' = 'super_admin'
    OR
    EXISTS (
        SELECT 1 FROM public.escolas e 
        WHERE e.id = funcionarios.tenant_id 
        AND e.gestor_user_id = auth.uid()
    )
);

-- DELETE: Apenas Gestor ou Super Admin
CREATE POLICY "funcionarios_delete_policy" ON public.funcionarios
FOR DELETE
TO authenticated
USING (
    auth.jwt() ->> 'role' = 'super_admin'
    OR
    EXISTS (
        SELECT 1 FROM public.escolas e 
        WHERE e.id = funcionarios.tenant_id 
        AND e.gestor_user_id = auth.uid()
    )
);

-- 3. Garantir que a tabela de usuários_sistema também tenha RLS robusto
DROP POLICY IF EXISTS "tenant_isolation_usuarios_sistema" ON public.usuarios_sistema;
CREATE POLICY "usuarios_sistema_robust_policy" ON public.usuarios_sistema
FOR ALL
TO authenticated
USING (
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
    OR
    auth.jwt() ->> 'role' = 'super_admin'
    OR
    EXISTS (
        SELECT 1 FROM public.escolas e 
        WHERE e.id = usuarios_sistema.tenant_id 
        AND e.gestor_user_id = auth.uid()
    )
);

-- 4. Log de auditoria para confirmar a correção
DO $$
BEGIN
    RAISE NOTICE 'RLS de Funcionários e Usuários de Sistema atualizado para suporte robusto a Gestores.';
END $$;
