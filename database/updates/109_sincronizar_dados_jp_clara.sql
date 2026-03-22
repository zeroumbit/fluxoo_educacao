-- ==============================================================================
-- 🚀 MIGRATION 109: SINCRONIZAÇÃO DE DADOS FINANCEIROS (JOÃO PEDRO & CLARA MARIA)
-- Descrição: Sincroniza o histórico financeiro e dados de ingresso entre irmãos.
--            Garante que o João Pedro tenha as mesmas cobranças da irmã Clara Maria.
--            Atende à solicitação: "João Pedro Alves, assim como a irmã CLARA MARIA 
--            entraram no mesmo dia... suas questões financeiras são iguais."
-- 0. Garantir Schema esperado (caso colunas novas ainda não existam no banco do usuário)
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS tipo_cobranca text DEFAULT 'mensalidade';
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS turma_id uuid;
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS ano_letivo integer;

DO $$
DECLARE
    v_id_clara uuid;
    v_id_joao uuid;
    v_tenant_id uuid;
    v_cobranca record;
    v_total_criadas integer := 0;
    v_total_atualizadas integer := 0;
BEGIN
    -- 1. Identificar os IDs dos alunos (Busca por nome conforme solicitado)
    SELECT id, tenant_id INTO v_id_clara, v_tenant_id FROM public.alunos WHERE nome_completo ILIKE '%Clara Maria%' LIMIT 1;
    SELECT id INTO v_id_joao FROM public.alunos WHERE nome_completo ILIKE '%João Pedro Alves%' LIMIT 1;

    IF v_id_clara IS NULL OR v_id_joao IS NULL THEN
        RAISE NOTICE '⚠️ Alunos não encontrados no banco com estes nomes exatos. Verifique se há erros de digitação.';
        RETURN;
    END IF;

    RAISE NOTICE 'Sincronizando dados para Clara Maria (ID: %) e João Pedro Alves (ID: %)', v_id_clara, v_id_joao;

    -- 2. Sincronizar dados Cadastrais de Ingresso e Valores Base
    -- Garante que ambos tenham a mesma data de ingresso e valor de mensalidade configurado no cadastro
    UPDATE public.alunos 
    SET 
        data_ingresso = (SELECT data_ingresso FROM public.alunos WHERE id = v_id_clara),
        valor_mensalidade_atual = (SELECT valor_mensalidade_atual FROM public.alunos WHERE id = v_id_clara),
        updated_at = NOW()
    WHERE id = v_id_joao;

    -- 3. Sincronizar Histórico de Cobranças (Incluindo 10/04/2026 e passados)
    -- Percorre todas as cobranças da Clara para replicar no João
    FOR v_cobranca IN 
        SELECT * FROM public.cobrancas WHERE aluno_id = v_id_clara
    LOOP
        -- 3.1 Busca se o João já tem essa cobrança (verificando data e descrição)
        IF NOT EXISTS (
            SELECT 1 FROM public.cobrancas 
            WHERE aluno_id = v_id_joao 
            AND data_vencimento = v_cobranca.data_vencimento
            AND (descricao = v_cobranca.descricao OR tipo_cobranca = v_cobranca.tipo_cobranca)
        ) THEN
            -- 3.2 Cria a cobrança faltante para o João (incluindo a do dia 10/04/2026)
            INSERT INTO public.cobrancas (
                tenant_id, 
                aluno_id, 
                turma_id, 
                descricao, 
                valor, 
                data_vencimento, 
                status, 
                tipo_cobranca, 
                data_pagamento, 
                forma_pagamento, 
                observacoes, 
                ano_letivo,
                created_at, 
                updated_at
            ) VALUES (
                v_cobranca.tenant_id, 
                v_id_joao, 
                v_cobranca.turma_id, 
                v_cobranca.descricao, 
                v_cobranca.valor, 
                v_cobranca.data_vencimento,
                v_cobranca.status, 
                v_cobranca.tipo_cobranca, 
                v_cobranca.data_pagamento,
                v_cobranca.forma_pagamento, 
                v_cobranca.observacoes, 
                v_cobranca.ano_letivo,
                NOW(), 
                NOW()
            );
            v_total_criadas := v_total_criadas + 1;
        ELSE
            -- 3.3 Se já existe, sincroniza o Status e Valor para garantir igualdade real no histórico
            UPDATE public.cobrancas
            SET 
                status = v_cobranca.status,
                valor = v_cobranca.valor,
                data_pagamento = v_cobranca.data_pagamento,
                forma_pagamento = v_cobranca.forma_pagamento,
                updated_at = NOW()
            WHERE aluno_id = v_id_joao 
            AND data_vencimento = v_cobranca.data_vencimento
            AND (descricao = v_cobranca.descricao OR tipo_cobranca = v_cobranca.tipo_cobranca)
            AND (status != v_cobranca.status OR valor != v_cobranca.valor OR COALESCE(data_pagamento, '1900-01-01') != COALESCE(v_cobranca.data_pagamento, '1900-01-01'));
            
            v_total_atualizadas := v_total_atualizadas + 1;
        END IF;
    END LOOP;

    -- 4. Relatório Final
    RAISE NOTICE '✅ Sincronização Concluída:';
    RAISE NOTICE '   - % cobranças criadas para João Pedro Alves (incluindo pendências de Abril/2026)', v_total_criadas;
    RAISE NOTICE '   - % cobranças existentes foram atualizadas para bater com o histórico da irmã', v_total_atualizadas;
END $$;
