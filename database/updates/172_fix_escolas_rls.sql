-- ==============================================================================
-- 🛡️ MIGRATION 172: ESCOLAS RLS RESTORATION FOR ONBOARDING
-- Objetivo: Permitir que novos gestores criem e gerenciem seus registros de escola.
-- ==============================================================================

BEGIN;

-- 1. Permitir que usuários autenticados criem o registro da sua escola
-- O gestor_user_id deve obrigatoriamente ser o ID do próprio usuário autenticado.
DROP POLICY IF EXISTS "gestor_escolas_insert" ON public.escolas;
CREATE POLICY "gestor_escolas_insert" ON public.escolas 
FOR INSERT TO authenticated 
WITH CHECK (
    gestor_user_id = auth.uid()
);

-- 2. Permitir que o gestor atualize os dados da sua própria escola
-- Essencial para finalizar o cadastro e preencher dados de endereço/perfil.
DROP POLICY IF EXISTS "gestor_escolas_update" ON public.escolas;
CREATE POLICY "gestor_escolas_update" ON public.escolas 
FOR UPDATE TO authenticated 
USING (
    gestor_user_id = auth.uid()
)
WITH CHECK (
    gestor_user_id = auth.uid()
);

-- 3. Garantir que a política de leitura (SELECT) esteja correta
DROP POLICY IF EXISTS "gestor_escolas_read" ON public.escolas;
CREATE POLICY "gestor_escolas_read" ON public.escolas 
FOR SELECT TO authenticated 
USING (
    gestor_user_id = auth.uid()
);

COMMIT;
