-- ==============================================================================
-- 🚑 HOTFIX: RESTAURAR LOGIN E ACESSO AO PERFIL DO RESPONSÁVEL
-- Descrição: Restaura as políticas de 'responsaveis' que foram limpas no reset.
-- ==============================================================================

-- 1. GARANTIR QUE A RPC FUNCIONE (Grant para anônimos)
GRANT EXECUTE ON FUNCTION public.get_portal_login_info(text) TO anon, authenticated;

-- 2. RESTAURAR POLÍTICAS DE 'responsaveis'
DROP POLICY IF EXISTS "Pais_Vem_Proprio_Perfil" ON public.responsaveis;
CREATE POLICY "Pais_Vem_Proprio_Perfil" ON public.responsaveis 
FOR ALL TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gestores_Vem_Responsaveis" ON public.responsaveis;
CREATE POLICY "Gestores_Vem_Responsaveis" ON public.responsaveis 
FOR SELECT TO authenticated 
USING ( (auth.jwt() ->> 'role') IN ('gestor', 'admin', 'super_admin') );

-- 3. AUDITORIA (Essencial para não travar o processo de login se falhar)
DROP POLICY IF EXISTS "Portal_Audit_Insert" ON public.portal_audit_log;
CREATE POLICY "Portal_Audit_Insert" ON public.portal_audit_log 
FOR INSERT TO anon, authenticated 
WITH CHECK (true);

-- 4. ALERTA DE SEGURANÇA: Garantir que responsaveis tem RLS mas permite o login bridge
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;
