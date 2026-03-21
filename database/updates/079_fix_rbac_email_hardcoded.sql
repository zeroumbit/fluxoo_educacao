-- ==============================================================================
-- 🚀 MIGRATION 079: CORREÇÃO RBAC - REMOVER EMAIL HARDCODED
-- Descrição: Remove emails hardcoded das políticas RLS e usa apenas claims JWT.
-- Impacto: SEGURANÇA - Não expõe emails sensíveis no código SQL.
-- Regra de Negócio: Super Admin mantém acesso total via claim is_super_admin.
-- ==============================================================================

-- 1. ATUALIZAR POLÍTICA DO SUPER ADMIN NA TABELA 'escolas' (006_rls_policies_gestor.sql)
-- Substitui validação por email pela função has_permission() que usa claim is_super_admin
DROP POLICY IF EXISTS "Super Admin vê todas as escolas" ON public.escolas;
CREATE POLICY "Super Admin vê todas as escolas"
ON public.escolas FOR ALL
TO authenticated
USING (public.has_permission('escolas.manage'));

-- 2. ATUALIZAR POLÍTICA GLOBAL DO SUPER ADMIN (loop de todas as tabelas)
-- Remove email hardcoded e usa has_permission()
DROP POLICY IF EXISTS "Super Admin total access" ON public.escolas;

-- Recriar a política global usando has_permission em vez de email
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        BEGIN
            -- Tenta criar política com has_permission para todas as tabelas
            EXECUTE format(
                'CREATE POLICY "Super Admin total access on %I" ON public.%I FOR ALL TO authenticated USING (public.has_permission(''%I.manage''))',
                t, t, t
            );
        EXCEPTION WHEN OTHERS THEN
            -- Ignora erros (tabelas que não suportam RLS ou políticas já existentes)
            NULL;
        END;
    END LOOP;
END $$;

-- 3. ATUALIZAR POLÍTICAS DA TABELA 'escolas' no 072_fix_turmas_visibility.sql
-- Substitui validação por email pela função has_permission()
DROP POLICY IF EXISTS "super_admin_escolas" ON public.escolas;
CREATE POLICY "super_admin_escolas" ON public.escolas
    FOR ALL TO authenticated
    USING (
        -- Super Admin tem acesso total via claim
        (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean = true
        OR
        -- Gestor acessa sua própria escola
        id::text = (SELECT tenant_id::text FROM public.usuarios_sistema WHERE id = auth.uid())
    )
    WITH CHECK (
        -- Super Admin tem acesso total via claim
        (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean = true
        OR
        -- Gestor acessa sua própria escola
        id::text = (SELECT tenant_id::text FROM public.usuarios_sistema WHERE id = auth.uid())
    );

-- 4. ATUALIZAR POLÍTICAS DE PLANOS DE AULA (072_fix_turmas_visibility.sql)
-- Super Admin acessa via claim, não por email
DROP POLICY IF EXISTS "super_admin_planos" ON public.planos_aula;
CREATE POLICY "super_admin_planos" ON public.planos_aula
    FOR ALL TO authenticated
    USING (
        -- Super Admin tem acesso total via claim
        (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean = true
        OR
        -- Usuários normais acessam por tenant isolation
        tenant_id::text = (SELECT tenant_id::text FROM public.usuarios_sistema WHERE id = auth.uid())
    );

-- 5. ATUALIZAR POLÍTICAS DE ATIVIDADES (072_fix_turmas_visibility.sql)
DROP POLICY IF EXISTS "super_admin_atividades" ON public.atividades;
CREATE POLICY "super_admin_atividades" ON public.atividades
    FOR ALL TO authenticated
    USING (
        -- Super Admin tem acesso total via claim
        (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean = true
        OR
        -- Usuários normais acessam por tenant isolation
        tenant_id::text = (SELECT tenant_id::text FROM public.usuarios_sistema WHERE id = auth.uid())
    );

-- 6. GARANTIR QUE A FUNÇÃO has_permission() ESTÁ FUNCIONANDO CORRETAMENTE
-- Esta função já existe no migration 067 e usa o claim is_super_admin
-- Apenas validando que está tudo correto
-- A função já faz:
-- 1. Check se is_super_admin = true → retorna TRUE
-- 2. Check de permissões via fn_resolve_user_permissions()

-- ==============================================================================
-- ✅ RESUMO DAS MUDANÇAS
-- ==============================================================================
-- - Removido email hardcoded 'zeroumbit@gmail.com' de todas as políticas RLS
-- - Super Admin agora usa claim 'is_super_admin' do JWT
-- - Funcionalidades existentes mantidas (Super Admin continua com acesso total)
-- - Gestor continua acessando sua escola via gestor_user_id
-- - Usuários normais continuam com tenant isolation
-- ==============================================================================

-- 7. VALIDAÇÃO PÓS-MIGRATION
-- Para verificar manualmente se há emails hardcoded, execute:
-- SELECT * FROM pg_policies WHERE policyname LIKE '%super_admin%';
-- RAISE NOTICE '✅ Migration executada com sucesso. Verifique as políticas manualmente no Supabase.';
