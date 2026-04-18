-- ==============================================================================
-- 🚩 MIGRATION 160: SECURITY HELPERS V2 - Fluxoo EDU
-- Versão otimizada, segura e performática
-- ==============================================================================

-- 1. IDENTIFICAR O RESPONSÁVEL
CREATE OR REPLACE FUNCTION public.get_my_responsavel_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.responsaveis WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 2. VERIFICAR FILIAÇÃO (SEM RECURSÃO)
CREATE OR REPLACE FUNCTION public.is_my_child_v2(p_aluno_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Retorna true se o aluno pertence ao responsável logado
  SELECT EXISTS (
    SELECT 1 
    FROM public.aluno_responsavel ar
    WHERE ar.aluno_id = p_aluno_id
      AND ar.responsavel_id = public.get_my_responsavel_id()
  );
$$;

-- 3. VERIFICAR ACESSO STAFF (SEM RECURSÃO)
CREATE OR REPLACE FUNCTION public.is_staff_of_school(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.usuarios_sistema us
    WHERE us.tenant_id = p_tenant_id
      AND us.id = auth.uid()
      AND us.status = 'ativo'
  );
$$;

-- 4. VERIFICAR SUPER ADMIN (VIA JWT)
CREATE OR REPLACE FUNCTION public.is_super_admin_v2()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean, false) OR
         COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean, false) OR
         (auth.jwt() ->> 'role') = 'super_admin';
$$;

COMMENT ON FUNCTION public.is_my_child_v2 IS 'Helper seguro para políticas de Pais - evita recursão usando Security Definer';
COMMENT ON FUNCTION public.is_staff_of_school IS 'Helper para equipe administrativa do tenant consultar usuários sem loop';
