-- =====================================================
-- DIAGNÓSTICO - RLS FUNCIONARIOS
-- =====================================================
-- Execute este script para identificar o problema exato

-- 1. Verificar se RLS está habilitado
SELECT 
  tablename,
  rowsecurity AS "RLS Habilitado"
FROM pg_tables 
WHERE tablename IN ('funcionarios', 'escolas');

-- 2. Verificar políticas existentes
SELECT 
  tablename,
  policyname AS "Política",
  cmd AS "Operação",
  roles AS "Roles"
FROM pg_policies 
WHERE tablename IN ('funcionarios', 'escolas')
ORDER BY tablename, cmd;

-- 3. Verificar estrutura da tabela funcionarios
SELECT 
  column_name AS "Coluna",
  data_type AS "Tipo",
  is_nullable AS "Nulo?",
  column_default AS "Default"
FROM information_schema.columns
WHERE table_name = 'funcionarios'
ORDER BY ordinal_position;

-- 4. Verificar se há funcionários cadastrados
SELECT COUNT(*) AS "Total de Funcionários" FROM funcionarios;

-- 5. Verificar se há escolas com gestor_user_id
SELECT 
  id,
  razao_social,
  gestor_user_id,
  CASE 
    WHEN gestor_user_id IS NOT NULL THEN '✓ Tem gestor'
    ELSE '✗ Sem gestor'
  END AS "Status"
FROM escolas
LIMIT 10;

-- 6. Verificar usuário atual (se autenticado)
SELECT 
  auth.uid() AS "User ID Atual",
  auth.jwt() ->> 'email' AS "Email",
  auth.jwt() ->> 'role' AS "Role";

-- 7. Testar query que o app está fazendo
-- Substitua <TENANT_ID> pelo ID da escola do usuário
-- SELECT * FROM funcionarios WHERE tenant_id = '<TENANT_ID>' ORDER BY nome_completo;

-- 8. Verificar constraints
SELECT
  conname AS "Constraint",
  conrelid::regclass AS "Tabela",
  a.attname AS "Coluna"
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
WHERE conrelid = 'funcionarios'::regclass
AND contype = 'f';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- 
-- Se RLS = true e não houver políticas:
--   → Criar políticas (usar script 023)
--
-- Se RLS = false:
--   → Executar: ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
--
-- Se não houver gestor_user_id em escolas:
--   → Usuário não está vinculado a nenhuma escola
--   → Atualizar: UPDATE escolas SET gestor_user_id = '<USER_ID>' WHERE id = '<ESCOLA_ID>'
--
-- Se tenant_id estiver vazio em funcionarios:
--   → App não está enviando tenant_id corretamente
--   → Verificar AuthContext e service.ts
-- =====================================================
