-- ==============================================================================
-- 215_fix_alertas_tratamento_rls.sql
-- Fix Row-Level Security for alertas_tratamento and alertas_historico
-- ==============================================================================

ALTER TABLE public.alertas_tratamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_historico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários da escola podem ver tratamentos" ON public.alertas_tratamento;
DROP POLICY IF EXISTS "Usuários da escola podem gerenciar tratamentos" ON public.alertas_tratamento;
DROP POLICY IF EXISTS "Usuários da escola podem ver histórico" ON public.alertas_historico;
DROP POLICY IF EXISTS "Usuários da escola podem inserir histórico" ON public.alertas_historico;
DROP POLICY IF EXISTS "Gestores podem ver tratamentos" ON public.alertas_tratamento;
DROP POLICY IF EXISTS "Gestores podem atualizar tratamentos" ON public.alertas_tratamento;
DROP POLICY IF EXISTS "Gestores podem inserir tratamentos" ON public.alertas_tratamento;

CREATE POLICY "Usuários da escola podem ver tratamentos" ON public.alertas_tratamento
FOR SELECT TO authenticated
USING (
    public.check_is_super_admin()
    OR tenant_id = auth.jwt()->>'tenant_id'
);

CREATE POLICY "Usuários da escola podem gerenciar tratamentos" ON public.alertas_tratamento
FOR ALL TO authenticated
USING (
    public.check_is_super_admin()
    OR tenant_id = auth.jwt()->>'tenant_id'
)
WITH CHECK (
    public.check_is_super_admin()
    OR tenant_id = auth.jwt()->>'tenant_id'
);

CREATE POLICY "Usuários da escola podem ver histórico" ON public.alertas_historico
FOR SELECT TO authenticated
USING (
    public.check_is_super_admin()
    OR tenant_id = auth.jwt()->>'tenant_id'
);

CREATE POLICY "Usuários da escola podem inserir histórico" ON public.alertas_historico
FOR INSERT TO authenticated
WITH CHECK (
    public.check_is_super_admin()
    OR tenant_id = auth.jwt()->>'tenant_id'
);
