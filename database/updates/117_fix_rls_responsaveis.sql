-- ==========================================================
-- MIGRATION 117: FIX RLS PARA RESPONSÁVEIS
-- Erro: 42501 new row violates row-level security policy for table "responsaveis"
-- Detalhe: Gestores não estavam conseguindo inserir novos responsáveis 
-- porque a política antiga só permitia o próprio responsavel (user_id = auth.uid()) inserir a si mesmo.
-- Correção: Adicionado Bypass do tenant_id (Gestores) na política de Modify dos Responsáveis.
-- ==========================================================

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Universal_Modify_Responsaveis" ON public.responsaveis;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

CREATE POLICY "Universal_Modify_Responsaveis" ON public.responsaveis FOR ALL TO authenticated USING (
    -- O próprio responsável
    user_id = auth.uid()
    OR 
    -- Gestores, Equipe e Admins (tem tenant_id atrelado ao usuário)
    (NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '') IS NOT NULL)
    OR 
    (auth.jwt()->'user_metadata'->>'role' = 'super_admin' OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true)
) WITH CHECK (
    user_id = auth.uid()
    OR 
    (NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '') IS NOT NULL)
    OR 
    (auth.jwt()->'user_metadata'->>'role' = 'super_admin' OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true)
);
