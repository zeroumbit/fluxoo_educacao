-- ================================================================
-- DIAGNÓSTICO DE VÍNCULOS ALUNO-RESPONSÁVEL
-- Execute cada bloco separadamente e me envie os resultados
-- ================================================================

-- [QUERY 1] Quantos alunos existem e quantos TÊM vínculo ativo?
SELECT 
    COUNT(DISTINCT a.id)                                        AS total_alunos,
    COUNT(DISTINCT ar.aluno_id) FILTER (WHERE ar.status = 'ativo')  AS alunos_com_vinculo_ativo,
    COUNT(DISTINCT ar.aluno_id) FILTER (WHERE ar.status != 'ativo') AS alunos_com_vinculo_inativo,
    COUNT(DISTINCT a.id) FILTER (
        WHERE NOT EXISTS (SELECT 1 FROM public.aluno_responsavel ar2 WHERE ar2.aluno_id = a.id)
    )                                                           AS alunos_sem_vinculo_algum
FROM public.alunos a
LEFT JOIN public.aluno_responsavel ar ON ar.aluno_id = a.id;

-- ================================================================

-- [QUERY 2] Qual o STATUS dos vínculos existentes?
-- (Verifica se foram desativados em vez de deletados)
SELECT status, COUNT(*) AS quantidade
FROM public.aluno_responsavel
GROUP BY status
ORDER BY quantidade DESC;

-- ================================================================

-- [QUERY 3] Os responsáveis existem, mas o vínculo está quebrado por tenant?
-- (Vínculo aponta para responsável de tenant diferente do aluno)
SELECT 
    COUNT(*) AS vinculos_com_tenant_errado
FROM public.aluno_responsavel ar
JOIN public.alunos a      ON a.id = ar.aluno_id
JOIN public.responsaveis r ON r.id = ar.responsavel_id
WHERE ar.tenant_id IS DISTINCT FROM a.tenant_id
   OR r.tenant_id  IS DISTINCT FROM a.tenant_id;

-- ================================================================

-- [QUERY 4] Alunos cadastrados com responsável no ATO do cadastro
-- mas que hoje não têm vínculo ativo
SELECT 
    a.id         AS aluno_id,
    a.nome_completo,
    a.tenant_id,
    e.razao_social AS escola,
    ar.status    AS status_vinculo,
    r.nome       AS responsavel_nome,
    r.status     AS responsavel_status
FROM public.alunos a
LEFT JOIN public.escolas e ON e.id = a.tenant_id
LEFT JOIN public.aluno_responsavel ar ON ar.aluno_id = a.id
LEFT JOIN public.responsaveis r ON r.id = ar.responsavel_id
ORDER BY a.tenant_id, a.nome_completo
LIMIT 100;
