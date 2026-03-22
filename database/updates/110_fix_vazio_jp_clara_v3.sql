-- ==============================================================================
-- 🚀 MIGRATION 110: SINCRONIZAÇÃO AGRESSIVA POR VÍNCULO FAMILIAR
-- Objetivo: Garante que todos os filhos de um mesmo responsável (João Pedro e Clara)
--            tenham os mesmos dados financeiros, corrigindo o problema de listagem vazia.
-- Data: 22 de março de 2026
-- ==============================================================================

DO $$
DECLARE
    v_id_clara uuid;
    v_id_aluno_destino uuid;
    v_resp_id uuid;
    v_tenant_id uuid;
    v_cobranca record;
    v_criadas int := 0;
    v_aluno_nome text;
BEGIN
    -- 1. Localizar Clara Maria (Referência de dados bons)
    SELECT id, tenant_id INTO v_id_clara, v_tenant_id 
    FROM public.alunos 
    WHERE nome_completo ILIKE '%Clara Maria%' LIMIT 1;

    IF v_id_clara IS NULL THEN
        RAISE NOTICE '❌ Aluno referência (Clara Maria) não encontrado.';
        RETURN;
    END IF;

    -- 2. Localizar o Responsável da Clara
    SELECT responsavel_id INTO v_resp_id FROM public.aluno_responsavel WHERE aluno_id = v_id_clara LIMIT 1;

    IF v_resp_id IS NULL THEN
        RAISE NOTICE '❌ Responsável da Clara Maria não encontrado no vínculo.';
        RETURN;
    END IF;

    -- 3. Identificar os irmãos (incluindo João Pedro)
    RAISE NOTICE '🔍 Localizando irmãos vinculados ao Responsável ID: %', v_resp_id;

    FOR v_id_aluno_destino, v_aluno_nome IN 
        SELECT a.id, a.nome_completo 
        FROM public.aluno_responsavel ar
        JOIN public.alunos a ON a.id = ar.aluno_id
        WHERE ar.responsavel_id = v_resp_id AND ar.aluno_id <> v_id_clara
    LOOP
        RAISE NOTICE '➡️ Sincronizando: % (ID: %)', v_aluno_nome, v_id_aluno_destino;

        -- Sincronizar data de ingresso e mensalidade base (se estiverem zeradas ou diferentes)
        UPDATE public.alunos 
        SET 
            data_ingresso = COALESCE(data_ingresso, (SELECT data_ingresso FROM public.alunos WHERE id = v_id_clara)),
            valor_mensalidade_atual = COALESCE(valor_mensalidade_atual, (SELECT valor_mensalidade_atual FROM public.alunos WHERE id = v_id_clara)),
            status = 'ativo'
        WHERE id = v_id_aluno_destino;

        -- Copiar as cobranças que a Clara tem e o irmão não tem
        FOR v_cobranca IN 
            SELECT * FROM public.cobrancas WHERE aluno_id = v_id_clara
        LOOP
            -- Verifica duplicidade por descrição OU data de vencimento
            IF NOT EXISTS (
                SELECT 1 FROM public.cobrancas 
                WHERE aluno_id = v_id_aluno_destino 
                AND data_vencimento = v_cobranca.data_vencimento 
                AND (descricao = v_cobranca.descricao)
            ) THEN
                INSERT INTO public.cobrancas (
                    tenant_id, 
                    aluno_id, 
                    descricao, 
                    valor, 
                    data_vencimento, 
                    status, 
                    tipo_cobranca, 
                    turma_id, 
                    ano_letivo, 
                    forma_pagamento, 
                    observacoes
                ) VALUES (
                    v_tenant_id, 
                    v_id_aluno_destino, 
                    v_cobranca.descricao, 
                    v_cobranca.valor, 
                    v_cobranca.data_vencimento, 
                    v_cobranca.status, 
                    COALESCE(v_cobranca.tipo_cobranca, 'mensalidade'), 
                    (SELECT turma_id FROM public.matriculas WHERE aluno_id = v_id_aluno_destino AND status = 'ativa' LIMIT 1), 
                    v_cobranca.ano_letivo, 
                    v_cobranca.forma_pagamento, 
                    'Sincronizado via Migration 110'
                );
                v_criadas := v_criadas + 1;
            END IF;
        END LOOP;
    END LOOP;

    IF v_criadas > 0 THEN
        RAISE NOTICE '✅ Sincronização concluída com sucesso! % novas cobranças criadas.', v_criadas;
    ELSE
        RAISE NOTICE 'ℹ️ Nenhuma cobrança nova precisou ser criada (já estavam sincronizadas ou irmãos não encontrados).';
    END IF;
END $$;
