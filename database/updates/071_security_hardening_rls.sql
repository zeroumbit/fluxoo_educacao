-- ==============================================================================
-- 🛡️ MIGRATION 071: HARDENING DE RLS (EMERGÊNCIA - CORREÇÃO V4)
-- Descrição: Reabilita RLS em tabelas críticas e corrige colunas faltantes.
-- ==============================================================================

-- 1. ADICIONAR COLUNAS FALTANTES (IDEMPOTENTE)
DO $$ 
BEGIN
    -- atividades_turmas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='atividades_turmas' AND column_name='tenant_id') THEN
        ALTER TABLE public.atividades_turmas ADD COLUMN tenant_id uuid;
        -- Popular tenant_id a partir da atividade pai
        UPDATE public.atividades_turmas at
        SET tenant_id = a.tenant_id
        FROM public.atividades a
        WHERE at.atividade_id = a.id;
        ALTER TABLE public.atividades_turmas ALTER COLUMN tenant_id SET NOT NULL;
    END IF;

    -- planos_aula_turmas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='planos_aula_turmas' AND column_name='tenant_id') THEN
        ALTER TABLE public.planos_aula_turmas ADD COLUMN tenant_id uuid;
        -- Popular tenant_id a partir do plano de aula pai
        UPDATE public.planos_aula_turmas pt
        SET tenant_id = p.tenant_id
        FROM public.planos_aula p
        WHERE pt.plano_aula_id = p.id;
        ALTER TABLE public.planos_aula_turmas ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
END $$;

-- 2. HABILITAR RLS
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_aula ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_aula_turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades_turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mural_avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autorizacoes_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autorizacoes_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autorizacoes_auditoria ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE ISOLAMENTO

-- ESCOLAS (Isolamento por ID próprio)
DROP POLICY IF EXISTS "tenant_isolation_escolas" ON public.escolas;
CREATE POLICY "tenant_isolation_escolas" ON public.escolas
    FOR ALL USING (id = (auth.jwt() ->> 'tenant_id')::uuid);

-- FILIAIS
DROP POLICY IF EXISTS "tenant_isolation_filiais" ON public.filiais;
CREATE POLICY "tenant_isolation_filiais" ON public.filiais
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- TURMAS
DROP POLICY IF EXISTS "tenant_isolation_turmas" ON public.turmas;
CREATE POLICY "tenant_isolation_turmas" ON public.turmas
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- PLANOS DE AULA
DROP POLICY IF EXISTS "tenant_isolation_planos_aula" ON public.planos_aula;
CREATE POLICY "tenant_isolation_planos_aula" ON public.planos_aula
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- PLANOS DE AULA TURMAS (Junção)
DROP POLICY IF EXISTS "tenant_isolation_planos_aula_turmas" ON public.planos_aula_turmas;
CREATE POLICY "tenant_isolation_planos_aula_turmas" ON public.planos_aula_turmas
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ATIVIDADES
DROP POLICY IF EXISTS "tenant_isolation_atividades" ON public.atividades;
CREATE POLICY "tenant_isolation_atividades" ON public.atividades
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ATIVIDADES TURMAS (Junção)
DROP POLICY IF EXISTS "tenant_isolation_atividades_turmas" ON public.atividades_turmas;
CREATE POLICY "tenant_isolation_atividades_turmas" ON public.atividades_turmas
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- MURAL
DROP POLICY IF EXISTS "tenant_isolation_mural" ON public.mural_avisos;
CREATE POLICY "tenant_isolation_mural" ON public.mural_avisos
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- AUTORIZAÇÕES MODELOS
DROP POLICY IF EXISTS "rbac_autorizacoes_modelos_view" ON public.autorizacoes_modelos;
CREATE POLICY "rbac_autorizacoes_modelos_view" ON public.autorizacoes_modelos
    FOR SELECT USING (
        tenant_id IS NULL 
        OR tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

-- AUTORIZAÇÕES RESPOSTAS
DROP POLICY IF EXISTS "tenant_isolation_autorizacoes_respostas" ON public.autorizacoes_respostas;
CREATE POLICY "tenant_isolation_autorizacoes_respostas" ON public.autorizacoes_respostas
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- AUTORIZAÇÕES AUDITORIA
DROP POLICY IF EXISTS "tenant_isolation_autorizacoes_auditoria" ON public.autorizacoes_auditoria;
CREATE POLICY "tenant_isolation_autorizacoes_auditoria" ON public.autorizacoes_auditoria
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
