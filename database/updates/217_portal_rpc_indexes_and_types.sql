-- ============================================================
-- 217_portal_rpc_indexes_and_types.sql
-- Apoio de performance para fn_portal_aluno_enriquecimento.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_matriculas_portal_aluno_status_data
ON public.matriculas (aluno_id, tenant_id, status, data_matricula DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_turmas_portal_tenant_nome_turno
ON public.turmas (tenant_id, nome, turno);

CREATE INDEX IF NOT EXISTS idx_aluno_responsavel_portal_aluno_resp_status
ON public.aluno_responsavel (aluno_id, responsavel_id, status);

CREATE INDEX IF NOT EXISTS idx_responsaveis_portal_user_id
ON public.responsaveis (user_id);

COMMENT ON INDEX public.idx_matriculas_portal_aluno_status_data IS
  'Acelera a busca da matricula ativa mais recente no Portal da Familia.';

COMMENT ON INDEX public.idx_turmas_portal_tenant_nome_turno IS
  'Acelera fallback de turma por serie/turno no Portal da Familia.';
