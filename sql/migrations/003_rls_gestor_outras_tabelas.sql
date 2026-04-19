-- ============================================================
-- RLS: Gestor Full Access - Outras Tabelas
-- Execute apos 001_rls_gestor_full_access.sql
-- ============================================================

-- ============================================================
-- TABELAS PRINCIPAIS (gestor tem acesso total via tenant_id)
-- ============================================================

-- 1. turmas
DROP POLICY IF EXISTS "gestor_turmas_all" ON turmas;
CREATE POLICY "gestor_turmas_all" ON turmas
FOR ALL USING (
  exists (select 1 from escolas where id = turmas.tenant_id and gestor_user_id = auth.uid())
);

-- 2. alunos
DROP POLICY IF EXISTS "gestor_alunos_all" ON alunos;
CREATE POLICY "gestor_alunos_all" ON alunos
FOR ALL USING (
  exists (select 1 from escolas where id = alunos.tenant_id and gestor_user_id = auth.uid())
);

-- 3. matriculas
DROP POLICY IF EXISTS "gestor_matriculas_all" ON matriculas;
CREATE POLICY "gestor_matriculas_all" ON matriculas
FOR ALL USING (
  exists (select 1 from escolas where id = matriculas.tenant_id and gestor_user_id = auth.uid())
);

-- 4. cobrancas (financeiro)
DROP POLICY IF EXISTS "gestor_cobrancas_all" ON cobrancas;
CREATE POLICY "gestor_cobrancas_all" ON cobrancas
FOR ALL USING (
  exists (select 1 from escolas where id = cobrancas.tenant_id and gestor_user_id = auth.uid())
);

-- 5. frequencias
DROP POLICY IF EXISTS "gestor_frequencias_all" ON frequencias;
CREATE POLICY "gestor_frequencias_all" ON frequencias
FOR ALL USING (
  exists (select 1 from escolas e where e.id = (select tenant_id from turmas where id = frequencias.turma_id) and e.gestor_user_id = auth.uid())
);

-- 6. atividades
DROP POLICY IF EXISTS "gestor_atividades_all" ON atividades;
CREATE POLICY "gestor_atividades_all" ON atividades
FOR ALL USING (
  exists (select 1 from escolas where id = atividades.tenant_id and gestor_user_id = auth.uid())
);

-- 7. planos_aula
DROP POLICY IF EXISTS "gestor_planos_aula_all" ON planos_aula;
CREATE POLICY "gestor_planos_aula_all" ON planos_aula
FOR ALL USING (
  exists (select 1 from escolas where id = planos_aula.tenant_id and gestor_user_id = auth.uid())
);

-- 8. boletins
DROP POLICY IF EXISTS "gestor_boletins_all" ON boletins;
CREATE POLICY "gestor_boletins_all" ON boletins
FOR ALL USING (
  exists (select 1 from escolas e 
    join turmas t on t.tenant_id = e.id 
    join matriculas m on m.turma_id = t.id
    where m.id = boletins.matricula_id and e.gestor_user_id = auth.uid())
);

-- 9. mural_avisos
DROP POLICY IF EXISTS "gestor_mural_all" ON mural_avisos;
CREATE POLICY "gestor_mural_all" ON mural_avisos
FOR ALL USING (
  exists (select 1 from escolas where id = mural_avisos.tenant_id and gestor_user_id = auth.uid())
);

-- 10. usuarios_sistema (funcionarios)
DROP POLICY IF EXISTS "gestor_usuarios_sistema_all" ON usuarios_sistema;
CREATE POLICY "gestor_usuarios_sistema_all" ON usuarios_sistema
FOR ALL USING (
  exists (select 1 from escolas where id = usuarios_sistema.tenant_id and gestor_user_id = auth.uid())
);

-- 11. funcionarios
DROP POLICY IF EXISTS "gestor_funcionarios" ON funcionarios;
CREATE POLICY "gestor_funcionarios" ON funcionarios
FOR ALL USING (
  exists (select 1 from escolas where id = funcionarios.escola_id and gestor_user_id = auth.uid())
);

-- 12. escolas (o proprio gestor)
DROP POLICY IF EXISTS "gestor_escolas_read" ON escolas;
CREATE POLICY "gestor_escolas_read" ON escolas
FOR SELECT USING (
  gestor_user_id = auth.uid()
);

-- ============================================================
-- VERIFICAR POLITICAS
-- ============================================================

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE policyname LIKE 'gestor_%'
ORDER BY tablename;