-- ============================================================
-- 218_transferencia_responsavel_destino_notifications.sql
-- Quando a familia solicita transferencia para uma escola da rede,
-- o destino precisa receber aceite e a origem precisa ser informada.
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_notificar_transferencia_responsavel_destino()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_aluno_nome TEXT;
    v_origem_nome TEXT;
    v_destino_nome TEXT;
BEGIN
    IF NEW.iniciado_por <> 'responsavel'
       OR NEW.escola_destino_id IS NULL
       OR NEW.status <> 'aguardando_aceite_destino' THEN
        RETURN NEW;
    END IF;

    SELECT nome_completo INTO v_aluno_nome
    FROM public.alunos
    WHERE id = NEW.aluno_id;

    SELECT razao_social INTO v_origem_nome
    FROM public.escolas
    WHERE id = NEW.escola_origem_id;

    SELECT razao_social INTO v_destino_nome
    FROM public.escolas
    WHERE id = NEW.escola_destino_id;

    IF NOT EXISTS (
        SELECT 1 FROM public.notificacoes
        WHERE tipo = 'TRANSFERENCIA_DESTINO'
          AND resolvida = false
          AND metadata->>'transferencia_id' = NEW.id::text
          AND metadata->>'evento' = 'aguardando_aceite_destino'
    ) THEN
        INSERT INTO public.notificacoes (
            tenant_id, user_id, tipo, titulo, mensagem, href,
            categoria, prioridade, metadata, lida, resolvida
        )
        VALUES (
            NEW.escola_destino_id,
            NULL,
            'TRANSFERENCIA_DESTINO',
            'Pedido de transferência recebido',
            'A família solicitou transferência de ' || COALESCE(v_aluno_nome, 'um aluno') ||
              ' para ' || COALESCE(v_destino_nome, 'esta escola') || '. Analise o aceite.',
            '/transferencias',
            'ESCOLAS',
            1,
            jsonb_build_object(
                'transferencia_id', NEW.id,
                'aluno_id', NEW.aluno_id,
                'responsavel_id', NEW.responsavel_id,
                'origem_id', NEW.escola_origem_id,
                'destino_id', NEW.escola_destino_id,
                'evento', 'aguardando_aceite_destino'
            ),
            false,
            false
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.notificacoes
        WHERE tipo = 'TRANSFERENCIA_ORIGEM'
          AND resolvida = false
          AND metadata->>'transferencia_id' = NEW.id::text
          AND metadata->>'evento' = 'iniciada_responsavel'
    ) THEN
        INSERT INTO public.notificacoes (
            tenant_id, user_id, tipo, titulo, mensagem, href,
            categoria, prioridade, metadata, lida, resolvida
        )
        VALUES (
            NEW.escola_origem_id,
            NULL,
            'TRANSFERENCIA_ORIGEM',
            'Transferência solicitada pela família',
            'A família solicitou transferência de ' || COALESCE(v_aluno_nome, 'um aluno') ||
              ' para ' || COALESCE(v_destino_nome, 'a escola de destino') || '.',
            '/transferencias',
            'ESCOLAS',
            2,
            jsonb_build_object(
                'transferencia_id', NEW.id,
                'aluno_id', NEW.aluno_id,
                'responsavel_id', NEW.responsavel_id,
                'origem_id', NEW.escola_origem_id,
                'destino_id', NEW.escola_destino_id,
                'origem_nome', v_origem_nome,
                'destino_nome', v_destino_nome,
                'evento', 'iniciada_responsavel'
            ),
            false,
            false
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_transferencia_responsavel_destino_notificacao ON public.transferencias_escolares;

CREATE TRIGGER trg_transferencia_responsavel_destino_notificacao
AFTER INSERT ON public.transferencias_escolares
FOR EACH ROW
EXECUTE FUNCTION public.fn_notificar_transferencia_responsavel_destino();

COMMENT ON FUNCTION public.fn_notificar_transferencia_responsavel_destino() IS
  'Notifica origem e destino quando a familia solicita transferencia para escola da rede.';
