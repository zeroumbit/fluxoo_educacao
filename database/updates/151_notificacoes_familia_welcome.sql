-- Migração 151: Criação da tabela notificacoes_familia para Informativo de Boas-Vindas
-- Objetivo: Suportar o envio de comunicações personalizadas para os responsáveis no Portal da Família.

-- 1. Criação da Tabela
CREATE TABLE IF NOT EXISTS public.notificacoes_familia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    responsavel_id UUID NOT NULL REFERENCES public.responsaveis(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL, -- Ex: 'WELCOME_RELEASE', 'AVISO_FINANCEIRO'
    titulo TEXT NOT NULL,
    conteudo_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    lida BOOLEAN NOT NULL DEFAULT false,
    lida_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Índices para Performance
CREATE INDEX IF NOT EXISTS idx_notif_familia_tenant ON public.notificacoes_familia(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notif_familia_responsavel ON public.notificacoes_familia(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_notif_familia_lida ON public.notificacoes_familia(lida) WHERE NOT lida;

-- 3. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_notif_familia') THEN
        CREATE TRIGGER set_updated_at_notif_familia
        BEFORE UPDATE ON public.notificacoes_familia
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 4. RLS - Row Level Security
ALTER TABLE public.notificacoes_familia ENABLE ROW LEVEL SECURITY;

-- Política: Responsável pode ler suas próprias notificações
CREATE POLICY "Responsáveis podem ver suas próprias notificações"
ON public.notificacoes_familia
FOR SELECT
TO authenticated
USING (
    responsavel_id IN (
        SELECT id FROM public.responsaveis WHERE user_id = auth.uid()
    )
);

-- Política: Responsável pode marcar como lida
CREATE POLICY "Responsáveis podem atualizar status de lida"
ON public.notificacoes_familia
FOR UPDATE
TO authenticated
USING (
    responsavel_id IN (
        SELECT id FROM public.responsaveis WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    responsavel_id IN (
        SELECT id FROM public.responsaveis WHERE user_id = auth.uid()
    )
);

-- Política: App (Service/Gestor) pode gerenciar tudo (via bypass ou service role se necessário)
-- No nosso caso, o backend (Supabase Client com Service Role ou RLS do Gestor) cuidará de criar
CREATE POLICY "Gestores podem gerenciar notificações da escola"
ON public.notificacoes_familia
FOR ALL
TO authenticated
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

-- Comentário da Tabela para documentação automática
COMMENT ON TABLE public.notificacoes_familia IS 'Tabela de notificações específicas para o Portal da Família, incluindo boas-vindas e avisos financeiros.';
