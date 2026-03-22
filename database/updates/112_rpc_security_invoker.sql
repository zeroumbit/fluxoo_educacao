-- ==============================================================================
-- 🛡️ MIGRATION 112: SEGURANÇA DE FUNÇÕES (SECURITY INVOKER)
-- Descrição: Converte automaticamente as RPCs da API Pública para SECURITY INVOKER
-- ==============================================================================

DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (
        SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          -- Altera apenas as RPCs declaradas (Remote Procedure Calls acessíveis pelo front)
          AND p.proname LIKE 'rpc_%'
    ) LOOP
        -- Força a execução sob os privilégios de quem chama e evita o Hijack do search_path
        EXECUTE 'ALTER FUNCTION public.' || quote_ident(r.proname) || '(' || r.args || ') SECURITY INVOKER SET search_path = public';
    END LOOP;
END $$;
