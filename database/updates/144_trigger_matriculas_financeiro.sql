-- ==============================================================================
-- MIGRATION 144: Trigger de Automação Financeira Pós-Matrícula
-- Descrição: Dispara automaticamente a geração de faturas (Taxa de Matrícula, 
--            Pro-rata e Mensalidades) ao ativar uma matrícula.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_trg_gerar_financeiro_matricula()
RETURNS TRIGGER AS $$
BEGIN
    -- Só dispara se a matrícula for ativada (Insert ou Update de status)
    IF (TG_OP = 'INSERT' AND NEW.status = 'ativa') OR 
       (TG_OP = 'UPDATE' AND OLD.status != 'ativa' AND NEW.status = 'ativa') THEN
       
       PERFORM public.fn_gerar_mensalidades_aluno(NEW.aluno_id, NEW.tenant_id);
       
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_gerar_financeiro_pos_matricula ON public.matriculas;
CREATE TRIGGER trg_gerar_financeiro_pos_matricula
AFTER INSERT OR UPDATE ON public.matriculas
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_gerar_financeiro_matricula();

COMMENT ON TRIGGER trg_gerar_financeiro_pos_matricula ON public.matriculas IS 'Automatiza a criação do fluxo financeiro do aluno (Taxa + Pro-rata + Parcelas) assim que a matrícula é ativada.';
