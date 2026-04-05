-- =====================================================
-- 🛡️ MIGRATION 139: CONSOLIDAÇÃO VALOR_MENSALIDADE
-- Descrição: Garante que turmas.valor_mensalidade seja a
--            fonte de verdade (source-of-truth), com função
--            RPC de reconciliação e validação.
-- =====================================================

-- 1. Função RPC para reconciliação manual/periódica
--    Verifica e corrige divergências entre turmas e alunos
CREATE OR REPLACE FUNCTION public.fn_reconciliar_mensalidades(p_tenant_id TEXT)
RETURNS TABLE(
    aluno_id TEXT,
    turma_id TEXT,
    valor_turma NUMERIC,
    valor_aluno NUMERIC,
    corrigido BOOLEAN
) AS $$
BEGIN
    -- Encontra divergências
    RETURN QUERY
    SELECT
        m.aluno_id::TEXT,
        m.turma_id::TEXT,
        t.valor_mensalidade AS valor_turma,
        a.valor_mensalidade_atual AS valor_aluno,
        TRUE AS corrigido
    FROM matriculas m
    JOIN turmas t ON t.id = m.turma_id
    JOIN alunos a ON a.id = m.aluno_id
    WHERE m.tenant_id = p_tenant_id
      AND m.status = 'ativa'
      AND t.valor_mensalidade IS DISTINCT FROM a.valor_mensalidade_atual;

    -- Corrige divergências
    UPDATE alunos a
    SET valor_mensalidade_atual = t.valor_mensalidade,
        updated_at = NOW()
    FROM matriculas m
    JOIN turmas t ON t.id = m.turma_id
    WHERE a.id = m.aluno_id
      AND m.tenant_id = p_tenant_id
      AND m.status = 'ativa'
      AND t.valor_mensalidade IS DISTINCT FROM a.valor_mensalidade_atual;

    -- Se não houve divergências, retorna vazio
    IF NOT FOUND THEN
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 2. Função para verificar consistência (read-only)
CREATE OR REPLACE FUNCTION public.fn_verificar_consistencia_mensalidades(p_tenant_id TEXT)
RETURNS TABLE(
    total_alunos_ativos BIGINT,
    total_com_divergencia BIGINT,
    divergencias JSONB
) AS $$
BEGIN
    -- Conta total de alunos ativos
    SELECT COUNT(*)::BIGINT
    INTO total_alunos_ativos
    FROM matriculas m
    WHERE m.tenant_id = p_tenant_id
      AND m.status = 'ativa';

    -- Conta e lista divergências
    SELECT
        COUNT(*)::BIGINT,
        jsonb_agg(jsonb_build_object(
            'aluno_id', m.aluno_id,
            'aluno_nome', a.nome_completo,
            'turma_id', m.turma_id,
            'turma_nome', t.nome,
            'valor_turma', t.valor_mensalidade,
            'valor_aluno', a.valor_mensalidade_atual
        ))
    INTO total_com_divergencia, divergencias
    FROM matriculas m
    JOIN turmas t ON t.id = m.turma_id
    JOIN alunos a ON a.id = m.aluno_id
    WHERE m.tenant_id = p_tenant_id
      AND m.status = 'ativa'
      AND t.valor_mensalidade IS DISTINCT FROM a.valor_mensalidade_atual;

    -- Se não há divergências, retorna zero e array vazio
    IF total_com_divergencia = 0 OR total_com_divergencia IS NULL THEN
        total_com_divergencia := 0;
        divergencias := '[]'::jsonb;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 3. Comentário documenting a source-of-truth
COMMENT ON COLUMN turmas.valor_mensalidade IS
    'SOURCE OF TRUTH: Valor canônico da mensalidade. alunos.valor_mensalidade_atual é sincronizado via trigger. cobrancas.valor é herdado de turmas.valor_mensalidade.';

COMMENT ON COLUMN alunos.valor_mensalidade_atual IS
    'DENORMALIZED: Sincronizado automaticamente via trg_sincronizar_mensalidade. NAO editar diretamente. Usado apenas para leitura rápida no dashboard.';

COMMENT ON COLUMN matriculas.valor_matricula IS
    'HISTORICO: Valor no momento da matrícula. Pode diferir do valor atual da turma. Usado apenas para auditoria histórica.';
