-- ==============================================================================
-- 🔒 MIGRATION 091: BLINDAGEM DE SEGURANÇA E ACESSO POR CPF (PORTAL)
-- Descrição: Habilita RLS em tabelas sensíveis e implementa RPC de login seguro.
-- ==============================================================================

-- 1. HABILITAR RLS NAS TABELAS CRÍTICAS
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aluno_responsavel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_audit_log ENABLE ROW LEVEL SECURITY;

-- 2. CRIAR RPC PARA BUSCA SEGURA DE LOGIN (SECURITY DEFINER)
-- Esta função permite que o Portal encontre o e-mail pelo CPF sem expor a tabela.
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
DECLARE
    v_cpf text;
BEGIN
    -- Limpa o CPF (remove . e -)
    v_cpf := regexp_replace(cpf_input, '\D', '', 'g');
    
    RETURN QUERY
    SELECT 
        r.id, 
        r.email, 
        r.nome, 
        r.primeiro_acesso, 
        r.termos_aceitos, 
        r.status, 
        r.user_id
    FROM public.responsaveis r
    WHERE regexp_replace(r.cpf, '\D', '', 'g') = v_cpf
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Liberar execução para anônimos (necessário para o flow de login)
GRANT EXECUTE ON FUNCTION public.get_portal_login_info(text) TO anon, authenticated;

-- 3. POLÍTICAS PARA 'responsaveis'
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
    EXISTS (
        SELECT 1 FROM public.aluno_responsavel ar
        JOIN public.alunos a ON a.id = ar.aluno_id
        WHERE ar.responsavel_id = public.responsaveis.id
        AND a.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
);

DROP POLICY IF EXISTS "Pais atualizam seu perfil" ON public.responsaveis;
CREATE POLICY "Pais atualizam seu perfil" 
ON public.responsaveis FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- 4. POLÍTICAS PARA 'alunos'
DROP POLICY IF EXISTS "Pais veem seus filhos" ON public.alunos;
CREATE POLICY "Pais veem seus filhos" 
ON public.alunos FOR SELECT 
TO authenticated 
USING (
    id IN (
        SELECT ar.aluno_id FROM public.aluno_responsavel ar
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        WHERE r.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Gestores veem seus alunos" ON public.alunos;
CREATE POLICY "Gestores veem seus alunos" 
ON public.alunos FOR ALL 
TO authenticated 
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 5. POLÍTICAS PARA 'aluno_responsavel'
DROP POLICY IF EXISTS "Pais veem seus vínculos" ON public.aluno_responsavel;
CREATE POLICY "Pais veem seus vínculos" 
ON public.aluno_responsavel FOR SELECT 
TO authenticated 
USING (
    responsavel_id IN (SELECT id FROM public.responsaveis WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Gestores veem vínculos da escola" ON public.aluno_responsavel;
CREATE POLICY "Gestores veem vínculos da escola" 
ON public.aluno_responsavel FOR ALL 
TO authenticated 
USING (
    aluno_id IN (SELECT id FROM public.alunos WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
);

-- 6. POLÍTICAS PARA ONBOARDING (RESTAURADO E MELHORADO)
-- Permite que novas escolas enviem dados, mas restringe quem pode ver.

-- Filiais
DROP POLICY IF EXISTS "permitir_cadastro_filial_onboarding" ON public.filiais;
CREATE POLICY "permitir_cadastro_filial_onboarding" ON public.filiais FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Gestores veem filiais" ON public.filiais;
CREATE POLICY "Gestores veem filiais" ON public.filiais FOR SELECT TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Assinaturas
DROP POLICY IF EXISTS "permitir_cadastro_assinatura_onboarding" ON public.assinaturas;
CREATE POLICY "permitir_cadastro_assinatura_onboarding" ON public.assinaturas FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Gestores veem assinatura" ON public.assinaturas;
CREATE POLICY "Gestores veem assinatura" ON public.assinaturas FOR SELECT TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Faturas
DROP POLICY IF EXISTS "permitir_cadastro_fatura_onboarding" ON public.faturas;
CREATE POLICY "permitir_cadastro_fatura_onboarding" ON public.faturas FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Gestores veem faturas" ON public.faturas;
CREATE POLICY "Gestores veem faturas" ON public.faturas FOR SELECT TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 7. AUDITORIA
DROP POLICY IF EXISTS "Permitir inserção de log de auditoria" ON public.portal_audit_log;
CREATE POLICY "Permitir inserção de log de auditoria" 
ON public.portal_audit_log FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- ==============================================================================
-- ✅ MIGRATION CONCLUÍDA
-- ==============================================================================
