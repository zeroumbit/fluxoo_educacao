-- =====================================================
-- MIGRACAO: Webhook Idempotencia + Concorrencia Segura
-- Arquivo: 137_webhook_idempotencia_e_concorrencia.sql
-- Descricao:
--   1. Tabela webhook_events_log (idempotencia de webhooks)
--   2. Coluna gateway_event_id em cobrancas (rastreio)
--   3. RPC registrar_pagamento_webhook (webhook gateway)
--   4. RPC baixar_boleto_concorrencia (baixa manual com FOR UPDATE)
-- IDEMPOTENTE: Seguro para rodar multiplas vezes.
-- =====================================================

-- =====================================================
-- 1. TABELA: webhook_events_log (Idempotencia)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.webhook_events_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificador unico do evento no gateway (ASAAS/MERCADO_PAGO)
    -- Este e o campo que garante idempotencia: mesmo event_id = mesmo evento
    gateway_event_id TEXT NOT NULL,

    -- Qual gateway originou o evento
    gateway TEXT NOT NULL CHECK (gateway IN ('asaas', 'mercado_pago')),

    -- Tipo do evento recebido (ex: PAYMENT_CONFIRMED, PAYMENT_RECEIVED)
    event_type TEXT NOT NULL,

    -- Payload CRUA recebida do gateway (para auditoria e reprocessamento)
    raw_payload JSONB NOT NULL,

    -- ID da cobranca local que foi afetada
    cobranca_id UUID REFERENCES public.cobrancas(id) ON DELETE SET NULL,

    -- Resultado do processamento
    processing_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (processing_status IN ('pending', 'processed', 'ignored_duplicate', 'error')),

    -- Detalhes do resultado (erro, sucesso, motivo da duplicata ignorada)
    processing_details JSONB,

    -- Quando o evento foi recebido
    received_at TIMESTAMPTZ DEFAULT NOW(),

    -- Quando foi processado (NULL se ainda pendente ou ignorado)
    processed_at TIMESTAMPTZ,

    -- Tentativas de processamento (para retry em caso de erro)
    retry_count INTEGER DEFAULT 0,

    -- Hash do payload para verificacao de integridade adicional
    payload_hash TEXT GENERATED ALWAYS AS (
        md5(raw_payload::text)
    ) STORED
);

-- INDICE UNIQUE: garante idempotencia no banco
-- Se o mesmo gateway + event_id chegar duas vezes, o INSERT falha
-- e o sistema pode tratar como duplicata.
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_unique
    ON public.webhook_events_log (gateway, gateway_event_id);

-- INDICES de consulta
CREATE INDEX IF NOT EXISTS idx_webhook_events_status
    ON public.webhook_events_log (processing_status);

CREATE INDEX IF NOT EXISTS idx_webhook_events_cobranca
    ON public.webhook_events_log (cobranca_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_received
    ON public.webhook_events_log (received_at DESC);

COMMENT ON TABLE public.webhook_events_log IS 'Log de eventos de webhook para garantir idempotencia. Cada gateway_event_id e unico por gateway.';
COMMENT ON INDEX public.idx_webhook_events_unique IS 'Garante que o mesmo evento do gateway nunca seja processado duas vezes.';

-- =====================================================
-- 2. ALTER TABLE: Adicionar gateway_event_id em cobrancas
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

COMMENT ON COLUMN public.cobrancas.gateway_event_id IS 'ID do evento no gateway que originou esta baixa. Para rastreio e auditoria.';
COMMENT ON COLUMN public.cobrancas.gateway_origem IS 'Gateway que processou o pagamento (asaas, mercado_pago).';
COMMENT ON COLUMN public.cobrancas.webhook_payload IS 'Payload completo do webhook para auditoria forense.';

-- =====================================================
-- 3. RPC: registrar_pagamento_webhook
--     Usada pela Edge Function para baixar cobranca via webhook.
--     Usa SELECT ... FOR UPDATE para evitar dupla baixa.
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
    v_duplicate_check RECORD;
BEGIN
    -- ==========================================
    -- A) Validar gateway
    -- ==========================================
    IF p_gateway NOT IN ('asaas', 'mercado_pago') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Gateway nao suportado',
            'gateway', p_gateway
        );
    END IF;

    -- ==========================================
    -- B) Buscar a cobranca COM LOCK (FOR UPDATE)
    --    Impede que outra transacao concorrente
    --    processe a mesma cobranca simultaneamente.
    -- ==========================================
    SELECT * INTO v_cobranca
    FROM public.cobrancas
    WHERE id = p_cobranca_id
      AND deleted_at IS NULL
    FOR UPDATE NOWAIT;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cobranca nao encontrada ou foi removida',
            'cobranca_id', p_cobranca_id
        );
    END IF;

    -- ==========================================
    -- C) Protecao contra dupla baixa
    --    Se ja esta paga, rejeita imediatamente.
    -- ==========================================
    IF v_cobranca.pago = TRUE OR v_cobranca.status = 'pago' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cobranca ja foi paga. Baixa duplicata rejeitada.',
            'cobranca_id', p_cobranca_id,
            'data_pagamento', v_cobranca.data_pagamento,
            'valor_pago', v_cobranca.valor_pago
        );
    END IF;

    -- ==========================================
    -- D) Calcular encargos se houver atraso
    -- ==========================================
    SELECT config_financeira INTO v_config
    FROM public.configuracoes_escola
    WHERE tenant_id = v_cobranca.tenant_id
      AND vigencia_fim IS NULL
    LIMIT 1;

    v_dias_carencia := COALESCE((v_config->>'dias_carencia')::INTEGER, 0);
    v_dias_atraso := GREATEST(0, CURRENT_DATE - v_cobranca.data_vencimento - v_dias_carencia);

    IF v_cobranca.override_manual = TRUE THEN
        -- Override manual: sem encargos
        v_valor_total := v_cobranca.valor;
    ELSIF v_dias_atraso <= 0 THEN
        -- Em dia ou dentro da carencia
        v_valor_total := v_cobranca.valor;
    ELSE
        -- Calcular multa (limitada a 2% conforme CDC)
        v_multa_valor := ROUND(
            v_cobranca.valor * LEAST(COALESCE((v_config->>'multa_atraso_perc')::DECIMAL, 2.0), 2.0) / 100,
            2
        );

        -- Calcular juros (1% a.m. = ~0.03333% a.d.)
        v_juros_valor := ROUND(
            v_cobranca.valor * (COALESCE((v_config->>'juros_mora_mensal_perc')::DECIMAL, 1.0) / 100 / 30) * v_dias_atraso,
            2
        );

        -- Multa fixa
        v_multa_fixa := COALESCE((v_config->>'multa_fixa')::DECIMAL, 0);

        v_valor_total := v_cobranca.valor + v_multa_valor + v_juros_valor + v_multa_fixa;
    END IF;

    -- ==========================================
    -- E) Atualizar a cobranca
    -- ==========================================
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

    -- ==========================================
    -- F) Registrar log de auditoria
    -- ==========================================
    BEGIN
        INSERT INTO public.audit_logs_v2 (
            tenant_id, user_id, acao, recurso_id,
            dados_anteriores, dados_novos, motivo_declarado
        ) VALUES (
            v_cobranca.tenant_id,
            NULL, -- Pagamento via sistema (webhook)
            'financeiro.cobrancas.pagar_webhook',
            p_cobranca_id,
            jsonb_build_object(
                'valor', v_cobranca.valor,
                'status_anterior', v_cobranca.status,
                'pago_anterior', v_cobranca.pago
            ),
            jsonb_build_object(
                'valor_pago', v_valor_total,
                'multa', v_multa_valor,
                'juros', v_juros_valor,
                'gateway', p_gateway,
                'gateway_event_id', p_gateway_event_id,
                'forma_pagamento', p_forma_pagamento
            ),
            'Pagamento recebido via webhook do gateway ' || p_gateway
        );
    EXCEPTION WHEN OTHERS THEN
        -- Nao bloquear pagamento se auditoria falhar
        NULL;
    END;

    -- ==========================================
    -- G) Registrar na tabela de cobrancas (gateway)
    -- ==========================================
    BEGIN
        INSERT INTO public.webhook_events_log (
            gateway_event_id,
            gateway,
            event_type,
            raw_payload,
            cobranca_id,
            processing_status,
            processing_details,
            processed_at
        ) VALUES (
            p_gateway_event_id,
            p_gateway,
            'PAYMENT_CONFIRMED',
            COALESCE(p_webhook_payload, '{}'::jsonb),
            p_cobranca_id,
            'processed',
            jsonb_build_object(
                'valor_original', v_cobranca.valor,
                'valor_pago', v_valor_total,
                'multa', v_multa_valor,
                'juros', v_juros_valor
            ),
            NOW()
        );
    EXCEPTION WHEN unique_violation THEN
        -- Idempotencia: evento ja registrado, ignorar
        NULL;
    END;

    -- ==========================================
    -- H) Retornar resultado
    -- ==========================================
    RETURN jsonb_build_object(
        'success', true,
        'cobranca_id', p_cobranca_id,
        'valor_original', v_cobranca.valor,
        'valor_pago', v_valor_total,
        'multa', v_multa_valor,
        'juros', v_juros_valor,
        'multa_fixa', v_multa_fixa,
        'dias_atraso', v_dias_atraso,
        'dias_carencia', v_dias_carencia,
        'gateway', p_gateway,
        'gateway_event_id', p_gateway_event_id
    );

EXCEPTION
    WHEN lock_not_available THEN
        -- Outra transacao ja esta processando esta cobranca.
        -- Retorna erro para o gateway poder fazer retry.
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cobranca bloqueada por outra transacao. Tente novamente.',
            'cobranca_id', p_cobranca_id,
            'retry', true
        );
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'cobranca_id', p_cobranca_id
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.registrar_pagamento_webhook IS 'Registra pagamento recebido via webhook do gateway com protecao contra dupla baixa e idempotencia.';

-- =====================================================
-- 4. RPC: baixar_boleto_concorrencia
--     Para baixa manual de boletos no frontend.
--     Usa SELECT ... FOR UPDATE SKIP LOCKED para evitar
--     que dois cliques simultaneos causem dupla cobranca.
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
    -- ==========================================
    -- A) Buscar cobranca COM LOCK
    --    FOR UPDATE NOWAIT: se outra sessao ja
    --    bloqueou esta linha, falha imediatamente
    --    evitando dupla baixa.
    -- ==========================================
    SELECT * INTO v_cobranca
    FROM public.cobrancas
    WHERE id = p_cobranca_id
      AND deleted_at IS NULL
    FOR UPDATE NOWAIT;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cobranca nao encontrada ou foi removida',
            'cobranca_id', p_cobranca_id
        );
    END IF;

    -- ==========================================
    -- B) Protecao contra dupla baixa
    -- ==========================================
    IF v_cobranca.pago = TRUE OR v_cobranca.status = 'pago' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Esta cobranca ja foi baixada. Operacao rejeitada para evitar duplicata.',
            'cobranca_id', p_cobranca_id,
            'data_pagamento', v_cobranca.data_pagamento,
            'valor_pago', v_cobranca.valor_pago,
            'ja_pago', true
        );
    END IF;

    -- ==========================================
    -- C) Calcular encargos
    -- ==========================================
    SELECT config_financeira INTO v_config
    FROM public.configuracoes_escola
    WHERE tenant_id = v_cobranca.tenant_id
      AND vigencia_fim IS NULL
    LIMIT 1;

    v_dias_carencia := COALESCE((v_config->>'dias_carencia')::INTEGER, 0);
    v_dias_atraso := GREATEST(0, CURRENT_DATE - v_cobranca.data_vencimento - v_dias_carencia);

    IF v_cobranca.override_manual = TRUE THEN
        v_valor_total := v_cobranca.valor;
    ELSIF v_dias_atraso <= 0 THEN
        v_valor_total := v_cobranca.valor;
    ELSE
        v_multa_valor := ROUND(
            v_cobranca.valor * LEAST(COALESCE((v_config->>'multa_atraso_perc')::DECIMAL, 2.0), 2.0) / 100,
            2
        );

        v_juros_valor := ROUND(
            v_cobranca.valor * (COALESCE((v_config->>'juros_mora_mensal_perc')::DECIMAL, 1.0) / 100 / 30) * v_dias_atraso,
            2
        );

        v_multa_fixa := COALESCE((v_config->>'multa_fixa')::DECIMAL, 0);
        v_valor_total := v_cobranca.valor + v_multa_valor + v_juros_valor + v_multa_fixa;
    END IF;

    -- ==========================================
    -- D) Atualizar cobranca
    -- ==========================================
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
        codigo_transacao = COALESCE(p_codigo_transacao, codigo_transacao),
        updated_at = NOW()
    WHERE id = p_cobranca_id;

    -- ==========================================
    -- E) Auditoria
    -- ==========================================
    BEGIN
        INSERT INTO public.audit_logs_v2 (
            tenant_id, user_id, acao, recurso_id,
            dados_anteriores, dados_novos, motivo_declarado
        ) VALUES (
            v_cobranca.tenant_id,
            COALESCE(p_usuario_id, auth.uid()),
            'financeiro.cobrancas.baixar_boleto_manual',
            p_cobranca_id,
            jsonb_build_object(
                'valor', v_cobranca.valor,
                'status_anterior', v_cobranca.status,
                'pago_anterior', v_cobranca.pago
            ),
            jsonb_build_object(
                'valor_pago', v_valor_total,
                'multa', v_multa_valor,
                'juros', v_juros_valor,
                'forma_pagamento', p_forma_pagamento
            ),
            'Baixa manual de boleto via interface'
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- ==========================================
    -- F) Retornar resultado
    -- ==========================================
    RETURN jsonb_build_object(
        'success', true,
        'cobranca_id', p_cobranca_id,
        'valor_original', v_cobranca.valor,
        'valor_pago', v_valor_total,
        'multa', v_multa_valor,
        'juros', v_juros_valor,
        'multa_fixa', v_multa_fixa,
        'dias_atraso', v_dias_atraso,
        'dias_carencia', v_dias_carencia,
        'forma_pagamento', p_forma_pagamento,
        'codigo_transacao', p_codigo_transacao
    );

EXCEPTION
    WHEN lock_not_available THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Esta cobranca esta sendo processada por outra sessao. Aguarde e tente novamente.',
            'cobranca_id', p_cobranca_id,
            'retry', true,
            'concorrencia', true
        );
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'cobranca_id', p_cobranca_id
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.baixar_boleto_concorrencia IS 'Baixa manual de boleto com protecao de concorrencia via SELECT FOR UPDATE. Impede dupla cobranca por cliques simultaneos.';

-- =====================================================
-- FIM DA MIGRACAO
-- =====================================================
