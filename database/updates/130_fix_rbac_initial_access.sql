-- ==============================================================================
-- 🛡️ MIGRATION 130: FIX RBAC INITIAL ACCESS (RLS FOR USUARIOS_SISTEMA)
-- Descrição: Corrige a falha de acesso inicial onde o funcionário não conseguia
--            ler seu próprio perfil por falta do claim tenant_id no primeiro login.
--            Também realiza o vínculo forçado para o UID fornecido.
-- ==============================================================================

-- 1. CORREÇÃO DA POLÍTICA RLS NA TABELA USUARIOS_SISTEMA
-- Anteriormente exigia tenant_id no JWT, que não existe no primeiro login.
DROP POLICY IF EXISTS "tenant_isolation_usuarios_sistema" ON public.usuarios_sistema;
CREATE POLICY "Universal_Select_usuarios_sistema" ON public.usuarios_sistema FOR SELECT TO authenticated USING (
    -- SuperAdmin
    (auth.jwt()->'user_metadata'->>'role' = 'super_admin' OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true)
    OR
    -- Staff da Escola (via JWT Claim)
    (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid)
    OR
    -- Gestor (Fallback)
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
    OR
    -- PRÓPRIO REGISTRO (Essencial para o login inicial carregar o perfil)
    (id = auth.uid())
);

-- Política para alterações (Gestor)
DROP POLICY IF EXISTS "tenant_isolation_usuarios_sistema_modify" ON public.usuarios_sistema;
CREATE POLICY "Universal_Modify_usuarios_sistema" ON public.usuarios_sistema FOR ALL TO authenticated USING (
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
    OR
    (auth.jwt()->'user_metadata'->>'role' = 'super_admin')
) WITH CHECK (
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
);

-- 2. GARANTIR VÍNCULO DO PROFESSOR ESPECÍFICO
-- UID: 4b8a8314-fc3f-4f06-bb3a-518997b31ea7
DO $$
DECLARE
    v_uid uuid := '4b8a8314-fc3f-4f06-bb3a-518997b31ea7'::uuid;
    v_funcionario_id uuid;
    v_tenant_id uuid;
    v_email text;
BEGIN
    -- 1. Buscar dados do funcionário pelo e-mail se o user_id não estiver setado
    -- Ou buscar por e-mail no auth.users
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
    
    SELECT id, tenant_id INTO v_funcionario_id, v_tenant_id 
    FROM public.funcionarios 
    WHERE email = v_email OR user_id = v_uid
    LIMIT 1;

    IF v_funcionario_id IS NOT NULL THEN
        -- Atualizar o user_id no funcionário se estiver faltando
        UPDATE public.funcionarios SET user_id = v_uid WHERE id = v_funcionario_id;
        
        -- Criar registro no usuarios_sistema se não existir
        INSERT INTO public.usuarios_sistema (id, tenant_id, funcionario_id, email_login, perfil_id, status)
        VALUES (
            v_uid, 
            v_tenant_id, 
            v_funcionario_id, 
            v_email, 
            'a0000001-0000-0000-0000-000000000001', -- Perfil Professor Default
            'ativo'
        )
        ON CONFLICT (id) DO UPDATE SET 
            funcionario_id = v_funcionario_id,
            tenant_id = v_tenant_id,
            perfil_id = COALESCE(public.usuarios_sistema.perfil_id, 'a0000001-0000-0000-0000-000000000001');

        -- Sincronizar metadata do auth.users
        UPDATE auth.users
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
            'tenant_id', v_tenant_id::text,
            'role', 'funcionario',
            'funcionario_id', v_funcionario_id::text
        )
        WHERE id = v_uid;
        
        RAISE NOTICE '✅ Professor 4b8a8314... vinculado e sincronizado com sucesso!';
    ELSE
        RAISE WARNING '❌ Não foi possível encontrar um registro na tabela funcionarios para o e-mail do UID 4b8a8314...';
    END IF;
END $$;
