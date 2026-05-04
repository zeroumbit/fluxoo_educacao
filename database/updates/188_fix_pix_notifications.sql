-- ==============================================================================
-- SCRIPT DE CORREÇÃO E AUTOMAÇÃO: PIX MANUAL NOTIFICAÇÕES
-- Objetivo: 
-- 1. Preencher metadata (responsável, aluno, turmas, valor) das notificações antigas.
-- 2. Criar trigger para auto-resolver notificação quando cobrança for paga.
-- ==============================================================================

-- PARTE 1: Correção de dados existentes (Backfill)
DO $$
DECLARE
    v_notif RECORD;
    v_cobranca_id UUID;
    v_resp_nome TEXT;
    v_aluno_nomes TEXT;
    v_turma_nomes TEXT;
    v_valor_total DECIMAL;
    v_meses TEXT;
    v_tipos TEXT;
BEGIN
    FOR v_notif IN 
        SELECT id, metadata, tenant_id 
        FROM public.notificacoes 
        WHERE tipo = 'PAGAMENTO_PIX_MANUAL' AND (metadata->>'responsavel_nome' IS NULL OR metadata->>'aluno_nome' IS NULL)
    LOOP
        -- Extrair o primeiro ID do array cobranca_ids (se existir)
        IF jsonb_array_length(v_notif.metadata->'cobranca_ids') > 0 THEN
            
            -- Calcular totais e concatenar nomes
            SELECT 
                SUM(c.valor),
                string_agg(DISTINCT a.nome_completo, ', '),
                string_agg(DISTINCT t.nome, ', '),
                string_agg(DISTINCT c.descricao, '; '),
                string_agg(DISTINCT c.tipo_cobranca, ', ')
            INTO 
                v_valor_total,
                v_aluno_nomes,
                v_turma_nomes,
                v_meses,
                v_tipos
            FROM public.cobrancas c
            JOIN public.alunos a ON a.id = c.aluno_id
            LEFT JOIN public.matriculas m ON m.aluno_id = a.id AND m.status = 'ativa'
            LEFT JOIN public.turmas t ON t.id = m.turma_id
            WHERE c.id IN (
                SELECT value::uuid 
                FROM jsonb_array_elements_text(v_notif.metadata->'cobranca_ids')
            );

            -- Buscar nome do responsável a partir de aluno_responsavel
            SELECT r.nome INTO v_resp_nome
            FROM public.cobrancas c
            JOIN public.aluno_responsavel ar ON ar.aluno_id = c.aluno_id
            JOIN public.responsaveis r ON r.id = ar.responsavel_id
            WHERE c.id = (v_notif.metadata->'cobranca_ids'->>0)::uuid
            LIMIT 1;

            -- Atualizar notificação com os dados enriquecidos
            UPDATE public.notificacoes
            SET metadata = jsonb_set(
                jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(
                                jsonb_set(
                                    metadata, 
                                    '{responsavel_nome}', to_jsonb(COALESCE(v_resp_nome, 'Responsável'))
                                ),
                                '{aluno_nome}', to_jsonb(COALESCE(v_aluno_nomes, ''))
                            ),
                            '{turma_nome}', to_jsonb(COALESCE(v_turma_nomes, ''))
                        ),
                        '{valor_total}', to_jsonb(COALESCE(v_valor_total, 0))
                    ),
                    '{meses_referencia}', to_jsonb(COALESCE(v_meses, ''))
                ),
                '{tipo_cobranca}', to_jsonb(COALESCE(v_tipos, 'Mensalidade'))
            )
            WHERE id = v_notif.id;
        END IF;
    END LOOP;
END;
$$;


-- PARTE 2: Trigger para auto-resolver a notificação de PIX quando o pagamento for aprovado
CREATE OR REPLACE FUNCTION public.fn_resolver_notificacao_pix_pago()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o status mudou para 'pago' ou o campo 'pago' mudou para TRUE
    IF (NEW.status = 'pago' AND OLD.status != 'pago') OR (NEW.pago = TRUE AND OLD.pago = FALSE) THEN
        
        -- Atualizar notificações pendentes relacionadas a esta cobrança
        UPDATE public.notificacoes
        SET 
            resolvida = TRUE,
            lida = TRUE,
            updated_at = NOW()
        WHERE 
            tipo = 'PAGAMENTO_PIX_MANUAL' 
            AND resolvida = FALSE
            AND metadata->'cobranca_ids' @> to_jsonb(NEW.id::text)
            AND tenant_id = NEW.tenant_id;
            
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que a trigger existe
DROP TRIGGER IF EXISTS trg_resolver_notif_pix_pago ON public.cobrancas;
CREATE TRIGGER trg_resolver_notif_pix_pago
    AFTER UPDATE OF status, pago ON public.cobrancas
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_resolver_notificacao_pix_pago();
