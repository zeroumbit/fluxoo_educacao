-- ==============================================================================
-- 🛡️ MIGRATION 184: AJUSTES PARA COBRANÇA MANUAL E ALERTAS SUPERADMIN
-- 1. Garante que SuperAdmin pode enviar notificações para as escolas
-- 2. Cria visualização de pendências de faturamento da plataforma
-- 3. Notifica mensalmente sobre pagamentos via PIX Manual
-- ==============================================================================

BEGIN;

-- 1. Ajuste de RLS na tabela notificacoes para SuperAdmin
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'notificacoes' 
    AND policyname IN ('SA_Manage_Notificacoes', 'Universal_Select_Notificacoes')
  ) LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.notificacoes';
  END LOOP;
END $$;

-- SuperAdmin pode tudo em notificações (para enviar alertas para escolas)
CREATE POLICY "SA_Manage_Notificacoes" ON public.notificacoes FOR ALL TO authenticated
USING (public.check_is_super_admin())
WITH CHECK (public.check_is_super_admin());

-- 2. View para Faturas Atrasadas da Plataforma (Dashboard SA)
CREATE OR REPLACE VIEW public.vw_faturas_plataforma_atrasadas AS
SELECT 
    f.id,
    f.tenant_id,
    e.razao_social as escola_nome,
    e.email_gestor,
    f.valor,
    f.competencia,
    f.data_vencimento,
    f.forma_pagamento,
    f.status
FROM public.faturas f
JOIN public.escolas e ON e.id = f.tenant_id
WHERE f.status IN ('pendente', 'atrasado', 'pendente_confirmacao')
AND (f.data_vencimento < CURRENT_DATE OR f.status = 'pendente_confirmacao');

-- Permissão de leitura para SuperAdmin na View
GRANT SELECT ON public.vw_faturas_plataforma_atrasadas TO authenticated;

-- 3. Função para Alerta Mensal de PIX Manual
-- Esta função pode ser chamada via RPC ou automatizada se o pg_cron estiver ativo
CREATE OR REPLACE FUNCTION public.alertar_pix_manual_pendente()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r RECORD;
BEGIN
    -- Busca faturas PIX Manual que vencem em 3 dias ou estão atrasadas
    FOR r IN 
        SELECT f.id, f.tenant_id, f.valor, f.competencia, e.razao_social, e.email_gestor
        FROM public.faturas f
        JOIN public.escolas e ON e.id = f.tenant_id
        WHERE f.forma_pagamento = 'pix_manual'
        AND f.status = 'pendente'
        AND (f.data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days' OR f.data_vencimento < CURRENT_DATE)
    LOOP
        -- Notifica a Escola
        INSERT INTO public.notificacoes (
            tenant_id, tipo, titulo, mensagem, href, categoria, prioridade, lida, resolvida
        ) VALUES (
            r.tenant_id, 'FINANCEIRO', 'Lembrete de Pagamento PIX',
            'Sua fatura de R$ ' || r.valor || ' (' || r.competencia || ') está próxima do vencimento. Realize o PIX e envie o comprovante.',
            '/admin/financeiro', 'PLATAFORMA', 2, false, false
        );

        -- Notifica o SuperAdmin (globalmente)
        INSERT INTO public.notificacoes (
            tenant_id, tipo, titulo, mensagem, href, categoria, prioridade, lida, resolvida
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', 'FINANCEIRO', 'Cobrança PIX Manual Pendente',
            'A escola ' || r.razao_social || ' possui uma fatura PIX Manual pendente (' || r.competencia || ').',
            '/super-admin/faturas', 'SISTEMA', 1, false, false
        );
    END LOOP;
END;
$$;

COMMIT;
