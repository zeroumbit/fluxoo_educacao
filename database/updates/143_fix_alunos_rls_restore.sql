-- ==============================================================================
-- 🚑 MIGRATION 143: RESTAURAÇÃO RLS ALUNOS + TABELAS CRÍTICAS
-- Problema: Migration 142 sobrescreveu políticas com JWT direto (sem metadata),
--           removendo acesso de gestores, responsáveis e funcionários.
-- Solução:  Restaurar políticas do modelo 114 (user_metadata + helpers) na
--           tabela alunos, e garantir políticas corretas em todas as tabelas
--           que afetam listagem de alunos.
-- ==============================================================================

BEGIN;

-- ============================================================================
-- PASSO 1: RESTAURAR HELPER FUNCTIONS (caso tenham sido perdidas)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_my_responsavel_id()
RETURNS uuid AS $$ 
    SELECT id FROM public.responsaveis WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_children()
RETURNS SETOF uuid AS $$
    SELECT aluno_id FROM public.aluno_responsavel
    WHERE responsavel_id = public.get_my_responsavel_id();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_tenants()
RETURNS SETOF uuid AS $$
    SELECT tenant_id FROM public.alunos
    WHERE id IN (SELECT public.get_my_children());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- PASSO 2: DERRUBAR TODAS AS POLÍTICAS DA TABELA ALUNOS (limpar migração 142)
-- ============================================================================
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'alunos' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.alunos';
    END LOOP;
END $$;

-- ============================================================================
-- PASSO 3: RECRIAR POLÍTICAS CORRETAS PARA ALUNOS (baseado na migração 114)
-- ============================================================================

-- SELECT: Gestor, Funcionários, Responsáveis, Super Admin
CREATE POLICY "Universal_Select_alunos" ON public.alunos FOR SELECT TO authenticated USING (
    -- SuperAdmin Bypass Global
    (auth.jwt()->'user_metadata'->>'role' = 'super_admin' OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true)
    OR
    -- Staff da Escola (via user_metadata ou app_metadata ou direct claim)
    (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid)
    OR
    -- Gestor da escola por ID direto
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
    OR
    -- Família: Responsáveis vêem seus filhos (via helper anti-recursion)
    (id IN (SELECT public.get_my_children()))
);

-- Para não bloquear soft-deletes: a migração 142 adicionou deleted_at,
-- mas a política de leitura não deve esconder os alunos "ativos" por causa disso.
-- O filtro de deleted_at deve ser feito na aplicação se necessário.

-- INSERT: Apenas staff do tenant
CREATE POLICY "Universal_Modify_alunos" ON public.alunos FOR ALL TO authenticated USING (
    (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid)
    OR
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
) WITH CHECK (
    (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid)
    OR
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
);

-- ============================================================================
-- PASSO 4: VERIFICAR E CORRIGIR MATRÍCULAS (necessário para listar turma do aluno)
-- ============================================================================
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'matriculas' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.matriculas';
    END LOOP;
END $$;

ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Universal_Select_matriculas" ON public.matriculas FOR SELECT TO authenticated USING (
    (auth.jwt()->'user_metadata'->>'role' = 'super_admin' OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true)
    OR
    (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid)
    OR
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
    OR
    (aluno_id IN (SELECT public.get_my_children()))
);

CREATE POLICY "Universal_Modify_matriculas" ON public.matriculas FOR ALL TO authenticated USING (
    (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid)
    OR
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
) WITH CHECK (
    (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid)
    OR
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
);

-- ============================================================================
-- PASSO 5: ALUNO_RESPONSAVEL (tabela de vínculos — crítica para portal família)
-- ============================================================================
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'aluno_responsavel' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.aluno_responsavel';
    END LOOP;
END $$;

ALTER TABLE public.aluno_responsavel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Universal_Select_AlunoResponsavel" ON public.aluno_responsavel FOR SELECT TO authenticated USING (
    -- Responsável vê seus vínculos
    responsavel_id = public.get_my_responsavel_id()
    OR
    -- Escola vê vínculos dos seus alunos
    EXISTS (
        SELECT 1 FROM public.alunos a WHERE a.id = aluno_id AND (
            a.tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
            OR a.tenant_id IN (SELECT e.id FROM public.escolas e WHERE e.gestor_user_id = auth.uid())
        )
    )
);

CREATE POLICY "Universal_Modify_AlunoResponsavel" ON public.aluno_responsavel FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.alunos a WHERE a.id = aluno_id AND (
            a.tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
            OR a.tenant_id IN (SELECT e.id FROM public.escolas e WHERE e.gestor_user_id = auth.uid())
        )
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.alunos a WHERE a.id = aluno_id AND (
            a.tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
            OR a.tenant_id IN (SELECT e.id FROM public.escolas e WHERE e.gestor_user_id = auth.uid())
        )
    )
);

-- ============================================================================
-- PASSO 6: RESPONSÁVEIS (tabela de pais/responsáveis)
-- ============================================================================
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'responsaveis' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.responsaveis';
    END LOOP;
END $$;

ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Universal_Select_Responsaveis" ON public.responsaveis FOR SELECT TO authenticated USING (
    -- Próprio registro
    user_id = auth.uid()
    OR 
    -- Gestor/Staff lê responsáveis dos alunos do seu tenant
    id IN (
        SELECT ar.responsavel_id FROM public.aluno_responsavel ar
        JOIN public.alunos a ON a.id = ar.aluno_id
        WHERE a.tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
        OR a.tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid())
    )
);

CREATE POLICY "Universal_Modify_Responsaveis" ON public.responsaveis FOR ALL TO authenticated USING (
    user_id = auth.uid()
    OR 
    id IN (
        SELECT ar.responsavel_id FROM public.aluno_responsavel ar
        JOIN public.alunos a ON a.id = ar.aluno_id
        WHERE a.tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
        OR a.tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid())
    )
) WITH CHECK (
    user_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.escolas e
        WHERE e.gestor_user_id = auth.uid()
    )
);

-- ============================================================================
-- PASSO 7: TURMAS (necessário para associar aluno → turma)
-- ============================================================================
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'turmas' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.turmas';
    END LOOP;
END $$;

ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Universal_Select_turmas" ON public.turmas FOR SELECT TO authenticated USING (
    (auth.jwt()->'user_metadata'->>'role' = 'super_admin' OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true)
    OR
    (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid)
    OR
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
    OR
    -- Responsáveis: vêem turmas onde seus filhos estão matriculados
    id IN (SELECT turma_id FROM public.matriculas WHERE aluno_id IN (SELECT public.get_my_children()) AND status='ativa')
);

CREATE POLICY "Universal_Modify_turmas" ON public.turmas FOR ALL TO authenticated USING (
    (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid)
    OR
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
) WITH CHECK (
    (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid)
    OR
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
);

-- ============================================================================
-- PASSO 8: COBRANCAS (necessário para portal financeiro dos pais)
-- ============================================================================
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'cobrancas' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.cobrancas';
    END LOOP;
END $$;

ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Universal_Select_cobrancas" ON public.cobrancas FOR SELECT TO authenticated USING (
    (auth.jwt()->'user_metadata'->>'role' = 'super_admin' OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true)
    OR
    (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid)
    OR
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
    OR
    (aluno_id IN (SELECT public.get_my_children()))
);

CREATE POLICY "Universal_Modify_cobrancas" ON public.cobrancas FOR ALL TO authenticated USING (
    (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid)
    OR
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
) WITH CHECK (
    (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid)
    OR
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
);

-- ============================================================================
-- PASSO 9: FREQUENCIAS (necessário para portal e professor)
-- ============================================================================
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'frequencias' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.frequencias';
    END LOOP;
END $$;

ALTER TABLE public.frequencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Universal_Select_frequencias" ON public.frequencias FOR SELECT TO authenticated USING (
    (auth.jwt()->'user_metadata'->>'role' = 'super_admin' OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true)
    OR
    (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid)
    OR
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
    OR
    (aluno_id IN (SELECT public.get_my_children()))
);

CREATE POLICY "Universal_Modify_frequencias" ON public.frequencias FOR ALL TO authenticated USING (
    (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid)
    OR
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
) WITH CHECK (
    (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid)
    OR
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
);

-- ============================================================================
-- PASSO 10: FUNCIONARIOS (necessário para listar professores)
-- ============================================================================
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'funcionarios' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.funcionarios';
    END LOOP;
END $$;

ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Universal_Select_funcionarios" ON public.funcionarios FOR SELECT TO authenticated USING (
    (auth.jwt()->'user_metadata'->>'role' = 'super_admin' OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true)
    OR
    (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid)
    OR
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
    OR
    -- Funcionário vê a si mesmo
    user_id = auth.uid()
);

CREATE POLICY "Universal_Modify_funcionarios" ON public.funcionarios FOR ALL TO authenticated USING (
    (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid)
    OR
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
) WITH CHECK (
    (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid)
    OR
    (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
);

-- ============================================================================
-- PASSO 11: GARANTIR metadata tenant_id no JWT da escola afetada
-- Re-executar a função que sincroniza o tenant_id nos JWT claims
-- ============================================================================
DO $$ 
BEGIN
    PERFORM public.update_user_tenant_claim();
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Função update_user_tenant_claim não encontrada. Executando sync manual...';
    -- Fallback: Atualizar manualmente para a escola MARIA JOSE ANDRADE
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
        'tenant_id', (SELECT id::text FROM public.escolas WHERE email_gestor = 'commercedez@gmail.com' LIMIT 1),
        'role', 'gestor'
    )
    WHERE email = 'commercedez@gmail.com';
END $$;

COMMIT;

-- ==============================================================================
-- ✅ RESUMO DA CORREÇÃO:
-- 1. Restaurou helpers get_my_children(), get_my_tenants(), get_my_responsavel_id()
-- 2. Restaurou políticas corretas na tabela alunos:
--    - Gestor: via user_metadata->tenant_id OU gestor_user_id = auth.uid()
--    - Funcionários: via user_metadata->tenant_id
--    - Responsáveis: via get_my_children() 
--    - Super Admin: via user_metadata->role = 'super_admin'
-- 3. Restaurou políticas em matriculas, aluno_responsavel, responsaveis, turmas,
--    cobrancas, frequencias e funcionarios
-- 4. Re-sincronizou os JWT claims do gestor
--
-- APÓS EXECUTAR:
-- 1. O gestor da escola deve FAZER LOGOUT e LOGIN novamente 
-- 2. Verificar no painel se os 5 alunos aparecem
-- 3. Testar acesso de um responsável no portal da família
-- ==============================================================================
