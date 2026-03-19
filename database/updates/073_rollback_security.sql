-- ==============================================================================
-- 🚨 MIGRATION 073: ROLLBACK TOTAL DE SEGURANÇA (EMERGÊNCIA)
-- Descrição: Desabilita RLS em todas as tabelas para restaurar funcionamento 
--            original onde a validação acontecia apenas na UI.
-- ==============================================================================

-- 1. DESABILITAR RLS NAS TABELAS MENCIONADAS NA AUDITORIA
ALTER TABLE public.escolas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.filiais DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_aula DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_aula_turmas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades_turmas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mural_avisos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.autorizacoes_modelos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.autorizacoes_respostas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.autorizacoes_auditoria DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_sistema DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs_v2 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis_acesso DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_permissions DISABLE ROW LEVEL SECURITY;

-- 2. LIMPAR QUALQUER "LIXO" DE TENANT_ID PARA O SUPER ADMIN
-- (Opcional: se o usuário quiser que o super admin continue sem tenant_id no banco)
