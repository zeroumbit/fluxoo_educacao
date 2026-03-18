-- ==============================================================================
-- 🚀 MIGRATION 070: SINCRONIZAÇÃO TRANSFERÊNCIA → FINANCEIRO
-- Descrição: Cancela cobranças futuras e inativa matrícula ao concluir transferência.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_sync_transferencia_financeiro()
RETURNS TRIGGER AS $$
BEGIN
    -- Se a transferência foi concluída (status mudou para 'concluida')
    IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status != 'concluida') THEN
        
        -- 1. Inativa a matrícula no tenant de ORIGEM
        UPDATE public.matriculas
        SET status = 'transferida',
            updated_at = NOW()
        WHERE aluno_id = NEW.aluno_id
          AND tenant_id = NEW.origem_tenant_id
          AND status = 'ativa';

        -- 2. Cancela cobranças 'a_vencer' do aluno no tenant de ORIGEM
        -- Mantemos as 'atrasado' pois são dívidas passadas que ainda devem ser cobradas
        UPDATE public.cobrancas
        SET status = 'cancelada',
            updated_at = NOW()
        WHERE aluno_id = NEW.aluno_id
          AND tenant_id = NEW.origem_tenant_id
          AND status = 'a_vencer'
          AND tipo_cobranca = 'mensalidade';

        -- 3. Log de auditoria
        INSERT INTO public.audit_logs_v2 (
            tenant_id, 
            user_id, 
            acao, 
            recurso_id, 
            motivo_declarado
        ) VALUES (
            NEW.origem_tenant_id, 
            COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), 
            'academico.transferencia.concluida_sync_financeiro', 
            NEW.id, 
            'Matrícula e cobranças futuras suspensas automaticamente por transferência concluída'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_transferencia_financeiro ON public.transferencias;
CREATE TRIGGER trg_sync_transferencia_financeiro
AFTER UPDATE ON public.transferencias
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_transferencia_financeiro();
