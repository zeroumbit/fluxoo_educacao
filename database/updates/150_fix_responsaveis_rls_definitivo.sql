-- ==============================================================================
-- 🔴 MIGRATION 150: CORREÇÃO DEFINITIVA RLS PARA TABELA "responsaveis"
-- ==============================================================================
-- PROBLEMA: A migration 114 (Universal RLS Fix) sobrescreveu a correção da 117,
-- criando a policy "Universal_Modify_Responsaveis" com apenas:
--     USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())
-- Isso impede que Gestores insiram novos responsáveis durante o cadastro de alunos,
-- pois o user_id no INSERT será o do responsável (ou NULL), não o do gestor.
-- 
-- ERRO: 42501 new row violates row-level security policy for table "responsaveis"
-- 
-- SOLUÇÃO: Expandir a policy para permitir:
--   1. O próprio responsável (user_id = auth.uid())
--   2. Gestores (gestor_user_id na tabela escolas)
--   3. Staff com tenant_id no JWT 
--   4. Super Admin
-- ==============================================================================

-- 1. DROP seguro da policy quebrada
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Universal_Modify_Responsaveis" ON public.responsaveis;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 2. Recriar com acesso expandido para Gestores e Staff
CREATE POLICY "Universal_Modify_Responsaveis" ON public.responsaveis
FOR ALL TO authenticated
USING (
    -- (A) O próprio responsável edita/vê seu registro
    (user_id = auth.uid())
    OR
    -- (B) Gestor da escola (busca direta, sem recursão)
    EXISTS (SELECT 1 FROM public.escolas e WHERE e.gestor_user_id = auth.uid())
    OR
    -- (C) Staff/Funcionário com tenant_id no JWT
    (NULLIF(COALESCE(
        auth.jwt()->'user_metadata'->>'tenant_id',
        auth.jwt()->'app_metadata'->>'tenant_id',
        auth.jwt()->>'tenant_id'
    ), '') IS NOT NULL)
    OR
    -- (D) Super Admin bypass
    (auth.jwt()->'user_metadata'->>'role' = 'super_admin'
     OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true)
)
WITH CHECK (
    -- Mesmas regras para INSERT/UPDATE
    (user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.escolas e WHERE e.gestor_user_id = auth.uid())
    OR
    (NULLIF(COALESCE(
        auth.jwt()->'user_metadata'->>'tenant_id',
        auth.jwt()->'app_metadata'->>'tenant_id',
        auth.jwt()->>'tenant_id'
    ), '') IS NOT NULL)
    OR
    (auth.jwt()->'user_metadata'->>'role' = 'super_admin'
     OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true)
);

-- 3. Garantir que a policy de SELECT também cubra gestores/staff
-- (A 114 já faz isso, mas vamos garantir que o SELECT não foi removido acidentalmente)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Universal_Select_Responsaveis" ON public.responsaveis;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

CREATE POLICY "Universal_Select_Responsaveis" ON public.responsaveis
FOR SELECT TO authenticated
USING (
    -- Próprio registro
    (user_id = auth.uid())
    OR
    -- Gestor lê responsáveis dos alunos do seu tenant
    id IN (
        SELECT ar.responsavel_id FROM public.aluno_responsavel ar
        JOIN public.alunos a ON a.id = ar.aluno_id
        WHERE a.tenant_id IN (SELECT e.id FROM public.escolas e WHERE e.gestor_user_id = auth.uid())
    )
    OR
    -- Staff com tenant_id no JWT
    id IN (
        SELECT ar.responsavel_id FROM public.aluno_responsavel ar
        JOIN public.alunos a ON a.id = ar.aluno_id
        WHERE a.tenant_id = NULLIF(COALESCE(
            auth.jwt()->'user_metadata'->>'tenant_id',
            auth.jwt()->'app_metadata'->>'tenant_id',
            auth.jwt()->>'tenant_id'
        ), '')::uuid
    )
    OR
    -- Super Admin
    (auth.jwt()->'user_metadata'->>'role' = 'super_admin'
     OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true)
    OR
    -- Gestor pode buscar por CPF (para o fluxo de "responsável já existe?")
    EXISTS (SELECT 1 FROM public.escolas e WHERE e.gestor_user_id = auth.uid())
);

-- ==============================================================================
-- 4. VALIDAÇÃO: Verificar que as políticas foram criadas corretamente
-- ==============================================================================
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'responsaveis' AND schemaname = 'public';
    
    IF policy_count < 2 THEN
        RAISE EXCEPTION 'ERRO CRÍTICO: Menos de 2 políticas ativas na tabela responsaveis. Esperado: Universal_Select + Universal_Modify. Encontrado: %', policy_count;
    END IF;
    
    RAISE NOTICE '✅ Migration 150 concluída: % políticas ativas na tabela responsaveis', policy_count;
END $$;
