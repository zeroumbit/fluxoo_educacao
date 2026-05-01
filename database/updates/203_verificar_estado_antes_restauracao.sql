-- ==============================================================================
-- 🔁 RESTAURAÇÃO DE VÍNCULOS LEGÍTIMOS
-- CPF 91776040325 é o responsável VERDADEIRO de Clara Maria e João Pedro Alves
-- ==============================================================================

-- Passo 1: Confirmar que o responsável existe e ver seu ID
SELECT id, nome, cpf, email, tenant_id
FROM public.responsaveis
WHERE cpf IN ('91776040325', '917.760.403-25');

-- Passo 2: Confirmar que os alunos ainda existem com suas matrículas intactas
SELECT
    a.id,
    a.nome_completo,
    a.cpf AS aluno_cpf,
    a.tenant_id,
    a.status,
    (
        SELECT COUNT(*) 
        FROM public.aluno_responsavel ar 
        WHERE ar.aluno_id = a.id
    ) AS qtd_responsaveis_vinculados
FROM public.alunos a
WHERE a.id IN (
    'cdee32d3-d020-407b-934e-35eef20fbbc9', -- Clara Maria
    'a600972a-8f92-469a-aa8d-5141a5037e90'  -- João Pedro Alves
);
