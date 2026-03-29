-- =====================================================
-- MIGRATION: Permite que Portal da Família veja profissionais
-- =====================================================
-- Problema: O erro 403 ocorre porque não há política RLS permitindo
-- que usuários autenticados do portal (role: responsavel) possam
-- visualizar os currículos/profissionais disponíveis.
--
-- Solução: Adicionar política de SELECT para todos autenticados
-- =====================================================

-- Habilitar RLS na tabela curriculos (se ainda não estiver)
ALTER TABLE public.curriculos ENABLE ROW LEVEL SECURITY;

-- Dropar políticas antigas se existirem
DO $$
BEGIN
    DROP POLICY IF EXISTS "curriculos_portal_familia_select" ON public.curriculos;
END $$;

-- Nova política: Permite que QUALQUER usuário autenticado possa visualizar
-- currículos de profissionais que buscam vaga ou prestam serviço
-- Isso inclui: responsavel (portal da família), gestores, super_admin, etc.
CREATE POLICY "curriculos_portal_familia_select"
    ON public.curriculos
    FOR SELECT
    TO authenticated
    USING (
        -- Permite visualizar apenas profissionais ativos que:
        -- 1. Buscam vaga OU
        -- 2. Prestam serviço
        (busca_vaga = true OR presta_servico = true)
        AND
        -- E que não estejam marcados como inativos
        (is_ativo = true OR is_ativo IS NULL)
    );

-- =====================================================
-- BÔNUS: Política para Lojistas (se necessário)
-- =====================================================
-- Permite que o Portal da Família veja lojistas ativos

DO $$
BEGIN
    DROP POLICY IF EXISTS "lojistas_portal_familia_select" ON public.lojistas;
END $$;

CREATE POLICY "lojistas_portal_familia_select"
    ON public.lojistas
    FOR SELECT
    TO authenticated
    USING (
        status = 'ativo'
    );

-- =====================================================
-- Confirmação
-- =====================================================
-- Após rodar este script, teste no Supabase:
-- SELECT * FROM curriculos WHERE busca_vaga = true OR presta_servico = true;
-- SELECT * FROM lojistas WHERE status = 'ativo';
-- =====================================================
