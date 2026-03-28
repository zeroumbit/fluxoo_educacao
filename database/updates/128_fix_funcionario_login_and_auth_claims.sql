-- ==============================================================================
-- 🛡️ MIGRATION 128: FIX FUNCIONARIO LOGIN AND AUTH CLAIMS
-- Descrição: Garante que funcionários consigam logar restaurando o acesso ao 
-- próprio registro via RLS e sincronizando o tenant_id no JWT.
-- ==============================================================================

-- 1. CORREÇÃO DA POLÍTICA RLS NA TABELA FUNCIONARIOS
-- A migration 114 removeu o check de user_id = auth.uid(), impedindo o login inicial
DROP POLICY IF EXISTS "Universal_Select_funcionarios" ON public.funcionarios;
CREATE POLICY "Universal_Select_funcionarios" ON public.funcionarios FOR SELECT TO authenticated USING (
    -- SuperAdmin Bypass Global
    (auth.jwt()->'user_metadata'->>'role' = 'super_admin' OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true)
    OR
    -- Staff da Escola (via JWT Claim)
    (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid)
    OR
    -- Gestor da Escola (via Join - Fallback se o claim falhar)
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
    OR
    -- PRÓPRIO REGISTRO (Essencial para o login inicial carregar o perfil)
    (user_id = auth.uid())
);

-- 2. FUNÇÃO PARA SINCRONIZAR TENANT_ID NO AUTH.USERS (Para funcionários)
-- Isso garante que o claim 'tenant_id' esteja no JWT após o primeiro login
CREATE OR REPLACE FUNCTION public.sync_funcionario_tenant_claim()
RETURNS trigger AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        -- Atualizar metadata do usuário no Supabase Auth
        UPDATE auth.users
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
            'tenant_id', NEW.tenant_id::text,
            'role', 'funcionario',
            'funcionario_id', NEW.id::text
        )
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. TRIGGER NA TABELA FUNCIONARIOS
DROP TRIGGER IF EXISTS trg_sync_funcionario_tenant ON public.funcionarios;
CREATE TRIGGER trg_sync_funcionario_tenant
    AFTER INSERT OR UPDATE OF user_id, tenant_id ON public.funcionarios
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_funcionario_tenant_claim();

-- 4. BACKFILL: Sincronizar funcionários existentes
DO $$ 
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT id, user_id, tenant_id 
        FROM public.funcionarios 
        WHERE user_id IS NOT NULL AND tenant_id IS NOT NULL
    LOOP
        UPDATE auth.users
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
            'tenant_id', rec.tenant_id::text,
            'role', 'funcionario',
            'funcionario_id', rec.id::text
        )
        WHERE id = rec.user_id;
    END LOOP;
END $$;

-- 5. VERIFICAÇÃO DO USUÁRIO ESPECÍFICO (UID fornecido pelo usuário)
-- UID: ce26265b-42e9-4e85-b424-783b89423f7a
DO $$
DECLARE
    v_uid uuid := 'ce26265b-42e9-4e85-b424-783b89423f7a'::uuid;
    v_found boolean;
    v_email text;
    v_tenant_id uuid;
BEGIN
    SELECT EXISTS (SELECT 1 FROM public.funcionarios WHERE user_id = v_uid) INTO v_found;
    
    IF v_found THEN
        SELECT email, tenant_id INTO v_email, v_tenant_id FROM public.funcionarios WHERE user_id = v_uid LIMIT 1;
        RAISE NOTICE '✅ Funcionário encontrado: % (Tenant: %)', v_email, v_tenant_id;
        
        -- Garante que o metadata dele está atualizado agora mesmo
        UPDATE auth.users
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
            'tenant_id', v_tenant_id::text,
            'role', 'funcionario'
        )
        WHERE id = v_uid;
        RAISE NOTICE '✅ Metadata do usuário ce26265b... atualizado forçadamente.';
    ELSE
        RAISE WARNING '⚠️  Funcionário com user_id ce26265b... NÃO encontrado na tabela public.funcionarios!';
    END IF;
END $$;
