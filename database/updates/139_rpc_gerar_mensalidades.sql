-- ==============================================================================
-- MIGRATION 139: RPC Functions para Geração de Mensalidades
-- Descrição: Cria as funções RPC fn_gerar_mensalidades_tenant_atual e 
-- fn_gerar_mensalidades_aluno que estavam sendo chamadas mas não existiam.
-- ==============================================================================

-- ==============================================================================
-- Função 1: fn_gerar_mensalidades_tenant_atual
-- Gera mensalidades faltantes para todos os alunos ativos do tenant atual.
-- Gera do MÊS DA MATRÍCULA até DEZEMBRO do ano vigente.
-- Idempotente: não duplica cobranças já existentes.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_gerar_mensalidades_tenant_atual()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
    v_mensalidades_criadas INT := 0;
    v_resultado JSONB;
    v_ano_atual INT := EXTRACT(YEAR FROM CURRENT_DATE);
    v_mes_inicio INT;
    v_mes_fim INT := 12;
    v_mes INT;
    v_ano_matricula INT;
    v_data_vencimento DATE;
    v_descricao TEXT;
    v_valor_mensalidade DECIMAL(10,2);
    v_existe_cobranca BOOLEAN;
    r_matricula RECORD;
BEGIN
    -- Obtém o tenant_id do contexto (usuário logado ou config)
    v_tenant_id := COALESCE(
        (current_setting('app.current_tenant_id', true)::UUID),
        (SELECT tenant_id FROM configuracoes_escola WHERE contexto = 'financeiro' ORDER BY updated_at DESC LIMIT 1)
    );

    IF v_tenant_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'mensalidades_criadas', 0,
            'tenant_id', NULL,
            'error', 'Tenant não identificado'
        );
    END IF;

    -- Cursor para alunos com matricula ativa
    FOR r_matricula IN 
        SELECT 
            m.aluno_id,
            m.turma_id,
            m.data_matricula,
            m.valor_matricula,
            m.valor_mensalidade as valor_contratado,
            t.valor_mensalidade as valor_turma,
            a.nome_completo,
            t.ano_letivo
        FROM public.matriculas m
        JOIN public.alunos a ON a.id = m.aluno_id AND a.tenant_id = m.tenant_id
        LEFT JOIN public.turmas t ON t.id = m.turma_id AND t.tenant_id = m.tenant_id
        WHERE m.tenant_id = v_tenant_id
          AND m.status = 'ativa'
          AND m.data_matricula IS NOT NULL
          AND (t.ano_letivo = v_ano_atual OR t.ano_letivo IS NULL)
        ORDER BY a.nome_completo
    LOOP
        -- Usa valor da turma, senão o contratado, senão 0
        v_valor_mensalidade := COALESCE(r_matricula.valor_turma, r_matricula.valor_contratado, 0);

        IF v_valor_mensalidade <= 0 THEN
            CONTINUE;
        END IF;

        -- Mês de início = mês da matrícula
        v_mes_inicio := EXTRACT(MONTH FROM r_matricula.data_matricula)::INT;
        v_ano_matricula := EXTRACT(YEAR FROM r_matricula.data_matricula)::INT;

        -- Gera cobrança do mês da matrícula até dezembro
        FOR v_mes IN SELECT generate_series(v_mes_inicio, v_mes_fim) LOOP
            -- Se matrícula for em outro ano, gera só daquele ano
            IF v_ano_matricula < v_ano_atual THEN
                -- Matrícula de anos anteriores: gera de janeiro a dezembro do ano atual
                v_data_vencimento := make_date(v_ano_atual, v_mes, 5);
            ELSE
                -- Matrícula no ano atual: gera do mês da matrícula até dezembro
                v_data_vencimento := make_date(v_ano_matricula, v_mes, 5);
            END IF;
            
            -- Pula cobranças de meses anteriores ao atual (não gera retroativo)
            IF v_data_vencimento < CURRENT_DATE AND v_ano_matricula = v_ano_atual THEN
                CONTINUE;
            END IF;
            
            -- Descrição: "Mensalidade [Mês] de [Ano]"
            v_descricao := TO_CHAR(v_data_vencimento, 'TMMonth') || ' de ' || EXTRACT(YEAR FROM v_data_vencimento);

            -- Verifica se cobrança já existe (idempotência)
            SELECT EXISTS(
                SELECT 1 FROM public.cobrancas
                WHERE tenant_id = v_tenant_id
                  AND aluno_id = r_matricula.aluno_id
                  AND descricao = v_descricao
                  AND data_vencimento = v_data_vencimento
                  AND status != 'cancelado'
            ) INTO v_existe_cobranca;

            IF NOT v_existe_cobranca THEN
                INSERT INTO public.cobrancas (
                    id,
                    tenant_id,
                    aluno_id,
                    descricao,
                    valor,
                    data_vencimento,
                    status,
                    pago,
                    tipo_cobranca,
                    created_at,
                    updated_at
                ) VALUES (
                    gen_random_uuid(),
                    v_tenant_id,
                    r_matricula.aluno_id,
                    v_descricao,
                    v_valor_mensalidade,
                    v_data_vencimento,
                    CASE 
                        WHEN v_data_vencimento < CURRENT_DATE THEN 'atrasado'
                        ELSE 'a_vencer'
                    END,
                    FALSE,
                    'mensalidade',
                    NOW(),
                    NOW()
                );
                v_mensalidades_criadas := v_mensalidades_criadas + 1;
            END IF;
        END LOOP;
    END LOOP;

    v_resultado := jsonb_build_object(
        'success', true,
        'mensalidades_criadas', v_mensalidades_criadas,
        'tenant_id', v_tenant_id
    );

    RETURN v_resultado;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'mensalidades_criadas', 0,
        'tenant_id', v_tenant_id,
        'error', SQLERRM
    );
END;
$$;

-- ==============================================================================
-- Função 2: fn_gerar_mensalidades_aluno
-- Gera mensalidades faltantes para um aluno específico.
-- Gera do MÊS DA MATRÍCULA até DEZEMBRO do ano vigente.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_gerar_mensalidades_aluno(
    p_aluno_id UUID,
    p_tenant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_mensalidades_criadas INT := 0;
    v_resultado JSONB;
    v_ano_atual INT := EXTRACT(YEAR FROM CURRENT_DATE);
    v_mes_inicio INT;
    v_mes_fim INT := 12;
    v_mes INT;
    v_ano_matricula INT;
    v_data_vencimento DATE;
    v_descricao TEXT;
    v_valor_mensalidade DECIMAL(10,2);
    v_existe_cobranca BOOLEAN;
    r_matricula RECORD;
BEGIN
    IF p_aluno_id IS NULL OR p_tenant_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'mensalidades_criadas', 0,
            'error', 'Parâmetros obrigatórios: p_aluno_id e p_tenant_id'
        );
    END IF;

    -- Busca matrícula ativa do aluno
    SELECT 
        m.turma_id,
        m.data_matricula,
        m.valor_matricula,
        m.valor_mensalidade as valor_contratado,
        t.valor_mensalidade as valor_turma,
        t.ano_letivo
    INTO r_matricula
    FROM public.matriculas m
    LEFT JOIN public.turmas t ON t.id = m.turma_id AND t.tenant_id = m.tenant_id
    WHERE m.aluno_id = p_aluno_id
      AND m.tenant_id = p_tenant_id
      AND m.status = 'ativa'
    ORDER BY m.data_matricula DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'mensalidades_criadas', 0,
            'error', 'Matrícula ativa não encontrada para o aluno'
        );
    END IF;

    v_valor_mensalidade := COALESCE(r_matricula.valor_turma, r_matricula.valor_contratado, 0);

    IF v_valor_mensalidade <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'mensalidades_criadas', 0,
            'error', 'Valor de mensalidade não configurado para a matrícula'
        );
    END IF;

    -- Mês de início = mês da matrícula
    v_mes_inicio := EXTRACT(MONTH FROM r_matricula.data_matricula)::INT;
    v_ano_matricula := EXTRACT(YEAR FROM r_matricula.data_matricula)::INT;

    -- Gera cobrança do mês da matrícula até dezembro
    FOR v_mes IN SELECT generate_series(v_mes_inicio, v_mes_fim) LOOP
        -- Se matrícula for em outro ano, gera só de janeiro a dezembro do ano atual
        IF v_ano_matricula < v_ano_atual THEN
            v_data_vencimento := make_date(v_ano_atual, v_mes, 5);
        ELSE
            -- Matrícula no ano atual: gera do mês da matrícula até dezembro
            v_data_vencimento := make_date(v_ano_matricula, v_mes, 5);
        END IF;
        
        -- Não gera cobranças retroativas (meses anteriores ao atual)
        IF v_data_vencimento < CURRENT_DATE AND v_ano_matricula = v_ano_atual THEN
            CONTINUE;
        END IF;

        -- Descrição: "Mensalidade [Mês] de [Ano]"
        v_descricao := TO_CHAR(v_data_vencimento, 'TMMonth') || ' de ' || EXTRACT(YEAR FROM v_data_vencimento);

        -- Verifica se cobrança já existe (idempotência)
        SELECT EXISTS(
            SELECT 1 FROM public.cobrancas
            WHERE tenant_id = p_tenant_id
              AND aluno_id = p_aluno_id
              AND descricao = v_descricao
              AND data_vencimento = v_data_vencimento
              AND status != 'cancelado'
        ) INTO v_existe_cobranca;

        IF NOT v_existe_cobranca THEN
            INSERT INTO public.cobrancas (
                id,
                tenant_id,
                aluno_id,
                descricao,
                valor,
                data_vencimento,
                status,
                pago,
                tipo_cobranca,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                p_tenant_id,
                p_aluno_id,
                v_descricao,
                v_valor_mensalidade,
                v_data_vencimento,
                CASE 
                    WHEN v_data_vencimento < CURRENT_DATE THEN 'atrasado'
                    ELSE 'a_vencer'
                END,
                FALSE,
                'mensalidade',
                NOW(),
                NOW()
            );
            v_mensalidades_criadas := v_mensalidades_criadas + 1;
        END IF;
    END LOOP;

    v_resultado := jsonb_build_object(
        'success', true,
        'mensalidades_criadas', v_mensalidades_criadas,
        'aluno_id', p_aluno_id
    );

    RETURN v_resultado;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'mensalidades_criadas', 0,
        'aluno_id', p_aluno_id,
        'error', SQLERRM
    );
END;
$$;

-- Grant executa para authenticated
GRANT EXECUTE ON FUNCTION public.fn_gerar_mensalidades_tenant_atual() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_gerar_mensalidades_aluno(UUID, UUID) TO authenticated;

DO $$
BEGIN
    RAISE NOTICE '✅ Funções RPC fn_gerar_mensalidades_tenant_atual e fn_gerar_mensalidades_aluno criadas com sucesso!';
END $$;