-- =====================================================
-- MIGRACAO: Motor Financeiro v2 - Webhook + Concorrencia
-- Arquivo: 137_motor_financeiro_v2.sql
-- Descricao COMPLETA:
--   1. Tabela gateway_config (Super Admin ativa, escola configura tokens)
--   2. Tabela gateway_tenant_config (tokens por escola)
--   3. Tabela webhook_events_log (idempotencia de webhooks)
--   4. Colunas de rastreio em cobrancas
--   5. RPC registrar_pagamento_webhook (com SELECT FOR UPDATE)
--   6. RPC baixar_boleto_concorrencia (baixa manual com FOR UPDATE)
--   7. Modulo 'gateway_pagamento' para controle de acesso
-- IDEMPOTENTE: Seguro para rodar multiplas vezes.
-- Tolerante: funciona mesmo que tabelas base nao existam ainda.
-- =====================================================

-- =====================================================
-- 0. PRE-REQUISITOS: Criar tabelas base se nao existirem
--    (Sem FK para evitar erros circulares)
-- =====================================================

-- Tabela cobrancas (sem FK para evitar erro 42P01)
CREATE TABLE IF NOT EXISTS public.cobrancas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    aluno_id UUID,
    descricao TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status TEXT DEFAULT 'a_vencer',
    pago BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela escolas (sem FK para evitar erro 42P01)
CREATE TABLE IF NOT EXISTS public.escolas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    cnpj TEXT,
    status_assinatura TEXT DEFAULT 'pendente',
    plano_id UUID,
    gestor_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela configuracoes_escola (sem FK)
CREATE TABLE IF NOT EXISTS public.configuracoes_escola (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    contexto TEXT NOT NULL DEFAULT 'escola',
    contexto_id UUID,
    config_financeira JSONB NOT NULL DEFAULT '{}',
    vigencia_inicio DATE DEFAULT CURRENT_DATE,
    vigencia_fim DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID,
    UNIQUE (tenant_id, contexto, vigencia_fim)
);

-- Tabela audit_logs_v2
CREATE TABLE IF NOT EXISTS public.audit_logs_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    user_id UUID,
    acao TEXT NOT NULL,
    recurso_id UUID,
    dados_anteriores JSONB,
    dados_novos JSONB,
    motivo_declarado TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela modulos (sem FK)
CREATE TABLE IF NOT EXISTS public.modulos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    codigo TEXT UNIQUE NOT NULL,
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela planos (sem FK)
CREATE TABLE IF NOT EXISTS public.planos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao_curta TEXT,
    valor_por_aluno DECIMAL(10,2) DEFAULT 0,
    status BOOLEAN DEFAULT true,
    tipo_empresa TEXT DEFAULT 'escolas',
    tipo_pagamento TEXT DEFAULT 'gratuito',
    validade_meses INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela plano_modulo (sem FK para evitar erro 42P01)
CREATE TABLE IF NOT EXISTS public.plano_modulo (
    plano_id UUID,
    modulo_id UUID,
    PRIMARY KEY (plano_id, modulo_id)
);

-- Registrar o modulo de gateway de pagamento
INSERT INTO public.modulos (nome, codigo, descricao)
VALUES ('Gateway de Pagamento', 'gateway_pagamento', 'Integracao com Asaas e Mercado Pago para recebimento automatico de mensalidades')
ON CONFLICT (codigo) DO NOTHING;

-- =====================================================
-- 1. TABELA: gateway_config (Global - Super Admin)
-- =====================================================

-- Drop constraint se existir (para recriar com novos gateways)
ALTER TABLE public.gateway_config DROP CONSTRAINT IF EXISTS gateway_config_gateway_check;

CREATE TABLE IF NOT EXISTS public.gateway_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway TEXT NOT NULL UNIQUE CHECK (gateway IN ('asaas', 'mercado_pago', 'abacate_pay', 'efi', 'pagseguro')),
    nome_exibicao TEXT NOT NULL,
    ativo_global BOOLEAN NOT NULL DEFAULT false,
    logo_url TEXT,
    doc_url TEXT,
    campos_config JSONB NOT NULL DEFAULT '[]'::jsonb,
    ordem_exibicao INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed: gateways disponiveis (desativados por padrao)
INSERT INTO public.gateway_config (gateway, nome_exibicao, ativo_global, campos_config, ordem_exibicao)
VALUES
    ('asaas', 'Asaas', false,
     '[
        {"key":"api_token","label":"API Token","type":"password","required":true,"help":"Obtenha em Configuracoes > Integracoes no painel Asaas"},
        {"key":"webhook_token","label":"Webhook Token","type":"password","required":true,"help":"Token de validacao do webhook"},
        {"key":"sandbox","label":"Modo Sandbox","type":"boolean","required":false,"default":false}
     ]'::jsonb, 1),
    ('mercado_pago', 'Mercado Pago', false,
     '[
        {"key":"access_token","label":"Access Token","type":"password","required":true,"help":"Obtenha em https://www.mercadopago.com.br/developers/panel/app"},
        {"key":"public_key","label":"Public Key","type":"text","required":false,"help":"Necessario para checkout transparent"},
        {"key":"webhook_secret","label":"Webhook Secret","type":"password","required":false,"help":"Para validacao de assinatura dos webhooks"}
     ]'::jsonb, 2),
    ('abacate_pay', 'Abacate Pay', false,
     '[
        {"key":"api_key","label":"API Key","type":"password","required":true,"help":"Obtenha no painel do Abacate Pay"},
        {"key":"api_secret","label":"API Secret","type":"password","required":true,"help":"Chave secreta da API"},
        {"key":"webhook_token","label":"Webhook Token","type":"password","required":true,"help":"Token para validar webhooks"},
        {"key":"sandbox","label":"Modo Sandbox","type":"boolean","required":false,"default":false}
     ]'::jsonb, 3),
    ('efi', 'EFI (EfiPay)', false,
     '[
        {"key":"client_id","label":"Client ID","type":"text","required":true,"help":"Obtenha no painel EFI"},
        {"key":"client_secret","label":"Client Secret","type":"password","required":true,"help":"Segredo do cliente"},
        {"key":"pix_cert","label":"Certificado PIX (PEM)","type":"textarea","required":false,"help":"Certificado para PIX"}
     ]'::jsonb, 4),
    ('pagseguro', 'PagSeguro', false,
     '[
        {"key":"email","label":"Email PagSeguro","type":"text","required":true,"help":"Email da conta PagSeguro"},
        {"key":"token","label":"Token","type":"password","required":true,"help":"Token de integracao"},
        {"key":"sandbox","label":"Modo Sandbox","type":"boolean","required":false,"default":false}
     ]'::jsonb, 5)
ON CONFLICT (gateway) DO NOTHING;

-- =====================================================
-- 2. TABELA: gateway_tenant_config (Por Escola)
-- =====================================================

-- Drop constraint se existir
ALTER TABLE public.gateway_tenant_config DROP CONSTRAINT IF EXISTS gateway_tenant_config_gateway_check;

CREATE TABLE IF NOT EXISTS public.gateway_tenant_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    gateway TEXT NOT NULL CHECK (gateway IN ('asaas', 'mercado_pago', 'abacate_pay', 'efi', 'pagseguro')),
    ativo BOOLEAN NOT NULL DEFAULT false,
    configuracao JSONB NOT NULL DEFAULT '{}'::jsonb,
    modo_teste BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID,
    UNIQUE (tenant_id, gateway)
);

CREATE INDEX IF NOT EXISTS idx_gateway_tenant_tenant
    ON public.gateway_tenant_config (tenant_id);

CREATE INDEX IF NOT EXISTS idx_gateway_tenant_ativo
    ON public.gateway_tenant_config (tenant_id, ativo)
    WHERE ativo = true;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.fn_atualiza_updated_at_gateway_tenant()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_updated_at_gateway_tenant ON public.gateway_tenant_config;
CREATE TRIGGER trg_updated_at_gateway_tenant
    BEFORE UPDATE ON public.gateway_tenant_config
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_atualiza_updated_at_gateway_tenant();

-- =====================================================
-- 3. TABELA: webhook_events_log (Idempotencia)
-- =====================================================

-- Drop constraint se existir
ALTER TABLE public.webhook_events_log DROP CONSTRAINT IF EXISTS webhook_events_log_gateway_check;

CREATE TABLE IF NOT EXISTS public.webhook_events_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway_event_id TEXT NOT NULL,
    gateway TEXT NOT NULL CHECK (gateway IN ('asaas', 'mercado_pago', 'abacate_pay', 'efi', 'pagseguro')),
    tenant_id UUID,
    event_type TEXT NOT NULL,
    raw_payload JSONB NOT NULL,
    cobranca_id UUID,
    processing_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (processing_status IN ('pending', 'processed', 'ignored_duplicate', 'error')),
    processing_details JSONB,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    retry_count INTEGER DEFAULT 0,
    payload_hash TEXT GENERATED ALWAYS AS (md5(raw_payload::text)) STORED
);

-- INDICE UNIQUE: garante idempotencia
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_unique
    ON public.webhook_events_log (gateway, gateway_event_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_tenant
    ON public.webhook_events_log (tenant_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_status
    ON public.webhook_events_log (processing_status);

CREATE INDEX IF NOT EXISTS idx_webhook_events_cobranca
    ON public.webhook_events_log (cobranca_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_received
    ON public.webhook_events_log (received_at DESC);

-- =====================================================
-- 4. ALTER TABLE: Colunas de rastreio em cobrancas
-- =====================================================

ALTER TABLE public.cobrancas
    ADD COLUMN IF NOT EXISTS gateway_event_id TEXT;

ALTER TABLE public.cobrancas
    ADD COLUMN IF NOT EXISTS gateway_origem TEXT;

ALTER TABLE public.cobrancas
    ADD COLUMN IF NOT EXISTS webhook_payload JSONB;

CREATE INDEX IF NOT EXISTS idx_cobrancas_gateway_event
    ON public.cobrancas (gateway_event_id)
    WHERE gateway_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cobrancas_gateway_origem
    ON public.cobrancas (gateway_origem)
    WHERE gateway_origem IS NOT NULL;

-- =====================================================
-- 5. RPC: registrar_pagamento_webhook
-- =====================================================

CREATE OR REPLACE FUNCTION public.registrar_pagamento_webhook(
    p_cobranca_id UUID,
    p_gateway TEXT,
    p_gateway_event_id TEXT,
    p_valor_pago DECIMAL(10,2),
    p_forma_pagamento TEXT DEFAULT NULL,
    p_codigo_transacao TEXT DEFAULT NULL,
    p_comprovante_url TEXT DEFAULT NULL,
    p_webhook_payload JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_cobranca RECORD;
    v_config JSONB;
    v_dias_atraso INTEGER;
    v_multa_valor DECIMAL(10,2) := 0;
    v_juros_valor DECIMAL(10,2) := 0;
    v_multa_fixa DECIMAL(10,2) := 0;
    v_valor_total DECIMAL(10,2);
    v_dias_carencia INTEGER := 0;
BEGIN
    -- A) Validar gateway
    IF p_gateway NOT IN ('asaas', 'mercado_pago', 'abacate_pay', 'efi', 'pagseguro') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Gateway nao suportado', 'gateway', p_gateway);
    END IF;

    -- B) SELECT FOR UPDATE NOWAIT
    SELECT * INTO v_cobranca
    FROM public.cobrancas
    WHERE id = p_cobranca_id AND deleted_at IS NULL
    FOR UPDATE NOWAIT;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cobranca nao encontrada ou foi removida', 'cobranca_id', p_cobranca_id);
    END IF;

    -- C) Protecao contra DUPLA BAIXA
    IF v_cobranca.pago = TRUE OR v_cobranca.status = 'pago' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cobranca ja foi paga. Baixa duplicata rejeitada.',
            'cobranca_id', p_cobranca_id,
            'data_pagamento', v_cobranca.data_pagamento,
            'valor_pago', v_cobranca.valor_pago
        );
    END IF;

    -- D) Calcular encargos
    BEGIN
        SELECT config_financeira INTO v_config
        FROM public.configuracoes_escola
        WHERE tenant_id = v_cobranca.tenant_id AND vigencia_fim IS NULL
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        v_config := '{}';
    END;

    v_dias_carencia := COALESCE((v_config->>'dias_carencia')::INTEGER, 0);
    v_dias_atraso := GREATEST(0, CURRENT_DATE - v_cobranca.data_vencimento - v_dias_carencia);

    IF v_cobranca.override_manual = TRUE THEN
        v_valor_total := v_cobranca.valor;
    ELSIF v_dias_atraso <= 0 THEN
        v_valor_total := v_cobranca.valor;
    ELSE
        v_multa_valor := ROUND(v_cobranca.valor * LEAST(COALESCE((v_config->>'multa_atraso_perc')::DECIMAL, 2.0), 2.0) / 100, 2);
        v_juros_valor := ROUND(v_cobranca.valor * (COALESCE((v_config->>'juros_mora_mensal_perc')::DECIMAL, 1.0) / 100 / 30) * v_dias_atraso, 2);
        v_multa_fixa := COALESCE((v_config->>'multa_fixa')::DECIMAL, 0);
        v_valor_total := v_cobranca.valor + v_multa_valor + v_juros_valor + v_multa_fixa;
    END IF;

    -- E) Atualizar cobranca
    UPDATE public.cobrancas
    SET
        status = 'pago',
        pago = TRUE,
        data_pagamento = NOW(),
        valor_pago = v_valor_total,
        forma_pagamento = COALESCE(p_forma_pagamento, forma_pagamento),
        comprovante_url = COALESCE(p_comprovante_url, comprovante_url),
        valor_multa = v_multa_valor,
        valor_juros = v_juros_valor,
        dias_atraso_calculado = v_dias_atraso,
        taxa_multa_aplicada = LEAST(COALESCE((v_config->>'multa_atraso_perc')::DECIMAL, 2.0), 2.0),
        taxa_juros_aplicada = COALESCE((v_config->>'juros_mora_mensal_perc')::DECIMAL, 1.0),
        gateway_event_id = p_gateway_event_id,
        gateway_origem = p_gateway,
        webhook_payload = p_webhook_payload,
        codigo_transacao = COALESCE(p_codigo_transacao, codigo_transacao),
        updated_at = NOW()
    WHERE id = p_cobranca_id;

    -- F) Auditoria
    BEGIN
        INSERT INTO public.audit_logs_v2 (
            tenant_id, user_id, acao, recurso_id,
            dados_anteriores, dados_novos, motivo_declarado
        ) VALUES (
            v_cobranca.tenant_id, NULL,
            'financeiro.cobrancas.pagar_webhook',
            p_cobranca_id,
            jsonb_build_object('valor', v_cobranca.valor, 'status', v_cobranca.status, 'pago', v_cobranca.pago),
            jsonb_build_object('valor_pago', v_valor_total, 'multa', v_multa_valor, 'juros', v_juros_valor, 'gateway', p_gateway, 'gateway_event_id', p_gateway_event_id),
            'Pagamento recebido via webhook ' || p_gateway
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- G) Log de idempotencia
    BEGIN
        INSERT INTO public.webhook_events_log (
            gateway_event_id, gateway, tenant_id, event_type, raw_payload,
            cobranca_id, processing_status, processing_details, processed_at
        ) VALUES (
            p_gateway_event_id, p_gateway, v_cobranca.tenant_id, 'PAYMENT_CONFIRMED',
            COALESCE(p_webhook_payload, '{}'::jsonb), p_cobranca_id, 'processed',
            jsonb_build_object('valor_original', v_cobranca.valor, 'valor_pago', v_valor_total),
            NOW()
        );
    EXCEPTION WHEN unique_violation THEN NULL;
    END;

    RETURN jsonb_build_object(
        'success', true, 'cobranca_id', p_cobranca_id,
        'valor_original', v_cobranca.valor, 'valor_pago', v_valor_total,
        'multa', v_multa_valor, 'juros', v_juros_valor, 'multa_fixa', v_multa_fixa,
        'dias_atraso', v_dias_atraso, 'dias_carencia', v_dias_carencia,
        'gateway', p_gateway, 'gateway_event_id', p_gateway_event_id
    );

EXCEPTION
    WHEN lock_not_available THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cobranca bloqueada por outra transacao. Tente novamente.', 'cobranca_id', p_cobranca_id, 'retry', true);
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'cobranca_id', p_cobranca_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. RPC: baixar_boleto_concorrencia
-- =====================================================

CREATE OR REPLACE FUNCTION public.baixar_boleto_concorrencia(
    p_cobranca_id UUID,
    p_forma_pagamento TEXT DEFAULT 'boleto',
    p_comprovante_url TEXT DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL,
    p_codigo_transacao TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_cobranca RECORD;
    v_config JSONB;
    v_dias_atraso INTEGER;
    v_multa_valor DECIMAL(10,2) := 0;
    v_juros_valor DECIMAL(10,2) := 0;
    v_multa_fixa DECIMAL(10,2) := 0;
    v_valor_total DECIMAL(10,2);
    v_dias_carencia INTEGER := 0;
BEGIN
    -- A) SELECT FOR UPDATE NOWAIT
    SELECT * INTO v_cobranca
    FROM public.cobrancas
    WHERE id = p_cobranca_id AND deleted_at IS NULL
    FOR UPDATE NOWAIT;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cobranca nao encontrada ou foi removida', 'cobranca_id', p_cobranca_id);
    END IF;

    -- B) Protecao contra dupla baixa
    IF v_cobranca.pago = TRUE OR v_cobranca.status = 'pago' THEN
        RETURN jsonb_build_object(
            'success', false, 'error', 'Esta cobranca ja foi baixada. Operacao rejeitada para evitar duplicata.',
            'cobranca_id', p_cobranca_id, 'data_pagamento', v_cobranca.data_pagamento,
            'valor_pago', v_cobranca.valor_pago, 'ja_pago', true
        );
    END IF;

    -- C) Encargos
    BEGIN
        SELECT config_financeira INTO v_config
        FROM public.configuracoes_escola
        WHERE tenant_id = v_cobranca.tenant_id AND vigencia_fim IS NULL
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        v_config := '{}';
    END;

    v_dias_carencia := COALESCE((v_config->>'dias_carencia')::INTEGER, 0);
    v_dias_atraso := GREATEST(0, CURRENT_DATE - v_cobranca.data_vencimento - v_dias_carencia);

    IF v_cobranca.override_manual = TRUE THEN
        v_valor_total := v_cobranca.valor;
    ELSIF v_dias_atraso <= 0 THEN
        v_valor_total := v_cobranca.valor;
    ELSE
        v_multa_valor := ROUND(v_cobranca.valor * LEAST(COALESCE((v_config->>'multa_atraso_perc')::DECIMAL, 2.0), 2.0) / 100, 2);
        v_juros_valor := ROUND(v_cobranca.valor * (COALESCE((v_config->>'juros_mora_mensal_perc')::DECIMAL, 1.0) / 100 / 30) * v_dias_atraso, 2);
        v_multa_fixa := COALESCE((v_config->>'multa_fixa')::DECIMAL, 0);
        v_valor_total := v_cobranca.valor + v_multa_valor + v_juros_valor + v_multa_fixa;
    END IF;

    -- D) Atualizar
    UPDATE public.cobrancas
    SET
        status = 'pago', pago = TRUE, data_pagamento = NOW(),
        valor_pago = v_valor_total,
        forma_pagamento = COALESCE(p_forma_pagamento, forma_pagamento),
        comprovante_url = COALESCE(p_comprovante_url, comprovante_url),
        valor_multa = v_multa_valor, valor_juros = v_juros_valor,
        dias_atraso_calculado = v_dias_atraso,
        taxa_multa_aplicada = LEAST(COALESCE((v_config->>'multa_atraso_perc')::DECIMAL, 2.0), 2.0),
        taxa_juros_aplicada = COALESCE((v_config->>'juros_mora_mensal_perc')::DECIMAL, 1.0),
        codigo_transacao = COALESCE(p_codigo_transacao, codigo_transacao),
        updated_at = NOW()
    WHERE id = p_cobranca_id;

    -- E) Auditoria
    BEGIN
        INSERT INTO public.audit_logs_v2 (
            tenant_id, user_id, acao, recurso_id,
            dados_anteriores, dados_novos, motivo_declarado
        ) VALUES (
            v_cobranca.tenant_id, COALESCE(p_usuario_id, auth.uid()),
            'financeiro.cobrancas.baixar_boleto_manual', p_cobranca_id,
            jsonb_build_object('valor', v_cobranca.valor, 'status', v_cobranca.status, 'pago', v_cobranca.pago),
            jsonb_build_object('valor_pago', v_valor_total, 'multa', v_multa_valor, 'juros', v_juros_valor, 'forma_pagamento', p_forma_pagamento),
            'Baixa manual de boleto via interface'
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN jsonb_build_object(
        'success', true, 'cobranca_id', p_cobranca_id,
        'valor_original', v_cobranca.valor, 'valor_pago', v_valor_total,
        'multa', v_multa_valor, 'juros', v_juros_valor, 'multa_fixa', v_multa_fixa,
        'dias_atraso', v_dias_atraso, 'dias_carencia', v_dias_carencia,
        'forma_pagamento', p_forma_pagamento, 'codigo_transacao', p_codigo_transacao
    );

EXCEPTION
    WHEN lock_not_available THEN
        RETURN jsonb_build_object('success', false, 'error', 'Esta cobranca esta sendo processada por outra sessao. Aguarde e tente novamente.', 'cobranca_id', p_cobranca_id, 'retry', true, 'concorrencia', true);
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'cobranca_id', p_cobranca_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. VIEW: vw_gateways_disponiveis
-- =====================================================

DROP VIEW IF EXISTS public.vw_gateways_disponiveis;
CREATE VIEW public.vw_gateways_disponiveis AS
SELECT
    gc.gateway,
    gc.nome_exibicao,
    gc.logo_url,
    gc.doc_url,
    gc.ordem_exibicao,
    gc.campos_config,
    gtc.ativo AS tenant_ativo,
    gtc.configuracao IS NOT NULL AS tenant_configurado,
    gtc.modo_teste,
    gtc.updated_at AS tenant_updated_at
FROM public.gateway_config gc
LEFT JOIN public.gateway_tenant_config gtc
    ON gc.gateway = gtc.gateway
WHERE gc.ativo_global = true
ORDER BY gc.ordem_exibicao;

-- =====================================================
-- 8. RLS Policies
-- =====================================================

ALTER TABLE public.gateway_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gateway_tenant_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gestor ve propria configuracao de gateway" ON public.gateway_tenant_config;

-- Verificar se coluna gestor_user_id existe antes de criar policy
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'escolas' AND column_name = 'gestor_user_id'
    ) THEN
        CREATE POLICY "Gestor ve propria configuracao de gateway"
            ON public.gateway_tenant_config FOR ALL
            USING (
                tenant_id IN (
                    SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- =====================================================
-- 9. FUNCOES AUXILIARES
-- =====================================================

CREATE OR REPLACE FUNCTION public.gateway_disponivel_para_tenant(
    p_tenant_id UUID,
    p_gateway TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_ativo_global BOOLEAN;
BEGIN
    SELECT ativo_global INTO v_ativo_global
    FROM public.gateway_config
    WHERE gateway = p_gateway;

    IF NOT FOUND OR v_ativo_global = false THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.buscar_config_gateway_tenant(
    p_tenant_id UUID,
    p_gateway TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_config JSONB;
    v_ativo_global BOOLEAN;
BEGIN
    SELECT ativo_global INTO v_ativo_global
    FROM public.gateway_config
    WHERE gateway = p_gateway;

    IF NOT FOUND OR v_ativo_global = false THEN
        RETURN jsonb_build_object('error', 'Gateway nao ativado pelo Super Admin', 'gateway', p_gateway);
    END IF;

    SELECT configuracao INTO v_config
    FROM public.gateway_tenant_config
    WHERE tenant_id = p_tenant_id AND gateway = p_gateway AND ativo = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Gateway nao configurado pela escola', 'gateway', p_gateway);
    END IF;

    RETURN v_config;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FIM DA MIGRACAO
-- =====================================================
