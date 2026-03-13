-- Migration 055: Trigger de Sincronização de Mensalidade
-- Descrição: Atualiza automaticamente o valor da mensalidade do aluno
--            quando há mudança na turma vinculada à matrícula

-- Função para sincronizar valor da mensalidade
CREATE OR REPLACE FUNCTION public.fn_sincronizar_mensalidade_do_aluno()
RETURNS TRIGGER AS $$
DECLARE
    v_valor_mensalidade NUMERIC(10,2);
    v_turma_nome TEXT;
BEGIN
    -- Buscar o valor da mensalidade da nova turma
    SELECT valor_mensalidade, nome
    INTO v_valor_mensalidade, v_turma_nome
    FROM public.turmas
    WHERE id = NEW.turma_id;

    -- Atualizar o aluno com o novo valor
    IF FOUND THEN
        UPDATE public.alunos
        SET 
            valor_mensalidade_atual = COALESCE(v_valor_mensalidade, 0),
            updated_at = NOW()
        WHERE id = NEW.aluno_id;

        -- Registrar log
        INSERT INTO public.logs_financeiros (tenant_id, acao, detalhes)
        VALUES (
            NEW.tenant_id,
            'SINCRONIZACAO_MENSALIDADE',
            jsonb_build_object(
                'aluno_id', NEW.aluno_id,
                'turma_id', NEW.turma_id,
                'turma_nome', v_turma_nome,
                'valor_mensalidade', v_valor_mensalidade,
                'data_operacao', NOW()
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger na tabela de matrículas
DROP TRIGGER IF EXISTS trg_sincronizar_mensalidade ON public.matriculas;
CREATE TRIGGER trg_sincronizar_mensalidade
AFTER INSERT OR UPDATE OF turma_id ON public.matriculas
FOR EACH ROW
EXECUTE FUNCTION public.fn_sincronizar_mensalidade_do_aluno();

COMMENT ON FUNCTION public.fn_sincronizar_mensalidade_do_aluno() IS 
    'Sincroniza automaticamente o valor da mensalidade do aluno baseado na turma vinculada';
