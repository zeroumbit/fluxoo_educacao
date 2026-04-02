-- =====================================================
-- MIGRAÇÃO: Sistema de Cobranças v2.0
-- Arquivo: 136_sistema_cobrancas_v2.sql
-- Descrição: VIEW otimizada, RPC de pagamento manual,
--            triggers de status e job diário.
-- IDEMPOTENTE: Seguro para rodar múltiplas vezes.
-- =====================================================

-- =====================================================
-- 1. ALTER TABLE: Adicionar colunas novas em cobrancas
-- =====================================================

-- Valor congelado no momento da geração
ALTER TABLE public.cobrancas
  ADD COLUMN IF NOT EXISTS valor_original DECIMAL(10,2);

-- Valores de pagamento
ALTER TABLE public.cobrancas
  ADD COLUMN IF NOT EXISTS valor_pago DECIMAL(10,2);
ALTER TABLE public.cobrancas
  ADD COLUMN IF NOT EXISTS valor_multa DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.cobrancas
  ADD COLUMN IF NOT EXISTS valor_juros DECIMAL(10,2) DEFAULT 0;

-- Flag booleana de pagamento
ALTER TABLE public.cobrancas
  ADD COLUMN IF NOT EXISTS pago BOOLEAN DEFAULT FALSE;

-- Controle de cálculo
ALTER TABLE public.cobrancas
  ADD COLUMN IF NOT EXISTS dias_atraso_calculado INTEGER DEFAULT 0;
ALTER TABLE public.cobrancas
  ADD COLUMN IF NOT EXISTS taxa_multa_aplicada DECIMAL(5,2);
ALTER TABLE public.cobrancas
  ADD COLUMN IF NOT EXISTS taxa_juros_aplicada DECIMAL(5,2);

-- Override manual
ALTER TABLE public.cobrancas
  ADD COLUMN IF NOT EXISTS override_manual BOOLEAN DEFAULT FALSE;
ALTER TABLE public.cobrancas
  ADD COLUMN IF NOT EXISTS motivo_override TEXT;

-- Dados de pagamento
ALTER TABLE public.cobrancas
  ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
ALTER TABLE public.cobrancas
  ADD COLUMN IF NOT EXISTS comprovante_url TEXT;

-- Soft delete
ALTER TABLE public.cobrancas
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.cobrancas
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- data_pagamento (pode ou não existir)
ALTER TABLE public.cobrancas
  ADD COLUMN IF NOT EXISTS data_pagamento TIMESTAMPTZ;

-- =====================================================
-- 2. BACKFILL: Preencher campos existentes
-- =====================================================

-- valor_original = valor (congela o valor inicial para registros existentes)
UPDATE public.cobrancas
SET valor_original = valor
WHERE valor_original IS NULL;

-- pago = TRUE onde status = 'pago'
UPDATE public.cobrancas
SET pago = TRUE
WHERE status = 'pago' AND (pago IS NULL OR pago = FALSE);

-- pago = FALSE onde status != 'pago'
UPDATE public.cobrancas
SET pago = FALSE
WHERE status != 'pago' AND pago IS NULL;

-- =====================================================
-- 3. ÍNDICES DE PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_cobrancas_tenant_status
  ON public.cobrancas (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_cobrancas_aluno_data
  ON public.cobrancas (aluno_id, data_vencimento);

CREATE INDEX IF NOT EXISTS idx_cobrancas_pago
  ON public.cobrancas (pago) WHERE pago = FALSE;

CREATE INDEX IF NOT EXISTS idx_cobrancas_deleted
  ON public.cobrancas (deleted_at) WHERE deleted_at IS NULL;

-- =====================================================
-- 4. TABELA job_logs (se não existir)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT,
    details JSONB,
    error_message TEXT
);

-- =====================================================
-- 5. VIEW: vw_cobrancas_com_encargos
-- =====================================================

DROP VIEW IF EXISTS public.vw_cobrancas_com_encargos;
CREATE OR REPLACE VIEW public.vw_cobrancas_com_encargos AS
SELECT 
    -- Campos base
    c.id,
    c.tenant_id,
    c.aluno_id,
    c.descricao,
    c.valor AS valor_original,
    c.valor, -- Compatibilidade com frontends legados que esperam a coluna 'valor'
    c.data_vencimento,
    c.status,
    c.pago,
    c.data_pagamento,
    c.valor_pago,
    c.override_manual,
    c.motivo_override,
    c.tipo_cobranca,
    c.turma_id,
    c.ano_letivo,
    c.forma_pagamento,
    c.comprovante_url,
    c.created_at,
    c.updated_at,
    c.taxa_multa_aplicada,
    c.taxa_juros_aplicada,
    
    -- Cálculos dinâmicos: dias de atraso
    CASE 
        WHEN c.pago = TRUE THEN COALESCE(c.dias_atraso_calculado, 0)
        ELSE GREATEST(0, (CURRENT_DATE - c.data_vencimento))
    END AS dias_atraso,
    
    -- Multa projetada ou realizada
    CASE 
        WHEN c.pago = TRUE THEN COALESCE(c.valor_multa, 0)
        WHEN c.override_manual = TRUE THEN 0
        WHEN GREATEST(0, (CURRENT_DATE - c.data_vencimento)) <= COALESCE((ce.config_financeira->>'dias_carencia')::INTEGER, 0) THEN 0
        ELSE ROUND(
            c.valor * LEAST(COALESCE((ce.config_financeira->>'multa_atraso_perc')::DECIMAL, 2.0), 2.0) / 100, 
            2
        )
    END AS valor_multa_projetado,
    
    -- Juros projetado ou realizado
    CASE 
        WHEN c.pago = TRUE THEN COALESCE(c.valor_juros, 0)
        WHEN c.override_manual = TRUE THEN 0
        WHEN GREATEST(0, (CURRENT_DATE - c.data_vencimento)) <= COALESCE((ce.config_financeira->>'dias_carencia')::INTEGER, 0) THEN 0
        ELSE ROUND(
            c.valor * (COALESCE((ce.config_financeira->>'juros_mora_mensal_perc')::DECIMAL, 1.0) / 100 / 30) 
            * GREATEST(0, (CURRENT_DATE - c.data_vencimento - COALESCE((ce.config_financeira->>'dias_carencia')::INTEGER, 0))), 
            2
        )
    END AS valor_juros_projetado,
    
    -- Multa fixa
    COALESCE((ce.config_financeira->>'multa_fixa')::DECIMAL, 0) AS multa_fixa,
    
    -- Dias de carência configurados
    COALESCE((ce.config_financeira->>'dias_carencia')::INTEGER, 0) AS dias_carencia,
    
    -- Total final projetado (o que o responsável vê)
    CASE 
        WHEN c.pago = TRUE THEN COALESCE(c.valor_pago, c.valor)
        WHEN c.override_manual = TRUE THEN c.valor
        WHEN GREATEST(0, (CURRENT_DATE - c.data_vencimento)) <= COALESCE((ce.config_financeira->>'dias_carencia')::INTEGER, 0) THEN c.valor
        ELSE ROUND(
            c.valor 
            + (c.valor * LEAST(COALESCE((ce.config_financeira->>'multa_atraso_perc')::DECIMAL, 2.0), 2.0) / 100)
            + (c.valor * (COALESCE((ce.config_financeira->>'juros_mora_mensal_perc')::DECIMAL, 1.0) / 100 / 30) 
               * GREATEST(0, (CURRENT_DATE - c.data_vencimento - COALESCE((ce.config_financeira->>'dias_carencia')::INTEGER, 0))))
            + COALESCE((ce.config_financeira->>'multa_fixa')::DECIMAL, 0)
        , 2)
    END AS valor_total_projetado,
    
    -- Flag: venceu além da carência?
    CASE 
        WHEN c.pago = TRUE THEN FALSE
        ELSE GREATEST(0, (CURRENT_DATE - c.data_vencimento)) > COALESCE((ce.config_financeira->>'dias_carencia')::INTEGER, 0)
    END AS vencido_apos_carencia

FROM public.cobrancas c
LEFT JOIN public.configuracoes_escola ce 
    ON c.tenant_id = ce.tenant_id 
    AND ce.vigencia_fim IS NULL
WHERE c.deleted_at IS NULL;

-- Comentários
COMMENT ON VIEW public.vw_cobrancas_com_encargos IS 'VIEW otimizada com cálculo dinâmico de multa, juros e total. Centraliza toda lógica de encargos.';

-- =====================================================
-- 6. RPC: registrar_pagamento_cobranca
-- =====================================================

CREATE OR REPLACE FUNCTION public.registrar_pagamento_cobranca(
    p_cobranca_id UUID,
    p_forma_pagamento TEXT DEFAULT NULL,
    p_comprovante_url TEXT DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_cobranca RECORD;
    v_config JSONB;
    v_dias_atraso INTEGER;
    v_multa_percentual DECIMAL;
    v_juros_percentual_dia DECIMAL;
    v_multa_valor DECIMAL;
    v_juros_valor DECIMAL;
    v_multa_fixa DECIMAL;
    v_valor_total DECIMAL;
    v_dias_carencia INTEGER;
BEGIN
    -- Buscar cobrança
    SELECT * INTO v_cobranca
    FROM public.cobrancas
    WHERE id = p_cobranca_id AND pago = FALSE AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cobrança não encontrada ou já paga');
    END IF;
    
    -- Buscar configurações da escola
    SELECT config_financeira INTO v_config
    FROM public.configuracoes_escola
    WHERE tenant_id = v_cobranca.tenant_id AND vigencia_fim IS NULL
    LIMIT 1;
    
    -- Calcular dias de carência
    v_dias_carencia := COALESCE((v_config->>'dias_carencia')::INTEGER, 0);
    
    -- Calcular dias de atraso (descontando carência)
    v_dias_atraso := GREATEST(0, CURRENT_DATE - v_cobranca.data_vencimento - v_dias_carencia);
    
    -- Se override manual, usa o valor fixo sem encargos
    IF v_cobranca.override_manual = TRUE THEN
        v_multa_valor := 0;
        v_juros_valor := 0;
        v_multa_fixa := 0;
        v_valor_total := v_cobranca.valor;
    ELSIF v_dias_atraso <= 0 THEN
        -- Dentro da carência ou em dia: sem encargos
        v_multa_valor := 0;
        v_juros_valor := 0;
        v_multa_fixa := 0;
        v_valor_total := v_cobranca.valor;
    ELSE
        -- Calcular multa (percentual, limitado ao CDC: max 2%)
        v_multa_percentual := LEAST(COALESCE((v_config->>'multa_atraso_perc')::DECIMAL, 2.0), 2.0);
        v_multa_valor := ROUND(v_cobranca.valor * v_multa_percentual / 100, 2);
        
        -- Calcular juros (1% ao mês = ~0.03333% ao dia)
        v_juros_percentual_dia := COALESCE((v_config->>'juros_mora_mensal_perc')::DECIMAL, 1.0) / 100 / 30;
        v_juros_valor := ROUND(v_cobranca.valor * v_juros_percentual_dia * v_dias_atraso, 2);
        
        -- Multa fixa
        v_multa_fixa := COALESCE((v_config->>'multa_fixa')::DECIMAL, 0);
        
        -- Valor total
        v_valor_total := v_cobranca.valor + v_multa_valor + v_juros_valor + v_multa_fixa;
    END IF;
    
    -- Atualizar cobrança
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
        updated_at = NOW()
    WHERE id = p_cobranca_id;
    
    -- Registrar auditoria (se tabela existir)
    BEGIN
        INSERT INTO public.audit_logs_v2 (
            tenant_id, user_id, acao, recurso_id,
            dados_anteriores, dados_novos, motivo_declarado
        ) VALUES (
            v_cobranca.tenant_id,
            COALESCE(p_usuario_id, auth.uid()),
            'financeiro.cobrancas.pagar_manual',
            p_cobranca_id,
            jsonb_build_object('valor', v_cobranca.valor, 'status', v_cobranca.status),
            jsonb_build_object('valor_pago', v_valor_total, 'multa', v_multa_valor, 'juros', v_juros_valor),
            'Pagamento manual registrado'
        );
    EXCEPTION WHEN OTHERS THEN
        -- Não bloquear pagamento se auditoria falhar
        NULL;
    END;
    
    RETURN jsonb_build_object(
        'success', true,
        'valor_original', v_cobranca.valor,
        'multa', v_multa_valor,
        'juros', v_juros_valor,
        'multa_fixa', v_multa_fixa,
        'valor_total', v_valor_total,
        'dias_atraso', v_dias_atraso,
        'dias_carencia', v_dias_carencia
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.registrar_pagamento_cobranca IS 'Registra pagamento manual com cálculo automático de multa/juros baseado nas configurações da escola.';

-- =====================================================
-- 7. TRIGGER: Atualizar status considerando carência
-- =====================================================

CREATE OR REPLACE FUNCTION public.fn_atualizar_status_cobranca()
RETURNS TRIGGER AS $$
DECLARE
    v_config JSONB;
    v_dias_carencia INTEGER;
BEGIN
    -- Se já paga, não altera
    IF NEW.pago = TRUE OR NEW.status = 'pago' THEN
        NEW.pago := TRUE;
        RETURN NEW;
    END IF;
    
    -- Buscar configurações
    SELECT config_financeira INTO v_config
    FROM public.configuracoes_escola
    WHERE tenant_id = NEW.tenant_id AND vigencia_fim IS NULL
    LIMIT 1;
    
    v_dias_carencia := COALESCE((v_config->>'dias_carencia')::INTEGER, 0);
    
    -- Atualizar status baseado na carência
    IF NEW.data_vencimento + v_dias_carencia < CURRENT_DATE THEN
        NEW.status := 'atrasado';
    ELSIF NEW.data_vencimento >= CURRENT_DATE THEN
        NEW.status := 'a_vencer';
    END IF;
    
    -- Calcular dias de atraso
    NEW.dias_atraso_calculado := GREATEST(0, CURRENT_DATE - NEW.data_vencimento - v_dias_carencia);
    
    -- Congelar valor_original se não estiver definido
    IF NEW.valor_original IS NULL THEN
        NEW.valor_original := NEW.valor;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recria trigger (idempotente)
DROP TRIGGER IF EXISTS trg_atualiza_status_cobranca ON public.cobrancas;
CREATE TRIGGER trg_atualiza_status_cobranca
    BEFORE INSERT OR UPDATE ON public.cobrancas
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_atualizar_status_cobranca();

-- =====================================================
-- 8. JOB: Atualização em massa de status
-- =====================================================

CREATE OR REPLACE FUNCTION public.atualizar_status_cobrancas_em_massa()
RETURNS void AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Atualiza cobranças que deveriam estar atrasadas
    -- O trigger trg_atualiza_status_cobranca se encarrega do cálculo
    UPDATE public.cobrancas
    SET updated_at = NOW()
    WHERE pago = FALSE 
      AND deleted_at IS NULL
      AND status != 'cancelado'
      AND data_vencimento < CURRENT_DATE;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Registrar execução
    INSERT INTO public.job_logs (job_name, executed_at, status, details)
    VALUES (
        'atualizar_status_cobrancas', 
        NOW(), 
        'success',
        jsonb_build_object('registros_atualizados', v_count)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.atualizar_status_cobrancas_em_massa IS 'Job diário para atualizar status de cobranças atrasadas em massa.';

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
