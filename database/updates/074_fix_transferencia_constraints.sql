-- ============================================================
-- 074_fix_transferencia_constraints.sql
-- Descrição: Adiciona Foreign Keys faltantes para permitir Joins no PostgREST
-- ============================================================

-- Primeiro, garantir que os dados sejam compatíveis (se houver lixo)
-- Mas assumimos que IDs de tenant são válidos.

DO $$
BEGIN
    -- FK Escola Origem
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_transferencia_escola_origem') THEN
        ALTER TABLE public.transferencias_escolares 
        ADD CONSTRAINT fk_transferencia_escola_origem 
        FOREIGN KEY (escola_origem_id) REFERENCES public.escolas(id);
    END IF;

    -- FK Escola Destino
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_transferencia_escola_destino') THEN
        ALTER TABLE public.transferencias_escolares 
        ADD CONSTRAINT fk_transferencia_escola_destino 
        FOREIGN KEY (escola_destino_id) REFERENCES public.escolas(id);
    END IF;
END $$;
