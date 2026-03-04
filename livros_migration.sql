-- ==========================================================
-- 0. TABELAS BASE (DEPENDÊNCIAS)
-- As tabelas turmas e alunos já existem no sistema. 
-- A tabela unidades mencionada no prompt foi corrigida para filiais.
-- ==========================================================

-- ==========================================================
-- 1. MÓDULO DE DISCIPLINAS (DINÂMICO)
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.disciplinas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    nome TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT disciplinas_unique_por_tenant UNIQUE (tenant_id, nome)
);

-- ==========================================================
-- 2. TABELA DE LIVROS (VERSÃO ENTERPRISE)
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.livros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    titulo TEXT NOT NULL,
    autor TEXT NOT NULL,
    editora TEXT NOT NULL,
    disciplina_id UUID NOT NULL REFERENCES public.disciplinas(id) ON DELETE RESTRICT,
    
    ano_letivo INTEGER NOT NULL, -- Ex: 2026

    capa_url TEXT,
    descricao TEXT,
    isbn TEXT,
    estado TEXT CHECK (estado IN ('Novo', 'Usado', 'Indiferente')),
    link_referencia TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT livros_isbn_unico_por_tenant UNIQUE (tenant_id, isbn)
);

-- ==========================================================
-- 3. LIGAÇÕES (RELACIONAMENTOS n:n)
-- ==========================================================

-- Ligação Livros <-> Filiais (Substituindo unidades por filiais)
CREATE TABLE IF NOT EXISTS public.livros_filiais (
    livro_id UUID NOT NULL REFERENCES public.livros(id) ON DELETE CASCADE,
    filial_id UUID NOT NULL REFERENCES public.filiais(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    PRIMARY KEY (livro_id, filial_id)
);

-- Ligação Livros <-> Turmas
CREATE TABLE IF NOT EXISTS public.livros_turmas (
    livro_id UUID NOT NULL REFERENCES public.livros(id) ON DELETE CASCADE,
    turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    PRIMARY KEY (livro_id, turma_id)
);

-- ==========================================================
-- 4. ÍNDICES E SEGURANÇA (RLS)
-- ==========================================================

CREATE INDEX IF NOT EXISTS idx_livros_tenant ON public.livros(tenant_id);
CREATE INDEX IF NOT EXISTS idx_livros_disciplina ON public.livros(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_livros_ano_letivo ON public.livros(ano_letivo);
CREATE INDEX IF NOT EXISTS idx_livros_titulo_search ON public.livros USING GIN (to_tsvector('portuguese', titulo));
CREATE INDEX IF NOT EXISTS idx_livros_turmas_turma ON public.livros_turmas(turma_id);
CREATE INDEX IF NOT EXISTS idx_livros_filiais_filial ON public.livros_filiais(filial_id);

ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livros_filiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livros_turmas ENABLE ROW LEVEL SECURITY;

-- Exemplo de Policies básicas (pode ser ajustado conforme seu esquema de auth real)
CREATE POLICY "Leitura de disciplinas permitida" ON public.disciplinas FOR SELECT USING (true);
CREATE POLICY "Leitura de livros permitida" ON public.livros FOR SELECT USING (true);
CREATE POLICY "Leitura de livros_turmas permitida" ON public.livros_turmas FOR SELECT USING (true);

-- ==========================================================
-- 5. VIEW E AUTOMAÇÃO
-- ==========================================================

-- Nota: Como alunos não possui turma_id fixo e o sistema atual utiliza um array "alunos_ids" em turmas, a view foi ajustada para refletir sua estrutura real.
CREATE OR REPLACE VIEW public.vw_livros_disponiveis_aluno AS
SELECT DISTINCT ON (l.id, a.id)
    l.id AS livro_id,
    l.tenant_id,
    l.titulo,
    l.autor,
    l.editora,
    l.ano_letivo,
    d.nome AS disciplina,
    l.capa_url,
    l.descricao,
    l.isbn,
    l.estado,
    l.link_referencia,
    a.id AS aluno_id,
    t.id AS turma_id
FROM public.livros l
JOIN public.livros_turmas lt ON lt.livro_id = l.id
JOIN public.turmas t ON t.id = lt.turma_id
JOIN public.alunos a ON a.id = ANY(t.alunos_ids)
JOIN public.disciplinas d ON d.id = l.disciplina_id
ORDER BY l.id, a.id;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_livros_timestamp ON public.livros;

CREATE TRIGGER trg_update_livros_timestamp
BEFORE UPDATE ON public.livros
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
