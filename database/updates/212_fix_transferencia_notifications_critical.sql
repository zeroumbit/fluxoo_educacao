-- ============================================================
-- 212_fix_transferencia_notifications_critical.sql
-- Correção crítica: notificações obrigatórias do fluxo de transferência.
-- - Escola destino inicia: responsável é notificado imediatamente.
-- - Responsável inicia: escola de origem é notificada imediatamente.
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'transferencias_escolares'
          AND column_name = 'escola_destino_nome_manual'
    ) THEN
        ALTER TABLE public.transferencias_escolares ADD COLUMN escola_destino_nome_manual TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'transferencias_escolares'
          AND column_name = 'escola_destino_cnpj_manual'
    ) THEN
        ALTER TABLE public.transferencias_escolares ADD COLUMN escola_destino_cnpj_manual TEXT;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.fn_criar_notificacao_transferencia(
    p_transferencia_id UUID,
    p_tipo TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_aluno_nome TEXT;
    v_aluno_id UUID;
    v_origem_tenant_id UUID;
    v_destino_nome TEXT;
    v_destino_tenant_id UUID;
    v_resp_id UUID;
    v_resp_user_id UUID;
    v_iniciado_por TEXT;
BEGIN
    IF p_tipo IS NULL THEN
        RETURN;
    END IF;

    SELECT
        a.nome_completo,
        a.id,
        t.escola_origem_id,
        COALESCE(e_destino.razao_social, t.escola_destino_nome_manual, 'escola de destino'),
        t.escola_destino_id,
        t.responsavel_id,
        r.user_id,
        t.iniciado_por
    INTO
        v_aluno_nome,
        v_aluno_id,
        v_origem_tenant_id,
        v_destino_nome,
        v_destino_tenant_id,
        v_resp_id,
        v_resp_user_id,
        v_iniciado_por
    FROM public.transferencias_escolares t
    JOIN public.alunos a ON a.id = t.aluno_id
    LEFT JOIN public.escolas e_destino ON e_destino.id = t.escola_destino_id
    LEFT JOIN public.responsaveis r ON r.id = t.responsavel_id
    WHERE t.id = p_transferencia_id;

    IF v_aluno_id IS NULL THEN
        RETURN;
    END IF;

    IF p_tipo = 'solicitacao' THEN
        IF v_iniciado_por IN ('destino', 'origem') AND v_resp_user_id IS NOT NULL THEN
            IF NOT EXISTS (
                SELECT 1 FROM public.notificacoes
                WHERE tipo = 'TRANSFERENCIA_RESPONSAVEL'
                  AND resolvida = false
                  AND metadata->>'transferencia_id' = p_transferencia_id::text
            ) THEN
                INSERT INTO public.notificacoes (
                    tenant_id, user_id, tipo, titulo, mensagem, href,
                    categoria, prioridade, metadata, lida, resolvida
                )
                VALUES (
                    v_origem_tenant_id,
                    v_resp_user_id,
                    'TRANSFERENCIA_RESPONSAVEL',
                    'Pedido de transferência',
                    'A escola ' || v_destino_nome || ' solicitou a transferência de ' || v_aluno_nome || '. Acesse para aprovar ou recusar.',
                    '/portal/transferencias',
                    'PORTAL',
                    1,
                    jsonb_build_object(
                        'transferencia_id', p_transferencia_id,
                        'aluno_id', v_aluno_id,
                        'responsavel_id', v_resp_id,
                        'origem_id', v_origem_tenant_id,
                        'destino_id', v_destino_tenant_id,
                        'evento', 'aguardando_responsavel'
                    ),
                    false,
                    false
                );
            END IF;
        END IF;

        IF v_iniciado_por = 'responsavel' THEN
            IF NOT EXISTS (
                SELECT 1 FROM public.notificacoes
                WHERE tipo = 'TRANSFERENCIA_ORIGEM'
                  AND resolvida = false
                  AND metadata->>'transferencia_id' = p_transferencia_id::text
                  AND metadata->>'evento' = 'iniciada_responsavel'
            ) THEN
                INSERT INTO public.notificacoes (
                    tenant_id, user_id, tipo, titulo, mensagem, href,
                    categoria, prioridade, metadata, lida, resolvida
                )
                VALUES (
                    v_origem_tenant_id,
                    NULL,
                    'TRANSFERENCIA_ORIGEM',
                    'Transferência solicitada pela família',
                    'O responsável solicitou a transferência de ' || v_aluno_nome || '. A escola de origem deve acompanhar e liberar a documentação.',
                    '/transferencias',
                    'ESCOLAS',
                    1,
                    jsonb_build_object(
                        'transferencia_id', p_transferencia_id,
                        'aluno_id', v_aluno_id,
                        'responsavel_id', v_resp_id,
                        'origem_id', v_origem_tenant_id,
                        'destino_id', v_destino_tenant_id,
                        'evento', 'iniciada_responsavel'
                    ),
                    false,
                    false
                );
            END IF;
        END IF;
    ELSIF p_tipo = 'aprovacao' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.notificacoes
            WHERE tipo = 'TRANSFERENCIA_ORIGEM'
              AND resolvida = false
              AND metadata->>'transferencia_id' = p_transferencia_id::text
              AND metadata->>'evento' = 'aprovada_responsavel'
        ) THEN
            INSERT INTO public.notificacoes (
                tenant_id, user_id, tipo, titulo, mensagem, href,
                categoria, prioridade, metadata, lida, resolvida
            )
            VALUES (
                v_origem_tenant_id,
                NULL,
                'TRANSFERENCIA_ORIGEM',
                'Transferência aprovada pela família',
                'O responsável aprovou a transferência de ' || v_aluno_nome || '. A escola de origem tem 30 dias para liberar o aluno.',
                '/transferencias',
                'ESCOLAS',
                1,
                jsonb_build_object(
                    'transferencia_id', p_transferencia_id,
                    'aluno_id', v_aluno_id,
                    'responsavel_id', v_resp_id,
                    'origem_id', v_origem_tenant_id,
                    'destino_id', v_destino_tenant_id,
                    'evento', 'aprovada_responsavel'
                ),
                false,
                false
            );
        END IF;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_transferencia_notificacao_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.fn_criar_notificacao_transferencia(
            NEW.id,
            CASE
                WHEN NEW.status IN ('aguardando_responsavel', 'aguardando_liberacao_origem') THEN 'solicitacao'
                ELSE NULL
            END
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM public.fn_criar_notificacao_transferencia(
            NEW.id,
            CASE
                WHEN NEW.status = 'aguardando_responsavel' THEN 'solicitacao'
                WHEN NEW.status = 'aguardando_liberacao_origem' THEN 'aprovacao'
                ELSE NULL
            END
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_transferencia_notificacao ON public.transferencias_escolares;
DROP TRIGGER IF EXISTS trg_transferencia_notificacao_engine ON public.transferencias_escolares;
DROP TRIGGER IF EXISTS trg_transferencia_notificacao_insert ON public.transferencias_escolares;
DROP TRIGGER IF EXISTS trg_transferencia_notificacao_update ON public.transferencias_escolares;

CREATE TRIGGER trg_transferencia_notificacao
AFTER INSERT OR UPDATE OF status ON public.transferencias_escolares
FOR EACH ROW
EXECUTE FUNCTION public.fn_transferencia_notificacao_trigger();

COMMENT ON FUNCTION public.fn_criar_notificacao_transferencia(UUID, TEXT) IS
  'Gera notificações críticas do fluxo de transferência para responsável e escola origem.';
