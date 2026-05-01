-- ==============================================================================
-- 🛡️ MIGRATION 191: FUNÇÃO RPC PARA UPDATE DE STATUS (FALLBACK)
-- Objetivo: Permite atualizar status de escola via RPC para casos específicos
-- ==============================================================================

BEGIN;

-- Função genérica para atualizar status (usada como fallback)
CREATE OR REPLACE FUNCTION public.fn_atualizar_status_escola(
  p_escola_id UUID,
  p_status TEXT,
  p_data_inicio DATE DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.check_is_super_admin() THEN
    RAISE EXCEPTION 'Apenas o Super Admin pode atualizar o status da escola.';
  END IF;

  IF p_status NOT IN ('ativa', 'suspensa') THEN
    RAISE EXCEPTION 'Status inválido para esta operação. Use fn_aprovar_escola ou fn_suspender_escola.';
  END IF;

  UPDATE public.escolas
  SET 
    status_assinatura = p_status,
    data_inicio = COALESCE(p_data_inicio, data_inicio),
    updated_at = NOW()
  WHERE id = p_escola_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Escola não encontrada: %', p_escola_id;
  END IF;

  PERFORM public.fn_registrar_audit(
    'ATUALIZAR_STATUS_ESCOLA', 'escolas', p_escola_id,
    NULL, jsonb_build_object('novo_status', p_status),
    'Atualização de status via Super Admin', 'info', 'gestao_escola'
  );

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_atualizar_status_escola(UUID, TEXT, DATE) TO authenticated;

COMMIT;

-- ==============================================================================
-- ✅ RESUMO MIGRATION 191
-- Função de fallback para update de status:
--   fn_atualizar_status_escola(p_escola_id, p_status, p_data_inicio)
-- ==============================================================================