-- ==============================================================================
-- 🚀 MIGRATION: ABERTURA TOTAL E SEGURA DO PORTAL DO RESPONSÁVEL
-- Descrição: Garante que os pais vejam TUDO o que é relacionado aos seus filhos.
-- ==============================================================================

-- 1. FUNÇÕES DE SUPORTE AVANÇADAS (Security Definer para Performance e Anti-Recursão)

-- Retorna todos os Tenant IDs onde o usuário tem filhos
CREATE OR REPLACE FUNCTION public.get_my_tenants()
RETURNS SETOF uuid AS $$
    SELECT DISTINCT a.tenant_id 
    FROM public.alunos a
    JOIN public.aluno_responsavel ar ON ar.aluno_id = a.id
    WHERE ar.responsavel_id = (SELECT r.id FROM public.responsaveis r WHERE r.user_id = auth.uid() LIMIT 1);
$$ LANGUAGE sql SECURITY DEFINER;

-- Verifica se uma turma pertence a um dos filhos do usuário
CREATE OR REPLACE FUNCTION public.is_my_child_turma(p_turma_id uuid)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.matriculas m
        JOIN public.aluno_responsavel ar ON ar.aluno_id = m.aluno_id
        WHERE m.turma_id = p_turma_id 
        AND ar.responsavel_id = (SELECT r.id FROM public.responsaveis r WHERE r.user_id = auth.uid() LIMIT 1)
        AND m.status = 'ativa'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. LIMPEZA E APLICAÇÃO DE POLÍTICAS (SELECT para Pais)

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Limpa políticas de todas as tabelas que o portal usa
    FOR r IN (
        SELECT policyname, tablename FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('alunos', 'responsaveis', 'aluno_responsavel', 'mural_avisos', 'cobrancas', 'config_financeira', 'frequencias', 'turmas', 'filiais', 'escolas', 'eventos', 'matriculas', 'plano_aula', 'atividades', 'documento_emitido', 'selos', 'configuracao_recebimento')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- --- ESCOLAS E FILIAIS (Metadados básicos) ---
CREATE POLICY "Portal_Escolas_Select" ON public.escolas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Portal_Filiais_Select" ON public.filiais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Portal_ConfigRec_Select" ON public.configuracao_recebimento FOR SELECT TO authenticated USING (true);

-- --- TURMAS (Essencial para joins de Mural e Agenda) ---
CREATE POLICY "Portal_Turmas_Select_Pais" ON public.turmas FOR SELECT TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'responsavel' AND public.is_my_child_turma(id) );
CREATE POLICY "Portal_Turmas_Gestor" ON public.turmas FOR ALL TO authenticated 
USING ( (auth.jwt() ->> 'role') IN ('gestor', 'admin', 'super_admin') );

-- --- ALUNOS E MATRÍCULAS ---
CREATE POLICY "Portal_Alunos_Pais" ON public.alunos FOR SELECT TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'responsavel' AND public.is_my_child(id) );
CREATE POLICY "Portal_Alunos_Gestor" ON public.alunos FOR ALL TO authenticated 
USING ( (auth.jwt() ->> 'role') IN ('gestor', 'admin', 'super_admin') );

CREATE POLICY "Portal_Matriculas_Pais" ON public.matriculas FOR SELECT TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'responsavel' AND public.is_my_child(aluno_id) );
CREATE POLICY "Portal_Matriculas_Gestor" ON public.matriculas FOR ALL TO authenticated 
USING ( (auth.jwt() ->> 'role') IN ('gestor', 'admin', 'super_admin') );

-- --- FINANCEIRO (Cobranças e Configurações) ---
CREATE POLICY "Portal_Cobrancas_Pais" ON public.cobrancas FOR SELECT TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'responsavel' AND public.is_my_child(aluno_id) );
CREATE POLICY "Portal_Cobrancas_Update" ON public.cobrancas FOR UPDATE TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'responsavel' AND public.is_my_child(aluno_id) );
CREATE POLICY "Portal_Cobrancas_Gestor" ON public.cobrancas FOR ALL TO authenticated 
USING ( (auth.jwt() ->> 'role') IN ('gestor', 'admin', 'super_admin') );

CREATE POLICY "Portal_ConfigFin_Pais" ON public.config_financeira FOR SELECT TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'responsavel' AND tenant_id IN (SELECT public.get_my_tenants()) );

-- --- COMUNICAÇÃO E AGENDA (Mural, Eventos, Frequência) ---
CREATE POLICY "Portal_Mural_Pais" ON public.mural_avisos FOR SELECT TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'responsavel' AND tenant_id IN (SELECT public.get_my_tenants()) );
CREATE POLICY "Portal_Mural_Gestor" ON public.mural_avisos FOR ALL TO authenticated 
USING ( (auth.jwt() ->> 'role') IN ('gestor', 'admin', 'super_admin') );

CREATE POLICY "Portal_Eventos_Pais" ON public.eventos FOR SELECT TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'responsavel' AND tenant_id IN (SELECT public.get_my_tenants()) );

CREATE POLICY "Portal_Frequencias_Pais" ON public.frequencias FOR SELECT TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'responsavel' AND public.is_my_child(aluno_id) );

-- --- CONTEÚDO (Plano de Aula e Atividades) ---
CREATE POLICY "Portal_PlanoAula_Pais" ON public.plano_aula FOR SELECT TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'responsavel' AND tenant_id IN (SELECT public.get_my_tenants()) );

CREATE POLICY "Portal_Atividades_Pais" ON public.atividades FOR SELECT TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'responsavel' AND tenant_id IN (SELECT public.get_my_tenants()) );

-- --- AUDITORIA ---
CREATE POLICY "Portal_Audit_Insert" ON public.portal_audit_log FOR INSERT TO anon, authenticated WITH CHECK (true);
