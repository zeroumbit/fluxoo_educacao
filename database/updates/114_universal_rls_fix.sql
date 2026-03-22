-- ==============================================================================
-- 🛡️ MIGRATION 114: UNIVERSAL RLS FIX v2 (TODAS AS TABELAS + ANTI-RECURSION)
-- Descrição: Restaura o acesso integral aos gestores lendo o tenant_id do 
-- 'user_metadata' e aplica a política Universal a TODAS as tabelas, quebrando
-- completamente o loop infinito (Erro 500) usando Security Definer Helpers.
-- ==============================================================================

-- 1. LIMPEZA TOTAL DAS POLÍTICAS ANTIGAS E UNIVERSAIS ANTERIORES
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename FROM pg_policies 
        WHERE schemaname = 'public' 
        AND (
            policyname LIKE 'Universal_%'
            OR policyname LIKE 'Gestor_%' 
            OR policyname LIKE 'Gestores_%'
            OR policyname LIKE 'Portal_%' 
            OR policyname LIKE 'SuperAdmin_%' 
            OR policyname LIKE 'Public_%'
            OR policyname LIKE 'Funcionario_%'
        )
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- ==============================================================================
-- HELPER FUNCTIONS (SECURITY DEFINER) - Quebram o Loop Infinito RLS (Erro 500)
-- ==============================================================================
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

-- STAFF CHECK (No Function, Inline para O(1)): 
-- tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid 
-- OR tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid())

-- SUPER ADMIN CHECK (Inline O(1)):
-- (auth.jwt()->'user_metadata'->>'role' = 'super_admin' OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true)

-- ==============================================================================
-- 2. POLÍTICAS DE ACESSO UNIVERSAL P/ PRINCIPAIS TABELAS COM "tenant_id"
-- ==============================================================================
DO $$ 
DECLARE 
    tb text;
    has_tenant_id boolean;
    tables_to_update text[] := ARRAY[
        'alunos', 'turmas', 'matriculas', 'frequencias', 'boletins', 
        'cobrancas', 'mural_avisos', 'eventos', 'planos_aula', 'atividades',
        'contas_pagar', 'filiais', 'config_financeira', 'livros', 'materiais_escolares',
        'documentos_emitidos', 'documento_templates', 'almoxarifado_itens', 
        'almoxarifado_movimentacoes', 'autorizacoes_modelos', 'funcionarios'
    ];
BEGIN
    FOREACH tb IN ARRAY tables_to_update LOOP
        
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tb);
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = tb AND column_name = 'tenant_id'
        ) INTO has_tenant_id;

        IF has_tenant_id THEN
            DECLARE
                parent_condition TEXT := 'false';
            BEGIN
                -- Mapeia a permissão do responsável apenas com helper list conditions (ID IN (...)).
                IF tb = 'alunos' THEN
                    parent_condition := 'id IN (SELECT public.get_my_children())';
                ELSIF tb = 'turmas' THEN
                    parent_condition := 'id IN (SELECT turma_id FROM public.matriculas WHERE aluno_id IN (SELECT public.get_my_children()) AND status=''ativa'')';
                ELSIF tb IN ('matriculas', 'frequencias', 'boletins', 'cobrancas') THEN
                    parent_condition := 'aluno_id IN (SELECT public.get_my_children())';
                ELSIF tb IN ('mural_avisos', 'eventos', 'planos_aula', 'atividades', 'livros', 'materiais_escolares', 'config_financeira', 'filiais') THEN
                    parent_condition := 'tenant_id IN (SELECT public.get_my_tenants())';
                END IF;

                ---------------------------
                -- POLÍTICA FOR SELECT
                ---------------------------
                EXECUTE format('
                    CREATE POLICY "Universal_Select_%I" ON public.%I FOR SELECT TO authenticated USING (
                        -- SuperAdmin Bypass Global
                        (auth.jwt()->''user_metadata''->>''role'' = ''super_admin'' OR COALESCE((auth.jwt()->>''is_super_admin'')::boolean, false) = true)
                        OR
                        -- Staff da Escola
                        (tenant_id = NULLIF(COALESCE(auth.jwt()->''user_metadata''->>''tenant_id'', auth.jwt()->''app_metadata''->>''tenant_id'', auth.jwt()->>''tenant_id''), '''')::uuid)
                        OR
                        (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
                        OR
                        -- Família (Dinâmico para esta tabela, sem loops infinitos RLS)
                        (%s)
                    );', tb, tb, parent_condition);

                ---------------------------
                -- POLÍTICA FOR UPDATE e INSERT
                ---------------------------
                EXECUTE format('
                    CREATE POLICY "Universal_Modify_%I" ON public.%I FOR ALL TO authenticated USING (
                        (tenant_id = NULLIF(COALESCE(auth.jwt()->''user_metadata''->>''tenant_id'', auth.jwt()->''app_metadata''->>''tenant_id'', auth.jwt()->>''tenant_id''), '''')::uuid)
                        OR
                        (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
                    ) WITH CHECK (
                        (tenant_id = NULLIF(COALESCE(auth.jwt()->''user_metadata''->>''tenant_id'', auth.jwt()->''app_metadata''->>''tenant_id'', auth.jwt()->>''tenant_id''), '''')::uuid)
                        OR
                        (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
                    );', tb, tb);
            END;
        END IF;

    END LOOP;
END $$;


-- ==============================================================================
-- 3. POLÍTICAS MANUAIS (Tabelas Relacionais e Sem Tenant)
-- ==============================================================================

-- ESCOLAS
CREATE POLICY "Universal_Select_Escolas" ON public.escolas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Universal_Modify_Escolas" ON public.escolas FOR ALL TO authenticated USING (
    id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
    OR gestor_user_id = auth.uid() 
    OR (auth.jwt()->'user_metadata'->>'role' = 'super_admin' OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true)
) WITH CHECK (
    id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
    OR gestor_user_id = auth.uid() 
    OR (auth.jwt()->'user_metadata'->>'role' = 'super_admin' OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true)
);

-- RESPONSAVEIS
CREATE POLICY "Universal_Select_Responsaveis" ON public.responsaveis FOR SELECT TO authenticated USING (
    -- Próprio registro
    user_id = auth.uid()
    OR 
    -- Gestor lê responsáveis dos alunos do seu tenant, usando uma consulta que não sofre recursão
    id IN (
        SELECT ar.responsavel_id FROM public.aluno_responsavel ar
        JOIN public.alunos a ON a.id = ar.aluno_id
        WHERE a.tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
        OR a.tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid())
    )
);

CREATE POLICY "Universal_Modify_Responsaveis" ON public.responsaveis FOR ALL TO authenticated USING (
    user_id = auth.uid()
) WITH CHECK (user_id = auth.uid());

-- ALUNO_RESPONSAVEL
CREATE POLICY "Universal_Select_AlunoResponsavel" ON public.aluno_responsavel FOR SELECT TO authenticated USING (
    -- Filho
    responsavel_id = public.get_my_responsavel_id()
    OR
    -- Escola
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

-- OUTRAS TABELAS
CREATE POLICY "Universal_Select_PlanosAulaTurmas" ON public.planos_aula_turmas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Universal_Modify_PlanosAulaTurmas" ON public.planos_aula_turmas FOR ALL TO authenticated USING (true) WITH CHECK(true);

CREATE POLICY "Universal_Select_AtividadesTurmas" ON public.atividades_turmas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Universal_Modify_AtividadesTurmas" ON public.atividades_turmas FOR ALL TO authenticated USING (true) WITH CHECK(true);

CREATE POLICY "Universal_Select_Selos" ON public.selos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Universal_Modify_Selos" ON public.selos FOR ALL TO authenticated USING (true) WITH CHECK(true);

CREATE POLICY "Universal_Select_Fila" ON public.fila_virtual FOR SELECT TO authenticated USING (
    tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
    OR tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid())
    OR responsavel_id = public.get_my_responsavel_id()
);
CREATE POLICY "Universal_Modify_Fila" ON public.fila_virtual FOR ALL TO authenticated USING (true) WITH CHECK(true);

CREATE POLICY "Universal_Select_AuthResp" ON public.autorizacoes_respostas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Universal_Modify_AuthResp" ON public.autorizacoes_respostas FOR ALL TO authenticated USING (true) WITH CHECK(true);

CREATE POLICY "Universal_Select_DS" ON public.document_solicitations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Universal_Modify_DS" ON public.document_solicitations FOR ALL TO authenticated USING (true) WITH CHECK(true);
