-- ==============================================================================
-- 🛡️ MIGRATION 126: OTIMIZAÇÃO DE PERFORMANCE RLS E FIX DE VISIBILIDADE
-- Descrição: Substitui subconsultas lentas (IN SELECT) por verificações diretas
-- do JWT claims e otimiza as funções Security Definer para evitar timeouts.
-- ==============================================================================

-- 1. Criação de cache de configuração de sessão (evita ler o JSON do JWT repetidamente)
-- Isso reduz o overhead de parsing do JSONB para cada linha processada.
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS uuid AS $$
  -- Tenta pegar do metadata do usuário (mais confiável no nosso sistema)
  SELECT NULLIF(COALESCE(
    auth.jwt()->'user_metadata'->>'tenant_id', 
    auth.jwt()->'app_metadata'->>'tenant_id', 
    auth.jwt()->>'tenant_id'
  ), '')::uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
  SELECT COALESCE((auth.jwt()->'user_metadata'->>'role' = 'super_admin'), false) 
         OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Refatoração do Helper de Escolas para Gestores (Security Definer para Performance)
-- Ao invés de usar IN (SELECT...), usamos um check simples.
CREATE OR REPLACE FUNCTION public.i_am_gestor_of(check_tenant_id uuid)
RETURNS boolean AS $$
BEGIN
    -- Se for o tenant do token, ok (O(1))
    IF check_tenant_id = public.get_auth_tenant_id() THEN
        RETURN true;
    END IF;
    
    -- Fallback: verifica se é dono da escola (Se o token falhar por algum motivo)
    RETURN EXISTS (
        SELECT 1 FROM public.escolas 
        WHERE id = check_tenant_id AND gestor_user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. RESET DE POLÍTICAS DAS TABELAS CHAVE (Alunos, Turmas, Matriculas)
DO $$ 
DECLARE 
    tb text;
    tables_to_fix text[] := ARRAY['alunos', 'turmas', 'matriculas', 'frequencias', 'boletins', 'cobrancas', 'planos_aula'];
BEGIN
    FOREACH tb IN ARRAY tables_to_fix LOOP
        -- Remove políticas universais antigas que usavam o loop lento
        EXECUTE format('DROP POLICY IF EXISTS "Universal_Select_%I" ON public.%I', tb, tb);
        EXECUTE format('DROP POLICY IF EXISTS "Universal_Modify_%I" ON public.%I', tb, tb);
        
        DECLARE
            parent_condition TEXT := 'false';
        BEGIN
            -- Define a condição de família específica para cada tabela para evitar erro de coluna inexistente
            IF tb = 'alunos' THEN
                parent_condition := 'id IN (SELECT public.get_my_children())';
            ELSIF tb = 'turmas' THEN
                parent_condition := 'id IN (SELECT turma_id FROM public.matriculas WHERE aluno_id IN (SELECT public.get_my_children()) AND status=''ativa'')';
            ELSIF tb IN ('matriculas', 'frequencias', 'boletins', 'cobrancas') THEN
                parent_condition := 'aluno_id IN (SELECT public.get_my_children())';
            ELSIF tb IN ('planos_aula') THEN
                parent_condition := '(status = ''publicado'' AND tenant_id IN (SELECT public.get_my_tenants()))';
            END IF;

            ---------------------------
            -- NOVA POLÍTICA SELECT (OTIMIZADA)
            ---------------------------
            EXECUTE format('
                CREATE POLICY "Universal_Select_%I" ON public.%I FOR SELECT TO authenticated USING (
                    public.is_super_admin() -- 1. Super Admin (Rápido)
                    OR (tenant_id = public.get_auth_tenant_id()) -- 2. Staff via Token (Rápido O(1))
                    OR (public.i_am_gestor_of(tenant_id)) -- 3. Gestor via DB (Fallback O(log n))
                    OR (%s) -- 4. Família (Condição dinâmica)
                );', tb, tb, parent_condition);
        END;

        ---------------------------
        -- NOVA POLÍTICA MODIFY (OTIMIZADA)
        ---------------------------
        EXECUTE format('
            CREATE POLICY "Universal_Modify_%I" ON public.%I FOR ALL TO authenticated USING (
                public.is_super_admin()
                OR (tenant_id = public.get_auth_tenant_id())
                OR (public.i_am_gestor_of(tenant_id))
            ) WITH CHECK (
                public.is_super_admin()
                OR (tenant_id = public.get_auth_tenant_id())
                OR (public.i_am_gestor_of(tenant_id))
            );', tb, tb);
    END LOOP;
END $$;

-- 4. Adição de Índices Críticos para o RLS não fazer Sequence Scan
-- Se não houver índice no tenant_id, o RLS fica 100x mais lento.
CREATE INDEX IF NOT EXISTS idx_alunos_tenant_id ON public.alunos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_turmas_tenant_id ON public.turmas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_tenant_id ON public.matriculas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_aluno_id ON public.matriculas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_planos_aula_tenant_id ON public.planos_aula(tenant_id);
CREATE INDEX IF NOT EXISTS idx_frequencias_aluno_id ON public.frequencias(aluno_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_aluno_id ON public.cobrancas(aluno_id);

-- 5. Fix especial para AlunoResponsavel (Performance)
DROP POLICY IF EXISTS "Universal_Select_AlunoResponsavel" ON public.aluno_responsavel;
CREATE POLICY "Universal_Select_AlunoResponsavel" ON public.aluno_responsavel FOR SELECT TO authenticated USING (
    responsavel_id = public.get_my_responsavel_id()
    OR public.is_super_admin()
    OR (SELECT public.i_am_gestor_of(a.tenant_id) FROM public.alunos a WHERE a.id = aluno_id)
);
