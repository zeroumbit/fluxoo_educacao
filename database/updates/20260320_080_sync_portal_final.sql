-- ==========================================================
-- SINCRONIZAÇÃO TOTAL: LIVROS E MATERIAIS NO PORTAL
-- ==========================================================

-- 1. Garante que as tabelas de junção tenham tenant_id (opcional, mas recomendado)
ALTER TABLE IF EXISTS public.livros_turmas ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE IF EXISTS public.materiais_turmas ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- 2. Recria a VIEW unificada para o Portal do Aluno
-- Esta view garante que o aluno veja tanto LIVROS quanto MATERIAIS de sua turma.
DROP VIEW IF EXISTS public.vw_itens_escolares_aluno;
CREATE OR REPLACE VIEW public.vw_itens_escolares_aluno AS
SELECT 
    'livro' as tipo,
    l.id,
    l.tenant_id,
    l.titulo,
    l.autor,
    l.editora,
    d.nome as disciplina,
    l.capa_url,
    l.descricao,
    l.isbn,
    l.estado as status_estado,
    l.link_referencia,
    COALESCE(l.ano_letivo, EXTRACT(year FROM CURRENT_DATE)::integer) as ano_letivo,
    a.id as aluno_id,
    t.id as turma_id,
    l.created_at
FROM public.livros l
JOIN public.livros_turmas lt ON lt.livro_id = l.id
JOIN public.turmas t ON t.id = lt.turma_id
JOIN public.alunos a ON (
    a.id = ANY(t.alunos_ids) 
    OR 
    EXISTS (
        SELECT 1 FROM public.matriculas m 
        WHERE m.aluno_id = a.id
          AND m.status = 'ativa' 
          AND REGEXP_REPLACE(LOWER(m.serie_ano), '[^a-z0-9]', '', 'g') = REGEXP_REPLACE(LOWER(t.nome), '[^a-z0-9]', '', 'g')
    )
)
LEFT JOIN public.disciplinas d ON d.id = l.disciplina_id

UNION ALL

SELECT 
    'material' as tipo,
    m.id,
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
JOIN public.alunos a ON (
    a.id = ANY(t.alunos_ids) 
    OR 
    EXISTS (
        SELECT 1 FROM public.matriculas m 
        WHERE m.aluno_id = a.id
          AND m.status = 'ativa' 
          AND REGEXP_REPLACE(LOWER(m.serie_ano), '[^a-z0-9]', '', 'g') = REGEXP_REPLACE(LOWER(t.nome), '[^a-z0-9]', '', 'g')
    )
)
LEFT JOIN public.disciplinas d ON d.id = m.disciplina_id;

-- 3. Permissões
GRANT SELECT ON public.vw_itens_escolares_aluno TO anon, authenticated;
GRANT SELECT ON public.materiais_escolares TO anon, authenticated;
GRANT SELECT ON public.materiais_turmas TO anon, authenticated;

-- 4. RLS para materiais_escolares (caso não exista)
ALTER TABLE public.materiais_escolares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura de materiais permitida" ON public.materiais_escolares;
CREATE POLICY "Leitura de materiais permitida" ON public.materiais_escolares FOR SELECT USING (true);
