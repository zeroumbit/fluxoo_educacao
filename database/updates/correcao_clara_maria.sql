-- ==============================================================================
-- 🛠️ CORREÇÃO DE VÍNCULOS INCORRETOS (CPF 91776040325)
-- ==============================================================================

-- Este script remove a ligação entre os alunos Clara Maria/João Pedro 
-- e o CPF 91776040325, permitindo que a escola cadastre os pais corretos.

DELETE FROM public.aluno_responsavel 
WHERE responsavel_id IN (
    SELECT id FROM public.responsaveis WHERE cpf = '91776040325'
)
AND aluno_id IN (
    'cdee32d3-d020-407b-934e-35eef20fbbc9', -- Clara Maria
    'a600972a-8f92-469a-aa8d-5141a5037e90'  -- João Pedro Alves
);

-- Após rodar este script:
-- 1. Os alunos continuam existindo no sistema.
-- 2. As matrículas e financeiro não são afetados.
-- 3. A escola deve entrar no cadastro de cada aluno e vincular o responsável correto.
