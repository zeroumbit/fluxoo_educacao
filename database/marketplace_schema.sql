-- =====================================================
-- Script: Schema para Lojistas e Profissionais
-- =====================================================

-- 1. Tabela de Lojistas
CREATE TABLE IF NOT EXISTS public.lojistas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    cnpj TEXT UNIQUE NOT NULL,
    email TEXT,
    telefone TEXT,
    categoria TEXT,
    descricao TEXT,
    plano_id TEXT DEFAULT 'free',
    status TEXT DEFAULT 'ativo',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS para Lojistas
ALTER TABLE public.lojistas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Lojistas
DO $$
BEGIN
    DROP POLICY IF EXISTS "Lojistas: usuário vê seu próprio registro" ON public.lojistas;
    DROP POLICY IF EXISTS "Lojistas: usuário edita seu próprio registro" ON public.lojistas;
    DROP POLICY IF EXISTS "Lojistas: super adm tem acesso total" ON public.lojistas;
END $$;

CREATE POLICY "Lojistas: usuário vê seu próprio registro"
    ON public.lojistas FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Lojistas: usuário edita seu próprio registro"
    ON public.lojistas FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Lojistas: super adm tem acesso total"
    ON public.lojistas FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users au
            WHERE au.id = auth.uid()
            AND (au.raw_user_meta_data->>'role') = 'super_admin'
        )
    );

-- 2. Atualização da tabela de Currículos (Profissionais)
-- Nota: A tabela public.curriculos já existe
ALTER TABLE public.curriculos 
ADD COLUMN IF NOT EXISTS busca_vaga BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS presta_servico BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS telefone TEXT,
ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Trigger para updated_at em lojistas
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    DROP TRIGGER IF EXISTS tr_lojistas_updated_at ON public.lojistas;
END $$;

CREATE TRIGGER tr_lojistas_updated_at
    BEFORE UPDATE ON public.lojistas
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
