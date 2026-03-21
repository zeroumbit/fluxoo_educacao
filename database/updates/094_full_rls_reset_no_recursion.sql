-- ==============================================================================
-- 🚨 LIMPEZA TOTAL E RECONSTRUÇÃO DE RLS (ANTI-RECURSÃO)
-- ==============================================================================

-- 1. LIMPAR TODAS AS POLÍTICAS EXISTENTES (Garante que não haja lixo de migrations antigas)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('alunos', 'responsaveis', 'aluno_responsavel', 'mural_avisos', 'cobrancas', 'config_financeira', 'frequencias')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 2. FUNÇÕES DE SUPORTE (SECURITY DEFINER - Executam com bypass de RLS)
CREATE OR REPLACE FUNCTION public.get_my_responsavel_id()
RETURNS uuid AS $$ 
    SELECT id FROM public.responsaveis WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_my_child(p_aluno_id uuid)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.aluno_responsavel 
        WHERE aluno_id = p_aluno_id 
        AND responsavel_id = public.get_my_responsavel_id()
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. POLÍTICAS RECONSTRUÍDAS

-- --- RESPONSAREIS ---
CREATE POLICY "RP_Responsaveis_Self" ON public.responsaveis FOR ALL TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "RP_Responsaveis_Gestor" ON public.responsaveis FOR SELECT TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'gestor' AND public.check_gestor_acesso_responsavel(id, (auth.jwt() ->> 'tenant_id')::uuid) );

-- --- ALUNOS ---
CREATE POLICY "RP_Alunos_Pais" ON public.alunos FOR SELECT TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'responsavel' AND public.is_my_child(id) );

CREATE POLICY "RP_Alunos_Gestor" ON public.alunos FOR ALL TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'gestor' AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid );

-- --- ALUNO_RESPONSAVEL ---
CREATE POLICY "RP_AR_Pais" ON public.aluno_responsavel FOR SELECT TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'responsavel' AND responsavel_id = public.get_my_responsavel_id() );

CREATE POLICY "RP_AR_Gestor" ON public.aluno_responsavel FOR ALL TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'gestor' AND EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = aluno_id AND a.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid) );

-- --- MURAL_AVISOS ---
CREATE POLICY "RP_Avisos_Pais" ON public.mural_avisos FOR SELECT TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'responsavel' AND tenant_id IN (SELECT tenant_id FROM public.alunos WHERE public.is_my_child(id)) );

CREATE POLICY "RP_Avisos_Gestor" ON public.mural_avisos FOR ALL TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'gestor' AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid );

-- --- COBRANCAS ---
CREATE POLICY "RP_Cobrancas_Pais" ON public.cobrancas FOR SELECT TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'responsavel' AND public.is_my_child(aluno_id) );

CREATE POLICY "RP_Cobrancas_Update_Ativa" ON public.cobrancas FOR UPDATE TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'responsavel' AND public.is_my_child(aluno_id) );

CREATE POLICY "RP_Cobrancas_Gestor" ON public.cobrancas FOR ALL TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'gestor' AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid );

-- --- CONFIG_FINANCEIRA ---
CREATE POLICY "RP_ConfigFin_Pais" ON public.config_financeira FOR SELECT TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'responsavel' AND tenant_id IN (SELECT tenant_id FROM public.alunos WHERE public.is_my_child(id)) );

CREATE POLICY "RP_ConfigFin_Gestor" ON public.config_financeira FOR ALL TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'gestor' AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid );

-- --- FREQUENCIAS ---
CREATE POLICY "RP_Frequencias_Pais" ON public.frequencias FOR SELECT TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'responsavel' AND public.is_my_child(aluno_id) );

CREATE POLICY "RP_Frequencias_Gestor" ON public.frequencias FOR ALL TO authenticated 
USING ( (auth.jwt() ->> 'role') = 'gestor' AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid );

-- 4. POLÍTICAS DE AUDITORIA E ONBOARDING
DROP POLICY IF EXISTS "Permitir inserção de log de auditoria" ON public.portal_audit_log;
CREATE POLICY "Permitir inserção de log de auditoria" ON public.portal_audit_log FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Filiais, Assinaturas, Faturas (Onboarding continua aberto para INSERT de anon)
DROP POLICY IF EXISTS "onboarding_insert_filiais" ON public.filiais;
CREATE POLICY "onboarding_insert_filiais" ON public.filiais FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "RP_Filiais_Gestor" ON public.filiais FOR ALL TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

DROP POLICY IF EXISTS "onboarding_insert_assinaturas" ON public.assinaturas;
CREATE POLICY "onboarding_insert_assinaturas" ON public.assinaturas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "RP_Assinaturas_Gestor" ON public.assinaturas FOR ALL TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

DROP POLICY IF EXISTS "onboarding_insert_faturas" ON public.faturas;
CREATE POLICY "onboarding_insert_faturas" ON public.faturas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "RP_Faturas_Gestor" ON public.faturas FOR ALL TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
