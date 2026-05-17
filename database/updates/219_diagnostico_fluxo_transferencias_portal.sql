-- ============================================================
-- 219_diagnostico_fluxo_transferencias_portal.sql
-- Diagnostico nao destrutivo do fluxo Escolas <-> Portal.
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_diagnostico_fluxo_transferencias_portal()
RETURNS TABLE (
    item TEXT,
    total BIGINT,
    detalhes JSONB
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        'transferencias_responsavel_sem_destino'::text AS item,
        COUNT(*) AS total,
        jsonb_agg(
            jsonb_build_object(
                'id', id,
                'aluno_id', aluno_id,
                'origem_id', escola_origem_id,
                'status', status,
                'created_at', created_at
            )
        ) FILTER (WHERE id IS NOT NULL) AS detalhes
    FROM public.transferencias_escolares
    WHERE iniciado_por = 'responsavel'
      AND escola_destino_id IS NULL
      AND escola_destino_nome_manual IS NULL
      AND (
          public.check_is_super_admin()
          OR public.check_is_tenant_staff(escola_origem_id)
      )

    UNION ALL

    SELECT
        'responsavel_com_destino_status_incorreto'::text AS item,
        COUNT(*) AS total,
        jsonb_agg(
            jsonb_build_object(
                'id', id,
                'aluno_id', aluno_id,
                'origem_id', escola_origem_id,
                'destino_id', escola_destino_id,
                'status', status,
                'created_at', created_at
            )
        ) FILTER (WHERE id IS NOT NULL) AS detalhes
    FROM public.transferencias_escolares
    WHERE iniciado_por = 'responsavel'
      AND escola_destino_id IS NOT NULL
      AND status NOT IN ('aguardando_aceite_destino', 'aguardando_liberacao_origem', 'concluido', 'recusado', 'cancelado', 'expirado')
      AND (
          public.check_is_super_admin()
          OR public.check_is_tenant_staff(escola_origem_id)
          OR public.check_is_tenant_staff(escola_destino_id)
      )

    UNION ALL

    SELECT
        'destino_sem_notificacao_de_aceite'::text AS item,
        COUNT(*) AS total,
        jsonb_agg(
            jsonb_build_object(
                'id', t.id,
                'aluno_id', t.aluno_id,
                'destino_id', t.escola_destino_id,
                'status', t.status,
                'created_at', t.created_at
            )
        ) FILTER (WHERE t.id IS NOT NULL) AS detalhes
    FROM public.transferencias_escolares t
    WHERE t.iniciado_por = 'responsavel'
      AND t.escola_destino_id IS NOT NULL
      AND t.status = 'aguardando_aceite_destino'
      AND (
          public.check_is_super_admin()
          OR public.check_is_tenant_staff(t.escola_destino_id)
      )
      AND NOT EXISTS (
          SELECT 1
          FROM public.notificacoes n
          WHERE n.tenant_id = t.escola_destino_id
            AND n.tipo = 'TRANSFERENCIA_DESTINO'
            AND n.metadata->>'transferencia_id' = t.id::text
      )

    UNION ALL

    SELECT
        'origem_sem_notificacao_familia'::text AS item,
        COUNT(*) AS total,
        jsonb_agg(
            jsonb_build_object(
                'id', t.id,
                'aluno_id', t.aluno_id,
                'origem_id', t.escola_origem_id,
                'status', t.status,
                'created_at', t.created_at
            )
        ) FILTER (WHERE t.id IS NOT NULL) AS detalhes
    FROM public.transferencias_escolares t
    WHERE t.iniciado_por = 'responsavel'
      AND t.status IN ('aguardando_aceite_destino', 'aguardando_liberacao_origem')
      AND (
          public.check_is_super_admin()
          OR public.check_is_tenant_staff(t.escola_origem_id)
      )
      AND NOT EXISTS (
          SELECT 1
          FROM public.notificacoes n
          WHERE n.tenant_id = t.escola_origem_id
            AND n.tipo = 'TRANSFERENCIA_ORIGEM'
            AND n.metadata->>'transferencia_id' = t.id::text
      );
$$;

REVOKE ALL ON FUNCTION public.fn_diagnostico_fluxo_transferencias_portal() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_diagnostico_fluxo_transferencias_portal() TO authenticated;

COMMENT ON FUNCTION public.fn_diagnostico_fluxo_transferencias_portal() IS
  'Retorna inconsistencias conhecidas do fluxo de transferencia iniciado pelo Portal da Familia.';
