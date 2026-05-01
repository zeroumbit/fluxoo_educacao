-- ==============================================================================
-- 🔎 INVESTIGAÇÃO PROFUNDA: RESPONSÁVEIS E ALUNOS (CPF 91776040325)
-- ==============================================================================

-- 1. Ver os dados do responsável dono do CPF
SELECT id, nome, cpf, email, telefone, created_at 
FROM public.responsaveis 
WHERE cpf = '91776040325';

-- 2. Ver todos os alunos vinculados a esse responsável e de quais escolas (tenants) eles são
SELECT 
    a.id AS aluno_id,
    a.nome_completo AS aluno_nome,
    a.cpf AS aluno_cpf,
    ar.grau_parentesco,
    e.razao_social AS escola_nome,
    a.created_at AS data_matricula
FROM public.aluno_responsavel ar
JOIN public.responsaveis r ON r.id = ar.responsavel_id
JOIN public.alunos a ON a.id = ar.aluno_id
LEFT JOIN public.escolas e ON e.id = a.tenant_id
WHERE r.cpf = '91776040325';

-- 3. Ver se existem CPFs duplicados ou inconsistentes na base de alunos
-- (Ex: Alunos com o mesmo CPF do Responsável por erro de digitação)
SELECT id, nome_completo, cpf, tenant_id 
FROM public.alunos 
WHERE cpf = '91776040325';

-- 4. Análise de Compartilhamento de Responsáveis (Quantos responsáveis têm alunos em mais de 1 escola)
SELECT 
    r.nome, 
    r.cpf, 
    COUNT(DISTINCT a.tenant_id) as qtd_escolas,
    COUNT(a.id) as qtd_alunos
FROM public.responsaveis r
JOIN public.aluno_responsavel ar ON r.id = ar.responsavel_id
JOIN public.alunos a ON a.id = ar.aluno_id
GROUP BY r.id, r.nome, r.cpf
HAVING COUNT(DISTINCT a.tenant_id) > 1
ORDER BY qtd_escolas DESC;
