-- ==============================================================================
-- 🔒 CORREÇÃO DA MIGRATION 091: TIPOS E RECURSÃO RLS
-- ==============================================================================

-- 1. CORREÇÃO DA RPC (Ajuste de tipos para evitar o erro 42804)
-- O Postgres exige que o tipo no RETURNS TABLE bata EXATAMENTE com o da tabela.
-- Para garantir compatibilidade, fazemos o cast explícito para TEXT no SELECT.
CREATE OR REPLACE FUNCTION public.get_portal_login_info(cpf_input text)
RETURNS TABLE (
    id uuid,
    email text,
    nome text,
    primeiro_acesso boolean,
    termos_aceitos boolean,
    status text,
    user_id uuid
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id, 
        r.email::text, 
        r.nome::text, 
        r.primeiro_acesso, 
        r.termos_aceitos, 
        r.status::text, 
        r.user_id
    FROM public.responsaveis r
    WHERE regexp_replace(r.cpf, '\D', '', 'g') = regexp_replace(cpf_input, '\D', '', 'g')
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 2. FUNÇÃO AUXILIAR PARA EVITAR RECURSÃO INFINITA NO RLS (Erro 500)
-- Esta função é SECURITY DEFINER para que o RLS possa consultar os vínculos 
-- sem disparar as políticas da própria tabela aluno_responsavel de novo.
CREATE OR REPLACE FUNCTION public.check_gestor_acesso_responsavel(p_responsavel_id uuid, p_tenant_id uuid)
RETURNS boolean SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.aluno_responsavel ar
        JOIN public.alunos a ON a.id = ar.aluno_id
        WHERE ar.responsavel_id = p_responsavel_id
        AND a.tenant_id = p_tenant_id
    );
END;
$$ LANGUAGE plpgsql;

-- 3. RE-IMPLEMENTAÇÃO DAS POLÍTICAS DE 'responsaveis'
DROP POLICY IF EXISTS "Pais veem seu próprio perfil" ON public.responsaveis;
CREATE POLICY "Pais veem seu próprio perfil" 
ON public.responsaveis FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gestores veem responsáveis da sua escola" ON public.responsaveis;
CREATE POLICY "Gestores veem responsáveis da sua escola" 
ON public.responsaveis FOR SELECT 
TO authenticated 
USING (
    public.check_gestor_acesso_responsavel(id, (auth.jwt() ->> 'tenant_id')::uuid)
);

-- 4. RE-IMPLEMENTAÇÃO DAS POLÍTICAS DE 'aluno_responsavel'
DROP POLICY IF EXISTS "Pais veem seus vínculos" ON public.aluno_responsavel;
CREATE POLICY "Pais veem seus vínculos" 
ON public.aluno_responsavel FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.responsaveis r 
        WHERE r.id = responsavel_id AND r.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Gestores veem vínculos da escola" ON public.aluno_responsavel;
CREATE POLICY "Gestores veem vínculos da escola" 
ON public.aluno_responsavel FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.alunos a 
        WHERE a.id = aluno_id AND a.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
);

-- 5. POLÍTICA PARA 'portal_audit_log' (Garantir que não quebre o login em caso de falha)
DROP POLICY IF EXISTS "Permitir inserção de log de auditoria" ON public.portal_audit_log;
CREATE POLICY "Permitir inserção de log de auditoria" 
ON public.portal_audit_log FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Garantir que anon pode executar a RPC
GRANT EXECUTE ON FUNCTION public.get_portal_login_info(text) TO anon, authenticated;
