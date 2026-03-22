-- ==========================================================
-- MIGRATION 116: FIX CADASTRO ESCOLA SELECTS (ONBOARDING)
-- Garante que o PostgREST consiga retornar os dados recém inseridos
-- no `.select().single()` durante o onboarding anônimo.
-- Oculta o erro "new row violates row-level security" pós-insert!
-- ==========================================================

-- 1. ESCOLAS (Permitir SELECT para public)
DROP POLICY IF EXISTS "Public_Select_Escolas" ON public.escolas;
CREATE POLICY "Public_Select_Escolas" ON public.escolas FOR SELECT TO public USING (true);
GRANT SELECT ON public.escolas TO anon, authenticated;

-- 2. FILIAIS
DROP POLICY IF EXISTS "Public_Select_Filiais" ON public.filiais;
CREATE POLICY "Public_Select_Filiais" ON public.filiais FOR SELECT TO public USING (true);
GRANT SELECT ON public.filiais TO anon, authenticated;

-- 3. ASSINATURAS E FATURAS
DROP POLICY IF EXISTS "Public_Select_Assinaturas" ON public.assinaturas;
CREATE POLICY "Public_Select_Assinaturas" ON public.assinaturas FOR SELECT TO public USING (true);
GRANT SELECT ON public.assinaturas TO anon, authenticated;

DROP POLICY IF EXISTS "Public_Select_Faturas_Onboarding" ON public.faturas;
CREATE POLICY "Public_Select_Faturas_Onboarding" ON public.faturas FOR SELECT TO public USING (true);
GRANT SELECT ON public.faturas TO anon, authenticated;
