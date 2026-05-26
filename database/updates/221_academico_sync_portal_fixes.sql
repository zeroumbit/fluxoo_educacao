-- ============================================================
-- 221_academico_sync_portal_fixes.sql
-- Correcoes de sincronismo escola -> portal:
-- 1. Frequencia em lote atomica via RPC.
-- 2. Ano letivo no boletim V2 derivado da data da avaliacao.
-- ============================================================

CREATE OR REPLACE FUNCTION public.salvar_frequencias_turma_data(
  p_tenant_id UUID,
  p_turma_id UUID,
  p_data_aula DATE,
  p_frequencias JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alunos_sem_matricula INTEGER;
BEGIN
  IF p_tenant_id IS NULL OR p_turma_id IS NULL OR p_data_aula IS NULL THEN
    RAISE EXCEPTION 'tenant_id, turma_id e data_aula sao obrigatorios.';
  END IF;

  IF p_frequencias IS NULL OR jsonb_typeof(p_frequencias) <> 'array' OR jsonb_array_length(p_frequencias) = 0 THEN
    RAISE EXCEPTION 'Lista de frequencias vazia ou invalida.';
  END IF;

  IF NOT (
    public.check_is_super_admin()
    OR public.check_is_tenant_staff(p_tenant_id)
  ) THEN
    RAISE EXCEPTION 'Permissao negada para salvar frequencia desta escola.';
  END IF;

  WITH payload AS (
    SELECT DISTINCT (item->>'aluno_id')::uuid AS aluno_id
    FROM jsonb_array_elements(p_frequencias) AS item
    WHERE item ? 'aluno_id'
  )
  SELECT COUNT(*)
  INTO v_alunos_sem_matricula
  FROM payload p
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.matriculas m
    WHERE m.aluno_id = p.aluno_id
      AND m.tenant_id = p_tenant_id
      AND m.turma_id = p_turma_id
      AND m.status = 'ativa'
  );

  IF v_alunos_sem_matricula > 0 THEN
    RAISE EXCEPTION 'Nao e possivel lancar frequencia para % aluno(s) sem matricula ativa nesta turma.', v_alunos_sem_matricula;
  END IF;

  DELETE FROM public.frequencias
  WHERE tenant_id = p_tenant_id
    AND turma_id = p_turma_id
    AND data_aula = p_data_aula;

  INSERT INTO public.frequencias (
    tenant_id,
    turma_id,
    aluno_id,
    data_aula,
    status,
    justificativa
  )
  SELECT
    p_tenant_id,
    p_turma_id,
    (item->>'aluno_id')::uuid,
    p_data_aula,
    COALESCE(NULLIF(item->>'status', ''), 'presente'),
    NULLIF(item->>'justificativa', '')
  FROM jsonb_array_elements(p_frequencias) AS item;
END;
$$;

REVOKE ALL ON FUNCTION public.salvar_frequencias_turma_data(UUID, UUID, DATE, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.salvar_frequencias_turma_data(UUID, UUID, DATE, JSONB) TO authenticated;

CREATE OR REPLACE VIEW public.vw_boletim_consolidado AS
SELECT
    n.aluno_id,
    c.disciplina_id,
    c.bimestre,
    c.turma_id,
    c.tenant_id,
    ROUND(
        SUM(n.nota * c.peso * COALESCE(pb.peso_bimestre, 1.0)) /
        NULLIF(SUM(CASE WHEN n.nota IS NOT NULL AND n.ausente = false THEN c.peso * COALESCE(pb.peso_bimestre, 1.0) ELSE 0 END), 0),
        2
    ) AS media_parcial,
    COUNT(f.id) FILTER (WHERE f.presente = false AND f.deleted_at IS NULL) AS total_faltas,
    COUNT(DISTINCT f.data_aula) FILTER (WHERE cl.tipo_dia = 'letivo') AS total_aulas_bimestre,
    NOW() AS calculado_em,
    COALESCE(EXTRACT(YEAR FROM c.data_aplicacao)::integer, EXTRACT(YEAR FROM CURRENT_DATE)::integer) AS ano_letivo
FROM public.avaliacoes_notas n
JOIN public.avaliacoes_config c ON n.avaliacao_id = c.id AND c.deleted_at IS NULL
LEFT JOIN public.config_pesos_bimestre pb
    ON pb.turma_id = c.turma_id
    AND pb.disciplina_id = c.disciplina_id
    AND pb.bimestre = c.bimestre
LEFT JOIN public.calendario_letivo cl
    ON cl.bimestre = c.bimestre
    AND cl.tenant_id = c.tenant_id
    AND cl.tipo_dia = 'letivo'
LEFT JOIN public.frequencia_diaria f
    ON f.aluno_id = n.aluno_id
    AND f.disciplina_id = c.disciplina_id
    AND f.data_aula = cl.data
    AND f.deleted_at IS NULL
WHERE n.deleted_at IS NULL
  AND n.ausente = false
GROUP BY n.aluno_id, c.disciplina_id, c.bimestre, c.turma_id, c.tenant_id, COALESCE(EXTRACT(YEAR FROM c.data_aplicacao)::integer, EXTRACT(YEAR FROM CURRENT_DATE)::integer);

CREATE OR REPLACE VIEW public.vw_boletim_completo AS
SELECT
    b.aluno_id,
    b.disciplina_id,
    d.nome AS nome_disciplina,
    b.bimestre,
    b.turma_id,
    b.tenant_id,
    b.media_parcial,
    COALESCE(b.total_faltas, 0) AS total_faltas,
    COALESCE(b.total_aulas_bimestre, 0) AS total_aulas_bimestre,
    rec.nota_recuperacao,
    CASE
        WHEN rec.nota_recuperacao IS NOT NULL
        THEN ROUND((COALESCE(b.media_parcial, 0) + rec.nota_recuperacao) / 2.0, 2)
        ELSE b.media_parcial
    END AS media_final,
    CASE
        WHEN COALESCE(b.total_aulas_bimestre, 0) > 0
             AND COALESCE(b.total_faltas, 0) > (COALESCE(b.total_aulas_bimestre, 0) * 0.25)
        THEN 'reprovado_falta'
        WHEN rec.nota_recuperacao IS NOT NULL
             AND (COALESCE(b.media_parcial, 0) + rec.nota_recuperacao) / 2.0 >= COALESCE((
                 SELECT (config_academica->>'media_aprovacao')::numeric
                 FROM public.configuracoes_escola
                 WHERE tenant_id = b.tenant_id AND vigencia_fim IS NULL
                 LIMIT 1
             ), 6.0)
        THEN 'aprovado_recuperacao'
        WHEN rec.nota_recuperacao IS NULL
             AND COALESCE(b.media_parcial, 0) >= COALESCE((
                 SELECT (config_academica->>'media_aprovacao')::numeric
                 FROM public.configuracoes_escola
                 WHERE tenant_id = b.tenant_id AND vigencia_fim IS NULL
                 LIMIT 1
             ), 6.0)
        THEN 'aprovado'
        WHEN rec.nota_recuperacao IS NOT NULL THEN 'reprovado_nota'
        ELSE 'cursando'
    END AS resultado,
    b.ano_letivo
FROM public.vw_boletim_consolidado b
LEFT JOIN public.disciplinas d ON d.id = b.disciplina_id
LEFT JOIN public.recuperacoes rec
    ON rec.aluno_id = b.aluno_id
    AND rec.disciplina_id = b.disciplina_id
    AND rec.bimestre = b.bimestre
    AND rec.deleted_at IS NULL;
