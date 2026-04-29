-- ==============================================================================
-- 🛡️ MIGRATION 189: FLUXO DE APROVAÇÃO — AÇÕES SENSÍVEIS
-- Objetivo:
--   Criar infraestrutura de workflow de aprovação para ações que requerem
--   validação de superior hierárquico (transferência, cancelamento, etc.)
-- Regras:
--   R1: Gestor é o aprovador final de qualquer ação sensível da escola
--   R2: SuperAdmin não aprova nada operacional (apenas leitura de pendências)
-- ==============================================================================

BEGIN;

-- ============================================================
-- 1. TABELA aprovacoes_pendentes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.aprovacoes_pendentes (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  tenant_id         UUID NOT NULL,

  -- Quem solicitou
  solicitante_id    UUID NOT NULL REFERENCES auth.users(id),
  solicitante_role  TEXT NOT NULL,

  -- O que foi solicitado
  tipo_acao         TEXT NOT NULL CHECK (tipo_acao IN (
    'transferencia_aluno',
    'cancelamento_matricula',
    'alteracao_nota',
    'concessao_desconto',
    'concessao_bolsa',
    'lancamento_gestor',   -- Lançamento excepcional de nota/falta pelo gestor
    'outros'
  )),
  titulo            TEXT NOT NULL,
  descricao         TEXT NOT NULL,
  justificativa     TEXT NOT NULL,

  -- Referências ao objeto da ação
  tabela_referencia TEXT,
  registro_id       UUID,
  dados_payload     JSONB,           -- Dados necessários para executar a ação

  -- Aprovação
  status            TEXT DEFAULT 'pendente' CHECK (status IN (
    'pendente', 'aprovada', 'rejeitada', 'cancelada', 'expirada'
  )),
  aprovador_id      UUID REFERENCES auth.users(id),
  aprovador_role    TEXT,
  decisao_em        TIMESTAMPTZ,
  motivo_decisao    TEXT,

  -- Expiração
  expires_at        TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

COMMENT ON TABLE public.aprovacoes_pendentes IS
  'Fila de aprovações para ações sensíveis. '
  'Toda ação que requer autorização de superior hierárquico é registrada aqui.';

-- Índices
CREATE INDEX IF NOT EXISTS idx_aprov_tenant_status ON public.aprovacoes_pendentes (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_aprov_solicitante   ON public.aprovacoes_pendentes (solicitante_id);
CREATE INDEX IF NOT EXISTS idx_aprov_status        ON public.aprovacoes_pendentes (status) WHERE status = 'pendente';

-- ============================================================
-- 2. RLS
-- ============================================================

DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'aprovacoes_pendentes') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.aprovacoes_pendentes';
  END LOOP;
END $$;

ALTER TABLE public.aprovacoes_pendentes ENABLE ROW LEVEL SECURITY;

-- Staff (Gestor) gerencia aprovações do seu tenant
CREATE POLICY "Staff_CRUD_Aprovacoes" ON public.aprovacoes_pendentes FOR ALL TO authenticated
USING  (public.check_is_tenant_staff(tenant_id))
WITH CHECK (
  public.check_is_tenant_staff(tenant_id)
  AND public.validate_tenant_context(tenant_id)
);

-- SuperAdmin: apenas leitura (R2 — não aprova nada operacional)
CREATE POLICY "SA_Read_Aprovacoes" ON public.aprovacoes_pendentes FOR SELECT TO authenticated
USING (public.check_is_super_admin());

-- ============================================================
-- 3. FUNÇÕES DE WORKFLOW
-- ============================================================

-- Criar solicitação de aprovação
CREATE OR REPLACE FUNCTION public.fn_solicitar_aprovacao(
  p_tipo_acao        TEXT,
  p_titulo           TEXT,
  p_descricao        TEXT,
  p_justificativa    TEXT,
  p_tabela_ref       TEXT DEFAULT NULL,
  p_registro_id      UUID DEFAULT NULL,
  p_dados_payload    JSONB DEFAULT NULL,
  p_expires_dias     INT DEFAULT 7
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_role TEXT;
BEGIN
  v_role := COALESCE(
    (auth.jwt()->'app_metadata'->>'role'),
    (auth.jwt()->'user_metadata'->>'role'),
    'unknown'
  );

  INSERT INTO public.aprovacoes_pendentes (
    tenant_id, solicitante_id, solicitante_role,
    tipo_acao, titulo, descricao, justificativa,
    tabela_referencia, registro_id, dados_payload,
    expires_at
  ) VALUES (
    public.get_jwt_tenant_id(), auth.uid(), v_role,
    p_tipo_acao, p_titulo, p_descricao, p_justificativa,
    p_tabela_ref, p_registro_id, p_dados_payload,
    NOW() + (p_expires_dias || ' days')::INTERVAL
  )
  RETURNING id INTO v_id;

  -- Registrar no audit_log
  PERFORM public.fn_registrar_audit(
    'SOLICITAR_APROVACAO', 'aprovacoes_pendentes', v_id,
    NULL, jsonb_build_object('tipo', p_tipo_acao, 'titulo', p_titulo),
    p_justificativa, 'info', 'workflow'
  );

  RETURN v_id;
END;
$$;

-- Aprovar ou rejeitar
CREATE OR REPLACE FUNCTION public.fn_decidir_aprovacao(
  p_aprovacao_id UUID,
  p_decisao      TEXT,  -- 'aprovada' ou 'rejeitada'
  p_motivo       TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_aprov public.aprovacoes_pendentes;
  v_role TEXT;
BEGIN
  IF p_decisao NOT IN ('aprovada', 'rejeitada') THEN
    RAISE EXCEPTION 'Decisão inválida. Use aprovada ou rejeitada.';
  END IF;

  SELECT * INTO v_aprov FROM public.aprovacoes_pendentes WHERE id = p_aprovacao_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aprovação não encontrada.';
  END IF;

  -- Apenas staff do tenant pode aprovar (R1: Gestor é o aprovador)
  IF NOT public.check_is_tenant_staff(v_aprov.tenant_id) THEN
    RAISE EXCEPTION 'Sem permissão para aprovar esta solicitação.';
  END IF;

  -- SuperAdmin não aprova ações operacionais (R2)
  IF public.check_is_super_admin() THEN
    RAISE EXCEPTION 'Super Admin não pode aprovar ações operacionais de escolas.';
  END IF;

  IF v_aprov.status != 'pendente' THEN
    RAISE EXCEPTION 'Esta solicitação já foi % .', v_aprov.status;
  END IF;

  v_role := COALESCE(
    (auth.jwt()->'app_metadata'->>'role'),
    (auth.jwt()->'user_metadata'->>'role'),
    'unknown'
  );

  UPDATE public.aprovacoes_pendentes
  SET
    status        = p_decisao,
    aprovador_id  = auth.uid(),
    aprovador_role = v_role,
    decisao_em    = NOW(),
    motivo_decisao = p_motivo,
    updated_at    = NOW()
  WHERE id = p_aprovacao_id;

  -- Registrar no audit_log
  PERFORM public.fn_registrar_audit(
    upper(p_decisao), 'aprovacoes_pendentes', p_aprovacao_id,
    NULL, jsonb_build_object('decisao', p_decisao, 'motivo', p_motivo),
    p_motivo, 'info', 'workflow'
  );

  RETURN true;
END;
$$;

-- ============================================================
-- 4. VIEW PARA DASHBOARD DE APROVAÇÕES PENDENTES
-- ============================================================

CREATE OR REPLACE VIEW public.vw_aprovacoes_pendentes AS
SELECT
  ap.id,
  ap.created_at,
  ap.tipo_acao,
  ap.titulo,
  ap.descricao,
  ap.justificativa,
  ap.solicitante_id,
  ap.solicitante_role,
  ap.status,
  ap.expires_at,
  ap.tenant_id
FROM public.aprovacoes_pendentes ap
WHERE ap.status = 'pendente'
  AND ap.expires_at > NOW()
  AND (
    public.check_is_tenant_staff(ap.tenant_id)
    OR public.check_is_super_admin()
  )
ORDER BY ap.created_at DESC;

GRANT SELECT ON public.vw_aprovacoes_pendentes TO authenticated;

-- ============================================================
-- 5. TRIGGER: EXPIRAR APROVAÇÕES AUTOMÁTICAMENTE
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_expirar_aprovacoes()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.aprovacoes_pendentes
  SET status = 'expirada', updated_at = NOW()
  WHERE status = 'pendente'
    AND expires_at < NOW();
  RETURN NULL;
END;
$$;

COMMIT;

-- ==============================================================================
-- ✅ RESUMO MIGRATION 189
-- aprovacoes_pendentes: Fila de aprovações com workflow completo
-- fn_solicitar_aprovacao(): Solicitar aprovação de ação sensível
-- fn_decidir_aprovacao(): Aprovar/rejeitar (apenas staff do tenant, R1)
-- SuperAdmin bloqueado de aprovar ações operacionais (R2)
-- vw_aprovacoes_pendentes: Dashboard para Gestor e SuperAdmin
-- ==============================================================================
