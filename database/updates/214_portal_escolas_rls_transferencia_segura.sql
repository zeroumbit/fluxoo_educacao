-- ============================================================
-- 214_portal_escolas_rls_transferencia_segura.sql
-- Fecha leitura ampla de escolas no portal e cria listagem segura
-- para transferencia entre escolas.
-- ============================================================

ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read_Escolas" ON public.escolas;
DROP POLICY IF EXISTS "Public_Escolas_Select" ON public.escolas;
DROP POLICY IF EXISTS "Leitura livre - Escolas" ON public.escolas;
DROP POLICY IF EXISTS "Acesso público limitado às escolas" ON public.escolas;
DROP POLICY IF EXISTS "Portal_Escolas_Select" ON public.escolas;
DROP POLICY IF EXISTS "Portal_Read_Pendente_Escola" ON public.escolas;
DROP POLICY IF EXISTS "Universal_Select_Escolas" ON public.escolas;

CREATE POLICY "Staff_Read_Escolas" ON public.escolas
FOR SELECT TO authenticated
USING (
    public.check_is_super_admin()
    OR public.check_is_tenant_staff(id)
);

CREATE POLICY "Responsavel_Read_Escola_Dos_Filhos" ON public.escolas
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.responsaveis r
        JOIN public.aluno_responsavel ar ON ar.responsavel_id = r.id
        JOIN public.alunos a ON a.id = ar.aluno_id
        WHERE r.user_id = auth.uid()
          AND ar.status = 'ativo'
          AND a.tenant_id = escolas.id
    )
);

CREATE OR REPLACE FUNCTION public.fn_listar_escolas_para_transferencia()
RETURNS TABLE (
    id UUID,
    razao_social TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT e.id, e.razao_social
    FROM public.escolas e
    WHERE COALESCE(e.status_assinatura, '') NOT IN ('cancelada', 'inativa', 'bloqueada')
    ORDER BY e.razao_social NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.fn_listar_escolas_para_transferencia() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_listar_escolas_para_transferencia() TO authenticated;

COMMENT ON FUNCTION public.fn_listar_escolas_para_transferencia() IS
  'Retorna apenas dados mínimos de escolas para pedido de transferencia no portal da familia.';
