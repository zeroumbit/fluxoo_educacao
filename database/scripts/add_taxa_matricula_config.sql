-- ============================================
-- MIGRATION: Adicionar Taxa de Matrícula Config
-- Descrição: Ativa regra global de cobrança de matrícula (boolean e valor padrão)
-- Data: 2026-03-24
-- ============================================

-- 1. ADICIONAR CAMPOS NO JSONB config_financeira
-- Como config_financeira é JSONB, o Supabase aceita os novos campos dinamicamente.
-- Este script garante que todas as escolas existentes comecem com a regra ATIVADA por padrão (conforme histórico da plataforma).

UPDATE configuracoes_escola
SET config_financeira = config_financeira || '{"cobrar_matricula": true, "valor_matricula_padrao": 0}'::jsonb
WHERE config_financeira IS NOT NULL
  AND (config_financeira->>'cobrar_matricula') IS NULL
  AND vigencia_fim IS NULL;

-- 2. VERIFICAÇÃO (COMENTADA PARA USO MANUAL)
/*
SELECT 
  tenant_id,
  config_financeira->>'cobrar_matricula' as cobrar_matricula,
  config_financeira->>'valor_matricula_padrao' as valor_matricula
FROM configuracoes_escola
WHERE vigencia_fim IS NULL;
*/
