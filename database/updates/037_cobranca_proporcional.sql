-- 🛠 MIGRATION: REGRA DE PROPORCIONALIDADE FINANCEIRA
-- Descrição: Implementa o cálculo automático de mensalidade
-- proporcional para ingressos após o dia 01.
-- ==========================================================

-- 1. Função de Cálculo (Padrão Dias Corridos conforme analise_regra_mensalidade.md)
CREATE OR REPLACE FUNCTION public.fn_calcular_proporcional_ingresso(
    p_valor_cheio DECIMAL,
    p_data_ingresso DATE
) RETURNS DECIMAL AS $$
DECLARE
    v_dia_ingresso INTEGER;
    v_ultimo_dia_mes INTEGER;
    v_dias_no_mes INTEGER;
    v_dias_pagos INTEGER;
BEGIN
    v_dia_ingresso := EXTRACT(DAY FROM p_data_ingresso);
    
    -- REGRA: Dia 01 = Valor Cheio
    IF v_dia_ingresso = 1 THEN
        RETURN p_valor_cheio;
    END IF;

    -- Identifica o total de dias do mês da matrícula
    v_ultimo_dia_mes := EXTRACT(DAY FROM (date_trunc('month', p_data_ingresso) + interval '1 month - 1 day'));
    v_dias_no_mes := v_ultimo_dia_mes;
    
    -- Dias que o aluno efetivamente usufruirá (ingresso até fim do mês)
    v_dias_pagos := v_dias_no_mes - v_dia_ingresso + 1;

    -- Cálculo: (Valor / Total Dias) * Dias Restantes
    RETURN ROUND((p_valor_cheio / v_dias_no_mes) * v_dias_pagos, 2);
END;
$$ LANGUAGE plpgsql;

-- 2. Procedure de Atualização em Lote (Segurança de Tenant)
-- Esta procedure atualiza o valor de mensalidade de todos os alunos ativos da turma.
CREATE OR REPLACE FUNCTION public.rpc_atualizar_mensalidade_turma_em_lote(
    p_tenant_id UUID,
    p_turma_id UUID,
    p_novo_valor_cheio DECIMAL
) RETURNS VOID AS $$
BEGIN
    -- Validação de Segurança: RLS redundante conforme regra 1.1
    UPDATE public.alunos
    SET valor_mensalidade_atual = p_novo_valor_cheio,
        updated_at = NOW()
    WHERE turma_id = p_turma_id 
      AND tenant_id = p_tenant_id
      AND status = 'ativo'
      AND deleted_at IS NULL;

    -- Registro de Auditoria (Essencial para ERP)
    INSERT INTO public.logs_financeiros (tenant_id, acao, detalhes)
    VALUES (p_tenant_id, 'ALTERACAO_VALOR_TURMA', 
            jsonb_build_object(
                'turma_id', p_turma_id, 
                'valor_definido', p_novo_valor_cheio,
                'data_operacao', NOW()
            ));
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger para gerar Fatura Proporcional no INSERT de Aluno
CREATE OR REPLACE FUNCTION public.fn_gerar_primeira_fatura_proporcional()
RETURNS TRIGGER AS $$
DECLARE
    v_valor_final DECIMAL;
BEGIN
    -- Calcula o valor baseado na regra de proporcionalidade
    v_valor_final := public.fn_calcular_proporcional_ingresso(NEW.valor_mensalidade_atual, NEW.data_ingresso);

    -- Insere a primeira fatura (mês de ingresso)
    INSERT INTO public.contas_receber (
        tenant_id, 
        aluno_id, 
        valor_original, 
        data_vencimento, 
        status, 
        descricao
    ) VALUES (
        NEW.tenant_id,
        NEW.id,
        v_valor_final,
        NEW.data_ingresso + interval '5 days', -- Vencimento padrão 5 dias após ingresso
        'aberto',
        'Mensalidade - Mês de Ingresso (Proporcional)'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gatilho ativado apenas na criação do aluno (Matrícula)
DROP TRIGGER IF EXISTS trg_gerar_fatura_ingresso ON public.alunos;
CREATE TRIGGER trg_gerar_fatura_ingresso
AFTER INSERT ON public.alunos
FOR EACH ROW
EXECUTE FUNCTION public.fn_gerar_primeira_fatura_proporcional();
