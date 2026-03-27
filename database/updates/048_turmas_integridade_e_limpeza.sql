-- migration 048: Integridade e Limpeza de Turmas (Audit Technical Debt)
-- 1. Remoção de campos redundantes
-- 2. Reforço de CASCADE para frequencias e boletins (Legacy Tables)
-- 3. Backfill de turma_id nas matrículas baseadas no fallback de nome
-- 4. Limpeza de dados órfãos e restrições de integridade

-- 1. Remoção de coluna redundante (já existe tabela turma_professores)
ALTER TABLE public.turmas DROP COLUMN IF EXISTS professores_ids;

-- 2. Reforço de integridade (Cascateamento) para tabelas legadas que ainda possuem turma_id
-- Nota: Tabelas V2 (frequencia_diaria, avaliacoes_config) já possuem CASCADE via migration 120.

-- Frequências (Legadas)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'frequencias') THEN
        ALTER TABLE public.frequencias 
            DROP CONSTRAINT IF EXISTS frequencias_turma_id_fkey,
            ADD CONSTRAINT frequencias_turma_id_fkey 
            FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Boletins (Legados - Histórico)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'boletins') THEN
        ALTER TABLE public.boletins
            DROP CONSTRAINT IF EXISTS boletins_turma_id_fkey,
            ADD CONSTRAINT boletins_turma_id_fkey 
            FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Cobranças (SET NULL para manter histórico financeiro, mas desvincular da turma excluída)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cobrancas') THEN
        ALTER TABLE public.cobrancas
            DROP CONSTRAINT IF EXISTS cobrancas_turma_id_fkey,
            ADD CONSTRAINT cobrancas_turma_id_fkey 
            FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Backfill de turma_id nas matrículas
-- Tenta associar matrículas órfãs com turmas existentes pelo nome da série/ano de forma normalizada
WITH matches AS (
    SELECT m.id AS matricula_id, t.id AS matched_turma_id
    FROM public.matriculas m
    JOIN public.turmas t ON m.tenant_id = t.tenant_id
    WHERE m.turma_id IS NULL
      AND LOWER(TRIM(REPLACE(REPLACE(m.serie_ano, 'º', ''), '°', ''))) = 
          LOWER(TRIM(REPLACE(REPLACE(t.nome, 'º', ''), '°', '')))
)
UPDATE public.matriculas m
SET turma_id = matches.matched_turma_id
FROM matches
WHERE m.id = matches.matricula_id;

-- 4. Registro de auditoria
COMMENT ON TABLE public.turmas IS 'Tabelas de turmas normalizada - Auditada em Março/2026';
COMMENT ON COLUMN public.matriculas.turma_id IS 'ID da turma. Regularizado via backfill na migration 048 para eliminar fallback de frontend.';
