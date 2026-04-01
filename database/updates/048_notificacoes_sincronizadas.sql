-- ==============================================================================
-- 📢 NOTIFICAÇÕES SINCRONIZADAS (WEB + MOBILE)
-- ==============================================================================
-- Cria tabela centralizada de notificações para sincronização entre dispositivos
-- ==============================================================================

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS public.notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID, -- NULL = notificação para todos os usuários do tenant
    tipo TEXT NOT NULL, -- 'RADAR_EVASAO', 'DOCUMENTO', 'FINANCEIRO', 'MATRICULA', etc.
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    href TEXT NOT NULL, -- Rota para navegação
    categoria TEXT NOT NULL, -- 'ESCOLAS', 'SUPER_ADMIN', 'PORTAL'
    prioridade INTEGER DEFAULT 1, -- 1 = alta, 2 = média, 3 = baixa
    lida BOOLEAN DEFAULT FALSE,
    resolvida BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}', -- Dados adicionais (ex: aluno_id, documento_id, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    lida_em TIMESTAMPTZ,
    resolvida_em TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_tenant_id ON public.notificacoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_id ON public.notificacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON public.notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_resolvida ON public.notificacoes(resolvida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_created_at ON public.notificacoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON public.notificacoes(tipo);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION fn_notificacoes_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notificacoes_update_updated_at ON public.notificacoes;
CREATE TRIGGER trg_notificacoes_update_updated_at
    BEFORE UPDATE ON public.notificacoes
    FOR EACH ROW
    EXECUTE FUNCTION fn_notificacoes_update_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
-- 1. Super Admin pode ver todas as notificações
CREATE POLICY "Super Admin visualiza todas as notificações"
    ON public.notificacoes
    FOR SELECT
    USING (
        auth.jwt() ->> 'role' = 'super_admin'
    );

-- 2. Gestor e funcionários veem apenas notificações do seu tenant
CREATE POLICY "Gestor e funcionários visualizam notificações do tenant"
    ON public.notificacoes
    FOR SELECT
    USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text
        AND (
            auth.jwt() ->> 'role' IN ('gestor', 'funcionario', 'professor')
            OR user_id IS NULL
            OR user_id = (auth.jwt() ->> 'user_id')::uuid
        )
    );

-- 3. Responsável veem apenas suas notificações no portal
CREATE POLICY "Responsável visualiza suas notificações no portal"
    ON public.notificacoes
    FOR SELECT
    USING (
        auth.jwt() ->> 'responsavel_id' = metadata->>'responsavel_id'
        AND auth.jwt() ->> 'app' = 'portal'
    );

-- 4. Gestor pode criar/atualizar notificações do seu tenant
CREATE POLICY "Gestor gerencia notificações do tenant"
    ON public.notificacoes
    FOR ALL
    USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text
        AND auth.jwt() ->> 'role' = 'gestor'
    );

-- 5. Super Admin pode gerenciar todas as notificações
CREATE POLICY "Super Admin gerencia todas as notificações"
    ON public.notificacoes
    FOR ALL
    USING (
        auth.jwt() ->> 'role' = 'super_admin'
    );

-- ==============================================================================
-- FUNÇÃO PARA MARCAR NOTIFICAÇÃO COMO LIDA
-- ==============================================================================
CREATE OR REPLACE FUNCTION marcar_notificacao_lida(notificacao_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.notificacoes
    SET 
        lida = TRUE,
        lida_em = NOW()
    WHERE id = notificacao_id
    AND (
        auth.jwt() ->> 'role' = 'super_admin'
        OR auth.jwt() ->> 'tenant_id' = tenant_id::text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- FUNÇÃO PARA MARCAR NOTIFICAÇÃO COMO RESOLVIDA
-- ==============================================================================
CREATE OR REPLACE FUNCTION marcar_notificacao_resolvida(notificacao_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.notificacoes
    SET 
        resolvida = TRUE,
        resolvida_em = NOW()
    WHERE id = notificacao_id
    AND (
        auth.jwt() ->> 'role' = 'super_admin'
        OR auth.jwt() ->> 'tenant_id' = tenant_id::text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- FUNÇÃO PARA CRIAR NOTIFICAÇÃO AUTOMÁTICA DO RADAR DE EVASÃO
-- ==============================================================================
CREATE OR REPLACE FUNCTION criar_notificacao_radar_evasao()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
    v_aluno_nome TEXT;
BEGIN
    -- Obtém tenant_id e nome do aluno
    SELECT tenant_id, nome_completo INTO v_tenant_id, v_aluno_nome
    FROM public.alunos
    WHERE id = NEW.aluno_id;

    -- Cria notificação apenas se for um novo alerta (INSERT)
    IF v_tenant_id IS NOT NULL THEN
        INSERT INTO public.notificacoes (
            tenant_id,
            tipo,
            titulo,
            mensagem,
            href,
            categoria,
            prioridade,
            metadata
        ) VALUES (
            v_tenant_id,
            'RADAR_EVASAO',
            'Aluno em risco de evasão',
            v_aluno_nome || ' apresenta sinais de risco de evasão.',
            '/dashboard',
            'ESCOLAS',
            1,
            jsonb_build_object('aluno_id', NEW.aluno_id, 'aluno_nome', v_aluno_nome)
        )
        ON CONFLICT DO NOTHING; -- Evita duplicatas
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar notificação automática quando aluno entrar no radar
DROP TRIGGER IF EXISTS trg_criar_notificacao_radar_evasao ON public.vw_radar_evasao;
-- Nota: Não é possível criar trigger em VIEW, precisamos usar abordagem alternativa
-- A notificação será criada via serviço na aplicação

-- ==============================================================================
-- COMENTÁRIOS
-- ==============================================================================
COMMENT ON TABLE public.notificacoes IS 'Tabela centralizada de notificações para sincronização web/mobile';
COMMENT ON COLUMN public.notificacoes.tipo IS 'Tipo de notificação: RADAR_EVASAO, DOCUMENTO, FINANCEIRO, MATRICULA, etc.';
COMMENT ON COLUMN public.notificacoes.categoria IS 'Categoria: ESCOLAS, SUPER_ADMIN, PORTAL';
COMMENT ON COLUMN public.notificacoes.prioridade IS '1 = Alta (vermelho), 2 = Média (âmbar), 3 = Baixa (azul)';
COMMENT ON COLUMN public.notificacoes.metadata IS 'Dados adicionais em JSONB: aluno_id, documento_id, responsavel_id, etc.';
COMMENT ON FUNCTION public.marcar_notificacao_lida IS 'Marca notificação como lida';
COMMENT ON FUNCTION public.marcar_notificacao_resolvida IS 'Marca notificação como resolvida (remove do sino)';
