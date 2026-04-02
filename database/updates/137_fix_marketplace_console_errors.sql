-- =====================================================
-- 🛒 MIGRATION 137: FIX MARKETPLACE CONSOLE ERRORS (RLS)
-- Descrição: Resolve o erro 403 (Forbidden) persistente no Portal.
--            Estende as permissões de leitura do Marketplace para 
--            usuários não logados (anon) permitindo a verificação de 
--            existência de lojistas e profissionais para o BottomNav.
-- =====================================================

-- 1. Políticas para CURRICULOS
-- O Portal precisa saber se existe algum profissional para mostrar/esconder o botão
DROP POLICY IF EXISTS "curriculos_portal_familia_select" ON public.curriculos;

CREATE POLICY "curriculos_portal_familia_select_v2"
    ON public.curriculos
    FOR SELECT
    TO authenticated, anon
    USING (
        (is_ativo = true OR is_ativo IS NULL)
        AND (busca_vaga = true OR presta_servico = true)
        -- No caso de anon, só permitimos ver se for explicitamente público
        AND (CASE WHEN auth.role() = 'anon' THEN is_publico = true ELSE true END)
    );

-- 2. Políticas para LOJISTAS
-- O Portal precisa saber se existem lojistas ativos
DROP POLICY IF EXISTS "lojistas_portal_familia_select" ON public.lojistas;

CREATE POLICY "lojistas_portal_familia_select_v2"
    ON public.lojistas
    FOR SELECT
    TO authenticated, anon
    USING (
        status = 'ativo'
    );

-- 3. Garantir que as colunas existem (Safe Guard)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='curriculos' AND column_name='busca_vaga') THEN
        ALTER TABLE public.curriculos ADD COLUMN busca_vaga BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='curriculos' AND column_name='presta_servico') THEN
        ALTER TABLE public.curriculos ADD COLUMN presta_servico BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Comentários
COMMENT ON POLICY "curriculos_portal_familia_select_v2" ON public.curriculos IS 'Permite que usuários (mesmo deslogados) verifiquem a existência de profissionais no Marketplace para fins de UI';
COMMENT ON POLICY "lojistas_portal_familia_select_v2" ON public.lojistas IS 'Permite que usuários (mesmo deslogados) verifiquem a existência de lojistas no Marketplace para fins de UI';
