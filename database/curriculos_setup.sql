-- =====================================================
-- Script: Configurar Tabela Currículos com RLS
-- =====================================================
-- Execute ESTE SCRIPT no Supabase SQL Editor
-- Cria tabela e políticas RLS corretas
-- =====================================================

-- 1. Habilitar RLS
ALTER TABLE public.curriculos ENABLE ROW LEVEL SECURITY;

-- 2. Dropar TODAS as políticas existentes
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
    END LOOP;
END $$;

-- 3. Criar políticas RLS CORRETAS

-- Política 1: Usuário vê seu próprio currículo
CREATE POLICY "curriculos_usuario_own_select"
    ON public.curriculos
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "curriculos_usuario_own_insert"
    ON public.curriculos
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "curriculos_usuario_own_update"
    ON public.curriculos
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Política 2: Gestores veem TODOS os currículos públicos
-- Esta política NÃO filtra por tenant_id - gestores veem currículos de QUALQUER escola
CREATE POLICY "curriculos_gestores_select_public"
    ON public.curriculos
    FOR SELECT
    USING (
        is_publico = true 
        AND is_ativo = true
        AND (
            -- É gestor de alguma escola
            EXISTS (
                SELECT 1 FROM public.escolas
                WHERE gestor_user_id = auth.uid()
            )
            -- OU é super admin (verifica auth.users)
            OR EXISTS (
                SELECT 1 FROM auth.users au
                WHERE au.id = auth.uid()
                AND (au.raw_user_meta_data->>'role') = 'super_admin'
            )
        )
    );

-- Política 3: Super Admin tem acesso total
CREATE POLICY "curriculos_superadmin_full"
    ON public.curriculos
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users au
            WHERE au.id = auth.uid()
            AND (au.raw_user_meta_data->>'role') = 'super_admin'
        )
    );

-- =====================================================
-- FIM DO SCRIPT - Políticas RLS configuradas!
-- =====================================================

-- Verificar políticas criadas
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'curriculos'
ORDER BY policyname;
