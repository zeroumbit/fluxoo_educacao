-- ============================================================
-- Trigger para Notificacoes Automaticas em Transferencias
-- Dispara notificacoes quando o status muda
-- ============================================================

-- ============================================================
-- 1. DROPAR TRIGGER ANTIGA SE EXISTIR
-- ============================================================

DROP TRIGGER IF EXISTS trg_transferencia_notificacao ON public.transferencias_escolares;
DROP FUNCTION IF EXISTS public.fn_transferencia_status_changed();

-- ============================================================
-- 2. CRIAR TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_transferencia_status_changed()
RETURNS TRIGGER AS $$
BEGIN
    -- Se status mudou, dispara notificacao
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM public.fn_criar_notificacao_transferencia(
            NEW.id,
            CASE 
                WHEN NEW.status = 'aguardando_responsavel' THEN 'solicitacao'
                WHEN NEW.status = 'aguardando_liberacao_origem' THEN 'aprovacao'
                WHEN NEW.status = 'concluido' THEN 'liberacao'
                ELSE NULL
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. CRIAR TRIGGER
-- ============================================================

CREATE TRIGGER trg_transferencia_notificacao
AFTER UPDATE OF status ON public.transferencias_escolares
FOR EACH ROW
EXECUTE FUNCTION public.fn_transferencia_status_changed();