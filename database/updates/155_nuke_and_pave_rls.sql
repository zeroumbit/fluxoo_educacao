-- ==============================================================================
-- 💣 MIGRATION 155: NUKE & PAVE RLS (LIMPEZA TOTAL DE RESQUÍCIOS)
-- Descrição: Remove TODAS as políticas de RLS das tabelas core para eliminar
--            qualquer política órfã que esteja causando recursão.
-- ==============================================================================

DO $$ 
DECLARE 
    r RECORD;
    v_tables text[] := ARRAY[
        'alunos', 'responsaveis', 'filiais', 'escolas', 
        'usuarios_sistema', 'aluno_responsavel', 'disciplinas',
        'assinaturas', 'faturas', 'cobrancas', 'frequencias', 'mural_avisos'
    ];
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = ANY(v_tables)
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 2. RE-HABILITAR RLS (Garantir que esteja ON)
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aluno_responsavel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frequencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mural_avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;

-- 3. RECRIAR HELPERS (Já definidos na 154, mas reforçando)
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID AS $$
    SELECT NULLIF(
        COALESCE(
            auth.jwt()->'user_metadata'->>'tenant_id',
            auth.jwt()->'app_metadata'->>'tenant_id',
            auth.jwt()->>'tenant_id'
        ),
        ''
    )::uuid;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean, false)
        OR COALESCE((auth.jwt() ->> 'is_super_admin')::boolean, false);
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. POLÍTICAS LIMPAS (MÁXIMA PERFORMANCE, ZERO RECURSÃO)

-- --- ESCOLAS & USUARIOS_SISTEMA (Base infra) ---
CREATE POLICY "infra_select_escolas" ON public.escolas FOR SELECT TO authenticated 
USING (id = public.get_my_tenant_id() OR public.is_super_admin() OR gestor_user_id = auth.uid());

CREATE POLICY "infra_select_usuarios" ON public.usuarios_sistema FOR SELECT TO authenticated 
USING (tenant_id = public.get_my_tenant_id() OR public.is_super_admin() OR id = auth.uid());

-- --- FILIAIS & DISCIPLINAS ---
CREATE POLICY "infra_select_filiais" ON public.filiais FOR ALL TO authenticated 
USING (tenant_id = public.get_my_tenant_id() OR public.is_super_admin());

CREATE POLICY "infra_select_disciplinas" ON public.disciplinas FOR SELECT TO authenticated 
USING (tenant_id IS NULL OR tenant_id = public.get_my_tenant_id() OR public.is_super_admin());

-- --- ALUNOS (O ponto crítico) ---
CREATE POLICY "core_select_alunos_staff" ON public.alunos FOR SELECT TO authenticated 
USING (tenant_id = public.get_my_tenant_id() OR public.is_super_admin());

CREATE POLICY "core_select_alunos_portal" ON public.alunos FOR SELECT TO authenticated 
USING (auth.jwt() ->> 'role' = 'responsavel' AND public.is_my_child(id));

-- --- RESPONSAREIS ---
CREATE POLICY "core_select_responsaveis_self" ON public.responsaveis FOR ALL TO authenticated 
USING (user_id = auth.uid() OR id = auth.uid() OR public.is_super_admin());

-- --- ALUNO_RESPONSAVEL (Vínculos) ---
CREATE POLICY "core_select_ar_staff" ON public.aluno_responsavel FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = aluno_id AND a.tenant_id = public.get_my_tenant_id()) OR public.is_super_admin());

CREATE POLICY "core_select_ar_portal" ON public.aluno_responsavel FOR SELECT TO authenticated 
USING (responsavel_id = public.get_my_responsavel_id());

-- --- FINANCEIRO & ACADEMICO ---
CREATE POLICY "core_all_cobrancas_staff" ON public.cobrancas FOR ALL TO authenticated 
USING (tenant_id = public.get_my_tenant_id() OR public.is_super_admin());

CREATE POLICY "core_select_cobrancas_portal" ON public.cobrancas FOR SELECT TO authenticated 
USING (public.is_my_child(aluno_id));

CREATE POLICY "core_all_frequencias_staff" ON public.frequencias FOR ALL TO authenticated 
USING (tenant_id = public.get_my_tenant_id() OR public.is_super_admin());

CREATE POLICY "core_select_frequencias_portal" ON public.frequencias FOR SELECT TO authenticated 
USING (public.is_my_child(aluno_id));

-- --- COMUNICAÇÃO ---
CREATE POLICY "core_all_mural_staff" ON public.mural_avisos FOR ALL TO authenticated 
USING (tenant_id = public.get_my_tenant_id() OR public.is_super_admin());

CREATE POLICY "core_select_mural_portal" ON public.mural_avisos FOR SELECT TO authenticated 
USING (tenant_id = public.get_my_tenant_id());

-- --- ASSINATURAS & FATURAS ---
CREATE POLICY "infra_select_assinaturas" ON public.assinaturas FOR SELECT TO authenticated 
USING (tenant_id = public.get_my_tenant_id() OR public.is_super_admin());

CREATE POLICY "infra_select_faturas" ON public.faturas FOR SELECT TO authenticated 
USING (tenant_id = public.get_my_tenant_id() OR public.is_super_admin());

-- 5. REVISÃO DE HAS_PERMISSION (Opcional, mas recomendado desativar RLS temporariamente se o erro persistir)
-- has_permission já é SECURITY DEFINER. O problema era escolas chamando has_permission. 
-- Agora escolas NÃO chama has_permission. O ciclo está quebrado.
