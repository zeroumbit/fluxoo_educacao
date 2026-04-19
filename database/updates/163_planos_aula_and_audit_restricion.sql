-- ==============================================================================
-- 🚩 MIGRATION 163: PLANOS DE AULA & ATIVIDADES RESTORATION
-- Descrição: Restaura visibilidade de planos de aula e atividades e restringe Auditoria.
-- ==============================================================================

-- 1. PLANOS DE AULA E ATIVIDADES (Liberar leitura para professores e staff)
ALTER TABLE public.planos_aula DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades DISABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.planos_aula TO authenticated;
GRANT SELECT ON public.atividades TO authenticated;

-- 2. AUDITORIA (Restringir acesso apenas a Super Admins no banco por segurança)
ALTER TABLE public.audit_logs_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_audit_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN 
    DROP POLICY IF EXISTS "Apenas SuperAdmins veem auditoria" ON public.audit_logs_v2;
    DROP POLICY IF EXISTS "Apenas SuperAdmins veem portal_audit" ON public.portal_audit_log;
END $$;

CREATE POLICY "Apenas SuperAdmins veem auditoria" ON public.audit_logs_v2 
FOR SELECT TO authenticated USING (public.is_super_admin_v2());

CREATE POLICY "Apenas SuperAdmins veem portal_audit" ON public.portal_audit_log 
FOR SELECT TO authenticated USING (public.is_super_admin_v2());
