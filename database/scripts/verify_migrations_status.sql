-- ============================================================
-- Script de Verificação de Migrations - Fluxoo Edu
-- ============================================================
-- Execute este script no SQL Editor do Supabase para verificar
-- quais migrations já foram aplicadas no banco de dados
-- ============================================================

-- 1. Criar tabela de controle de migrations (se não existir)
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  applied_at TIMESTAMP DEFAULT NOW(),
  description TEXT
);

-- 2. Verificar existência de tabelas criadas por migrations
WITH expected_tables AS (
  SELECT 'cobrancas' as table_name UNION ALL
  SELECT 'enderecos' UNION ALL
  SELECT 'materiais' UNION ALL
  SELECT 'boletins' UNION ALL
  SELECT 'permissoes' UNION ALL
  SELECT 'marketplace_categorias' UNION ALL
  SELECT 'marketplace_produtos' UNION ALL
  SELECT 'diario_classe' UNION ALL
  SELECT 'materiais_escolares' UNION ALL
  SELECT 'disciplinas' UNION ALL
  SELECT 'livros' UNION ALL
  SELECT 'portal_logins'
)
SELECT 
  et.table_name,
  CASE WHEN t.table_name IS NOT NULL THEN '✅ Existe' ELSE '❌ Não existe' END as status
FROM expected_tables et
LEFT JOIN information_schema.tables t 
  ON et.table_name = t.table_name 
  AND t.table_schema = 'public'
ORDER BY et.table_name;

-- 3. Verificar colunas específicas de migrations
WITH expected_columns AS (
  SELECT 'escolas' as table_name, 'numero_escolas' as column_name UNION ALL
  SELECT 'escolas', 'nome_fantasia' UNION ALL
  SELECT 'escolas', 'logo_url' UNION ALL
  SELECT 'responsaveis', 'senha_hash' UNION ALL
  SELECT 'responsaveis', 'cpf' UNION ALL
  SELECT 'planos_aula', 'filial_id' UNION ALL
  SELECT 'cobrancas', 'pix_qr_code_base64' UNION ALL
  SELECT 'contas_pagar', 'categoria' UNION ALL
  SELECT 'alunos', 'desconto_valor' UNION ALL
  SELECT 'alunos', 'genero' UNION ALL
  SELECT 'matriculas', 'data_ingresso' UNION ALL
  SELECT 'turmas', 'grade_academica_id' UNION ALL
  SELECT 'planos', 'tipo_empresa'
)
SELECT 
  ec.table_name,
  ec.column_name,
  CASE WHEN c.column_name IS NOT NULL THEN '✅ Existe' ELSE '❌ Não existe' END as status
FROM expected_columns ec
LEFT JOIN information_schema.columns c 
  ON ec.table_name = c.table_name 
  AND ec.column_name = c.column_name
  AND c.table_schema = 'public'
ORDER BY ec.table_name, ec.column_name;

-- 4. Verificar views
WITH expected_views AS (
  SELECT 'vw_fechamento_bimestre' as view_name
)
SELECT 
  ev.view_name,
  CASE WHEN v.table_name IS NOT NULL THEN '✅ Existe' ELSE '❌ Não existe' END as status
FROM expected_views ev
LEFT JOIN information_schema.views v 
  ON ev.view_name = v.table_name 
  AND v.table_schema = 'public'
ORDER BY ev.view_name;

-- 5. Contar políticas RLS por tabela (para verificar se RLS foi aplicado)
SELECT 
  tablename,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 6. Verificar triggers (para verificar se automações foram aplicadas)
SELECT 
  trigger_schema,
  trigger_name,
  event_object_table as table_name,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- 7. Listar todas as funções do banco (para verificar se funções foram criadas)
SELECT 
  routine_schema,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ============================================================
-- Após verificar, registre as migrations aplicadas
-- ============================================================
-- Exemplo (descomente e ajuste conforme necessário):
-- INSERT INTO migrations (name, description) VALUES 
--   ('111_universal_rls_governance_v3_1.sql', 'Governança RLS universal v3.1'),
--   ('096_comprehensive_portal_rls.sql', 'RLS completo do portal'),
--   ('090_correcao_definitiva_gestor.sql', 'Correção definitiva acesso gestor');

-- ============================================================
-- Consultar migrations registradas
-- ============================================================
SELECT * FROM migrations ORDER BY applied_at DESC;
