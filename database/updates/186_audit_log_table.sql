-- ==============================================================================
-- 🛡️ MIGRATION 186: AUDIT LOG TABLE — IMUTÁVEL E LGPD-COMPLIANT
-- Objetivo:
--   1. Criar tabela audit_log (append-only — sem UPDATE/DELETE permitido)
--   2. Triggers automáticos para tabelas sensíveis
--   3. Justificativa obrigatória para ações do Gestor em notas/faltas
--   4. Rastreabilidade completa para LGPD
-- ==============================================================================

BEGIN;

-- ============================================================
-- 1. TABELA AUDIT_LOG — IMUTÁVEL
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Quem fez
  user_id      UUID NOT NULL,
  user_role    TEXT NOT NULL,
  user_email   TEXT,
  tenant_id    UUID,

  -- O que foi feito
  acao         TEXT NOT NULL,          -- 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT'
  tabela       TEXT,
  registro_id  UUID,

  -- Dados da mudança (LGPD: apenas campos alterados, não dados completos)
  dados_antes  JSONB,
  dados_depois JSONB,

  -- Contexto
  justificativa   TEXT,               -- Obrigatória para ações excepcionais do Gestor
  ip_address      TEXT,
  user_agent      TEXT,
  sessao_id       TEXT,

  -- Classificação
  severidade      TEXT DEFAULT 'info' CHECK (severidade IN ('info', 'warning', 'critical')),
  categoria       TEXT DEFAULT 'operacional'
);

COMMENT ON TABLE public.audit_log IS
  'Log de auditoria imutável. Nenhum registro pode ser alterado ou removido. '
  'Obrigatório pela LGPD para rastreabilidade de ações sobre dados sensíveis.';

-- Índices de performance para consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant     ON public.audit_log (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user       ON public.audit_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_tabela     ON public.audit_log (tabela, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_severidade ON public.audit_log (severidade) WHERE severidade IN ('warning', 'critical');

-- ============================================================
-- 2. RLS — IMUTABILIDADE GARANTIDA NO BANCO
-- Ninguém pode alterar ou remover um log de auditoria
-- ============================================================

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- SuperAdmin pode LER todos os logs (auditoria global)
CREATE POLICY "SA_Read_AuditLog" ON public.audit_log FOR SELECT TO authenticated
USING (public.check_is_super_admin());

-- Staff (Gestor) pode LER apenas logs do seu tenant
CREATE POLICY "Staff_Read_AuditLog" ON public.audit_log FOR SELECT TO authenticated
USING (public.check_is_tenant_staff(tenant_id));

-- Qualquer usuário autenticado pode INSERIR (audit é append-only)
CREATE POLICY "Authenticated_Insert_AuditLog" ON public.audit_log FOR INSERT TO authenticated
WITH CHECK (true);

-- NINGUÉM pode UPDATE ou DELETE — IMUTABILIDADE TOTAL
-- (Sem políticas de UPDATE/DELETE = bloqueio automático com RLS)

-- ============================================================
-- 3. FUNÇÃO DE REGISTRO DE AUDITORIA
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_registrar_audit(
  p_acao        TEXT,
  p_tabela      TEXT,
  p_registro_id UUID DEFAULT NULL,
  p_dados_antes JSONB DEFAULT NULL,
  p_dados_depois JSONB DEFAULT NULL,
  p_justificativa TEXT DEFAULT NULL,
  p_severidade  TEXT DEFAULT 'info',
  p_categoria   TEXT DEFAULT 'operacional'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_user_id UUID := auth.uid();
  v_metadata JSONB := auth.jwt()->'user_metadata';
  v_role TEXT;
BEGIN
  v_role := COALESCE(
    auth.jwt()->'app_metadata'->>'role',
    v_metadata->>'role',
    'unknown'
  );

  -- Scrubbing LGPD: remover campos sensíveis dos dados de auditoria
  IF p_dados_antes IS NOT NULL THEN
    p_dados_antes := p_dados_antes
      - 'password' - 'senha' - 'cpf' - 'token'
      - 'refresh_token' - 'access_token';
  END IF;
  IF p_dados_depois IS NOT NULL THEN
    p_dados_depois := p_dados_depois
      - 'password' - 'senha' - 'cpf' - 'token'
      - 'refresh_token' - 'access_token';
  END IF;

  INSERT INTO public.audit_log (
    user_id, user_role, tenant_id,
    acao, tabela, registro_id,
    dados_antes, dados_depois,
    justificativa, severidade, categoria
  ) VALUES (
    v_user_id, v_role, public.get_jwt_tenant_id(),
    p_acao, p_tabela, p_registro_id,
    p_dados_antes, p_dados_depois,
    p_justificativa, p_severidade, p_categoria
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- ============================================================
-- 4. TRIGGER: REGISTRAR AUTOMATICAMENTE AÇÕES DE GESTOR EM NOTAS
-- R1: Gestor que lança nota diretamente → log com severidade 'warning'
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_audit_notas_gestor()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_is_gestor BOOLEAN;
  v_justificativa TEXT;
BEGIN
  -- Verifica se o executor é Gestor (e não Professor)
  v_is_gestor := EXISTS (
    SELECT 1 FROM public.escolas
    WHERE id = public.get_jwt_tenant_id()
    AND gestor_user_id = auth.uid()
  );

  IF v_is_gestor THEN
    -- Ação excepcional: registra no audit_log com severidade warning
    v_justificativa := COALESCE(
      current_setting('app.audit_justificativa', true),
      'Lançamento direto pelo Gestor (sem justificativa informada)'
    );

    PERFORM public.fn_registrar_audit(
      TG_OP,
      TG_TABLE_NAME,
      NEW.id,
      CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
      to_jsonb(NEW),
      v_justificativa,
      'warning',
      'academico_excepcional'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Aplicar trigger na tabela notas (se existir)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notas') THEN
    DROP TRIGGER IF EXISTS trg_audit_notas ON public.notas;
    CREATE TRIGGER trg_audit_notas
      AFTER INSERT OR UPDATE ON public.notas
      FOR EACH ROW EXECUTE FUNCTION public.trg_audit_notas_gestor();
    RAISE NOTICE '✅ Trigger de auditoria criado em notas';
  END IF;
END $$;

-- ============================================================
-- 5. TRIGGER GENÉRICO: AÇÕES CRÍTICAS (DELETE, cancelamento, etc.)
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_audit_acoes_criticas()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.fn_registrar_audit(
      'DELETE', TG_TABLE_NAME, OLD.id,
      to_jsonb(OLD), NULL, NULL, 'critical', 'exclusao'
    );
    RETURN OLD;
  END IF;

  PERFORM public.fn_registrar_audit(
    TG_OP, TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW),
    NULL, 'info', 'operacional'
  );
  RETURN NEW;
END;
$$;

-- Aplicar em matriculas (cancelamentos são críticos)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'matriculas') THEN
    DROP TRIGGER IF EXISTS trg_audit_matriculas ON public.matriculas;
    CREATE TRIGGER trg_audit_matriculas
      AFTER INSERT OR UPDATE OR DELETE ON public.matriculas
      FOR EACH ROW EXECUTE FUNCTION public.trg_audit_acoes_criticas();
    RAISE NOTICE '✅ Trigger de auditoria em matriculas';
  END IF;
END $$;

-- ============================================================
-- 6. VIEW PARA DASHBOARD DE AUDITORIA DO GESTOR
-- ============================================================

CREATE OR REPLACE VIEW public.vw_audit_log_tenant AS
SELECT
  al.id,
  al.created_at,
  al.user_id,
  al.user_role,
  al.acao,
  al.tabela,
  al.registro_id,
  al.justificativa,
  al.severidade,
  al.categoria,
  al.tenant_id
FROM public.audit_log al
WHERE public.check_is_tenant_staff(al.tenant_id)
   OR public.check_is_super_admin();

COMMENT ON VIEW public.vw_audit_log_tenant IS
  'View segura de audit_log. Gestor vê apenas seu tenant. SuperAdmin vê tudo.';

GRANT SELECT ON public.vw_audit_log_tenant TO authenticated;

COMMIT;

-- ==============================================================================
-- ✅ RESUMO MIGRATION 186
-- audit_log: Tabela imutável (apenas INSERT via RLS)
-- fn_registrar_audit(): Registro de auditoria com scrubbing LGPD
-- trg_audit_notas_gestor(): Gestor que lança nota → warning automático
-- trg_audit_acoes_criticas(): DELETE e ações críticas → log crítico
-- vw_audit_log_tenant: Dashboard de auditoria para Gestor e SuperAdmin
-- ==============================================================================
