-- ==============================================================================
-- 🚨 REFORMA DO CADASTRO, MATRÍCULA E FINANCEIRO
-- ==============================================================================

-- 1. SINCRONIZAÇÃO DE TURMAS (alunos_ids[])
-- Função que mantém o array de alunos da turma sincronizado com as matrículas
CREATE OR REPLACE FUNCTION fn_sincronizar_alunos_ids()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Adiciona o aluno ao array da turma se status for ativa
        IF (NEW.status = 'ativa' AND NEW.turma_id IS NOT NULL) THEN
            UPDATE public.turmas 
            SET alunos_ids = array_append(COALESCE(alunos_ids, '{}'), NEW.aluno_id)
            WHERE id = NEW.turma_id 
              AND NOT (NEW.aluno_id = ANY(COALESCE(alunos_ids, '{}')));
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Remove o aluno do array da turma
        IF (OLD.turma_id IS NOT NULL) THEN
            UPDATE public.turmas 
            SET alunos_ids = array_remove(alunos_ids, OLD.aluno_id)
            WHERE id = OLD.turma_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Trata mudança de turma ou mudança de status
        IF (OLD.turma_id IS DISTINCT FROM NEW.turma_id OR OLD.status IS DISTINCT FROM NEW.status) THEN
            -- Remove da turma antiga
            IF (OLD.turma_id IS NOT NULL) THEN
                UPDATE public.turmas 
                SET alunos_ids = array_remove(alunos_ids, OLD.aluno_id)
                WHERE id = OLD.turma_id;
            END IF;
            
            -- Adiciona na turma nova (se estiver ativa)
            IF (NEW.status = 'ativa' AND NEW.turma_id IS NOT NULL) THEN
                UPDATE public.turmas 
                SET alunos_ids = array_append(COALESCE(alunos_ids, '{}'), NEW.aluno_id)
                WHERE id = NEW.turma_id 
                  AND NOT (NEW.aluno_id = ANY(COALESCE(alunos_ids, '{}')));
            END IF;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sincronizar_alunos_ids ON public.matriculas;
CREATE TRIGGER trg_sincronizar_alunos_ids
AFTER INSERT OR UPDATE OR DELETE ON public.matriculas
FOR EACH ROW EXECUTE FUNCTION fn_sincronizar_alunos_ids();

-- 2. CONSOLIDAÇÃO DO RADAR DE EVASÃO (VIEW ÚNICA)
-- Removemos definições antigas se existirem para evitar conflitos de cache do Supabase
DROP VIEW IF EXISTS vw_radar_evasao;
CREATE OR REPLACE VIEW vw_radar_evasao WITH (security_invoker = on) AS
SELECT
    a.id AS aluno_id,
    a.tenant_id,
    a.nome_completo,
    COALESCE(f.faltas_consecutivas, 0) AS faltas_consecutivas,
    COALESCE(c.cobrancas_atrasadas, 0) AS cobrancas_atrasadas,
    COALESCE(r.cobrancas_atrasadas_recorrentes, 0) AS cobrancas_recorrentes,
    CASE
        WHEN COALESCE(f.faltas_consecutivas, 0) > 7 
             AND COALESCE(r.cobrancas_atrasadas_recorrentes, 0) >= 3 THEN 'FALTAS + INADIMPLÊNCIA RECORRENTE'
        WHEN COALESCE(f.faltas_consecutivas, 0) > 7 THEN 'FALTAS CONSECUTIVAS'
        WHEN COALESCE(r.cobrancas_atrasadas_recorrentes, 0) >= 3 THEN 'INADIMPLÊNCIA RECORRENTE'
        WHEN COALESCE(c.cobrancas_atrasadas, 0) > 0 THEN 'FINANCEIRO EM ATRASO'
        ELSE 'OUTROS'
    END AS motivo_principal
FROM alunos a
LEFT JOIN vw_aluno_faltas_consecutivas f ON f.aluno_id = a.id
LEFT JOIN vw_aluno_financeiro_atrasado c ON c.aluno_id = a.id
LEFT JOIN vw_aluno_financeiro_recorrente r ON r.aluno_id = a.id
WHERE (
    COALESCE(f.faltas_consecutivas, 0) > 7 
    OR COALESCE(c.cobrancas_atrasadas, 0) > 0 
    OR COALESCE(r.cobrancas_atrasadas_recorrentes, 0) >= 3
);

-- 3. REFORÇO DE CASCATA (ON DELETE CASCADE)
-- Garante que dependências básicas sejam limpas pelo banco de dados para evitar erros de integridade manual
DO $$ 
BEGIN
    -- aluno_responsavel
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'aluno_responsavel_aluno_id_fkey') THEN
        ALTER TABLE public.aluno_responsavel DROP CONSTRAINT aluno_responsavel_aluno_id_fkey;
    END IF;
    ALTER TABLE public.aluno_responsavel ADD CONSTRAINT aluno_responsavel_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE;

    -- documentos_emitidos
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'documentos_emitidos_aluno_id_fkey') THEN
        ALTER TABLE public.documentos_emitidos DROP CONSTRAINT documentos_emitidos_aluno_id_fkey;
    END IF;
    ALTER TABLE public.documentos_emitidos ADD CONSTRAINT documentos_emitidos_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) ON DELETE CASCADE;
END $$;
