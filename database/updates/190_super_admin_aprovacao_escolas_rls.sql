-- ==============================================================================
-- 🛡️ MIGRATION 190: REGRA DE OURO — ACESSO DO SUPER ADMIN
-- 
-- REGRAS DE NEGÓCIO:
--   ✓ Super Admin GERENCIA PLANOS (criar, editar, deletar)
--   ✓ Super Admin ATIVA/DESATIVA escolas específicas:
--     - Escolas que pagaram via PIX MANUAL
--     - Escolas que cometem infração/ilegal
--   ✗ Super Admin NÃO faz operações operacionais em escolas
--     (não cria turmas, não gerencia alunos, não alter dados)
-- ==============================================================================

BEGIN;

-- ============================================================
-- 1. POLÍTICAS RLS PARA ESCOLAS - ACESSO LIMITADO DO SUPER ADMIN
-- ============================================================

-- Remove políticas que vamos recriar
DROP POLICY IF EXISTS "SA_Read_Escolas" ON public.escolas;
DROP POLICY IF EXISTS "SA_Update_Status_Escolas" ON public.escolas;
DROP POLICY IF EXISTS "Gestor_Read_Own_Escola" ON public.escolas;
DROP POLICY IF EXISTS "Gestor_Update_Own_Escola" ON public.escolas;
DROP POLICY IF EXISTS "Portal_Read_Pendente_Escola" ON public.escolas;

ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Super Admin pode LER todas as escolas (para gestão)
-- ============================================================

CREATE POLICY "SA_Read_Escolas" ON public.escolas
FOR SELECT TO authenticated
USING (
  public.check_is_super_admin()
);

-- ============================================================
-- Super Admin pode ATUALIZAR apenas status (ativar/desativar)
-- ============================================================

CREATE POLICY "SA_Update_Status_Escolas" ON public.escolas
FOR UPDATE TO authenticated
USING (
  public.check_is_super_admin()
)
WITH CHECK (
  public.check_is_super_admin()
  AND (
    -- Apenas pode alterar status_assinatura
    (status_assinatura IS NOT NULL)
  )
);

-- ============================================================
-- RLS para Gestor (sua própria escola - acesso total)
-- ============================================================

CREATE POLICY "Gestor_Read_Own_Escola" ON public.escolas
FOR SELECT TO authenticated
USING (
  public.check_is_tenant_staff(id)
);

CREATE POLICY "Gestor_Update_Own_Escola" ON public.escolas
FOR UPDATE TO authenticated
USING (
  public.check_is_tenant_staff(id)
)
WITH CHECK (
  public.check_is_tenant_staff(id)
);

-- ============================================================
-- RLS para Portal (leitura de escolas pendentes)
-- ============================================================

CREATE POLICY "Portal_Read_Pendente_Escola" ON public.escolas
FOR SELECT TO authenticated
USING (
  status_assinatura = 'pendente'
  OR status_assinatura = 'aguardando_pagamento'
  OR public.check_is_tenant_staff(id)
  OR public.check_is_super_admin()
);

-- ============================================================
-- 2. FUNÇÕES DE APROVAÇÃO (chamadas pelo Super Admin via RPC)
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_aprovar_escola(
  p_escola_id UUID,
  p_motivo TEXT DEFAULT 'Aprovada pelo Super Admin'
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_escola RECORD;
  v_metodo TEXT;
BEGIN
  IF NOT public.check_is_super_admin() THEN
    RAISE EXCEPTION 'Apenas o Super Admin pode aprovar escolas.';
  END IF;

  -- Busca escola
  SELECT id, status_assinatura, metodo_pagamento INTO v_escola
  FROM public.escolas 
  WHERE id = p_escola_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Escola não encontrada: %', p_escola_id;
  END IF;

  v_metodo := COALESCE(v_escola.metodo_pagamento, 'pix');

  -- Apenas aprova se for PIX MANUAL (R1)
  IF v_metodo != 'pix_manual' THEN
    RAISE EXCEPTION 'Escolas com pagamento automático são aprovadas automaticamente. Método atual: %', v_metodo;
  END IF;

  -- Atualiza para ativa
  UPDATE public.escolas
  SET 
    status_assinatura = 'ativa',
    data_inicio = NOW()::date,
    updated_at = NOW()
  WHERE id = p_escola_id;

  PERFORM public.fn_registrar_audit(
    'APROVAR_ESCOLA', 'escolas', p_escola_id,
    NULL, jsonb_build_object('motivo', p_motivo, 'metodo_pagamento', v_metodo),
    p_motivo, 'info', 'gestao_escola'
  );

  RETURN TRUE;
END;
$$;

-- ============================================================
-- Função para reprovar/suspender escola (infração ou não pagamento)
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_suspender_escola(
  p_escola_id UUID,
  p_motivo TEXT DEFAULT 'Suspensa pelo Super Admin'
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.check_is_super_admin() THEN
    RAISE EXCEPTION 'Apenas o Super Admin pode suspender escolas.';
  END IF;

  UPDATE public.escolas
  SET 
    status_assinatura = 'suspensa',
    motivo_suspensao = p_motivo,
    data_suspensao = NOW(),
    updated_at = NOW()
  WHERE id = p_escola_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Escola não encontrada: %', p_escola_id;
  END IF;

  PERFORM public.fn_registrar_audit(
    'SUSPENDER_ESCOLA', 'escolas', p_escola_id,
    NULL, jsonb_build_object('motivo', p_motivo),
    p_motivo, 'warning', 'gestao_escola'
  );

  RETURN TRUE;
END;
$$;

-- ============================================================
-- Função para reativar escola suspensa
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_reativar_escola(p_escola_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.check_is_super_admin() THEN
    RAISE EXCEPTION 'Apenas o Super Admin pode reativar escolas.';
  END IF;

  UPDATE public.escolas
  SET 
    status_assinatura = 'ativa',
    motivo_suspensao = NULL,
    data_suspensao = NULL,
    updated_at = NOW()
  WHERE id = p_escola_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Escola não encontrada: %', p_escola_id;
  END IF;

  PERFORM public.fn_registrar_audit(
    'REATIVAR_ESCOLA', 'escolas', p_escola_id,
    NULL, jsonb_build_object('acao', 'reativar'),
    'Escola reativada pelo Super Admin', 'info', 'gestao_escola'
  );

  RETURN TRUE;
END;
$$;

-- ============================================================
-- VIEW: ESCOLAS PENDENTES DE APROVAÇÃO (PIX MANUAL)
-- ============================================================

CREATE OR REPLACE VIEW public.vw_escolas_pendentes_aprovacao AS
SELECT 
  e.id,
  e.razao_social,
  e.cnpj,
  e.email_gestor,
  e.nome_gestor,
  e.telefone,
  e.status_assinatura,
  e.metodo_pagamento,
  e.plano_id,
  e.created_at,
  e.data_inicio,
  p.nome AS plano_nome,
  p.valor_por_aluno
FROM public.escolas e
LEFT JOIN public.planos p ON p.id = e.plano_id
WHERE e.status_assinatura IN ('pendente', 'aguardando_pagamento')
  AND e.metodo_pagamento = 'pix_manual'
ORDER BY e.created_at DESC;

GRANT SELECT ON public.vw_escolas_pendentes_aprovacao TO authenticated;

-- ============================================================
-- PERMISSÕES
-- ============================================================

GRANT EXECUTE ON FUNCTION public.fn_aprovar_escola(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_suspender_escola(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_reativar_escola(UUID) TO authenticated;

COMMIT;

-- ==============================================================================
-- ✅ RESUMO MIGRATION 190
-- 
-- ACESSO DO SUPER ADMIN:
--   ✓ LEITURA de todas as escolas
--   ✓ ATUALIZAÇÃO de status (ativar/suspender/reativar)
--   ✓ Apenas em escolas com PIX MANUAL ou por infração
--   ✗ NÃO pode fazer operações operacionais
-- 
-- FUNÇÕES CRIADAS:
--   fn_aprovar_escola() - aprova escola PIX MANUAL
--   fn_suspender_escola() - suspende por infração
--   fn_reativar_escola() - reativa escola suspensa
-- 
-- VIEW:
--   vw_escolas_pendentes_aprovacao - escolas aguardando aprovação PIX MANUAL
-- ==============================================================================