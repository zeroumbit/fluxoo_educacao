-- ============================================================
-- 073_engine_transferencia_notificacoes_definitivo.sql
-- Descrição: Motor de Notificações para Transferências Escolares
-- Autor: Antigravity
-- ============================================================

-- 1. LIMPEZA DE OBJETOS ANTIGOS
DROP TRIGGER IF EXISTS trg_transferencia_notificacao_insert ON public.transferencias_escolares;
DROP TRIGGER IF EXISTS trg_transferencia_notificacao_update ON public.transferencias_escolares;
DROP TRIGGER IF EXISTS trg_transferencia_notificacao ON public.transferencias_escolares;
DROP FUNCTION IF EXISTS public.fn_transferencia_notificacao_trigger();
DROP FUNCTION IF EXISTS public.fn_transferencia_status_changed();
DROP FUNCTION IF EXISTS public.fn_criar_notificacao_transferencia(UUID, TEXT);

-- 2. FUNÇÃO CORE DE NOTIFICAÇÃO
CREATE OR REPLACE FUNCTION public.fn_criar_notificacao_transferencia(
    p_transferencia_id UUID,
    p_tipo TEXT -- 'solicitacao', 'aprovacao', 'concluido', 'recusado'
)
RETURNS VOID AS $$
DECLARE
    v_aluno_nome TEXT;
    v_origem_nome TEXT;
    v_origem_tenant_id UUID;
    v_destino_nome TEXT;
    v_destino_tenant_id UUID;
    v_resp_user_id UUID;
    v_aluno_id UUID;
BEGIN
    -- Buscar dados da transferência e nomes relacionados
    SELECT 
        a.nome_completo,
        e_origem.razao_social,
        e_origem.id,
        COALESCE(e_destino.razao_social, t.escola_destino_nome_manual),
        t.escola_destino_id,
        r.user_id,
        a.id
    INTO 
        v_aluno_nome,
        v_origem_nome,
        v_origem_tenant_id,
        v_destino_nome,
        v_destino_tenant_id,
        v_resp_user_id,
        v_aluno_id
    FROM public.transferencias_escolares t
    JOIN public.alunos a ON t.aluno_id = a.id
    JOIN public.escolas e_origem ON t.escola_origem_id = e_origem.id
    LEFT JOIN public.escolas e_destino ON t.escola_destino_id = e_destino.id
    JOIN public.responsaveis r ON t.responsavel_id = r.id
    WHERE t.id = p_transferencia_id;

    -- Se não encontrar o registro, interrompe
    IF v_aluno_id IS NULL THEN
        RETURN;
    END IF;

    -- LÓGICA POR TIPO DE NOTIFICAÇÃO
    IF p_tipo = 'solicitacao' THEN
        -- 1. Notificar Responsável (Pedido de Aceite)
        IF v_resp_user_id IS NOT NULL THEN
            INSERT INTO public.notificacoes (tenant_id, user_id, tipo, titulo, mensagem, href, categoria, prioridade, metadata, lida, resolvida)
            VALUES (
                v_origem_tenant_id, -- Tenant de origem pois o portal do responsável está vinculado a ele
                v_resp_user_id,
                'DOCUMENTO',
                'Pedido de Transferencia',
                'A escola ' || v_destino_nome || ' solicitou a transferencia de ' || v_aluno_nome || '. Seu aceite e obrigatorio.',
                '/portal/transferencias',
                'ESCOLAS',
                2,
                jsonb_build_object('transferencia_id', p_transferencia_id, 'aluno_id', v_aluno_id),
                false,
                false
            );
        END IF;

        -- 2. Notificar Escola de Origem (Aviso de que um aluno está sendo solicitado)
        INSERT INTO public.notificacoes (tenant_id, user_id, tipo, titulo, mensagem, href, categoria, prioridade, metadata, lida, resolvida)
        VALUES (
            v_origem_tenant_id,
            NULL, -- Global para admins
            'DOCUMENTO',
            'Nova Solicitacao de Transferencia',
            'O aluno ' || v_aluno_nome || ' foi solicitado pela escola ' || v_destino_nome || '. Aguardando aceite da familia.',
            '/transferencias',
            'ESCOLAS',
            1,
            jsonb_build_object('transferencia_id', p_transferencia_id, 'aluno_id', v_aluno_id),
            false,
            false
        );

    ELSIF p_tipo = 'aprovacao' THEN
        -- Notificar Escola de Origem (Aviso de que a família aceitou e agora é com elas)
        INSERT INTO public.notificacoes (tenant_id, user_id, tipo, titulo, mensagem, href, categoria, prioridade, metadata, lida, resolvida)
        VALUES (
            v_origem_tenant_id,
            NULL,
            'DOCUMENTO',
            'Transferencia Aprovada pela Familia',
            'A familia aceitou a transferencia de ' || v_aluno_nome || '. Voce tem 30 dias para processar a liberacao.',
            '/transferencias',
            'ESCOLAS',
            2,
            jsonb_build_object('transferencia_id', p_transferencia_id, 'aluno_id', v_aluno_id),
            false,
            false
        );

        -- Notificar Escola de Destino (A família aceitou)
        IF v_destino_tenant_id IS NOT NULL THEN
            INSERT INTO public.notificacoes (tenant_id, user_id, tipo, titulo, mensagem, href, categoria, prioridade, metadata, lida, resolvida)
            VALUES (
                v_destino_tenant_id,
                NULL,
                'DOCUMENTO',
                'Familia Aceitou Transferencia',
                'O responsavel por ' || v_aluno_nome || ' aprovou o pedido. Aguardando liberacao da escola de origem.',
                '/transferencias',
                'ESCOLAS',
                1,
                jsonb_build_object('transferencia_id', p_transferencia_id, 'aluno_id', v_aluno_id),
                false,
                false
            );
        END IF;

    ELSIF p_tipo = 'concluido' THEN
        -- Notificar Escola de Destino (Sucesso final)
        IF v_destino_tenant_id IS NOT NULL THEN
            INSERT INTO public.notificacoes (tenant_id, user_id, tipo, titulo, mensagem, href, categoria, prioridade, metadata, lida, resolvida)
            VALUES (
                v_destino_tenant_id,
                NULL,
                'DOCUMENTO',
                'Transferencia Concluida',
                'O processo de ' || v_aluno_nome || ' foi finalizado. O aluno ja pode ser matriculado.',
                '/transferencias',
                'ESCOLAS',
                2,
                jsonb_build_object('transferencia_id', p_transferencia_id, 'aluno_id', v_aluno_id),
                false,
                false
            );
        END IF;

        -- Notificar Responsável
        IF v_resp_user_id IS NOT NULL THEN
            INSERT INTO public.notificacoes (tenant_id, user_id, tipo, titulo, mensagem, href, categoria, prioridade, metadata, lida, resolvida)
            VALUES (
                COALESCE(v_destino_tenant_id, v_origem_tenant_id),
                v_resp_user_id,
                'DOCUMENTO',
                'Transferencia Finalizada',
                'A transferencia de ' || v_aluno_nome || ' foi concluida com sucesso.',
                '/portal/transferencias',
                'ESCOLAS',
                1,
                jsonb_build_object('transferencia_id', p_transferencia_id, 'aluno_id', v_aluno_id),
                false,
                false
            );
        END IF;

    ELSIF p_tipo = 'recusado' THEN
        -- Notificar Escola de Destino (Alguém negou)
        IF v_destino_tenant_id IS NOT NULL THEN
            INSERT INTO public.notificacoes (tenant_id, user_id, tipo, titulo, mensagem, href, categoria, prioridade, metadata, lida, resolvida)
            VALUES (
                v_destino_tenant_id,
                NULL,
                'DOCUMENTO',
                'Pedido de Transferencia Recusado',
                'O pedido para ' || v_aluno_nome || ' foi recusado ou cancelado.',
                '/transferencias',
                'ESCOLAS',
                2,
                jsonb_build_object('transferencia_id', p_transferencia_id, 'aluno_id', v_aluno_id),
                false,
                false
            );
        END IF;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.fn_transferencia_notificacao_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- CASO: INSERT (Nova solicitação)
    IF (TG_OP = 'INSERT') THEN
        IF NEW.status = 'aguardando_responsavel' THEN
            PERFORM public.fn_criar_notificacao_transferencia(NEW.id, 'solicitacao');
        END IF;
    
    -- CASO: UPDATE (Mudança de status)
    ELSIF (TG_OP = 'UPDATE') THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            PERFORM public.fn_criar_notificacao_transferencia(
                NEW.id,
                CASE 
                    WHEN NEW.status = 'aguardando_responsavel' THEN 'solicitacao'
                    WHEN NEW.status = 'aguardando_liberacao_origem' THEN 'aprovacao'
                    WHEN NEW.status = 'concluido' THEN 'concluido'
                    WHEN NEW.status = 'recusado' OR NEW.status = 'cancelado' THEN 'recusado'
                    ELSE NULL
                END
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CRIAÇÃO DOS TRIGGERS
CREATE TRIGGER trg_transferencia_notificacao_engine
AFTER INSERT OR UPDATE ON public.transferencias_escolares
FOR EACH ROW
EXECUTE FUNCTION public.fn_transferencia_notificacao_trigger();

-- 5. COMENTÁRIO
COMMENT ON FUNCTION public.fn_criar_notificacao_transferencia IS 'Gera notificações inteligentes para o ciclo de vida das transferências escolares.';
