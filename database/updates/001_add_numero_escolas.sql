-- ============================================
-- ADICIONA CAMPO 'NUMERO' NA TABELA ESCOLAS
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- ============================================

ALTER TABLE escolas
ADD COLUMN IF NOT EXISTS numero VARCHAR(20) DEFAULT NULL;

COMMENT ON COLUMN escolas.numero IS 'Número do endereço da escola';
