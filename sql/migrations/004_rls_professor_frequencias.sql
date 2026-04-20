-- ============================================================
-- RLS: Professor Access - Frequencias
-- Permite que professores lancem frequencia para suas turmas.
-- ============================================================

-- 1. frequencias (Acesso para professores)
DROP POLICY IF EXISTS "professor_frequencias_all" ON frequencias;
CREATE POLICY "professor_frequencias_all" ON frequencias
FOR ALL USING (
  exists (
    select 1 from turma_professores tp
    join funcionarios f on f.id = tp.professor_id
    where tp.turma_id = frequencias.turma_id
    and f.user_id = auth.uid()
  )
);

-- 2. Garantir que o gestor continue tendo acesso total (ja existe, mas reforcamos se necessario)
-- DROP POLICY IF EXISTS "gestor_frequencias_all" ON frequencias;
-- CREATE POLICY "gestor_frequencias_all" ON frequencias
-- FOR ALL USING (
--   exists (select 1 from escolas where id = (select tenant_id from turmas where id = frequencias.turma_id) and gestor_user_id = auth.uid())
-- );
