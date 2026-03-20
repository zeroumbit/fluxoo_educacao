-- ==========================================================
-- 🛠️ SINCRONIZAÇÃO PRO: LIVROS E MATERIAIS NO PORTAL
-- Garante que o aluno veja itens baseados na sua Turma Real,
-- Matrícula ou Série/Ano (Fuzzy Match).
-- ==========================================================

-- 1. Redefinição da View com Inteligência de Vínculo
DROP VIEW IF EXISTS public.vw_itens_escolares_aluno;
CREATE OR REPLACE VIEW public.vw_itens_escolares_aluno AS
WITH aluno_turmas AS (
    -- CTE para encontrar todas as turmas possíveis de um aluno
    SELECT DISTINCT
        a.id as aluno_id,
        a.tenant_id,
        t.id as turma_id
    FROM public.alunos a
    JOIN public.turmas t ON (
        -- Vínculo 1: Array de IDs na turma (legado/rápido)
        a.id = ANY(t.alunos_ids)
        OR 
        -- Vínculo 2: Matrícula ativa com vínculo direto ou por nome de série
        EXISTS (
            SELECT 1 FROM public.matriculas m 
            WHERE m.aluno_id = a.id 
              AND m.status = 'ativa'
              AND (
                m.turma_id = t.id 
                OR 
                -- Fuzzy match: "6 ANO" matches "6º Ano" ou "6 Ano"
                REGEXP_REPLACE(LOWER(m.serie_ano), '[^a-z0-9]', '', 'g') = REGEXP_REPLACE(LOWER(t.nome), '[^a-z0-9]', '', 'g')
              )
        )
    )
)
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
    at.aluno_id,
    at.turma_id,
    l.created_at
FROM public.livros l
JOIN public.livros_turmas lt ON lt.livro_id = l.id
JOIN aluno_turmas at ON at.turma_id = lt.turma_id
LEFT JOIN public.disciplinas d ON d.id = l.disciplina_id

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
    at.aluno_id,
    at.turma_id,
    m.created_at
FROM public.materiais_escolares m
JOIN public.materiais_turmas mt ON mt.material_id = m.id
JOIN aluno_turmas at ON at.turma_id = mt.turma_id
LEFT JOIN public.disciplinas d ON d.id = m.disciplina_id;

-- 2. Permissões de Acesso para o Portal
GRANT SELECT ON public.vw_itens_escolares_aluno TO anon, authenticated;
GRANT SELECT ON public.materiais_escolares TO anon, authenticated;
GRANT SELECT ON public.materiais_turmas TO anon, authenticated;
GRANT SELECT ON public.livros TO anon, authenticated;
GRANT SELECT ON public.livros_turmas TO anon, authenticated;
GRANT SELECT ON public.turmas TO anon, authenticated;
GRANT SELECT ON public.disciplinas TO anon, authenticated;

-- 3. Garantia de RLS (Caso não existam, as tabelas de livros/materiais já devem ter as políticas aplicadas nos scripts anteriores)
-- O script 075 já aplicou as políticas para materiais.
-- O script livros_rls_fix já aplicou para livros.
