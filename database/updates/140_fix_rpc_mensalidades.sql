-- ==============================================================================
-- MIGRATION 140: Correção Final e Total da RPC fn_gerar_mensalidades_aluno
-- Descrição: Ajusta a lógica para gerar de JANEIRO a DEZEMBRO se a matrícula 
--            for de um ano anterior ao ano letivo solicitado.
-- ==============================================================================

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
    r_matricula RECORD;
    r_config RECORD;
BEGIN
    -- 1. Busca Configurações da Escola
    SELECT (config_financeira->>'dia_vencimento_padrao')::INT as dia_venc, 
           config_financeira
    INTO r_config
    FROM public.configuracoes_escola 
    WHERE tenant_id = p_tenant_id AND vigencia_fim IS NULL 
    LIMIT 1;

    v_dia_vencimento_config := COALESCE(r_config.dia_venc, 10);

    -- 2. Busca Matrícula Ativa
    SELECT 
        m.id as matricula_id,
        m.turma_id,
        m.data_matricula,
        m.ano_letivo,
        COALESCE(m.valor_matricula, 0) as valor_matricula,
        COALESCE(t.valor_mensalidade, a.valor_mensalidade_atual, 0) as valor_mensalidade
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
        RETURN jsonb_build_object('success', false, 'error', 'Matrícula ativa não encontrada.');
    END IF;

    -- 3. Gerar TAXA DE MATRÍCULA (Apenas se for o ano do ingresso ou rematrícula explícita)
    IF r_matricula.valor_matricula > 0 THEN
        v_descricao := 'Taxa de Matrícula - Ativação de Vínculo (' || v_ano_alvo || ')';
        
        SELECT EXISTS(
            SELECT 1 FROM public.cobrancas 
            WHERE tenant_id = p_tenant_id 
              AND aluno_id = p_aluno_id 
              AND descricao = v_descricao 
              AND status != 'cancelado'
        ) INTO v_existe_cobranca;

        IF NOT v_existe_cobranca THEN
            INSERT INTO public.cobrancas (tenant_id, aluno_id, descricao, valor, data_vencimento, status, tipo_cobranca, ano_letivo)
            VALUES (p_tenant_id, p_aluno_id, v_descricao, r_matricula.valor_matricula, CURRENT_DATE + 2, 'a_vencer', 'mensalidade', v_ano_alvo);
            v_cobrancas_criadas := v_cobrancas_criadas + 1;
        END IF;
    END IF;

    -- 4. Determina mês de início (Lógica de Rematrícula)
    IF EXTRACT(YEAR FROM r_matricula.data_matricula) < v_ano_alvo THEN
        -- Matrícula feita em anos passados para o ano letivo atual: Gera desde JANEIRO
        v_mes_inicio := 1;
    ELSE
        -- Matrícula feita dentro do ano letivo atual: Gera a partir do mês da matrícula
        v_mes_inicio := EXTRACT(MONTH FROM r_matricula.data_matricula)::INT;
    END IF;

    v_valor_base := r_matricula.valor_mensalidade;

    FOR v_mes IN v_mes_inicio..v_mes_fim LOOP
        v_data_vencimento := make_date(v_ano_alvo, v_mes, v_dia_vencimento_config);
        
        -- PRO-RATA (Apenas se for o primeiro mês absoluto da entrada do aluno)
        IF v_mes = v_mes_inicio AND EXTRACT(DAY FROM r_matricula.data_matricula) > 1 AND EXTRACT(YEAR FROM r_matricula.data_matricula) = v_ano_alvo THEN
            v_dias_no_mes := EXTRACT(DAY FROM (date_trunc('month', r_matricula.data_matricula) + interval '1 month - 1 day'));
            v_dias_uso := v_dias_no_mes - EXTRACT(DAY FROM r_matricula.data_matricula) + 1;
            v_valor_proporcional := ROUND((v_valor_base / v_dias_no_mes) * v_dias_uso, 2);
            v_descricao := 'Mensalidade Proporcional (' || TO_CHAR(v_data_vencimento, 'TMMonth') || ') - ' || v_dias_uso || ' dias';
            v_data_vencimento := CURRENT_DATE + 2;
        ELSE
            v_valor_proporcional := v_valor_base;
            v_descricao := 'Mensalidade de ' || TO_CHAR(v_data_vencimento, 'TMMonth') || ' de ' || v_ano_alvo;
        END IF;

        SELECT EXISTS(
            SELECT 1 FROM public.cobrancas 
            WHERE aluno_id = p_aluno_id 
              AND tenant_id = p_tenant_id
              AND (EXTRACT(MONTH FROM data_vencimento) = v_mes AND EXTRACT(YEAR FROM data_vencimento) = v_ano_alvo)
              AND status != 'cancelado'
              AND tipo_cobranca = 'mensalidade'
        ) INTO v_existe_cobranca;

        IF NOT v_existe_cobranca AND v_valor_proporcional > 0 THEN
            INSERT INTO public.cobrancas (tenant_id, aluno_id, descricao, valor, data_vencimento, status, tipo_cobranca, ano_letivo)
            VALUES (p_tenant_id, p_aluno_id, v_descricao, v_valor_proporcional, v_data_vencimento, 
                   CASE WHEN v_data_vencimento < CURRENT_DATE THEN 'atrasado' ELSE 'a_vencer' END, 
                   'mensalidade', v_ano_alvo);
            v_cobrancas_criadas := v_cobrancas_criadas + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'cobrancas_criadas', v_cobrancas_criadas);
END;
$$;
