-- Diagnóstico: Verificar existência das views do radar de evasão
-- Execute no SQL Editor do Supabase

-- 1. Verificar se as views existem
SELECT 
    'vw_aluno_faltas_consecutivas' AS view_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vw_aluno_faltas_consecutivas') THEN 'EXISTE' ELSE 'NÃO EXISTE' END AS status
UNION ALL
SELECT 
    'vw_aluno_financeiro_atrasado',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vw_aluno_financeiro_atrasado') THEN 'EXISTE' ELSE 'NÃO EXISTE' END
UNION ALL
SELECT 
    'vw_aluno_financeiro_recorrente',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vw_aluno_financeiro_recorrente') THEN 'EXISTE' ELSE 'NÃO EXISTE' END
UNION ALL
SELECT 
    'vw_radar_evasao',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vw_radar_evasao') THEN 'EXISTE' ELSE 'NÃO EXISTE' END;

-- 2. Testar cada view individualmente
SELECT * FROM vw_aluno_faltas_consecutivas LIMIT 1;
SELECT * FROM vw_aluno_financeiro_atrasado LIMIT 1;
SELECT * FROM vw_aluno_financeiro_recorrente LIMIT 1;
SELECT * FROM vw_radar_evasao LIMIT 1;

-- 3. Verificar RLS na tabela alunos
SELECT 
    relname,
    relrowsecurity
FROM pg_class
WHERE relname = 'alunos';

-- 4. Verificar se há política ativa na view (pode causar erro 500)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('vw_radar_evasao', 'vw_aluno_faltas_consecutivas', 'vw_aluno_financeiro_atrasado', 'vw_aluno_financeiro_recorrente');

-- 5. Ver último erro no log do PostgreSQL (se disponível)
-- Este comando só funciona se você tiver acesso ao logs do servidor