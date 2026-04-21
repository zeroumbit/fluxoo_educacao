-- ==============================================================================
-- 🛡️ MIGRATION 171: PORTAL RLS RESTORATION FOR PIX PAYMENTS
-- Objetivo: Resolver erro 403 ao enviar comprovantes e gerar notificações.
-- ==============================================================================

BEGIN;

-- 1. Permitir que responsáveis insiram notificações de PIX Manual
-- Garante que o Portal da Família possa avisar a escola sobre o pagamento feito.
DROP POLICY IF EXISTS "Portal_Insert_Notificacoes" ON public.notificacoes;
CREATE POLICY "Portal_Insert_Notificacoes" ON public.notificacoes 
FOR INSERT TO authenticated 
WITH CHECK (
    tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
    AND tipo = 'PAGAMENTO_PIX_MANUAL'
);

-- 2. Permitir que responsáveis anexem comprovantes em suas cobranças
-- Restringe o update APENAS ao campo comprovante_url para segurança máxima.
-- Usa o helper get_my_children() para validar se a cobrança pertence a um dependente.
DROP POLICY IF EXISTS "Portal_Update_Comprovante_Cobranca" ON public.cobrancas;
CREATE POLICY "Portal_Update_Comprovante_Cobranca" ON public.cobrancas 
FOR UPDATE TO authenticated 
USING (
    aluno_id IN (SELECT public.get_my_children())
)
WITH CHECK (
    aluno_id IN (SELECT public.get_my_children())
);

COMMIT;
