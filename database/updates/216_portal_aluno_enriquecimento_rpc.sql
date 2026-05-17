-- ============================================================
-- 216_portal_aluno_enriquecimento_rpc.sql
-- Centraliza a resolucao de matricula/turma do aluno no banco,
-- evitando 3 a 4 queries sequenciais no mount do portal.
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_portal_aluno_enriquecimento(p_aluno_id UUID)
RETURNS TABLE (
    aluno_id UUID,
    tenant_id UUID,
    turma_id UUID,
    turma_nome TEXT,
    turma_turno TEXT,
    turma_valor_mensalidade NUMERIC,
    valor_matricula NUMERIC,
    valor_mensalidade NUMERIC,
    serie_ano TEXT,
    matricula_turno TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH aluno_autorizado AS (
        SELECT a.id, a.tenant_id, a.valor_mensalidade_atual
        FROM public.alunos a
        WHERE a.id = p_aluno_id
          AND EXISTS (
              SELECT 1
              FROM public.responsaveis r
              JOIN public.aluno_responsavel ar ON ar.responsavel_id = r.id
              WHERE r.user_id = auth.uid()
                AND ar.aluno_id = a.id
                AND ar.status = 'ativo'
          )
        LIMIT 1
    ),
    matricula_ativa AS (
        SELECT m.aluno_id, m.tenant_id, m.turma_id, m.serie_ano, m.turno, m.valor_matricula
        FROM public.matriculas m
        JOIN aluno_autorizado a ON a.id = m.aluno_id AND a.tenant_id = m.tenant_id
        WHERE m.status = 'ativa'
        ORDER BY m.data_matricula DESC NULLS LAST, m.created_at DESC NULLS LAST
        LIMIT 1
    ),
    turma_resolvida AS (
        SELECT t.id, t.nome, t.turno, t.valor_mensalidade, c.prioridade
        FROM matricula_ativa m
        JOIN LATERAL (
            SELECT t1.id, t1.nome, t1.turno, t1.valor_mensalidade, 1 AS prioridade
            FROM public.turmas t1
            WHERE t1.tenant_id = m.tenant_id
              AND t1.id = m.turma_id

            UNION ALL

            SELECT t2.id, t2.nome, t2.turno, t2.valor_mensalidade, 2 AS prioridade
            FROM public.turmas t2
            WHERE t2.tenant_id = m.tenant_id
              AND m.aluno_id = ANY(COALESCE(t2.alunos_ids, ARRAY[]::UUID[]))

            UNION ALL

            SELECT t3.id, t3.nome, t3.turno, t3.valor_mensalidade, 3 AS prioridade
            FROM public.turmas t3
            WHERE t3.tenant_id = m.tenant_id
              AND t3.nome = m.serie_ano
              AND (
                  t3.turno = m.turno
                  OR t3.turno = CASE
                      WHEN m.turno = 'manha' THEN 'matutino'
                      WHEN m.turno = 'tarde' THEN 'vespertino'
                      ELSE m.turno
                  END
              )
        ) c ON TRUE
        JOIN public.turmas t ON t.id = c.id
        ORDER BY c.prioridade
        LIMIT 1
    )
    SELECT
        a.id AS aluno_id,
        a.tenant_id,
        tr.id AS turma_id,
        COALESCE(tr.nome, m.serie_ano) AS turma_nome,
        COALESCE(tr.turno, m.turno) AS turma_turno,
        tr.valor_mensalidade AS turma_valor_mensalidade,
        m.valor_matricula,
        COALESCE(tr.valor_mensalidade, a.valor_mensalidade_atual, m.valor_matricula) AS valor_mensalidade,
        m.serie_ano,
        m.turno AS matricula_turno
    FROM aluno_autorizado a
    LEFT JOIN matricula_ativa m ON m.aluno_id = a.id
    LEFT JOIN turma_resolvida tr ON TRUE;
$$;

REVOKE ALL ON FUNCTION public.fn_portal_aluno_enriquecimento(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_portal_aluno_enriquecimento(UUID) TO authenticated;

COMMENT ON FUNCTION public.fn_portal_aluno_enriquecimento(UUID) IS
  'Retorna matricula/turma atuais de um filho do responsavel autenticado para o Portal da Familia.';
