-- =====================================================
-- Migration 130: Tabela de Currículos para Profissionais
-- =====================================================
-- Cria tabela para armazenar currículos de profissionais
-- que se candidatam a vagas nas escolas (professores,
-- vigias, porteiros, e outros funcionários).
--
-- IMPORTANTE: Execute também o 131_curriculos_permissions.sql
-- =====================================================

-- 1. Criar tabela de currículos
CREATE TABLE IF NOT EXISTS public.curriculos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.escolas(id) ON DELETE CASCADE,
    funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE CASCADE,
    
    -- Dados profissionais
    disponibilidade_emprego BOOLEAN DEFAULT FALSE,
    disponibilidade_tipo TEXT[] DEFAULT '{}',
    areas_interesse TEXT[] DEFAULT '{}',
    pretensao_salarial NUMERIC(10,2),
    
    -- Formação e experiência
    formacao JSONB DEFAULT '[]'::jsonb,
    experiencia JSONB DEFAULT '[]'::jsonb,
    habilidades TEXT[] DEFAULT '{}',
    certificacoes JSONB DEFAULT '[]'::jsonb,
    
    -- Dados adicionais
    resumo_profissional TEXT,
    observacoes TEXT,
    
    -- Controle de visibilidade
    is_publico BOOLEAN DEFAULT FALSE,
    is_ativo BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_curriculos_user_id ON public.curriculos(user_id);
CREATE INDEX IF NOT EXISTS idx_curriculos_tenant_id ON public.curriculos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_curriculos_funcionario_id ON public.curriculos(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_curriculos_disponibilidade ON public.curriculos(disponibilidade_emprego) WHERE disponibilidade_emprego = true;
CREATE INDEX IF NOT EXISTS idx_curriculos_is_publico ON public.curriculos(is_publico) WHERE is_publico = true;
CREATE INDEX IF NOT EXISTS idx_curriculos_areas_interesse ON public.curriculos USING GIN(areas_interesse);
CREATE INDEX IF NOT EXISTS idx_curriculos_habilidades ON public.curriculos USING GIN(habilidades);

-- 3. Habilitar RLS
ALTER TABLE public.curriculos ENABLE ROW LEVEL SECURITY;

-- 4. Dropar políticas existentes (se houver) - IDEMPOTENTE
DROP POLICY IF EXISTS "curriculos_owner_select" ON public.curriculos;
DROP POLICY IF EXISTS "curriculos_owner_insert" ON public.curriculos;
DROP POLICY IF EXISTS "curriculos_owner_update" ON public.curriculos;
DROP POLICY IF EXISTS "curriculos_owner_delete" ON public.curriculos;
DROP POLICY IF EXISTS "curriculos_gestores_select" ON public.curriculos;
DROP POLICY IF EXISTS "curriculos_superadmin_select" ON public.curriculos;
DROP POLICY IF EXISTS "curriculos_superadmin_manage" ON public.curriculos;

-- 5. Criar políticas RLS SEGURAS

-- Usuário vê/edita APENAS seu próprio currículo
CREATE POLICY "curriculos_owner_select"
    ON public.curriculos
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "curriculos_owner_insert"
    ON public.curriculos
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "curriculos_owner_update"
    ON public.curriculos
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "curriculos_owner_delete"
    ON public.curriculos
    FOR DELETE
    USING (auth.uid() = user_id);

-- Gestores veem APENAS currículos públicos de escolas ativas
CREATE POLICY "curriculos_gestores_select"
    ON public.curriculos
    FOR SELECT
    USING (
        is_publico = true 
        AND is_ativo = true
        AND disponibilidade_emprego = true
        AND EXISTS (
            SELECT 1 FROM public.escolas
            WHERE gestor_user_id = auth.uid()
            AND status_assinatura = 'ativa'
        )
    );

-- Super Admin tem acesso total
CREATE POLICY "curriculos_superadmin_select"
    ON public.curriculos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users au
            WHERE au.id = auth.uid()
            AND (au.raw_user_meta_data->>'role') = 'super_admin'
        )
    );

CREATE POLICY "curriculos_superadmin_manage"
    ON public.curriculos
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users au
            WHERE au.id = auth.uid()
            AND (au.raw_user_meta_data->>'role') = 'super_admin'
        )
    );

-- 6. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_curriculos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_curriculos_update_updated_at
    BEFORE UPDATE ON public.curriculos
    FOR EACH ROW
    EXECUTE FUNCTION update_curriculos_updated_at();

-- 7. Comentários
COMMENT ON TABLE public.curriculos IS 'Armazena currículos de profissionais disponíveis para emprego formal';
COMMENT ON COLUMN public.curriculos.disponibilidade_emprego IS 'Indica se o profissional está disponível para emprego formal';
COMMENT ON COLUMN public.curriculos.disponibilidade_tipo IS 'Tipos de disponibilidade: tempo_integral, meio_periodo, substituicoes, eventual';
COMMENT ON COLUMN public.curriculos.areas_interesse IS 'Áreas de interesse profissional: docencia, administrativo, seguranca, limpeza, etc.';
COMMENT ON COLUMN public.curriculos.is_publico IS 'Se true, o currículo está visível para gestores das escolas';
COMMENT ON COLUMN public.curriculos.is_ativo IS 'Se true, o currículo está ativo para busca';
