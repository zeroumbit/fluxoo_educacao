-- ============================================================
-- CORRECAO: Notificacoes de Transferencia v2
-- ============================================================

-- Limpar funcao antiga
DROP FUNCTION IF EXISTS public.fn_criar_notificacao_transferencia(UUID, TEXT);
DROP FUNCTION IF EXISTS public.fn_transferencia_status_changed();
DROP TRIGGER IF EXISTS trg_transferencia_notificacao ON public.transferencias_escolares;

-- ============================================================
-- FUNCAO PRINCIPAL
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_criar_notificacao_transferencia(
    p_transferencia_id UUID,
    p_tipo TEXT DEFAULT 'solicitacao'
)
RETURNS VOID AS $$
DECLARE
    v_aluno_nome TEXT;
    v_origem_nome TEXT;
    v_destino_nome TEXT;
    v_resp_user_id UUID;
    v_transf_aluno_id UUID;
    v_transf_origem_id UUID;
    v_transf_destino_id UUID;
    v_transf_resp_id UUID;
    v_transf_status TEXT;
BEGIN
    -- Buscar transferencia
    SELECT aluno_id, escola_origem_id, escola_destino_id, responsavel_id, status
    INTO v_transf_aluno_id, v_transf_origem_id, v_transf_destino_id, v_transf_resp_id, v_transf_status
    FROM public.transferencias_escolares
    WHERE id = p_transferencia_id;

    IF v_transf_aluno_id IS NULL THEN
        RAISE EXCEPTION 'Transferencia nao encontrada: %', p_transferencia_id;
    END IF;

    -- Buscar aluno
    SELECT nome_completo INTO v_aluno_nome
    FROM public.alunos WHERE id = v_transf_aluno_id;

    -- Buscar escola origem
    SELECT razao_social INTO v_origem_nome
    FROM public.escolas WHERE id = v_transf_origem_id;

    -- Buscar escola destino
    IF v_transf_destino_id IS NOT NULL THEN
        SELECT razao_social INTO v_destino_nome
        FROM public.escolas WHERE id = v_transf_destino_id;
    END IF;

    -- Buscar user_id do responsavel
    SELECT user_id INTO v_resp_user_id
    FROM public.aluno_responsavel
    WHERE responsavel_id = v_transf_resp_id
    LIMIT 1;

    -- Notificar Responsavel
    INSERT INTO public.notificacoes (tenant_id, user_id, tipo, titulo, mensagem, href, categoria, prioridade, metadata, created_at, updated_at) 
    VALUES (
        v_transf_origem_id,
        v_resp_user_id,
        'TRANSFERENCIA',
        'Pedido de Transferencia',
        'A escola ' || COALESCE(v_destino_nome, 'de destino') || ' solicitou a transferencia de ' || COALESCE(v_aluno_nome, 'um aluno') || '.',
        '/portal/transferencias',
        'TRANSFERENCIAS',
        2,
        jsonb_build_object('transferencia_id', p_transferencia_id, 'aluno_id', v_transf_aluno_id),
        NOW(),
        NOW()
    );

    -- Notificar Escola Origem
    INSERT INTO public.notificacoes (tenant_id, user_id, tipo, titulo, mensagem, href, categoria, prioridade, metadata, created_at, updated_at) 
    VALUES (
        v_transf_origem_id,
        NULL,
        'TRANSFERENCIA',
        'Nova Solicitacao de Transferencia',
        'Solicitacao recebida para ' || COALESCE(v_aluno_nome, 'um aluno') || '. Aguardando aprobacao do responsavel.',
        '/transferencias',
        'TRANSFERENCIAS',
        2,
        jsonb_build_object('transferencia_id', p_transferencia_id, 'aluno_id', v_transf_aluno_id),
        NOW(),
        NOW()
    );

    -- Notificar Escola Destino
    IF v_transf_destino_id IS NOT NULL THEN
        INSERT INTO public.notificacoes (tenant_id, user_id, tipo, titulo, mensagem, href, categoria, prioridade, metadata, created_at, updated_at) 
        VALUES (
            v_transf_destino_id,
            NULL,
            'TRANSFERENCIA',
            'Solicitacao Enviada',
            'Solicitacao enviada para ' || COALESCE(v_aluno_nome, 'um aluno') || '. Aguardando aprobacao da familia.',
            '/transferencias',
            'TRANSFERENCIAS',
            1,
            jsonb_build_object('transferencia_id', p_transferencia_id, 'aluno_id', v_transf_aluno_id),
            NOW(),
            NOW()
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_transferencia_status_changed()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM public.fn_criar_notificacao_transferencia(NEW.id, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transferencia_notificacao
AFTER UPDATE OF status ON public.transferencias_escolares
FOR EACH ROW
EXECUTE FUNCTION public.fn_transferencia_status_changed();

-- Teste
SELECT 'Funcoes criadas com sucesso' AS status;