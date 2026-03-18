-- ==============================================================================
-- 🚀 MIGRATION 069: INTEGRAÇÃO AGENDA → MURAL (EVENTBUS)
-- Descrição: Criação automática de avisos no mural a partir de eventos da agenda.
-- ==============================================================================

ALTER TABLE public.eventos
ADD COLUMN IF NOT EXISTS publicar_no_mural BOOLEAN DEFAULT FALSE;

CREATE OR REPLACE FUNCTION public.fn_sync_agenda_mural()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o evento estiver configurado para publicar no mural
    IF NEW.publicar_no_mural = TRUE AND (OLD.publicar_no_mural IS NULL OR OLD.publicar_no_mural = FALSE) THEN
        INSERT INTO public.mural_avisos (
            tenant_id, 
            titulo, 
            corpo, 
            data_fim, 
            criada_por, 
            created_at
        ) VALUES (
            NEW.tenant_id,
            '🚨 ' || NEW.nome,
            'Fiquem atentos! Um novo evento foi agendado: ' || NEW.descricao || '. Começa em ' || NEW.data_inicio,
            NEW.data_termino,
            COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_agenda_mural ON public.eventos;
CREATE TRIGGER trg_sync_agenda_mural
AFTER INSERT OR UPDATE ON public.eventos
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_agenda_mural();
