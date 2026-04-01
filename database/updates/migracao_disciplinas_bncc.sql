-- =============================================================================
-- 📚 MIGRAÇÃO: NOVO CATÁLOGO DE DISCIPLINAS BNCC (FLUXOO EDU)
-- Descrição: Limpa catálogo legado, remove duplicatas e ativa segmentação por etapa.
-- Versão: 2.1 (Fix RLS + Fix Column Names + Fix Turmas Etapa)
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. PREPARAÇÃO DA ESTRUTURA
-- =============================================================================

-- Adicionar colunas necessárias às disciplinas
ALTER TABLE public.disciplinas ADD COLUMN IF NOT EXISTS etapa TEXT DEFAULT 'TODAS';
ALTER TABLE public.disciplinas ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Linguagens';
ALTER TABLE public.disciplinas ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 999;
ALTER TABLE public.disciplinas ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;
ALTER TABLE public.disciplinas ADD COLUMN IF NOT EXISTS ativa BOOLEAN DEFAULT TRUE;
ALTER TABLE public.disciplinas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Adicionar etapa às turmas para segmentação BNCC
ALTER TABLE public.turmas
ADD COLUMN IF NOT EXISTS etapa TEXT DEFAULT 'EF1'
CHECK (etapa IN ('EI', 'EF1', 'EF2', 'EM', 'TODAS'));

-- =============================================================================
-- 2. TABELA DE OCULTAÇÃO LOCAL (MULTI-TENANT SAFE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_disciplinas_ocultas (
    tenant_id UUID NOT NULL,
    disciplina_id UUID NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tenant_id, disciplina_id)
);

-- RLS para a tabela de ocultação
ALTER TABLE public.tenant_disciplinas_ocultas ENABLE ROW LEVEL SECURITY;

-- Helper macro para tenant_id (tenta primeiro claim direto, depois user_metadata)
-- Usamos COALESCE para suportar diferentes configurações de JWT
DROP POLICY IF EXISTS "escola_gere_suas_ocultacoes" ON public.tenant_disciplinas_ocultas;
CREATE POLICY "escola_gere_suas_ocultacoes" ON public.tenant_disciplinas_ocultas
    FOR ALL TO authenticated
    USING (
        tenant_id = (COALESCE(auth.jwt() ->> 'tenant_id', auth.jwt() -> 'user_metadata' ->> 'tenant_id'))::uuid OR 
        (auth.jwt() ->> 'role') = 'super_admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    )
    WITH CHECK (
        tenant_id = (COALESCE(auth.jwt() ->> 'tenant_id', auth.jwt() -> 'user_metadata' ->> 'tenant_id'))::uuid OR 
        (auth.jwt() ->> 'role') = 'super_admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    );

-- =============================================================================
-- 3. LIMPEZA TOTAL E REMOÇÃO DE DUPLICATAS
-- =============================================================================

-- A) REMOVER TODAS AS DISCIPLINAS GLOBAIS (Catálogo antigo)
DELETE FROM public.disciplinas WHERE tenant_id IS NULL;

-- B) REMOVER DUPLICATAS DENTRO DOS TENANTS (Escolas)
DELETE FROM public.disciplinas d1
USING public.disciplinas d2
WHERE d1.id > d2.id 
  AND d1.nome = d2.nome 
  AND d1.tenant_id = d2.tenant_id
  AND d1.tenant_id IS NOT NULL;

-- =============================================================================
-- 4. ÍNDICES E CONSTRAINTS
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_disciplinas_etapa ON public.disciplinas(etapa);
CREATE INDEX IF NOT EXISTS idx_disciplinas_categoria ON public.disciplinas(categoria);

-- Garante que no futuro não haja duplicatas (1 nome por tenant/global)
DROP INDEX IF EXISTS idx_unique_disciplina_nome_tenant;
CREATE UNIQUE INDEX idx_unique_disciplina_nome_tenant 
ON public.disciplinas (
    nome, 
    COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

-- =============================================================================
-- 5. INSERIR NOVO CATÁLOGO DE DISCIPLINAS BNCC
-- =============================================================================

CREATE TEMP TABLE tmp_novas_disciplinas (
    nome TEXT, categoria TEXT, ordem INTEGER
);

INSERT INTO tmp_novas_disciplinas (nome, categoria, ordem) VALUES
-- EI
('O eu, o outro e o nós', 'Campos de Experiência', 10),
('Corpo, gestos e movimentos', 'Campos de Experiência', 20),
('Traços, sons, cores e formas', 'Campos de Experiência', 30),
('Escuta, fala, pensamento e imaginação', 'Campos de Experiência', 40),
('Espaços, tempos, quantidades, relações e transformações', 'Campos de Experiência', 50),
-- EF1 / EF2 / EM Base
('Língua Portuguesa', 'Linguagens', 10),
('Matemática', 'Matemática', 30),
('Ciências', 'Ciências da Natureza', 40),
('História', 'Ciências Humanas', 50),
('Geografia', 'Ciências Humanas', 60),
('Inglês', 'Linguagens', 20),
('Artes', 'Artes', 70),
('Educação Física', 'Educação Física', 80),
('Ensino Religioso', 'Ensino Religioso', 90),
('Informática / Tecnologia', 'Outros', 100),
('Espanhol', 'Linguagens', 30),
('Química', 'Ciências da Natureza', 56),
('Física', 'Ciências da Natureza', 55),
('Biologia', 'Ciências da Natureza', 57),
('Projeto de Vida', 'Itinerários', 110),
('Educação Financeira', 'Itinerários', 120),
('Filosofia', 'Ciências Humanas', 90),
('Sociologia', 'Ciências Humanas', 100),
-- Itinerários EM
('Robótica', 'Itinerários', 150),
('Pensamento Computacional', 'Itinerários', 160),
('Empreendedorismo', 'Itinerários', 170),
('Cultura Digital', 'Itinerários', 180),
('Mídias e Comunicação', 'Itinerários', 190),
('Ciências da Natureza Aplicadas', 'Itinerários', 200),
('Matemática Aplicada', 'Itinerários', 210),
('Saúde e Bem-Estar', 'Itinerários', 220),
('Direitos Humanos e Cidadania', 'Itinerários', 230),
('Redação / Produção de Texto', 'Linguagens', 25);

-- Inserção das disciplinas no catálogo global (tenant_id IS NULL)
-- Usamos 'TODAS' na etapa para que apareçam em qualquer filtro inicial
INSERT INTO public.disciplinas (id, tenant_id, nome, etapa, categoria, ordem, is_default, ativa)
SELECT gen_random_uuid(), NULL, nome, 'TODAS', categoria, ordem, TRUE, TRUE
FROM tmp_novas_disciplinas
ON CONFLICT (nome, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)) 
DO UPDATE SET 
    categoria = EXCLUDED.categoria,
    ordem = EXCLUDED.ordem,
    etapa = 'TODAS',
    is_default = TRUE,
    ativa = TRUE;

DROP TABLE tmp_novas_disciplinas;

-- =============================================================================
-- 6. POLÍTICAS RLS PARA DISCIPLINAS
-- =============================================================================

ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "disciplinas_select_policy" ON public.disciplinas;
CREATE POLICY "disciplinas_select_policy" ON public.disciplinas
    FOR SELECT TO authenticated
    USING (
        tenant_id IS NULL OR 
        tenant_id = (COALESCE(auth.jwt() ->> 'tenant_id', auth.jwt() -> 'user_metadata' ->> 'tenant_id'))::uuid OR
        (auth.jwt() ->> 'role') = 'super_admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    );

DROP POLICY IF EXISTS "disciplinas_insert_policy" ON public.disciplinas;
CREATE POLICY "disciplinas_insert_policy" ON public.disciplinas
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id = (COALESCE(auth.jwt() ->> 'tenant_id', auth.jwt() -> 'user_metadata' ->> 'tenant_id'))::uuid OR 
        (auth.jwt() ->> 'role') = 'super_admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    );

DROP POLICY IF EXISTS "disciplinas_update_policy" ON public.disciplinas;
CREATE POLICY "disciplinas_update_policy" ON public.disciplinas
    FOR UPDATE TO authenticated
    USING (
        tenant_id = (COALESCE(auth.jwt() ->> 'tenant_id', auth.jwt() -> 'user_metadata' ->> 'tenant_id'))::uuid OR 
        (auth.jwt() ->> 'role') = 'super_admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    );

DROP POLICY IF EXISTS "disciplinas_delete_policy" ON public.disciplinas;
CREATE POLICY "disciplinas_delete_policy" ON public.disciplinas
    FOR DELETE TO authenticated
    USING (
        tenant_id = (COALESCE(auth.jwt() ->> 'tenant_id', auth.jwt() -> 'user_metadata' ->> 'tenant_id'))::uuid OR 
        (auth.jwt() ->> 'role') = 'super_admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    );

COMMIT;
