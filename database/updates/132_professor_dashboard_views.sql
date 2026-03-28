-- =============================================================================
-- MIGRATION 132: Views Analíticas para o Dashboard do Professor
-- Adaptadas para as tabelas reais: turma_grade_horaria, turma_professores,
-- planos_aula (com coluna professor_id), academico_atividades
-- =============================================================================

-- -------------------------------------------------------------------------
-- VIEW 1: Agenda do Dia do Professor
-- Retorna os horários de aulas do professor para o dia atual
-- -------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_professor_agenda_hoje AS
SELECT
    gh.id AS grade_id,
    gh.tenant_id,
    gh.professor_id,
    gh.turma_id,
    t.nome        AS turma_nome,
    gh.disciplina_id,
    d.nome        AS disciplina_nome,
    gh.hora_inicio,
    gh.hora_fim,
    COALESCE(gh.sala, '') AS sala,
    CURRENT_DATE  AS data_aula,
    -- Verifica se já existe registro de frequência hoje para esta aula
    EXISTS (
        SELECT 1
        FROM public.frequencias fr
        WHERE fr.turma_id      = gh.turma_id
          AND fr.data_aula     = CURRENT_DATE
        LIMIT 1
    ) AS chamada_realizada,
    -- Verifica se o conteúdo do plano de aula foi registrado hoje
    EXISTS (
        SELECT 1
        FROM public.planos_aula pa
        WHERE pa.turma_id = gh.turma_id
          AND pa.disciplina_id    = gh.disciplina_id
          AND pa.data_aula        = CURRENT_DATE
          AND pa.conteudo_realizado IS NOT NULL
        LIMIT 1
    ) AS conteudo_registrado
FROM public.turma_grade_horaria gh
JOIN public.turmas     t ON t.id = gh.turma_id
JOIN public.disciplinas d ON d.id = gh.disciplina_id
-- ISODOW: 1=Segunda a 7=Domingo — mapeia com o campo dia_semana da grade
WHERE gh.dia_semana = EXTRACT(ISODOW FROM CURRENT_DATE)::int;


-- -------------------------------------------------------------------------
-- VIEW 2: Pendências Críticas do Professor (últimos 15 dias)
-- -------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_professor_pendencias AS
-- 1. Planos de aula passados sem conteúdo registrado
SELECT
    pa.tenant_id,
    pa.professor_id,
    'conteudo'::text                AS tipo_pendencia,
    'Conteúdo não registrado'::text AS descricao,
    pa.data_aula                    AS data_referencia,
    COALESCE(
        (SELECT t.nome FROM public.turmas t WHERE t.id = pa.turma_id),
        'Turma não especificada'
    )                               AS contexto
FROM public.planos_aula pa
WHERE pa.data_aula  < CURRENT_DATE
  AND pa.data_aula >= CURRENT_DATE - INTERVAL '15 days'
  AND pa.conteudo_realizado IS NULL

UNION ALL

-- 2. Avaliações com prazo vencido ainda sem notas registradas para todos os alunos
SELECT
    ac.tenant_id,
    tp.professor_id,
    'notas'::text                                 AS tipo_pendencia,
    'Avaliação aguardando correção/notas'::text   AS descricao,
    ac.data_aplicacao                             AS data_referencia,
    ac.titulo                                     AS contexto
FROM public.avaliacoes_config ac
JOIN public.turma_professores tp ON tp.turma_id = ac.turma_id AND tp.disciplina_id = ac.disciplina_id
WHERE ac.data_aplicacao  < CURRENT_DATE
  AND ac.data_aplicacao >= CURRENT_DATE - INTERVAL '15 days'
  AND ac.deleted_at IS NULL
  AND EXISTS (
      -- Se a turma tem alunos ativos que AINDA NÃO TEM nota lançada para a avaliação
      SELECT 1
      FROM public.matriculas m
      WHERE m.turma_id = ac.turma_id
        AND m.status = 'ativa'
        AND NOT EXISTS (
            SELECT 1
            FROM public.avaliacoes_notas an
            WHERE an.avaliacao_id = ac.id
              AND an.aluno_id = m.aluno_id
              AND an.deleted_at IS NULL
        )
  );


-- -------------------------------------------------------------------------
-- VIEW 3: Saúde das Turmas do Professor (frequência + média do mês)
-- -------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_professor_saude_turmas AS
SELECT
    tp.tenant_id,
    tp.professor_id,
    tp.turma_id,
    t.nome AS turma_nome,
    -- Total de alunos com matrícula ativa na turma
    COALESCE((
        SELECT COUNT(*)
        FROM public.matriculas m
        WHERE m.turma_id = tp.turma_id
          AND m.status   = 'ativa'
    ), 0)::int AS total_alunos,
    -- Percentual de presença no mês atual
    COALESCE((
        SELECT ROUND(
            (COUNT(*) FILTER (WHERE fr.status = 'presente'))::numeric
            / NULLIF(COUNT(*), 0) * 100
        , 1)
        FROM public.frequencias fr
        WHERE fr.turma_id = tp.turma_id
          AND EXTRACT(MONTH FROM fr.data_aula) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR  FROM fr.data_aula) = EXTRACT(YEAR  FROM CURRENT_DATE)
    ), 100)::numeric AS percentual_presenca,
    -- Média geral de notas das avaliações da turma
    COALESCE((
        SELECT ROUND(AVG(bc.media_final), 1)
        FROM public.vw_boletim_completo bc
        WHERE bc.turma_id = tp.turma_id
    ), 0)::numeric AS media_geral
FROM public.turma_professores tp
JOIN public.turmas t ON t.id = tp.turma_id
WHERE tp.status = 'ativo';


-- -------------------------------------------------------------------------
-- Comentários nas views para documentação
-- -------------------------------------------------------------------------
COMMENT ON VIEW public.vw_professor_agenda_hoje IS
  'Agenda do dia atual do professor — cruzamento da grade horária com chamadas e conteúdos registrados.';

COMMENT ON VIEW public.vw_professor_pendencias IS
  'Pendências dos últimos 15 dias: conteúdos e resultados de atividades não registrados.';

COMMENT ON VIEW public.vw_professor_saude_turmas IS
  'Métricas de saúde das turmas vinculadas ao professor: presença mensal e média de notas.';
