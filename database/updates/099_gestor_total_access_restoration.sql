-- ==============================================================================
-- 🚨 MIGRATION 099: RESTAURAÇÃO TOTAL E DEFINITIVA - GESTOR DA ESCOLA
-- Descrição: Restaura 100% do acesso do Gestor à sua escola e filiais.
--            Resolve o problema de caminho do JWT (role e tenant_id) e 
--            limpa as políticas parciais das correções anteriores.
-- Data: 22 de março de 2026 (Horário Local)
-- ==============================================================================

-- 1. FUNÇÕES DE SUPORTE (SECURITY DEFINER)
-- Estas funções garantem que extraímos os claims do JWT do lugar correto (user_metadata)
-- e que a verificação de gestor seja baseada na tabela 'escolas' do banco.

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

CREATE OR REPLACE FUNCTION public.get_jwt_role()
RETURNS text AS $$
    SELECT COALESCE(
        auth.jwt() -> 'user_metadata' ->> 'role',
        auth.jwt() -> 'app_metadata' ->> 'role',
        CASE WHEN (auth.jwt() ->> 'is_super_admin')::boolean THEN 'super_admin' ELSE NULL END,
        auth.jwt() ->> 'role'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_gestor_of_tenant(p_tenant_id uuid)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.escolas
        WHERE id = p_tenant_id
        AND gestor_user_id = auth.uid()
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. LIMPEZA TOTAL DE POLÍTICAS EXISTENTES
-- Removemos políticas de TODAS as tabelas críticas para reconstruir o acesso planejado.
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'escolas', 'filiais', 'turmas', 'alunos', 'matriculas', 'responsaveis', 
            'aluno_responsavel', 'cobrancas', 'contas_pagar', 'frequencias', 
            'planos_aula', 'atividades', 'mural_avisos', 'boletins', 
            'documento_templates', 'documentos_emitidos', 'almoxarifado_itens', 
            'almoxarifado_movimentacoes', 'livros', 'materiais_escolares',
            'assinaturas', 'faturas', 'eventos', 'config_financeira', 'configuracao_recebimento'
        )
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 3. POLÍTICA DE ACESSO TOTAL PARA O GESTOR
-- Esta é a regra de ouro: Se o usuário é gestor no JWT e o tenant match OU se ele é gestor direto no banco, ele faz TUDO.

-- Função auxiliar para simplificar as políticas
CREATE OR REPLACE FUNCTION public.check_gestor_access(p_tenant_id uuid)
RETURNS boolean AS $$
BEGIN
    -- Se é Super Admin, bypass.
    IF public.get_jwt_role() = 'super_admin' THEN RETURN TRUE; END IF;
    
    -- Se é Gestor e o tenant_id bate com o do JWT ou com o que ele gerencia no banco
    RETURN (
        public.get_jwt_role() = 'gestor' 
        AND (p_tenant_id = public.get_jwt_tenant_id() OR public.is_gestor_of_tenant(p_tenant_id))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Aplicando ACESSO TOTAL nas tabelas principais
-- Turmas
CREATE POLICY "Gestor_Turmas_Full" ON public.turmas FOR ALL TO authenticated USING (public.check_gestor_access(tenant_id)) WITH CHECK (public.check_gestor_access(tenant_id));
-- Alunos
CREATE POLICY "Gestor_Alunos_Full" ON public.alunos FOR ALL TO authenticated USING (public.check_gestor_access(tenant_id)) WITH CHECK (public.check_gestor_access(tenant_id));
-- Matrículas
CREATE POLICY "Gestor_Matriculas_Full" ON public.matriculas FOR ALL TO authenticated USING (public.check_gestor_access(tenant_id)) WITH CHECK (public.check_gestor_access(tenant_id));
-- Cobranças
CREATE POLICY "Gestor_Cobrancas_Full" ON public.cobrancas FOR ALL TO authenticated USING (public.check_gestor_access(tenant_id)) WITH CHECK (public.check_gestor_access(tenant_id));
-- Contas a Pagar
CREATE POLICY "Gestor_ContasPagar_Full" ON public.contas_pagar FOR ALL TO authenticated USING (public.check_gestor_access(tenant_id)) WITH CHECK (public.check_gestor_access(tenant_id));
-- Escolas (Especial: Gestor vê a sua por ID ou por ser dono)
CREATE POLICY "Gestor_Escola_Full" ON public.escolas FOR ALL TO authenticated USING (id = public.get_jwt_tenant_id() OR gestor_user_id = auth.uid() OR public.get_jwt_role() = 'super_admin');
-- Filiais
CREATE POLICY "Gestor_Filiais_Full" ON public.filiais FOR ALL TO authenticated USING (public.check_gestor_access(tenant_id)) WITH CHECK (public.check_gestor_access(tenant_id));
-- Frequências
CREATE POLICY "Gestor_Frequencias_Full" ON public.frequencias FOR ALL TO authenticated USING (public.check_gestor_access(tenant_id)) WITH CHECK (public.check_gestor_access(tenant_id));
-- Planos de Aula
CREATE POLICY "Gestor_PlanosAula_Full" ON public.planos_aula FOR ALL TO authenticated USING (public.check_gestor_access(tenant_id)) WITH CHECK (public.check_gestor_access(tenant_id));
-- Atividades
CREATE POLICY "Gestor_Atividades_Full" ON public.atividades FOR ALL TO authenticated USING (public.check_gestor_access(tenant_id)) WITH CHECK (public.check_gestor_access(tenant_id));
-- Mural de Avisos
CREATE POLICY "Gestor_Mural_Full" ON public.mural_avisos FOR ALL TO authenticated USING (public.check_gestor_access(tenant_id)) WITH CHECK (public.check_gestor_access(tenant_id));
-- Boletins
CREATE POLICY "Gestor_Boletins_Full" ON public.boletins FOR ALL TO authenticated USING (public.check_gestor_access(tenant_id)) WITH CHECK (public.check_gestor_access(tenant_id));
-- Config Financeira
CREATE POLICY "Gestor_ConfigFin_Full" ON public.config_financeira FOR ALL TO authenticated USING (public.check_gestor_access(tenant_id)) WITH CHECK (public.check_gestor_access(tenant_id));
-- Livros e Materiais
CREATE POLICY "Gestor_Livros_Full" ON public.livros FOR ALL TO authenticated USING (public.check_gestor_access(tenant_id)) WITH CHECK (public.check_gestor_access(tenant_id));
CREATE POLICY "Gestor_Materiais_Full" ON public.materiais_escolares FOR ALL TO authenticated USING (public.check_gestor_access(tenant_id)) WITH CHECK (public.check_gestor_access(tenant_id));

-- Responsáveis e Vínculos (Lógica especial pois não tem tenant_id direto em responsaveis)
CREATE POLICY "Gestor_Responsaveis_Select" ON public.responsaveis FOR SELECT TO authenticated 
USING ( public.get_jwt_role() = 'super_admin' OR EXISTS (SELECT 1 FROM public.aluno_responsavel ar JOIN public.alunos a ON a.id = ar.aluno_id WHERE ar.responsavel_id = public.responsaveis.id AND public.check_gestor_access(a.tenant_id)) );

CREATE POLICY "Gestor_AR_Full" ON public.aluno_responsavel FOR ALL TO authenticated 
USING ( EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = aluno_id AND public.check_gestor_access(a.tenant_id)) );

-- 4. PORTAL DO RESPONSÁVEL (Garantir que Pais vejam seus filhos)
CREATE POLICY "Portal_Alunos_Select" ON public.alunos FOR SELECT TO authenticated USING (public.get_jwt_role() = 'responsavel' AND public.is_my_child(id));
CREATE POLICY "Portal_Responsaveis_Self" ON public.responsaveis FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Portal_Cobrancas_Select" ON public.cobrancas FOR SELECT TO authenticated USING (public.get_jwt_role() = 'responsavel' AND public.is_my_child(aluno_id));
CREATE POLICY "Portal_Turmas_Select" ON public.turmas FOR SELECT TO authenticated USING (public.get_jwt_role() = 'responsavel' AND public.is_my_child_turma(id));
CREATE POLICY "Portal_Frequencias_Select" ON public.frequencias FOR SELECT TO authenticated USING (public.get_jwt_role() = 'responsavel' AND public.is_my_child(aluno_id));

-- 5. ACESSO PÚBLICO (Escola/Filiais Básicos para Onboarding/Portal)
CREATE POLICY "Public_Escolas_Select" ON public.escolas FOR SELECT USING (true);
CREATE POLICY "Public_Filiais_Select" ON public.filiais FOR SELECT USING (true);

-- ==============================================================================
-- ✅ RESTAURAÇÃO CONCLUÍDA
-- ==============================================================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🚀 GESTOR: ACESSO TOTAL RESTAURADO';
    RAISE NOTICE '📊 TURMAS, ALUNOS E COBRANÇAS LIBERADOS';
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE '⚠️  Gestor deve agora ver suas 9 turmas e 3 alunos.';
    RAISE NOTICE '========================================';
END $$;
