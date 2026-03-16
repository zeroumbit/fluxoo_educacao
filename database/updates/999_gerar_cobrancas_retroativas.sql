-- Script Utilitário: Gerar Cobranças Faltantes para Matrículas Ativas
-- Descrição: Identifica matrículas que não possuem cobranças iniciais 
--            e as gera retroativamente.

DO $$
DECLARE
    rec RECORD;
    v_valor_final DECIMAL;
BEGIN
    FOR rec IN 
        SELECT m.id as matricula_id, m.tenant_id, m.aluno_id, a.valor_mensalidade_atual, a.data_ingresso, a.id as aluno_uuid
        FROM public.matriculas m
        JOIN public.alunos a ON m.aluno_id = a.id
        WHERE NOT EXISTS (SELECT 1 FROM public.cobrancas c WHERE c.aluno_id = a.id)
          AND a.valor_mensalidade_atual > 0
    LOOP
        -- Calcula o valor proporcional (usando a função existente se disponível, ou valor cheio)
        v_valor_final := rec.valor_mensalidade_atual;
        
        -- Tenta usar a função de cálculo proporcional se ela existir
        BEGIN
            v_valor_final := public.fn_calcular_proporcional_ingresso(rec.valor_mensalidade_atual, rec.data_ingresso);
        EXCEPTION WHEN OTHERS THEN
            v_valor_final := rec.valor_mensalidade_atual;
        END;

        -- Insere a cobrança
        INSERT INTO public.cobrancas (
            tenant_id, 
            aluno_id, 
            valor, 
            data_vencimento, 
            status, 
            descricao,
            tipo_cobranca,
            created_at,
            updated_at
        ) VALUES (
            rec.tenant_id,
            rec.aluno_uuid,
            v_valor_final,
            COALESCE(rec.data_ingresso, CURRENT_DATE) + interval '5 days',
            'a_vencer',
            'Mensalidade - Mês de Ingresso (Gerado Retroativamente)',
            'mensalidade',
            NOW(),
            NOW()
        );
    END LOOP;
END $$;
