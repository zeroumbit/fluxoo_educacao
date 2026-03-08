-- ==========================================================
-- 🚨 RADAR DE EVASÃO FAMILIAR (Zero Cost AI)
-- Identifica alunos ativos que tiveram irmãos retirados da escola.
-- Utilizando a tabela Aluno_Responsavel para capturar vínculos N:N corretamente.
-- ==========================================================

CREATE OR REPLACE VIEW public.vw_alerta_evasao_familiar AS
WITH irmaos_inativos AS (
    -- 1. Identificamos os vínculos dos alunos que saíram recentemente
    SELECT 
        ar.responsavel_id,
        r.cpf AS responsavel_financeiro_cpf, 
        a.nome_completo AS irmao_que_saiu, 
        a.status AS motivo_saida, 
        a.updated_at AS data_saida,
        a.tenant_id
    FROM public.alunos a
    JOIN public.aluno_responsavel ar ON a.id = ar.aluno_id AND ar.is_financeiro = true
    JOIN public.responsaveis r ON ar.responsavel_id = r.id
    WHERE a.status IN ('transferido', 'cancelado', 'desistente')
      -- Consideramos apenas saídas nos últimos 6 meses para não gerar ruído antigo
      AND a.updated_at >= CURRENT_DATE - INTERVAL '6 months'
)
-- 2. Cruzamos com os alunos que ainda estão na escola sob o mesmo responsável
SELECT
    a.id AS aluno_ativo_id,
    a.tenant_id,
    a.nome_completo AS aluno_ativo_nome,
    -- (Nota da IA): Estamos usando subquery com a.id = ANY(t.alunos_ids) com base no seu schema
    -- real da tabela turmas que carrega esse UUID array, para não depender de uma coluna
    -- que não existe universalmente.
    COALESCE(
       (SELECT t.nome FROM public.turmas t WHERE a.id = ANY(t.alunos_ids) LIMIT 1),
       'Não vinculada'
    ) AS turma_atual,
    r.nome AS responsavel,
    r.telefone AS telefone_contato,
    i.irmao_que_saiu,
    i.motivo_saida,
    i.data_saida,
    -- Nível de urgência baseado no tempo da saída do irmão (quanto mais recente, maior o risco)
    CASE 
        WHEN i.data_saida >= CURRENT_DATE - INTERVAL '15 days' THEN 'CRITICO'
        WHEN i.data_saida >= CURRENT_DATE - INTERVAL '45 days' THEN 'ALTO'
        ELSE 'MONITORAMENTO'
    END as nivel_risco
FROM public.alunos a
JOIN public.aluno_responsavel ar ON a.id = ar.aluno_id AND ar.is_financeiro = true
JOIN public.responsaveis r ON ar.responsavel_id = r.id
JOIN irmaos_inativos i 
  ON r.cpf = i.responsavel_financeiro_cpf 
  AND a.tenant_id = i.tenant_id
WHERE a.status = 'ativo';

-- Índice para garantir performance nesta View
CREATE INDEX IF NOT EXISTS idx_aluno_responsavel_fin_opt ON public.aluno_responsavel(responsavel_id) WHERE is_financeiro = true;
