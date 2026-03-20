-- TABELA DE MATERIAIS ESCOLARES
CREATE TABLE IF NOT EXISTS public.materiais_escolares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- IDENTIFICAÇÃO
    nome TEXT NOT NULL,
    descricao TEXT,
    codigo_sku TEXT,
    categoria TEXT NOT NULL,
    subcategoria TEXT,

    -- QUANTIDADE E ESPECIFICAÇÃO
    quantidade_sugerida INTEGER NOT NULL,
    unidade_medida TEXT NOT NULL,
    especificacoes TEXT,
    tamanho TEXT,
    cor TEXT,
    tipo TEXT,
    marca_sugerida TEXT,

    -- CLASSIFICAÇÃO
    disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE SET NULL, -- Matéria específica
    periodo_uso TEXT NOT NULL CHECK (periodo_uso IN ('Início do ano', 'Durante o ano', 'Específico')),

    -- STATUS E CONTROLE
    status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Indiferente', 'Inativo', 'Descontinuado', 'Em breve')),
    obrigatoriedade TEXT NOT NULL DEFAULT 'Obrigatório' CHECK (obrigatoriedade IN ('Obrigatório', 'Recomendado', 'Opcional')),
    data_inclusao TIMESTAMPTZ DEFAULT NOW(),
    data_remocao TIMESTAMPTZ,

    -- INFORMAÇÕES PARA COMPRA
    onde_encontrar TEXT,
    observacoes TEXT,
    link_referencia TEXT,
    preco_sugerido DECIMAL(10,2),

    -- MATERIAL FORNECIDO PELA ESCOLA (Opcional)
    estoque_atual INTEGER,
    estoque_minimo INTEGER,
    fornecedor TEXT,
    preco_unitario DECIMAL(10,2),
    codigo_barras TEXT,
    codigo_interno TEXT,
    data_ultima_compra TIMESTAMPTZ,
    quantidade_por_aluno INTEGER,

    -- CAMPOS PARA LISTA DE MATERIAL
    incluir_na_lista_oficial BOOLEAN DEFAULT TRUE,
    posicao_lista INTEGER,
    observacao_especifica_lista TEXT,
    imagem_url TEXT,
    is_uso_coletivo BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RELACIONAMENTO n:n COM TURMAS
CREATE TABLE IF NOT EXISTS public.materiais_turmas (
    material_id UUID NOT NULL REFERENCES public.materiais_escolares(id) ON DELETE CASCADE,
    turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    PRIMARY KEY (material_id, turma_id)
);

-- RLS
ALTER TABLE public.materiais_escolares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais_turmas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura de materiais permitida" ON public.materiais_escolares FOR SELECT USING (true);
CREATE POLICY "Leitura de materiais_turmas permitida" ON public.materiais_turmas FOR SELECT USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_materiais_tenant ON public.materiais_escolares(tenant_id);
CREATE INDEX IF NOT EXISTS idx_materiais_categoria ON public.materiais_escolares(categoria);
CREATE INDEX IF NOT EXISTS idx_materiais_turmas_turma ON public.materiais_turmas(turma_id);

-- View unificada para o aluno (Livros + Materiais)
DROP VIEW IF EXISTS public.vw_itens_escolares_aluno;
CREATE OR REPLACE VIEW public.vw_itens_escolares_aluno AS
SELECT 
    'livro' as tipo,
    l.id as id,
    l.tenant_id,
    l.titulo as titulo,
    l.autor as autor,
    l.editora as editora,
    d.nome as disciplina,
    l.capa_url as capa_url,
    l.descricao,
    l.isbn as isbn,
    l.estado as status_estado,
    l.link_referencia,
    l.ano_letivo,
    a.id as aluno_id,
    t.id as turma_id,
    l.created_at
FROM public.livros l
JOIN public.livros_turmas lt ON lt.livro_id = l.id
JOIN public.turmas t ON t.id = lt.turma_id
JOIN public.alunos a ON (a.id = ANY(t.alunos_ids))
JOIN public.disciplinas d ON d.id = l.disciplina_id

UNION ALL

SELECT 
    'material' as tipo,
    m.id as id,
    m.tenant_id,
    m.nome as titulo,
    m.marca_sugerida as autor,
    m.categoria as editora,
    d.nome as disciplina,
    m.imagem_url as capa_url,
    m.descricao,
    m.codigo_sku as isbn,
    m.status as status_estado,
    m.link_referencia,
    EXTRACT(year FROM CURRENT_DATE)::integer as ano_letivo,
    a.id as aluno_id,
    t.id as turma_id,
    m.created_at
FROM public.materiais_escolares m
JOIN public.materiais_turmas mt ON mt.material_id = m.id
JOIN public.turmas t ON t.id = mt.turma_id
JOIN public.alunos a ON (a.id = ANY(t.alunos_ids))
LEFT JOIN public.disciplinas d ON d.id = m.disciplina_id;
