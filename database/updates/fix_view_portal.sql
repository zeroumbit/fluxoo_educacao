-- ==========================================================
-- CORREÇÃO: SINCRONIZAÇÃO ALUNO <-> TURMA <-> LIVRO
-- Resolve o problema de livros não aparecerem no Portal
-- ==========================================================

-- A view foi atualizada para ser muito mais inteligente.
-- Agora ela não depende SOMENTE do array `alunos_ids`.
-- Se a escola matricular o aluno indicando uma serie_ano (ex: "5 ANO") e a turma se chamar "5º ano",
-- A inteligência do banco de dados vai normalizar o texto e conectar o aluno ao livro automaticamente.

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
JOIN public.disciplinas d ON d.id = l.disciplina_id
ORDER BY l.id, a.id;

-- Garante na API do Supabase que os views poderão ser lidos pelo portal
GRANT SELECT ON public.vw_livros_disponiveis_aluno TO anon, authenticated;
