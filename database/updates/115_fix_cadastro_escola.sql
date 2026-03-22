-- ==========================================================
-- MIGRATION 115: FIX CADASTRO ESCOLA (ONBOARDING)
-- Garante que novos gestores possam realizar o cadastro da 
-- escola mesmo se o login (sessão) ainda não estiver ativo
-- no cliente por causa de rate limit ou timeout.
-- ==========================================================

-- 1. ESCOLAS
DROP POLICY IF EXISTS "Public_Insert_Escolas" ON public.escolas;
CREATE POLICY "Public_Insert_Escolas" ON public.escolas FOR INSERT TO public WITH CHECK (true);
GRANT INSERT ON public.escolas TO anon, authenticated;

-- 2. FILIAIS
DROP POLICY IF EXISTS "Public_Insert_Filiais" ON public.filiais;
CREATE POLICY "Public_Insert_Filiais" ON public.filiais FOR INSERT TO public WITH CHECK (true);
GRANT INSERT ON public.filiais TO anon, authenticated;

-- 3. ASSINATURAS E FATURAS
DROP POLICY IF EXISTS "Public_Insert_Assinaturas" ON public.assinaturas;
CREATE POLICY "Public_Insert_Assinaturas" ON public.assinaturas FOR INSERT TO public WITH CHECK (true);
GRANT INSERT ON public.assinaturas TO anon, authenticated;

DROP POLICY IF EXISTS "Public_Insert_Faturas" ON public.faturas;
CREATE POLICY "Public_Insert_Faturas" ON public.faturas FOR INSERT TO public WITH CHECK (true);
GRANT INSERT ON public.faturas TO anon, authenticated;

-- 4. CONFIGURAÇÃO_RECEBIMENTO (leitura livre e populada p/ evitar 401/406)
ALTER TABLE public.configuracao_recebimento ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.configuracao_recebimento TO anon, authenticated;

DROP POLICY IF EXISTS "Public_Select_ConfigRecebimento" ON public.configuracao_recebimento;
CREATE POLICY "Public_Select_ConfigRecebimento" ON public.configuracao_recebimento FOR SELECT TO public USING (true);

-- Tentar inserir uma configuração de recebimento base se a tabela estiver vazia
-- Assim evita o erro 406 Not Acceptable causado por `.single()` em tabela sem registros
INSERT INTO public.configuracao_recebimento (mercado_pago_ativo, pix_manual_ativo, tipo_chave_pix, chave_pix, favorecido, instrucoes_extras)
SELECT true, true, 'cnpj', '00.000.000/0000-00', 'Fluxoo Educação', 'Para confirmação do pagamento do onboarding, envie o comprovante.'
WHERE NOT EXISTS (SELECT 1 FROM public.configuracao_recebimento);
