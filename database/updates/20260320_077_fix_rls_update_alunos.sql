-- ==============================================================================
-- 🚀 MIGRATION 077: FIX RLS UPDATE ALUNOS
-- Descrição: Adiciona política de UPDATE na tabela alunos para permitir
--            atualização do campo valor_mensalidade_atual via API REST
-- ==============================================================================

-- Adicionar política de UPDATE para alunos
DROP POLICY IF EXISTS "rbac_alunos_update" ON public.alunos;
CREATE POLICY "rbac_alunos_update" ON public.alunos FOR UPDATE
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('academico.alunos.edit')
)
WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND public.has_permission('academico.alunos.edit')
);
