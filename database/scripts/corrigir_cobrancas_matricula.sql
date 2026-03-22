-- ============================================
-- SCRIPT DE CORREÇÃO - COBRANÇAS DE MATRÍCULA
-- ============================================
-- Este script cria cobranças de matrícula para TODOS os alunos
-- que têm matrícula ativa mas não possuem cobrança de matrícula
--
-- COMO USAR:
-- 1. Acesse: https://supabase.com/dashboard/project/phuyqtdpedfigbfsevte/sql
-- 2. Cole este script e clique em RUN
-- ============================================

-- ============================================
-- 1. CRIAR COBRANÇAS DE MATRÍCULA FALTANTES
-- ============================================
INSERT INTO cobrancas (
  tenant_id,
  aluno_id,
  descricao,
  valor,
  data_vencimento,
  status,
  tipo_cobranca,
  turma_id,
  ano_letivo,
  created_at,
  updated_at
)
SELECT 
  m.tenant_id,
  m.aluno_id,
  'Matrícula - ' || COALESCE(m.serie_ano, '2026'),
  m.valor_matricula,
  m.data_matricula,
  'a_vencer',
  'mensalidade',
  m.turma_id,
  m.ano_letivo,
  NOW(),
  NOW()
FROM matriculas m
WHERE m.status = 'ativa'
  AND m.valor_matricula > 0
  -- Só cria se NÃO existir cobrança de matrícula para este aluno
  AND NOT EXISTS (
    SELECT 1 
    FROM cobrancas c 
    WHERE c.aluno_id = m.aluno_id 
      AND c.tenant_id = m.tenant_id
      AND (
        LOWER(c.descricao) LIKE '%matrícula%' 
        OR LOWER(c.descricao) LIKE '%matricula%'
      )
  );

-- ============================================
-- 2. VERIFICAR COBRANÇAS CRIADAS
-- ============================================
SELECT 
  COUNT(*) AS cobranças_de_matrícula_criadas
FROM cobrancas c
WHERE LOWER(c.descricao) LIKE '%matrícula%'
  AND c.created_at::DATE = CURRENT_DATE;

-- ============================================
-- 3. LISTAR TODAS AS COBRANÇAS DE MATRÍCULA
-- ============================================
SELECT 
  c.id,
  c.descricao,
  c.valor,
  c.data_vencimento,
  c.status,
  a.nome_completo AS aluno,
  m.serie_ano AS turma_serie,
  m.data_matricula,
  c.created_at AS cobranca_criada_em
FROM cobrancas c
INNER JOIN alunos a ON a.id = c.aluno_id
INNER JOIN matriculas m ON m.aluno_id = a.id AND m.status = 'ativa'
WHERE LOWER(c.descricao) LIKE '%matrícula%' 
   OR LOWER(c.descricao) LIKE '%matricula%'
ORDER BY c.created_at DESC;

-- ============================================
-- 4. VERIFICAR ALUNOS ESPECÍFICOS (EX: ALICIA)
-- ============================================
SELECT 
  a.id AS aluno_id,
  a.nome_completo,
  a.status,
  m.id AS matricula_id,
  m.status AS status_matricula,
  m.data_matricula,
  m.valor_matricula,
  m.serie_ano,
  c.id AS cobranca_id,
  c.descricao AS cobranca_descricao,
  c.valor AS cobranca_valor,
  c.status AS cobranca_status,
  c.data_vencimento
FROM alunos a
INNER JOIN matriculas m ON m.aluno_id = a.id AND m.status = 'ativa'
LEFT JOIN cobrancas c ON c.aluno_id = a.id 
  AND (LOWER(c.descricao) LIKE '%matrícula%' OR LOWER(c.descricao) LIKE '%matricula%')
WHERE LOWER(a.nome_completo) LIKE '%alicia%'
   OR LOWER(a.nome_completo) LIKE '%cunha%';

-- ============================================
-- INSTRUÇÕES FINAIS:
-- ============================================
-- 1. Rode este script no Supabase SQL Editor
-- 2. Verifique o resultado da query #4 para ALICIA CUNHA
-- 3. Acesse http://localhost:5173/portal/financeiro
-- 4. A cobrança de matrícula deve aparecer agora!
