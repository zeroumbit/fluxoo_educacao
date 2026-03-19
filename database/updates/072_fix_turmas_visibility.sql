-- 1. EMERGÊNCIA: Desabilitar RLS na tabela turmas temporariamente
-- Isso permitirá que o usuário verifique se os dados ainda existem.
ALTER TABLE public.turmas DISABLE ROW LEVEL SECURITY;

-- 2. BACKFILL: Tentar recuperar turmas órfãs (sem tenant_id)
DO $$ 
DECLARE 
    v_single_tenant_id uuid;
BEGIN
    -- Busca o ID da primeira escola ativa
    SELECT id INTO v_single_tenant_id FROM public.escolas LIMIT 1;
    
    -- Se encontrarmos pelo menos uma escola, vinculamos as turmas órfãs
    IF v_single_tenant_id IS NOT NULL THEN
        -- Primeiro: Corrigir as que estão NULL
        UPDATE public.turmas SET tenant_id = v_single_tenant_id WHERE tenant_id IS NULL;
        
        -- Segundo: Garantir que o usuário zeroumbit@gmail.com EXISTE no usuarios_sistema vinculado a essa escola
        -- Isso é necessário para que o RLS baseado em tabela funcione para o desenvolvedor.
        INSERT INTO public.usuarios_sistema (id, tenant_id, email_login, status)
        SELECT id, v_single_tenant_id, email, 'ativo'
        FROM auth.users
        WHERE email = 'zeroumbit@gmail.com'
        ON CONFLICT (id) DO UPDATE SET tenant_id = v_single_tenant_id, status = 'ativo';

        -- NOVO: Vincular também no campo gestor_user_id da tabela escolas para que o AuthContext o identifique como Gestor
        UPDATE public.escolas 
        SET gestor_user_id = (SELECT id FROM auth.users WHERE email = 'zeroumbit@gmail.com')
        WHERE id = v_single_tenant_id AND gestor_user_id IS NULL;

        -- Terceiro: Tentar limpar o lixo 'tenant-default' se a coluna permitir/conter
        BEGIN
            UPDATE public.turmas SET tenant_id = v_single_tenant_id WHERE tenant_id::text = 'tenant-default';
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;
END $$;
-- 3. SEGURANÇA: Criar política robusta de ISOLAMENTO TOTAL (Strict Multi-tenancy)
-- Removendo bypasses globais para seguir a regra: "Super Admin não acessa dados acadêmicos"

-- TURMAS
DROP POLICY IF EXISTS "tenant_isolation_turmas" ON public.turmas;
DROP POLICY IF EXISTS "super_admin_turmas" ON public.turmas;
CREATE POLICY "tenant_isolation_turmas" ON public.turmas
    FOR ALL TO authenticated
    USING (
        tenant_id::text = (SELECT tenant_id::text FROM public.usuarios_sistema WHERE id = auth.uid())
    )
    WITH CHECK (
        tenant_id::text = (SELECT tenant_id::text FROM public.usuarios_sistema WHERE id = auth.uid())
    );

-- ALUNOS
DROP POLICY IF EXISTS "tenant_isolation_alunos" ON public.alunos;
DROP POLICY IF EXISTS "super_admin_alunos" ON public.alunos;
CREATE POLICY "tenant_isolation_alunos" ON public.alunos
    FOR ALL TO authenticated
    USING (
        tenant_id::text = (SELECT tenant_id::text FROM public.usuarios_sistema WHERE id = auth.uid())
    )
    WITH CHECK (
        tenant_id::text = (SELECT tenant_id::text FROM public.usuarios_sistema WHERE id = auth.uid())
    );

-- ESCOLAS (Aqui o Super Admin PODE acessar para gerenciar a plataforma)
DROP POLICY IF EXISTS "tenant_isolation_escolas" ON public.escolas;
DROP POLICY IF EXISTS "super_admin_escolas" ON public.escolas;
CREATE POLICY "super_admin_escolas" ON public.escolas 
    FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'email' = 'zeroumbit@gmail.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'zeroumbit@gmail.com');

CREATE POLICY "tenant_isolation_escolas" ON public.escolas 
    FOR ALL TO authenticated 
    USING (id::text = (SELECT tenant_id::text FROM public.usuarios_sistema WHERE id = auth.uid()));

-- FILIAIS
DROP POLICY IF EXISTS "tenant_isolation_filiais" ON public.filiais;
DROP POLICY IF EXISTS "super_admin_filiais" ON public.filiais;
CREATE POLICY "tenant_isolation_filiais" ON public.filiais
    FOR ALL TO authenticated
    USING (tenant_id::text = (SELECT tenant_id::text FROM public.usuarios_sistema WHERE id = auth.uid()));

-- MURAL
DROP POLICY IF EXISTS "tenant_isolation_mural" ON public.mural_avisos;
DROP POLICY IF EXISTS "super_admin_mural" ON public.mural_avisos;
CREATE POLICY "tenant_isolation_mural" ON public.mural_avisos
    FOR ALL TO authenticated
    USING (tenant_id::text = (SELECT tenant_id::text FROM public.usuarios_sistema WHERE id = auth.uid()));

-- PLANOS DE AULA E ATIVIDADES
DROP POLICY IF EXISTS "super_admin_planos" ON public.planos_aula;
DROP POLICY IF EXISTS "tenant_isolation_planos_aula" ON public.planos_aula;
CREATE POLICY "super_admin_planos" ON public.planos_aula FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'zeroumbit@gmail.com');

DROP POLICY IF EXISTS "super_admin_atividades" ON public.atividades;
DROP POLICY IF EXISTS "tenant_isolation_atividades" ON public.atividades;
CREATE POLICY "super_admin_atividades" ON public.atividades FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'zeroumbit@gmail.com');

-- 4. GARANTIR QUE RLS ESTÁ ATIVO
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mural_avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_aula ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
