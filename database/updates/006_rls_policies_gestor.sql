-- ==========================================================
-- SCRIPT DE POLÍTICAS DE SEGURANÇA (RLS) - VERSÃO CORRIGIDA
-- Resolve o problema de acesso à Dashboard para novos Gestores
-- ==========================================================

-- 1. Habilitar RLS em tabelas críticas (caso não esteja)
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mural_avisos ENABLE ROW LEVEL SECURITY;

-- 2. Limpeza de políticas antigas para evitar conflitos de "already exists"
-- (Opcional, mas ajuda a garantir que o script rode limpo)
DROP POLICY IF EXISTS "Gestores podem ver sua própria escola" ON public.escolas;
DROP POLICY IF EXISTS "Super Admin vê todas as escolas" ON public.escolas;
DROP POLICY IF EXISTS "Gestores acessam alunos da sua escola" ON public.alunos;
DROP POLICY IF EXISTS "Gestores acessam faturamento da sua escola" ON public.assinaturas;
DROP POLICY IF EXISTS "Gestores acessam faturas da sua escola" ON public.faturas;
DROP POLICY IF EXISTS "Gestores acessam cobrancas da sua escola" ON public.cobrancas;
DROP POLICY IF EXISTS "Gestores acessam avisos da sua escola" ON public.mural_avisos;

-- 3. POLÍTICAS PARA A TABELA 'ESCOLAS'
-- Gestor: Pode ver a escola que ele gerencia (via UID)
CREATE POLICY "Gestores podem ver sua própria escola"
ON public.escolas FOR SELECT
TO authenticated
USING (gestor_user_id = auth.uid());

-- Super Admin: Pode ver tudo (E-mail configurado)
CREATE POLICY "Super Admin vê todas as escolas"
ON public.escolas FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'zeroumbit@gmail.com');

-- 4. POLÍTICAS PARA TABELAS RELACIONADAS AO TENANT (FILTRO POR tenant_id)
-- Alunos
CREATE POLICY "Gestores acessam alunos da sua escola"
ON public.alunos FOR ALL
TO authenticated
USING (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()));

-- Assinaturas e Faturas
CREATE POLICY "Gestores acessam faturamento da sua escola"
ON public.assinaturas FOR SELECT
TO authenticated
USING (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()));

CREATE POLICY "Gestores acessam faturas da sua escola"
ON public.faturas FOR SELECT
TO authenticated
USING (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()));

-- Cobranças e Mural
CREATE POLICY "Gestores acessam cobrancas da sua escola"
ON public.cobrancas FOR ALL
TO authenticated
USING (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()));

CREATE POLICY "Gestores acessam avisos da sua escola"
ON public.mural_avisos FOR ALL
TO authenticated
USING (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()));

-- 5. POLÍTICA GLOBAL DO SUPER ADMIN (Loop corrigido)
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        BEGIN
            EXECUTE format('CREATE POLICY "Super Admin total access on %I" ON public.%I FOR ALL TO authenticated USING (auth.jwt() ->> ''email'' = ''zeroumbit@gmail.com'')', t, t);
        EXCEPTION WHEN OTHERS THEN
            -- Ignora se a política já existir ou se a tabela não suportar RLS
            NULL;
        END;
    END LOOP;
END $$;
