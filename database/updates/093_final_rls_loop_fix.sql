-- ==============================================================================
-- 🔒 CORREÇÃO DEFINITIVA: RLS ANTI-RECURSÃO (LOOP-FREE)
-- ==============================================================================

-- 1. FUNÇÕES DE SUPORTE (SECURITY DEFINER para ignorar RLS internamente)

-- Retorna o ID do responsável vinculado ao usuário logado
CREATE OR REPLACE FUNCTION public.get_my_responsavel_id()
RETURNS uuid AS $$
    SELECT id FROM public.responsaveis WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Verifica se um aluno é "filho" (vinculado) do usuário logado
CREATE OR REPLACE FUNCTION public.is_my_child(p_aluno_id uuid)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.aluno_responsavel 
        WHERE aluno_id = p_aluno_id 
        AND responsavel_id = public.get_my_responsavel_id()
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Verifica se um vínculo pertence ao usuário logado
CREATE OR REPLACE FUNCTION public.is_my_link(p_link_id uuid)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.aluno_responsavel 
        WHERE id = p_link_id 
        AND responsavel_id = public.get_my_responsavel_id()
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. RE-IMPLEMENTAÇÃO DAS POLÍTICAS (Usando as funções acima para evitar loops)

-- Tabela: RESPONSAREIS
DROP POLICY IF EXISTS "Pais veem seu próprio perfil" ON public.responsaveis;
CREATE POLICY "Pais veem seu próprio perfil" ON public.responsaveis 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gestores veem responsáveis da sua escola" ON public.responsaveis;
CREATE POLICY "Gestores veem responsáveis da sua escola" ON public.responsaveis
FOR SELECT TO authenticated 
USING (public.check_gestor_acesso_responsavel(id, (auth.jwt() ->> 'tenant_id')::uuid));

-- Tabela: ALUNOS
DROP POLICY IF EXISTS "Pais veem seus filhos" ON public.alunos;
CREATE POLICY "Pais veem seus filhos" ON public.alunos 
FOR SELECT TO authenticated USING (public.is_my_child(id));

DROP POLICY IF EXISTS "Gestores veem seus alunos" ON public.alunos;
CREATE POLICY "Gestores veem seus alunos" ON public.alunos 
FOR ALL TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Tabela: ALUNO_RESPONSAVEL
DROP POLICY IF EXISTS "Pais veem seus vínculos" ON public.aluno_responsavel;
CREATE POLICY "Pais veem seus vínculos" ON public.aluno_responsavel 
FOR SELECT TO authenticated USING (responsavel_id = public.get_my_responsavel_id());

DROP POLICY IF EXISTS "Gestores veem vínculos da escola" ON public.aluno_responsavel;
CREATE POLICY "Gestores veem vínculos da escola" ON public.aluno_responsavel 
FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = aluno_id AND a.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid));

-- 3. FIX PARA OUTRAS TABELAS DO PORTAL (Avisos, Cobranças, Frequências)

-- MURAL_AVISOS
DROP POLICY IF EXISTS "Pais veem avisos da sua escola" ON public.mural_avisos;
CREATE POLICY "Pais veem avisos da sua escola" ON public.mural_avisos 
FOR SELECT TO authenticated 
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.alunos WHERE public.is_my_child(id)
    )
);

-- COBRANCAS
DROP POLICY IF EXISTS "Pais veem cobrancas vinculadas" ON public.cobrancas;
CREATE POLICY "Pais veem cobrancas vinculadas" ON public.cobrancas 
FOR SELECT TO authenticated USING (public.is_my_child(aluno_id));

-- FREQUENCIAS
DROP POLICY IF EXISTS "Pais veem frequencia dos filhos" ON public.frequencias;
CREATE POLICY "Pais veem frequencia dos filhos" ON public.frequencias 
FOR SELECT TO authenticated USING (public.is_my_child(aluno_id));

-- CONFIG_FINANCEIRA
DROP POLICY IF EXISTS "Pais veem config financeira da escola" ON public.config_financeira;
CREATE POLICY "Pais veem config financeira da escola" ON public.config_financeira 
FOR SELECT TO authenticated 
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.alunos WHERE public.is_my_child(id)
    )
);

-- 4. FIX PARA O STATUS DE COBRANÇAS (PATCH error)
-- O portal tenta atualizar cobranças para 'atrasado'. Precisamos permitir isso.
CREATE POLICY "Pais atualizam status de cobrança" ON public.cobrancas 
FOR UPDATE TO authenticated 
USING (public.is_my_child(aluno_id))
WITH CHECK (public.is_my_child(aluno_id));

-- Garantir que as tabelas de onboarding continuem funcionando
-- (já configuradas na migration anterior, mas garantindo que o RLS não as bloqueie para gestores)
ALTER TABLE public.filiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
