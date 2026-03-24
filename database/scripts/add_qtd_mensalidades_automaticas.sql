-- ============================================
-- MIGRATION: Adicionar qtd_mensalidades_automaticas
-- Descrição: Adiciona campo para configurar quantidade 
--            de mensalidades geradas automaticamente na matrícula
-- Data: 2026-03-24
-- ============================================

-- Adicionar coluna na tabela configuracoes_escola (JSONB config_financeira)
-- Nota: Como config_financeira é JSONB, não precisamos alterar a estrutura da tabela
-- O campo será adicionado automaticamente quando as configurações forem salvas

-- Atualizar configurações existentes para incluir o valor padrão (12)
UPDATE configuracoes_escola
SET config_financeira = config_financeira || '{"qtd_mensalidades_automaticas": 12}'::jsonb
WHERE config_financeira IS NOT NULL
  AND (config_financeira->>'qtd_mensalidades_automaticas') IS NULL
  AND vigencia_fim IS NULL;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- SELECT 
--   tenant_id,
--   config_financeira->>'qtd_mensalidades_automaticas' as qtd_mensalidades
-- FROM configuracoes_escola
-- WHERE vigencia_fim IS NULL;
