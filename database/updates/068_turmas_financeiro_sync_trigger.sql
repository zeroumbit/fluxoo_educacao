-- ==============================================================================
-- 🚀 MIGRATION 068: SINCRONIZAÇÃO AUTOMÁTICA TURMA → FINANCEIRO
-- Descrição: Atualiza cobranças pendentes quando o valor da mensalidade da turma muda.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_sync_cobrancas_turma_valor()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o valor da mensalidade mudou (ou qualquer outro campo se necessário)
    IF NEW.valor_mensalidade IS DISTINCT FROM OLD.valor_mensalidade THEN
        -- 1. Log da operação no Audit
        INSERT INTO public.audit_logs_v2 (tenant_id, user_id, acao, recurso_id, valor_anterior, valor_novo, motivo_declarado)
        VALUES (
            NEW.tenant_id, 
            COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), 
            'financeiro.cobranca.sync_massivo_turma', 
            NEW.id, 
            jsonb_build_object('valor', OLD.valor_mensalidade),
            jsonb_build_object('valor', NEW.valor_mensalidade),
            'Reajuste automático via alteração na Turma'
        );

        -- 2. Atualiza todas as cobranças vinculadas à turma que não foram pagas
        UPDATE public.cobrancas
        SET valor = NEW.valor_mensalidade,
            updated_at = NOW()
        WHERE turma_id = NEW.id
          AND status IN ('a_vencer', 'atrasado')
          AND tipo_cobranca = 'mensalidade';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_cobrancas_turma_valor ON public.turmas;
CREATE TRIGGER trg_sync_cobrancas_turma_valor
AFTER UPDATE ON public.turmas
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_cobrancas_turma_valor();
