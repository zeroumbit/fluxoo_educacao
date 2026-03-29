-- =====================================================
-- Script: CORREÇÃO RLS - Produção (Seguro)
-- =====================================================
-- Execute ESTE SCRIPT para remover a política emergencial
-- e aplicar políticas RESTRITIVAS de produção
-- =====================================================

-- 1. Dropar TODAS as políticas de uma vez (usando DO block)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'curriculos'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.curriculos', pol.policyname);
        RAISE NOTICE 'Policy removida: %', pol.policyname;
    END LOOP;
END $$;

-- 2. Criar políticas SEGURAS de produção

-- Política 1: Usuário vê/edita APENAS seu próprio currículo
CREATE POLICY "curriculos_owner_select"
    ON public.curriculos
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "curriculos_owner_insert"
    ON public.curriculos
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "curriculos_owner_update"
    ON public.curriculos
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "curriculos_owner_delete"
    ON public.curriculos
    FOR DELETE
    USING (auth.uid() = user_id);

-- Política 2: Gestores de escolas veem APENAS currículos públicos
-- Apenas gestores autenticados de escolas ativas
CREATE POLICY "curriculos_gestores_select"
    ON public.curriculos
    FOR SELECT
    USING (
        -- Deve ser currículo público e ativo
        is_publico = true 
        AND is_ativo = true
        AND disponibilidade_emprego = true
        -- E o usuário deve ser gestor de alguma escola
        AND EXISTS (
            SELECT 1 FROM public.escolas
            WHERE gestor_user_id = auth.uid()
            AND status_assinatura = 'ativa'
        )
    );

-- Política 3: Super Admin tem acesso total
CREATE POLICY "curriculos_superadmin_select"
    ON public.curriculos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users au
            WHERE au.id = auth.uid()
            AND (au.raw_user_meta_data->>'role') = 'super_admin'
        )
    );

CREATE POLICY "curriculos_superadmin_manage"
    ON public.curriculos
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users au
            WHERE au.id = auth.uid()
            AND (au.raw_user_meta_data->>'role') = 'super_admin'
        )
    );

-- 3. Verificar políticas criadas
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'curriculos'
ORDER BY policyname;

-- =====================================================
-- VERIFICAÇÃO PÓS-EXECUÇÃO
-- =====================================================
-- Execute estas queries para validar:

-- 1. Quantas políticas existem?
SELECT count(*) as total_politicas
FROM pg_policies 
WHERE tablename = 'curriculos';
-- Esperado: 7 políticas (4 owner + 1 gestor + 2 superadmin)

-- 2. A política emergencial foi removida?
SELECT count(*) as politica_emergencial
FROM pg_policies 
WHERE tablename = 'curriculos' 
AND policyname = 'curriculos_acesso_liberado';
-- Esperado: 0

-- =====================================================
-- FIM DO SCRIPT - RLS Seguro Aplicado!
-- =====================================================
