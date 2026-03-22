-- ==============================================================================
-- 🔒 MIGRATION 107: RESTAURAR ACESSO TOTAL DO GESTOR (SEM AFETAR PORTAL)
-- Descrição: Adiciona políticas do Gestor de volta nas tabelas compartilhadas.
--            NÃO remove nem altera nenhuma política "Portal_*".
-- Regra: Gestor tem acesso FOR ALL a tudo da sua escola (tenant_id).
-- ==============================================================================

-- 1. GARANTIR FUNÇÕES DE SUPORTE
CREATE OR REPLACE FUNCTION public.get_jwt_tenant_id()
RETURNS uuid AS $$
    SELECT (
        COALESCE(
            auth.jwt() -> 'user_metadata' ->> 'tenant_id',
            auth.jwt() -> 'app_metadata' ->> 'tenant_id',
            auth.jwt() ->> 'tenant_id'
        )
    )::uuid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_gestor_of_tenant(p_tenant_id uuid)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = p_tenant_id
        AND gestor_user_id = auth.uid()
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Função unificada: retorna TRUE se o usuário é gestor/admin/super_admin do tenant
CREATE OR REPLACE FUNCTION public.is_school_staff(p_tenant_id uuid)
RETURNS boolean AS $$
    SELECT (
        -- Gestor: tenant_id bate com o do JWT
        p_tenant_id = public.get_jwt_tenant_id()
        -- OU é gestor direto no banco
        OR public.is_gestor_of_tenant(p_tenant_id)
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. REMOVER APENAS POLÍTICAS DO GESTOR (Prefixo "Gestor_" e "Gestores_")
--    NUNCA REMOVER políticas "Portal_*"
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename FROM pg_policies 
        WHERE schemaname = 'public' 
        AND (policyname LIKE 'Gestor_%' OR policyname LIKE 'Gestores_%' OR policyname LIKE 'SuperAdmin_%' OR policyname LIKE 'Public_%')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 3. POLÍTICAS DO GESTOR (Acesso FOR ALL à sua escola)

-- ESCOLAS
DROP POLICY IF EXISTS "Gestor_Escola_Full" ON public.escolas;
CREATE POLICY "Gestor_Escola_Full" ON public.escolas FOR ALL TO authenticated 
USING (id = public.get_jwt_tenant_id() OR gestor_user_id = auth.uid());

-- FILIAIS
DROP POLICY IF EXISTS "Gestor_Filiais_Full" ON public.filiais;
CREATE POLICY "Gestor_Filiais_Full" ON public.filiais FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

-- TURMAS
DROP POLICY IF EXISTS "Gestor_Turmas_Full" ON public.turmas;
CREATE POLICY "Gestor_Turmas_Full" ON public.turmas FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

-- ALUNOS
DROP POLICY IF EXISTS "Gestor_Alunos_Full" ON public.alunos;
CREATE POLICY "Gestor_Alunos_Full" ON public.alunos FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

-- MATRÍCULAS
DROP POLICY IF EXISTS "Gestor_Matriculas_Full" ON public.matriculas;
CREATE POLICY "Gestor_Matriculas_Full" ON public.matriculas FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

-- COBRANÇAS
DROP POLICY IF EXISTS "Gestor_Cobrancas_Full" ON public.cobrancas;
CREATE POLICY "Gestor_Cobrancas_Full" ON public.cobrancas FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

-- CONTAS A PAGAR
DROP POLICY IF EXISTS "Gestor_ContasPagar_Full" ON public.contas_pagar;
CREATE POLICY "Gestor_ContasPagar_Full" ON public.contas_pagar FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

-- FREQUÊNCIAS
DROP POLICY IF EXISTS "Gestor_Frequencias_Full" ON public.frequencias;
CREATE POLICY "Gestor_Frequencias_Full" ON public.frequencias FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

-- PLANOS DE AULA
DROP POLICY IF EXISTS "Gestor_PlanosAula_Full" ON public.planos_aula;
CREATE POLICY "Gestor_PlanosAula_Full" ON public.planos_aula FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

-- ATIVIDADES
DROP POLICY IF EXISTS "Gestor_Atividades_Full" ON public.atividades;
CREATE POLICY "Gestor_Atividades_Full" ON public.atividades FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

-- MURAL DE AVISOS
DROP POLICY IF EXISTS "Gestor_Mural_Full" ON public.mural_avisos;
CREATE POLICY "Gestor_Mural_Full" ON public.mural_avisos FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

-- EVENTOS
DROP POLICY IF EXISTS "Gestor_Eventos_Full" ON public.eventos;
CREATE POLICY "Gestor_Eventos_Full" ON public.eventos FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

-- BOLETINS
DROP POLICY IF EXISTS "Gestor_Boletins_Full" ON public.boletins;
CREATE POLICY "Gestor_Boletins_Full" ON public.boletins FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

-- CONFIG FINANCEIRA
DROP POLICY IF EXISTS "Gestor_ConfigFin_Full" ON public.config_financeira;
CREATE POLICY "Gestor_ConfigFin_Full" ON public.config_financeira FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

-- LIVROS E MATERIAIS
DROP POLICY IF EXISTS "Gestor_Livros_Full" ON public.livros;
CREATE POLICY "Gestor_Livros_Full" ON public.livros FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

DROP POLICY IF EXISTS "Gestor_Materiais_Full" ON public.materiais_escolares;
CREATE POLICY "Gestor_Materiais_Full" ON public.materiais_escolares FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

-- DOCUMENTOS
DROP POLICY IF EXISTS "Gestor_DocTemplates_Full" ON public.documento_templates;
CREATE POLICY "Gestor_DocTemplates_Full" ON public.documento_templates FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

DROP POLICY IF EXISTS "Gestor_DocEmitidos_Full" ON public.documentos_emitidos;
CREATE POLICY "Gestor_DocEmitidos_Full" ON public.documentos_emitidos FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

-- ALMOXARIFADO
DROP POLICY IF EXISTS "Gestor_Almox_Itens_Full" ON public.almoxarifado_itens;
CREATE POLICY "Gestor_Almox_Itens_Full" ON public.almoxarifado_itens FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

DROP POLICY IF EXISTS "Gestor_Almox_Mov_Full" ON public.almoxarifado_movimentacoes;
CREATE POLICY "Gestor_Almox_Mov_Full" ON public.almoxarifado_movimentacoes FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

-- RESPONSÁVEIS (Gestor vê os pais dos alunos da sua escola)
DROP POLICY IF EXISTS "Gestor_Responsaveis_Select" ON public.responsaveis;
CREATE POLICY "Gestor_Responsaveis_Select" ON public.responsaveis FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.aluno_responsavel ar
        JOIN public.alunos a ON a.id = ar.aluno_id
        WHERE ar.responsavel_id = public.responsaveis.id
        AND public.is_school_staff(a.tenant_id)
    )
);

-- ALUNO-RESPONSÁVEL (Gestor gerencia vínculos de alunos da sua escola)
DROP POLICY IF EXISTS "Gestor_AR_Full" ON public.aluno_responsavel;
CREATE POLICY "Gestor_AR_Full" ON public.aluno_responsavel FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.alunos a
        WHERE a.id = aluno_id
        AND public.is_school_staff(a.tenant_id)
    )
);

-- AUTORIZAÇÕES (Gestor gerencia modelos de autorização)
DROP POLICY IF EXISTS "Gestor_AutModelos_Full" ON public.autorizacoes_modelos;
CREATE POLICY "Gestor_AutModelos_Full" ON public.autorizacoes_modelos FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

DROP POLICY IF EXISTS "Gestor_AutRespostas_Select" ON public.autorizacoes_respostas;
CREATE POLICY "Gestor_AutRespostas_Select" ON public.autorizacoes_respostas FOR SELECT TO authenticated 
USING (public.is_school_staff(tenant_id));

-- SELOS (Gestor gerencia selos dos alunos)
DROP POLICY IF EXISTS "Gestor_Selos_Full" ON public.selos;
CREATE POLICY "Gestor_Selos_Full" ON public.selos FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

-- FILA VIRTUAL (Gestor gerencia a fila da escola)
DROP POLICY IF EXISTS "Gestor_Fila_Full" ON public.fila_virtual;
CREATE POLICY "Gestor_Fila_Full" ON public.fila_virtual FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

-- SOLICITAÇÕES DE DOCUMENTOS (Gestor vê pedidos dos pais)
DROP POLICY IF EXISTS "Gestor_DocSolicit_Full" ON public.document_solicitations;
CREATE POLICY "Gestor_DocSolicit_Full" ON public.document_solicitations FOR ALL TO authenticated 
USING (public.is_school_staff(tenant_id));

-- 4. ACESSO PÚBLICO (Leitura básica para onboarding e portal)
CREATE POLICY "Public_Escolas_Select" ON public.escolas FOR SELECT USING (true);
CREATE POLICY "Public_Filiais_Select" ON public.filiais FOR SELECT USING (true);

-- 5. SUPER ADMIN (Acesso de auditoria)
DROP POLICY IF EXISTS "SuperAdmin_Escolas_Full" ON public.escolas;
CREATE POLICY "SuperAdmin_Escolas_Full" ON public.escolas FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR (auth.jwt() ->> 'is_super_admin')::boolean = true);

-- ==============================================================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ GESTOR: ACESSO TOTAL RESTAURADO';
    RAISE NOTICE '✅ PORTAL: POLÍTICAS PRESERVADAS';
    RAISE NOTICE '========================================';
END $$;
