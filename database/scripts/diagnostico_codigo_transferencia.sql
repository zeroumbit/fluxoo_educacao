-- =====================================================
-- DIAGNÓSTICO: Verificar status do codigo_transferencia
-- DATA: 2026-04-12
-- DESCRIÇÃO: Verifica se alunos têm codigo_transferencia
--            e se o trigger está funcionando.
-- =====================================================

-- 1. Verificar se a coluna existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'alunos' AND column_name = 'codigo_transferencia';

-- 2. Verificar constraint UNIQUE
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'alunos'::regclass AND conname LIKE '%codigo_transferencia%';

-- 3. Verificar trigger
SELECT tgname, tgtype, proname
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'alunos'::regclass AND tgname LIKE '%codigo_transferencia%';

-- 4. Verificar função do trigger
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'gerar_codigo_transferencia';

-- 5. Contar alunos com e sem codigo_transferencia
SELECT 
  COUNT(*) AS total_alunos,
  COUNT(codigo_transferencia) AS com_codigo,
  COUNT(*) - COUNT(codigo_transferencia) AS sem_codigo
FROM alunos
WHERE deleted_at IS NULL;

-- 6. Listar últimos 10 alunos criados com seus códigos
SELECT 
  id,
  nome_completo,
  codigo_transferencia,
  created_at
FROM alunos
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 7. Ver se a RPC buscar_aluno_transferencia existe
SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_name = 'buscar_aluno_transferencia';

-- 8. Testar a RPC manualmente (substitua pelo código real)
-- SELECT * FROM buscar_aluno_transferencia('XXXXX');
