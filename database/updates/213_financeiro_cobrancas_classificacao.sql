-- ============================================================
-- 213_financeiro_cobrancas_classificacao.sql
-- Classificacao oficial de cobrancas.
-- Remove dependencia de descricao textual para regras financeiras.
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cobranca_subtipo') THEN
        CREATE TYPE public.cobranca_subtipo AS ENUM (
            'matricula_rematricula',
            'mensalidade',
            'material_didatico',
            'fardamento_uniforme',
            'eventos_passeios',
            'taxas_administrativas',
            'atividades_extracurriculares',
            'avulso',
            'multa_juros'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cobranca_origem') THEN
        CREATE TYPE public.cobranca_origem AS ENUM (
            'matricula',
            'recorrencia',
            'manual',
            'evento',
            'negociacao'
        );
    END IF;
END $$;

ALTER TABLE public.cobrancas
    ADD COLUMN IF NOT EXISTS subtipo_cobranca public.cobranca_subtipo,
    ADD COLUMN IF NOT EXISTS origem_cobranca public.cobranca_origem;

UPDATE public.cobrancas
SET subtipo_cobranca = CASE
    WHEN lower(descricao) LIKE '%matrícula%'
      OR lower(descricao) LIKE '%matricula%'
      OR lower(descricao) LIKE '%rematrícula%'
      OR lower(descricao) LIKE '%rematricula%'
        THEN 'matricula_rematricula'::public.cobranca_subtipo
    WHEN lower(descricao) LIKE '%material%'
      OR lower(descricao) LIKE '%apostila%'
      OR lower(descricao) LIKE '%livro%'
      OR lower(descricao) LIKE '%plataforma%'
        THEN 'material_didatico'::public.cobranca_subtipo
    WHEN lower(descricao) LIKE '%uniforme%'
      OR lower(descricao) LIKE '%fardamento%'
      OR lower(descricao) LIKE '%camiseta%'
      OR lower(descricao) LIKE '%agasalho%'
        THEN 'fardamento_uniforme'::public.cobranca_subtipo
    WHEN lower(descricao) LIKE '%evento%'
      OR lower(descricao) LIKE '%passeio%'
      OR lower(descricao) LIKE '%excursão%'
      OR lower(descricao) LIKE '%excursao%'
      OR lower(descricao) LIKE '%formatura%'
      OR lower(descricao) LIKE '%festa%'
        THEN 'eventos_passeios'::public.cobranca_subtipo
    WHEN lower(descricao) LIKE '%juros%'
      OR lower(descricao) LIKE '%multa%'
        THEN 'multa_juros'::public.cobranca_subtipo
    WHEN lower(descricao) LIKE '%2ª via%'
      OR lower(descricao) LIKE '%segunda via%'
      OR lower(descricao) LIKE '%documento%'
      OR lower(descricao) LIKE '%carteirinha%'
      OR lower(descricao) LIKE '%taxa administrativa%'
        THEN 'taxas_administrativas'::public.cobranca_subtipo
    WHEN lower(descricao) LIKE '%futebol%'
      OR lower(descricao) LIKE '%ballet%'
      OR lower(descricao) LIKE '%judô%'
      OR lower(descricao) LIKE '%judo%'
      OR lower(descricao) LIKE '%integral%'
      OR lower(descricao) LIKE '%extracurricular%'
        THEN 'atividades_extracurriculares'::public.cobranca_subtipo
    WHEN tipo_cobranca = 'mensalidade'
      OR lower(descricao) LIKE '%mensalidade%'
        THEN 'mensalidade'::public.cobranca_subtipo
    ELSE 'avulso'::public.cobranca_subtipo
END
WHERE subtipo_cobranca IS NULL;

UPDATE public.cobrancas
SET origem_cobranca = CASE
    WHEN subtipo_cobranca = 'matricula_rematricula'
        THEN 'matricula'::public.cobranca_origem
    WHEN subtipo_cobranca = 'mensalidade'
        THEN 'recorrencia'::public.cobranca_origem
    WHEN subtipo_cobranca = 'eventos_passeios'
        THEN 'evento'::public.cobranca_origem
    WHEN subtipo_cobranca = 'multa_juros'
        THEN 'negociacao'::public.cobranca_origem
    ELSE 'manual'::public.cobranca_origem
END
WHERE origem_cobranca IS NULL;

ALTER TABLE public.cobrancas
    ALTER COLUMN subtipo_cobranca SET DEFAULT 'avulso',
    ALTER COLUMN origem_cobranca SET DEFAULT 'manual',
    ALTER COLUMN subtipo_cobranca SET NOT NULL,
    ALTER COLUMN origem_cobranca SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cobrancas_subtipo
    ON public.cobrancas (tenant_id, subtipo_cobranca)
    WHERE status <> 'cancelado';

CREATE INDEX IF NOT EXISTS idx_cobrancas_origem
    ON public.cobrancas (tenant_id, origem_cobranca)
    WHERE status <> 'cancelado';

COMMENT ON COLUMN public.cobrancas.subtipo_cobranca IS
  'Subtipo oficial da cobranca usado por regras financeiras; descricao e apenas texto visual.';

COMMENT ON COLUMN public.cobrancas.origem_cobranca IS
  'Origem oficial da cobranca: matricula, recorrencia, manual, evento ou negociacao.';

DROP VIEW IF EXISTS public.vw_cobrancas_com_encargos;
CREATE VIEW public.vw_cobrancas_com_encargos AS
SELECT
    c.id,
    c.tenant_id,
    c.aluno_id,
    c.descricao,
    c.valor AS valor_original,
    c.valor,
    c.data_vencimento,
    c.status,
    c.pago,
    c.data_pagamento,
    c.valor_pago,
    c.override_manual,
    c.motivo_override,
    c.tipo_cobranca,
    c.subtipo_cobranca,
    c.origem_cobranca,
    c.turma_id,
    c.ano_letivo,
    c.forma_pagamento,
    c.comprovante_url,
    c.created_at,
    c.updated_at,
    c.taxa_multa_aplicada,
    c.taxa_juros_aplicada,
    CASE
        WHEN c.pago = TRUE THEN COALESCE(c.dias_atraso_calculado, 0)
        ELSE GREATEST(0, (CURRENT_DATE - c.data_vencimento))
    END AS dias_atraso,
    CASE
        WHEN c.pago = TRUE THEN COALESCE(c.valor_multa, 0)
        WHEN c.override_manual = TRUE THEN 0
        WHEN GREATEST(0, (CURRENT_DATE - c.data_vencimento)) <= COALESCE((ce.config_financeira->>'dias_carencia')::INTEGER, 0) THEN 0
        ELSE ROUND(
            c.valor * LEAST(COALESCE((ce.config_financeira->>'multa_atraso_perc')::DECIMAL, 2.0), 2.0) / 100,
            2
        )
    END AS valor_multa_projetado,
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
    COALESCE((ce.config_financeira->>'multa_fixa')::DECIMAL, 0) AS multa_fixa,
    COALESCE((ce.config_financeira->>'dias_carencia')::INTEGER, 0) AS dias_carencia,
    CASE
        WHEN c.pago = TRUE THEN COALESCE(c.valor_pago, c.valor)
        WHEN c.override_manual = TRUE THEN c.valor
        WHEN GREATEST(0, (CURRENT_DATE - c.data_vencimento)) <= COALESCE((ce.config_financeira->>'dias_carencia')::INTEGER, 0) THEN c.valor
        ELSE ROUND(
            c.valor
            + (c.valor * LEAST(COALESCE((ce.config_financeira->>'multa_atraso_perc')::DECIMAL, 2.0), 2.0) / 100)
            + (c.valor * (COALESCE((ce.config_financeira->>'juros_mora_mensal_perc')::DECIMAL, 1.0) / 100 / 30)
               * GREATEST(0, (CURRENT_DATE - c.data_vencimento - COALESCE((ce.config_financeira->>'dias_carencia')::INTEGER, 0))))
            + COALESCE((ce.config_financeira->>'multa_fixa')::DECIMAL, 0),
            2
        )
    END AS valor_total_projetado,
    CASE
        WHEN c.pago = TRUE THEN FALSE
        ELSE GREATEST(0, (CURRENT_DATE - c.data_vencimento)) > COALESCE((ce.config_financeira->>'dias_carencia')::INTEGER, 0)
    END AS vencido_apos_carencia
FROM public.cobrancas c
LEFT JOIN public.configuracoes_escola ce
    ON c.tenant_id = ce.tenant_id
    AND ce.vigencia_fim IS NULL
WHERE c.deleted_at IS NULL;

DROP FUNCTION IF EXISTS public.fn_gerar_mensalidades_aluno(UUID, UUID);
DROP FUNCTION IF EXISTS public.fn_gerar_mensalidades_aluno(UUID, UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.fn_gerar_mensalidades_aluno(
    p_aluno_id UUID,
    p_tenant_id UUID,
    p_ano INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cobrancas_criadas INT := 0;
    v_ano_alvo INT := COALESCE(p_ano, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
    v_mes_inicio INT;
    v_mes_fim INT := 12;
    v_mes INT;
    v_data_vencimento DATE;
    v_descricao TEXT;
    v_valor_base DECIMAL(10,2);
    v_existe_cobranca BOOLEAN;
    v_dia_vencimento_config INT;
    v_dias_no_mes INT;
    v_dias_uso INT;
    v_valor_proporcional DECIMAL(10,2);
    v_subtipo public.cobranca_subtipo;
    r_matricula RECORD;
    r_config RECORD;
BEGIN
    SELECT (config_financeira->>'dia_vencimento_padrao')::INT AS dia_venc,
           config_financeira
    INTO r_config
    FROM public.configuracoes_escola
    WHERE tenant_id = p_tenant_id
      AND vigencia_fim IS NULL
    LIMIT 1;

    v_dia_vencimento_config := COALESCE(r_config.dia_venc, 10);

    SELECT
        m.id AS matricula_id,
        m.turma_id,
        m.data_matricula,
        m.ano_letivo,
        COALESCE(m.valor_matricula, 0) AS valor_matricula,
        COALESCE(t.valor_mensalidade, a.valor_mensalidade_atual, 0) AS valor_mensalidade
    INTO r_matricula
    FROM public.matriculas m
    LEFT JOIN public.turmas t ON t.id = m.turma_id
    LEFT JOIN public.alunos a ON a.id = m.aluno_id
    WHERE m.aluno_id = p_aluno_id
      AND m.tenant_id = p_tenant_id
      AND m.status = 'ativa'
      AND (m.ano_letivo = v_ano_alvo OR EXTRACT(YEAR FROM m.data_matricula) = v_ano_alvo)
    ORDER BY m.created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Matricula ativa nao encontrada.');
    END IF;

    IF r_matricula.valor_matricula > 0 THEN
        v_descricao := 'Taxa de Matricula - Ativacao de Vinculo (' || v_ano_alvo || ')';

        SELECT EXISTS(
            SELECT 1
            FROM public.cobrancas
            WHERE tenant_id = p_tenant_id
              AND aluno_id = p_aluno_id
              AND status <> 'cancelado'
              AND ano_letivo = v_ano_alvo
              AND subtipo_cobranca = 'matricula_rematricula'
        ) INTO v_existe_cobranca;

        IF NOT v_existe_cobranca THEN
            INSERT INTO public.cobrancas (
                tenant_id, aluno_id, descricao, valor, data_vencimento,
                status, tipo_cobranca, subtipo_cobranca, origem_cobranca, ano_letivo
            )
            VALUES (
                p_tenant_id, p_aluno_id, v_descricao, r_matricula.valor_matricula,
                CURRENT_DATE + 2, 'a_vencer', 'mensalidade',
                'matricula_rematricula', 'matricula', v_ano_alvo
            );
            v_cobrancas_criadas := v_cobrancas_criadas + 1;
        END IF;
    END IF;

    IF EXTRACT(YEAR FROM r_matricula.data_matricula) < v_ano_alvo THEN
        v_mes_inicio := 1;
    ELSE
        v_mes_inicio := EXTRACT(MONTH FROM r_matricula.data_matricula)::INT;
    END IF;

    v_valor_base := r_matricula.valor_mensalidade;

    FOR v_mes IN v_mes_inicio..v_mes_fim LOOP
        v_data_vencimento := make_date(v_ano_alvo, v_mes, v_dia_vencimento_config);

        IF v_mes = v_mes_inicio
           AND EXTRACT(DAY FROM r_matricula.data_matricula) > 1
           AND EXTRACT(YEAR FROM r_matricula.data_matricula) = v_ano_alvo THEN
            v_dias_no_mes := EXTRACT(DAY FROM (date_trunc('month', r_matricula.data_matricula) + interval '1 month - 1 day'));
            v_dias_uso := v_dias_no_mes - EXTRACT(DAY FROM r_matricula.data_matricula) + 1;
            v_valor_proporcional := ROUND((v_valor_base / v_dias_no_mes) * v_dias_uso, 2);
            v_descricao := 'Mensalidade Proporcional (' || TO_CHAR(v_data_vencimento, 'TMMonth') || ') - ' || v_dias_uso || ' dias';
            v_data_vencimento := CURRENT_DATE + 2;
        ELSE
            v_valor_proporcional := v_valor_base;
            v_descricao := 'Mensalidade de ' || TO_CHAR(v_data_vencimento, 'TMMonth') || ' de ' || v_ano_alvo;
        END IF;

        v_subtipo := 'mensalidade';

        SELECT EXISTS(
            SELECT 1
            FROM public.cobrancas
            WHERE aluno_id = p_aluno_id
              AND tenant_id = p_tenant_id
              AND EXTRACT(MONTH FROM data_vencimento) = v_mes
              AND EXTRACT(YEAR FROM data_vencimento) = v_ano_alvo
              AND status <> 'cancelado'
              AND subtipo_cobranca = v_subtipo
        ) INTO v_existe_cobranca;

        IF NOT v_existe_cobranca AND v_valor_proporcional > 0 THEN
            INSERT INTO public.cobrancas (
                tenant_id, aluno_id, descricao, valor, data_vencimento,
                status, tipo_cobranca, subtipo_cobranca, origem_cobranca, ano_letivo
            )
            VALUES (
                p_tenant_id, p_aluno_id, v_descricao, v_valor_proporcional,
                v_data_vencimento,
                CASE WHEN v_data_vencimento < CURRENT_DATE THEN 'atrasado' ELSE 'a_vencer' END,
                'mensalidade', v_subtipo, 'recorrencia', v_ano_alvo
            );
            v_cobrancas_criadas := v_cobrancas_criadas + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'cobrancas_criadas', v_cobrancas_criadas);
END;
$$;
