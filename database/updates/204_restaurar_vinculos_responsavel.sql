-- ==============================================================================
-- 🔁 RESTAURAÇÃO COMPLETA — CPF 91776040325 (Clara Maria + João Pedro Alves)
-- Escola: tenant_id = 5a68b8cb-c580-4c55-b09e-3db228f21ef0
-- ==============================================================================

-- PASSO A: Recriar o responsável se ele foi deletado pela migration 202
-- (Isso acontece quando deletamos os vínculos ANTES de rodar a 202)

INSERT INTO public.responsaveis (
    cpf,
    nome,
    email,
    telefone,
    senha_hash,
    tenant_id,
    status,
    primeiro_acesso,
    termos_aceitos
)
VALUES (
    '91776040325',
    'Responsável CPF 91776040325',  -- ⚠️ AJUSTE O NOME REAL ABAIXO se souber
    NULL,                           -- email pode ser nulo
    NULL,                           -- telefone pode ser nulo
    '$2b$10$placeholder',           -- senha temporária — responsável precisará redefinir via portal
    '5a68b8cb-c580-4c55-b09e-3db228f21ef0', -- tenant_id da Escola Santa Martina
    'ativo',
    true,           -- primeiro_acesso = true para forçar troca de senha no login
    false
)
ON CONFLICT (cpf, tenant_id) DO NOTHING  -- idempotente: não recria se já existir
RETURNING id, nome, cpf, tenant_id;

-- PASSO B: Recriar os vínculos aluno <-> responsável
-- (Usando subquery para pegar o ID correto do responsável recém-criado/existente)

INSERT INTO public.aluno_responsavel (
    aluno_id,
    responsavel_id,
    tenant_id,
    grau_parentesco,
    is_financeiro,
    is_academico,
    status
)
SELECT
    a.id        AS aluno_id,
    r.id        AS responsavel_id,
    a.tenant_id,
    'pai'       AS grau_parentesco,
    true        AS is_financeiro,
    true        AS is_academico,
    'ativo'     AS status
FROM public.alunos a
CROSS JOIN (
    SELECT id FROM public.responsaveis 
    WHERE cpf = '91776040325'
    AND tenant_id = '5a68b8cb-c580-4c55-b09e-3db228f21ef0'
    LIMIT 1
) r
WHERE a.id IN (
    'cdee32d3-d020-407b-934e-35eef20fbbc9', -- Clara Maria
    'a600972a-8f92-469a-aa8d-5141a5037e90'  -- João Pedro Alves
)
ON CONFLICT DO NOTHING;

-- PASSO C: Verificar se tudo ficou correto
SELECT
    a.nome_completo      AS aluno_nome,
    r.nome               AS responsavel_nome,
    r.cpf                AS responsavel_cpf,
    r.email              AS responsavel_email,
    r.status             AS responsavel_status,
    r.primeiro_acesso,
    ar.grau_parentesco,
    ar.is_financeiro,
    ar.status            AS vinculo_status,
    e.razao_social       AS escola
FROM public.aluno_responsavel ar
JOIN public.alunos a      ON a.id = ar.aluno_id
JOIN public.responsaveis r ON r.id = ar.responsavel_id
LEFT JOIN public.escolas e ON e.id = a.tenant_id
WHERE a.id IN (
    'cdee32d3-d020-407b-934e-35eef20fbbc9',
    'a600972a-8f92-469a-aa8d-5141a5037e90'
);
