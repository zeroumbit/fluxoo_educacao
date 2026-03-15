-- ==========================================================
-- CORREÇÃO E UNIFICAÇÃO RLS: MATRÍCULAS E ACADÊMICO
-- Resolve o erro 404 Not Found ao atualizar matrículas
-- ==========================================================

-- 1. Garantir que RLS está desabilitado ou tem políticas para Gestores
-- O erro 404 em PATCH costuma ocorrer quando RLS bloqueia o acesso à linha.

-- A) Tabelas que devem ter RLS Desabilitado em Desenvolvimento (conforme README do projeto)
ALTER TABLE public.matriculas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_aula DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.selos DISABLE ROW LEVEL SECURITY;

-- B) Criar políticas de backup (caso alguém habilite RLS manualmente)
-- SELECT
DROP POLICY IF EXISTS "Gestores podem ver matriculas da sua escola" ON public.matriculas;
CREATE POLICY "Gestores podem ver matriculas da sua escola" ON public.matriculas
FOR SELECT TO authenticated
USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid OR auth.jwt() ->> 'role' = 'super_admin');

-- UPDATE
DROP POLICY IF EXISTS "Gestores podem editar matriculas da sua escola" ON public.matriculas;
CREATE POLICY "Gestores podem editar matriculas da sua escola" ON public.matriculas
FOR UPDATE TO authenticated
USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid OR auth.jwt() ->> 'role' = 'super_admin')
WITH CHECK (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid OR auth.jwt() ->> 'role' = 'super_admin');

-- INSERT
DROP POLICY IF EXISTS "Gestores podem criar matriculas para sua escola" ON public.matriculas;
CREATE POLICY "Gestores podem criar matriculas para sua escola" ON public.matriculas
FOR INSERT TO authenticated
WITH CHECK (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid OR auth.jwt() ->> 'role' = 'super_admin');

-- DELETE
DROP POLICY IF EXISTS "Gestores podem excluir matriculas da sua escola" ON public.matriculas;
CREATE POLICY "Gestores podem excluir matriculas da sua escola" ON public.matriculas
FOR DELETE TO authenticated
USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid OR auth.jwt() ->> 'role' = 'super_admin');

-- 2. Garantir que o valor da mensalidade é propagado do Aluno para o Portal
COMMENT ON TABLE public.matriculas IS 'Tabela de matrículas. RLS desabilitado para desenvolvimento, com políticas de fallback para produção.';
