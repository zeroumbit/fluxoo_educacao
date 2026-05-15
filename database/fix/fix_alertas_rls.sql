-- =====================================================
-- FIX: RLS Alertas Tratamento
-- Corrige erro 42501 - Row-level security policy violation
-- =====================================================

-- Drop políticas existentes
DROP POLICY IF EXISTS "alertas_gestor_select" ON public.alertas_tratamento;
DROP POLICY IF EXISTS "alertas_gestor_insert" ON public.alertas_tratamento;
DROP POLICY IF EXISTS "alertas_gestor_update" ON public.alertas_tratamento;
DROP POLICY IF EXISTS "alertas_gestor_delete" ON public.alertas_tratamento;

DROP POLICY IF EXISTS "alertas_hist_gestor_select" ON public.alertas_historico;
DROP POLICY IF EXISTS "alertas_hist_gestor_insert" ON public.alertas_historico;

-- Nova política usando auth.jwt() que é mais confiável
-- Gestores podem ver todos os alertas da sua escola
CREATE POLICY "alertas_gestor_select"
    ON public.alertas_tratamento
    FOR SELECT
    TO authenticated
    USING (
        tenant_id = (SELECT COALESCE((auth.jwt()->>'tenant_id'), ''))
    );

-- Gestores podem inserir alertas na sua escola
CREATE POLICY "alertas_gestor_insert"
    ON public.alertas_tratamento
    FOR INSERT
    TO authenticated
    WITH CHECK (
        tenant_id = (SELECT COALESCE((auth.jwt()->>'tenant_id'), ''))
    );

-- Gestores podem atualizar alertas da sua escola
CREATE POLICY "alertas_gestor_update"
    ON public.alertas_tratamento
    FOR UPDATE
    TO authenticated
    USING (
        tenant_id = (SELECT COALESCE((auth.jwt()->>'tenant_id'), ''))
    )
    WITH CHECK (
        tenant_id = (SELECT COALESCE((auth.jwt()->>'tenant_id'), ''))
    );

-- Gestores podem deletar alertas da sua escola
CREATE POLICY "alertas_gestor_delete"
    ON public.alertas_tratamento
    FOR DELETE
    TO authenticated
    USING (
        tenant_id = (SELECT COALESCE((auth.jwt()->>'tenant_id'), ''))
    );

-- Histórico - SELECT
CREATE POLICY "alertas_hist_gestor_select"
    ON public.alertas_historico
    FOR SELECT
    TO authenticated
    USING (
        tenant_id = (SELECT COALESCE((auth.jwt()->>'tenant_id'), ''))
    );

-- Histórico - INSERT
CREATE POLICY "alertas_hist_gestor_insert"
    ON public.alertas_historico
    FOR INSERT
    TO authenticated
    WITH CHECK (
        tenant_id = (SELECT COALESCE((auth.jwt()->>'tenant_id'), ''))
    );

-- Verificar se funcionou
SELECT 'Políticas recriadas com sucesso' as resultado;