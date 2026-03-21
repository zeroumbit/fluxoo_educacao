-- ==============================================================================
-- 🚨 MIGRATION 087: CORREÇÃO JWT CLAIMS - TENANT_ID E GESTOR
-- Descrição: Configura o Supabase Auth para incluir tenant_id nos claims do JWT
-- Impacto: CRÍTICO - Sem isso, o RLS não funciona pois tenant_id é null
-- ==============================================================================

-- IMPORTANTE: Esta migration cria uma função que atualiza o metadata do usuário
-- com o tenant_id correto baseado na escola onde ele é gestor
-- ==============================================================================

-- 1. Função para atualizar metadata do usuário com tenant_id
CREATE OR REPLACE FUNCTION public.update_user_tenant_claim()
RETURNS void AS $$
DECLARE
    v_user_id uuid;
    v_tenant_id uuid;
BEGIN
    -- Para cada usuário que é gestor de alguma escola
    FOR v_user_id, v_tenant_id IN
        SELECT e.gestor_user_id, e.id
        FROM escolas e
        WHERE e.gestor_user_id IS NOT NULL
    LOOP
        -- Atualizar metadata do usuário com tenant_id
        UPDATE auth.users
        SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
            'tenant_id', v_tenant_id::text,
            'role', 'gestor'
        )
        WHERE id = v_user_id;
    END LOOP;
    
    RAISE NOTICE '✅ Metadata dos gestores atualizado com tenant_id';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Executar a função para atualizar todos os gestores
SELECT public.update_user_tenant_claim();

-- 3. Trigger para atualizar automaticamente quando criar/editar escola
CREATE OR REPLACE FUNCTION public.sync_gestor_tenant_claim()
RETURNS trigger AS $$
BEGIN
    IF NEW.gestor_user_id IS NOT NULL THEN
        UPDATE auth.users
        SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
            'tenant_id', NEW.id::text,
            'role', 'gestor'
        )
        WHERE id = NEW.gestor_user_id;
    END IF;
    
    -- Se estava definindo um gestor e mudou
    IF OLD.gestor_user_id IS NOT NULL AND OLD.gestor_user_id IS DISTINCT FROM NEW.gestor_user_id THEN
        -- Remover tenant_id do gestor antigo
        UPDATE auth.users
        SET raw_user_meta_data = raw_user_meta_data - 'tenant_id' - 'role'
        WHERE id = OLD.gestor_user_id
        AND NOT EXISTS (
            SELECT 1 FROM escolas WHERE gestor_user_id = OLD.gestor_user_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar trigger na tabela escolas
DROP TRIGGER IF EXISTS trg_sync_gestor_tenant ON public.escolas;
CREATE TRIGGER trg_sync_gestor_tenant
    AFTER INSERT OR UPDATE ON public.escolas
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_gestor_tenant_claim();

-- 5. Validar configuração atual
DO $$
DECLARE
    rec record;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 VALIDANDO CONFIGURAÇÃO DOS GESTORES';
    RAISE NOTICE '========================================';
    
    FOR rec IN
        SELECT 
            e.id as escola_id,
            e.razao_social,
            e.gestor_user_id,
            u.email,
            u.raw_user_meta_data->>'tenant_id' as tenant_id_no_metadata,
            u.raw_user_meta_data->>'role' as role_no_metadata
        FROM escolas e
        LEFT JOIN auth.users u ON u.id = e.gestor_user_id
        WHERE e.gestor_user_id IS NOT NULL
    LOOP
        RAISE NOTICE '----------------------------------------';
        RAISE NOTICE '🏫 Escola: %', rec.escola_id;
        RAISE NOTICE '📧 Gestor: %', rec.email;
        RAISE NOTICE '🆔 Gestor ID: %', rec.gestor_user_id;
        RAISE NOTICE '🏷️  Tenant ID no metadata: %', rec.tenant_id_no_metadata;
        RAISE NOTICE '👤 Role no metadata: %', rec.role_no_metadata;
        
        IF rec.tenant_id_no_metadata IS NULL THEN
            RAISE WARNING '⚠️  ATENÇÃO: Gestor sem tenant_id no metadata!';
        END IF;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MIGRATION 087 CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
    RAISE NOTICE '1. Faça logout da aplicação';
    RAISE NOTICE '2. Faça login novamente com o gestor';
    RAISE NOTICE '3. Execute: SELECT auth.uid(), auth.jwt() ->> ''tenant_id'';';
    RAISE NOTICE '4. Verifique se tenant_id NÃO é null';
    RAISE NOTICE '========================================';
END $$;

-- ==============================================================================
-- ✅ RESUMO
-- ==============================================================================
-- - Atualiza metadata de TODOS os gestores com tenant_id
-- - Cria trigger para atualizar automaticamente no futuro
-- - Sem isso, o JWT não tem tenant_id e o RLS bloqueia tudo
-- ==============================================================================
