-- ------------------------------------------------------------------------------
-- REVISÃO RLS FUNCIONÁRIOS - ACESSO TOTAL PARA COLABORADORES DA ESCOLA
-- ------------------------------------------------------------------------------
-- Este script garante que qualquer membro da instituição (via tenant_id) possa
-- visualizar, editar e gerenciar o quadro de funcionários, resolvendo bloqueios
-- de "Gestor" que impediam colaboradores administrativos de atualizar dados.

ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

-- 1. Limpeza de políticas restritivas
DROP POLICY IF EXISTS "funcionarios_gestor_read" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_gestor_insert" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_gestor_update" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_gestor_delete" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_user_read" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_super_admin" ON public.funcionarios;
DROP POLICY IF EXISTS "Acesso por Tenant (SELECT)" ON public.funcionarios;
DROP POLICY IF EXISTS "Acesso por Tenant (INSERT)" ON public.funcionarios;
DROP POLICY IF EXISTS "Acesso por Tenant (UPDATE)" ON public.funcionarios;

-- 2. Novas Políticas Unificadas via public.uid_tenant()
-- Esta política permite que usuários de uma escola gerenciem seu próprio ecossistema.

-- LEITURA
CREATE POLICY "Acesso por Tenant (SELECT)" ON public.funcionarios
    FOR SELECT
    TO authenticated
    USING (
        tenant_id = public.uid_tenant() 
        OR 
        auth.jwt() ->> 'role' = 'super_admin'
    );

-- INSERÇÃO
CREATE POLICY "Acesso por Tenant (INSERT)" ON public.funcionarios
    FOR INSERT
    TO authenticated
    WITH CHECK (
        tenant_id = public.uid_tenant() 
        OR 
        auth.jwt() ->> 'role' = 'super_admin'
    );

-- ATUALIZAÇÃO (EDITAR DETALHES)
CREATE POLICY "Acesso por Tenant (UPDATE)" ON public.funcionarios
    FOR UPDATE
    TO authenticated
    USING (
        tenant_id = public.uid_tenant() 
        OR 
        auth.jwt() ->> 'role' = 'super_admin'
    )
    WITH CHECK (
        tenant_id = public.uid_tenant() 
        OR 
        auth.jwt() ->> 'role' = 'super_admin'
    );

-- EXCLUSÃO (DESATIVAR)
CREATE POLICY "Acesso por Tenant (DELETE)" ON public.funcionarios
    FOR DELETE
    TO authenticated
    USING (
        tenant_id = public.uid_tenant() 
        OR 
        auth.jwt() ->> 'role' = 'super_admin'
    );

-- 3. Garantir que a função uid_tenant existe (caso o script de transferência não tenha rodado ainda)
CREATE OR REPLACE FUNCTION public.uid_tenant() 
RETURNS uuid AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid;
$$ LANGUAGE sql STABLE;

COMMENT ON TABLE public.funcionarios IS 'Tabela de funcionários da rede. RLS baseado em public.uid_tenant() para permitir que toda a equipe da escola gerencie seu quadro.';
