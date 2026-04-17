-- ==============================================================================
-- 🚀 MIGRATION 152: HARDENING SEGURANÇA (RLS & RATE LIMITING)
-- Descrição: Habilita RLS em tabelas anteriormente excluídas e implementa
--            proteção de rate limiting a nível de banco de dados.
-- ==============================================================================

-- 1. HABILITAR RLS NAS TABELAS CRÍTICAS RESTANTES
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS PARA 'escolas'
DROP POLICY IF EXISTS "Usuários veem sua própria escola" ON public.escolas;
CREATE POLICY "Usuários veem sua própria escola" ON public.escolas
FOR SELECT TO authenticated
USING (
    id::text = (SELECT tenant_id::text FROM public.usuarios_sistema WHERE id = auth.uid())
    OR public.has_permission('escolas.view')
);

-- 3. POLÍTICAS PARA 'responsaveis'
DROP POLICY IF EXISTS "Responsáveis veem seus próprios dados" ON public.responsaveis;
CREATE POLICY "Responsáveis veem seus próprios dados" ON public.responsaveis
FOR ALL TO authenticated
USING (
    id = auth.uid() OR public.has_permission('academico.responsaveis.view')
);

-- 4. POLÍTICAS PARA 'filiais'
DROP POLICY IF EXISTS "Usuários veem filiais do seu tenant" ON public.filiais;
CREATE POLICY "Usuários veem filiais do seu tenant" ON public.filiais
FOR ALL TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM public.usuarios_sistema WHERE id = auth.uid())
    OR public.has_permission('config.escola.manage')
);

-- 5. POLÍTICAS PARA 'assinaturas' E 'faturas'
DROP POLICY IF EXISTS "Usuários veem suas assinaturas" ON public.assinaturas;
CREATE POLICY "Usuários veem suas assinaturas" ON public.assinaturas
FOR SELECT TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM public.usuarios_sistema WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Usuários veem suas faturas" ON public.faturas;
CREATE POLICY "Usuários veem suas faturas" ON public.faturas
FOR SELECT TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM public.usuarios_sistema WHERE id = auth.uid())
);

-- 6. INFRAESTRUTURA DE RATE LIMITING (DATABASE LEVEL)
CREATE TABLE IF NOT EXISTS public.audit_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- IP, UserID ou Email
    action TEXT NOT NULL,     -- 'login', 'signup', 'api_call'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para performance de limpeza e busca
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON public.audit_rate_limits(identifier, action, created_at);

-- Função para verificar rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier TEXT,
    p_action TEXT,
    p_max_attempts INTEGER,
    p_window_minutes INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_attempts INTEGER;
BEGIN
    -- Limpa registros antigos (mais velhos que a janela)
    DELETE FROM public.audit_rate_limits 
    WHERE created_at < now() - (p_window_minutes || ' minutes')::interval;

    -- Conta tentativas na janela atual
    SELECT count(*) INTO v_attempts
    FROM public.audit_rate_limits
    WHERE identifier = p_identifier 
      AND action = p_action
      AND created_at > now() - (p_window_minutes || ' minutes')::interval;

    IF v_attempts >= p_max_attempts THEN
        RETURN FALSE;
    END IF;

    -- Registra nova tentativa
    INSERT INTO public.audit_rate_limits (identifier, action)
    VALUES (p_identifier, p_action);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário de Sucesso
COMMENT ON TABLE public.audit_rate_limits IS 'Tabela de controle de fluxo para mitigar ataques de força bruta e DoS.';
