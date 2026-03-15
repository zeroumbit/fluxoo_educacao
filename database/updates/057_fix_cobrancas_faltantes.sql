-- ==========================================================
-- 🔧 FIX: GERAR COBRANÇAS FALTANTES
-- Gera cobranças de mensalidade para matrículas ativas sem cobranças
-- ==========================================================

-- Função para gerar cobranças automáticas para matrículas sem cobranças
CREATE OR REPLACE FUNCTION public.fn_gerar_cobrancas_faltantes()
RETURNS void AS $$
DECLARE
    m RECORD;
    v_valor_mensalidade NUMERIC(10,2);
    v_data_vencimento DATE;
    v_cobrancas_existentes BIGINT;
    v_mes_atual INTEGER := EXTRACT(MONTH FROM CURRENT_DATE);
    v_ano_atual INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    v_dia_vencimento INTEGER := 10;
BEGIN
    -- Buscar dia de vencimento padrão da escola
    SELECT dia_vencimento_padrao INTO v_dia_vencimento
    FROM public.config_financeira
    WHERE tenant_id IS NOT NULL
    LIMIT 1;

    IF v_dia_vencimento IS NULL THEN
        v_dia_vencimento := 10;
    END IF;

    -- Loop por todas as matrículas ativas
    FOR m IN 
        SELECT mat.id, mat.aluno_id, mat.tenant_id, mat.turma_id, mat.serie_ano, mat.turno, mat.data_matricula
        FROM public.matriculas mat
        WHERE mat.status = 'ativa'
          AND mat.tenant_id IS NOT NULL
          AND mat.aluno_id IS NOT NULL
    LOOP
        -- Buscar valor da mensalidade da turma
        SELECT valor_mensalidade INTO v_valor_mensalidade
        FROM public.turmas
        WHERE id = m.turma_id;

        -- Se não encontrou turma, tenta pegar o valor da própria matrícula
        IF v_valor_mensalidade IS NULL OR v_valor_mensalidade = 0 THEN
            -- Buscar desconto do aluno se existir
            SELECT 
                CASE 
                    WHEN a.desconto_tipo = 'porcentagem' THEN m.valor_matricula * (1 - (a.desconto_valor / 100))
                    ELSE GREATEST(0, m.valor_matricula - COALESCE(a.desconto_valor, 0))
                END INTO v_valor_mensalidade
            FROM public.matriculas mat
            LEFT JOIN public.alunos a ON a.id = mat.aluno_id
            WHERE mat.id = m.id;

            IF v_valor_mensalidade IS NULL OR v_valor_mensalidade = 0 THEN
                v_valor_mensalidade := 0;
            END IF;
        END IF;

        -- Pular se não tem valor de mensalidade
        IF v_valor_mensalidade IS NULL OR v_valor_mensalidade = 0 THEN
            CONTINUE;
        END IF;

        -- Verificar se já existem cobranças de mensalidade para este aluno
        SELECT COUNT(*) INTO v_cobrancas_existentes
        FROM public.cobrancas
        WHERE aluno_id = m.aluno_id
          AND tenant_id = m.tenant_id
          AND descricao ILIKE '%Mensalidade%';

        -- Se não tem cobranças, gerar para os meses restantes do ano letivo
        IF v_cobrancas_existentes = 0 THEN
            -- Gerar cobranças do mês atual até dezembro
            FOR mes IN v_mes_atual..12 LOOP
                -- Criar data de vencimento no dia padrão do mês
                v_data_vencimento := MAKE_DATE(v_ano_atual, mes, v_dia_vencimento)::DATE;

                -- Pular meses anteriores à data da matrícula
                IF v_data_vencimento >= m.data_matricula THEN
                    INSERT INTO public.cobrancas (
                        tenant_id,
                        aluno_id,
                        descricao,
                        valor,
                        data_vencimento,
                        status,
                        created_at,
                        updated_at
                    ) VALUES (
                        m.tenant_id,
                        m.aluno_id,
                        CONCAT('Mensalidade ', TO_CHAR(v_data_vencimento, 'MM/YYYY')),
                        v_valor_mensalidade,
                        v_data_vencimento,
                        'a_vencer',
                        NOW(),
                        NOW()
                    );
                END IF;
            END LOOP;

            -- Log de geração
            RAISE NOTICE 'Cobranças geradas para aluno % (matrícula %)', m.aluno_id, m.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comentar: Execute isso no Supabase SQL Editor para gerar cobranças retroativas
-- SELECT public.fn_gerar_cobrancas_faltantes();

COMMENT ON FUNCTION public.fn_gerar_cobrancas_faltantes() IS
    'Gera cobranças de mensalidade para matrículas ativas que não possuem cobranças vinculadas';
