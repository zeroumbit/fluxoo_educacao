-- ==============================================================================
-- 🚨 MIGRATION 161: RLS CORE RESTORATION (BLINDAGEM SEGURA)
-- Descrição: Reabilita o RLS usando os novos Helpers V2, garantindo zero-recursão.
-- ==============================================================================

-- 1. TABELAS DE LEITURA LIVRE (Evita falha em JOINs do Frontend)
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Leitura livre - Escolas" ON public.escolas;
    DROP POLICY IF EXISTS "Leitura livre - Filiais" ON public.filiais;
    DROP POLICY IF EXISTS "Leitura livre - Disciplinas" ON public.disciplinas;
END $$;

CREATE POLICY "Leitura livre - Escolas" ON public.escolas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura livre - Filiais" ON public.filiais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura livre - Disciplinas" ON public.disciplinas FOR SELECT TO authenticated USING (true);

-- 2. ALUNOS (Coração do sistema, foco em performance e segurança)
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Staff ve alunos" ON public.alunos;
    DROP POLICY IF EXISTS "Pais veem apenas seus filhos" ON public.alunos;
END $$;

CREATE POLICY "Staff ve alunos" ON public.alunos FOR ALL TO authenticated
USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
  OR public.is_staff_of_school(tenant_id)
  OR public.is_super_admin_v2()
);

-- Aproveita o cache do planner para chamadas SD
CREATE POLICY "Pais veem apenas seus filhos" ON public.alunos FOR SELECT TO authenticated
USING ( (SELECT public.is_my_child_v2(id)) );


-- 3. ALUNO RESPONSAVEL (Isolamento garantido sem consultar alunos em loop)
ALTER TABLE public.aluno_responsavel ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Staff acesso aluno_responsavel" ON public.aluno_responsavel;
    DROP POLICY IF EXISTS "Responsavel ve apenas seus vinculos" ON public.aluno_responsavel;
END $$;

CREATE POLICY "Staff acesso aluno_responsavel" ON public.aluno_responsavel FOR ALL TO authenticated
USING ( 
  public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2()
);

CREATE POLICY "Responsavel ve apenas seus vinculos" ON public.aluno_responsavel FOR SELECT TO authenticated
USING ( responsavel_id = public.get_my_responsavel_id() );


-- 4. RESPONSAVEIS
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Responsaveis Multi-Acesso" ON public.responsaveis;
END $$;

CREATE POLICY "Responsaveis Multi-Acesso" ON public.responsaveis FOR ALL TO authenticated
USING (
  user_id = auth.uid() OR
  id = auth.uid() OR
  public.is_super_admin_v2() OR
  EXISTS (
        SELECT 1 FROM public.aluno_responsavel ar
        JOIN public.alunos a ON a.id = ar.aluno_id
        WHERE ar.responsavel_id = public.responsaveis.id
        AND public.is_staff_of_school(a.tenant_id)
  )
);


-- 5. MATRICULAS E TURMAS
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Staff gerencia turmas" ON public.turmas;
    DROP POLICY IF EXISTS "Pais veem turmas" ON public.turmas;
    DROP POLICY IF EXISTS "Staff gerencia matriculas" ON public.matriculas;
    DROP POLICY IF EXISTS "Pais veem matriculas" ON public.matriculas;
END $$;

CREATE POLICY "Staff gerencia turmas" ON public.turmas FOR ALL TO authenticated
USING ( tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2() );

CREATE POLICY "Pais veem turmas" ON public.turmas FOR SELECT TO authenticated
USING ( id IN (SELECT turma_id FROM public.matriculas WHERE public.is_my_child_v2(aluno_id)) );

CREATE POLICY "Staff gerencia matriculas" ON public.matriculas FOR ALL TO authenticated
USING ( tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2() );

CREATE POLICY "Pais veem matriculas" ON public.matriculas FOR SELECT TO authenticated
USING ( public.is_my_child_v2(aluno_id) );


-- 6. FINANCEIRO (Cobranças e afins)
ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_financeira ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Staff gerencia financeiro" ON public.cobrancas;
    DROP POLICY IF EXISTS "Pais veem cobrancas" ON public.cobrancas;
    
    DROP POLICY IF EXISTS "Staff_assinaturas" ON public.assinaturas;
    DROP POLICY IF EXISTS "Staff_faturas" ON public.faturas;
    DROP POLICY IF EXISTS "Staff_config_financeira" ON public.config_financeira;
END $$;

CREATE POLICY "Staff gerencia financeiro" ON public.cobrancas FOR ALL TO authenticated
USING ( tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2() );

CREATE POLICY "Pais veem cobrancas" ON public.cobrancas FOR SELECT TO authenticated
USING ( public.is_my_child_v2(aluno_id) );

CREATE POLICY "Staff_assinaturas" ON public.assinaturas FOR ALL TO authenticated 
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2());

CREATE POLICY "Staff_faturas" ON public.faturas FOR ALL TO authenticated 
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2());

CREATE POLICY "Staff_config_financeira" ON public.config_financeira FOR ALL TO authenticated 
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2());


-- 7. ROTINA E COMUNICAÇÃO (Mural e Frequências)
ALTER TABLE public.mural_avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frequencias ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Staff_mural" ON public.mural_avisos;
    DROP POLICY IF EXISTS "Pais_mural" ON public.mural_avisos;
    DROP POLICY IF EXISTS "Staff_frequencias" ON public.frequencias;
    DROP POLICY IF EXISTS "Pais_frequencias" ON public.frequencias;
END $$;

CREATE POLICY "Staff_mural" ON public.mural_avisos FOR ALL TO authenticated
USING ( tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2() );

CREATE POLICY "Pais_mural" ON public.mural_avisos FOR SELECT TO authenticated
USING ( tenant_id IN (SELECT a.tenant_id FROM public.alunos a WHERE public.is_my_child_v2(a.id)) );

CREATE POLICY "Staff_frequencias" ON public.frequencias FOR ALL TO authenticated
USING ( tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2() );

CREATE POLICY "Pais_frequencias" ON public.frequencias FOR SELECT TO authenticated
USING ( public.is_my_child_v2(aluno_id) );


-- 8. USUÁRIOS SISTEMA
ALTER TABLE public.usuarios_sistema ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Permissao_usuarios_sistema" ON public.usuarios_sistema;
END $$;

CREATE POLICY "Permissao_usuarios_sistema" ON public.usuarios_sistema FOR ALL TO authenticated
USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
  OR id = auth.uid()
  OR public.is_super_admin_v2()
);
