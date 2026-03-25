-- ==============================================================================
-- MIGRATION 120: DIÁRIO DE CLASSE E BOLETIM OFICIAL V2.1
-- Descrição: Substitui o modelo JSONB antigo por arquitetura relacional profunda,
-- auditável, aderente à LDB 9.394/96, Lei 15.001/2024 e LGPD.
-- Mantém compatibilidade com tabela legada `boletins` (histórico congelado).
-- ==============================================================================

-- ==============================================================================
-- 1. ENUMS ESSENCIAIS
-- ==============================================================================

DO $$ BEGIN
  CREATE TYPE tipo_avaliacao AS ENUM ('prova', 'trabalho', 'simulado', 'participacao', 'recuperacao', 'exame_final');
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'tipo_avaliacao já existe.'; END $$;

DO $$ BEGIN
  CREATE TYPE resultado_academico AS ENUM ('aprovado', 'reprovado', 'recuperacao', 'conselho', 'cursando');
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'resultado_academico já existe.'; END $$;

DO $$ BEGIN
  CREATE TYPE status_bimestre AS ENUM ('aberto', 'fechado', 'conselho');
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'status_bimestre já existe.'; END $$;

-- ==============================================================================
-- 2. FUNÇÃO AUXILIAR UNIVERSAL updated_at
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. CALENDÁRIO LETIVO (LDB Art. 24)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.calendario_letivo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    bimestre INTEGER NOT NULL CHECK (bimestre BETWEEN 1 AND 4),
    tipo_dia TEXT NOT NULL DEFAULT 'letivo' CHECK (tipo_dia IN ('letivo', 'feriado', 'recesso', 'evento')),
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, data)
);

CREATE INDEX IF NOT EXISTS idx_calendario_tenant_bimestre ON public.calendario_letivo(tenant_id, bimestre, tipo_dia);

-- ==============================================================================
-- 4. FREQUÊNCIA DIÁRIA (LDB Art. 24 — Mínimo 75%)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.frequencia_diaria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    disciplina_id UUID NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,

    data_aula DATE NOT NULL,
    presente BOOLEAN NOT NULL DEFAULT true,
    justificativa TEXT,

    registrado_por UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(aluno_id, disciplina_id, data_aula)
);

CREATE INDEX IF NOT EXISTS idx_frequencia_diaria_aluno_disc ON public.frequencia_diaria(aluno_id, disciplina_id, data_aula);
CREATE INDEX IF NOT EXISTS idx_frequencia_diaria_turma_data ON public.frequencia_diaria(turma_id, data_aula);
CREATE INDEX IF NOT EXISTS idx_frequencia_diaria_aluno_presente ON public.frequencia_diaria(aluno_id, disciplina_id, presente) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_frequencia_updated_at ON public.frequencia_diaria;
CREATE TRIGGER trg_frequencia_updated_at
    BEFORE UPDATE ON public.frequencia_diaria
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==============================================================================
-- 5. MOTOR DE AVALIAÇÕES
-- ==============================================================================

-- Cabeçalho (configuração da avaliação)
CREATE TABLE IF NOT EXISTS public.avaliacoes_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    disciplina_id UUID NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,

    bimestre INTEGER NOT NULL CHECK (bimestre BETWEEN 1 AND 4),
    tipo tipo_avaliacao NOT NULL DEFAULT 'prova',
    titulo TEXT NOT NULL,
    peso DECIMAL(5,2) NOT NULL DEFAULT 1.0 CHECK (peso > 0),
    data_aplicacao DATE,

    created_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_config_turma_disc ON public.avaliacoes_config(turma_id, disciplina_id, bimestre) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_avaliacoes_config_updated_at ON public.avaliacoes_config;
CREATE TRIGGER trg_avaliacoes_config_updated_at
    BEFORE UPDATE ON public.avaliacoes_config
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Notas dos Alunos
CREATE TABLE IF NOT EXISTS public.avaliacoes_notas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    avaliacao_id UUID NOT NULL REFERENCES public.avaliacoes_config(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,

    nota DECIMAL(5,2) CHECK (nota IS NULL OR (nota >= 0 AND nota <= 10)),
    ausente BOOLEAN NOT NULL DEFAULT false,

    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(avaliacao_id, aluno_id)
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_notas_aluno ON public.avaliacoes_notas(aluno_id, avaliacao_id) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_avaliacoes_notas_updated_at ON public.avaliacoes_notas;
CREATE TRIGGER trg_avaliacoes_notas_updated_at
    BEFORE UPDATE ON public.avaliacoes_notas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==============================================================================
-- 6. RECUPERAÇÕES (LDB Art. 24, V, "e")
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.recuperacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    disciplina_id UUID NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,
    bimestre INTEGER NOT NULL CHECK (bimestre BETWEEN 1 AND 4),
    nota_recuperacao DECIMAL(5,2) CHECK (nota_recuperacao IS NULL OR (nota_recuperacao >= 0 AND nota_recuperacao <= 10)),
    registrado_por UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(aluno_id, disciplina_id, bimestre)
);

DROP TRIGGER IF EXISTS trg_recuperacoes_updated_at ON public.recuperacoes;
CREATE TRIGGER trg_recuperacoes_updated_at
    BEFORE UPDATE ON public.recuperacoes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==============================================================================
-- 7. CONFIGURAÇÃO DE PESOS POR BIMESTRE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.config_pesos_bimestre (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    disciplina_id UUID NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,
    bimestre INTEGER NOT NULL CHECK (bimestre BETWEEN 1 AND 4),
    peso_bimestre DECIMAL(5,2) NOT NULL DEFAULT 1.0 CHECK (peso_bimestre > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, turma_id, disciplina_id, bimestre)
);

DROP TRIGGER IF EXISTS trg_config_pesos_updated_at ON public.config_pesos_bimestre;
CREATE TRIGGER trg_config_pesos_updated_at
    BEFORE UPDATE ON public.config_pesos_bimestre
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==============================================================================
-- 8. OBSERVAÇÕES PEDAGÓGICAS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.observacoes_pedagogicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    bimestre INTEGER NOT NULL CHECK (bimestre BETWEEN 1 AND 4),

    comportamento TEXT,
    participacao TEXT,
    parecer_descritivo TEXT,

    registrado_por UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(aluno_id, bimestre, turma_id)
);

DROP TRIGGER IF EXISTS trg_observacoes_updated_at ON public.observacoes_pedagogicas;
CREATE TRIGGER trg_observacoes_updated_at
    BEFORE UPDATE ON public.observacoes_pedagogicas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==============================================================================
-- 9. AUDITORIA DE NOTAS (Lei 15.001/2024)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.auditoria_notas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    avaliacao_nota_id UUID NOT NULL,
    aluno_id UUID NOT NULL,
    nota_anterior DECIMAL(5,2),
    nota_nova DECIMAL(5,2),
    motivo_alteracao TEXT,
    alterado_por UUID NOT NULL REFERENCES auth.users(id),
    data_alteracao TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_notas_aluno ON public.auditoria_notas(aluno_id, data_alteracao DESC);

-- Trigger de auditoria automática
CREATE OR REPLACE FUNCTION public.fn_auditoria_notas()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.nota IS DISTINCT FROM NEW.nota THEN
        INSERT INTO public.auditoria_notas (tenant_id, avaliacao_nota_id, aluno_id, nota_anterior, nota_nova, alterado_por)
        VALUES (NEW.tenant_id, NEW.id, NEW.aluno_id, OLD.nota, NEW.nota, COALESCE(NEW.updated_by, auth.uid()));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audita_notas ON public.avaliacoes_notas;
CREATE TRIGGER trg_audita_notas
    AFTER UPDATE ON public.avaliacoes_notas
    FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_notas();

-- ==============================================================================
-- 10. FECHAMENTO DE BIMESTRE (Congelamento)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.fechamento_bimestre (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    bimestre INTEGER NOT NULL CHECK (bimestre BETWEEN 1 AND 4),
    status status_bimestre NOT NULL DEFAULT 'aberto',
    fechado_em TIMESTAMPTZ,
    fechado_por UUID REFERENCES auth.users(id),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, turma_id, bimestre)
);

DROP TRIGGER IF EXISTS trg_fechamento_bimestre_updated_at ON public.fechamento_bimestre;
CREATE TRIGGER trg_fechamento_bimestre_updated_at
    BEFORE UPDATE ON public.fechamento_bimestre
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger que impede alterações após fechamento
CREATE OR REPLACE FUNCTION public.fn_verifica_fechamento_bimestre()
RETURNS TRIGGER AS $$
DECLARE
    v_turma_id UUID;
    v_bimestre INTEGER;
    v_tenant_id UUID;
BEGIN
    IF TG_TABLE_NAME = 'avaliacoes_notas' THEN
        SELECT c.turma_id, c.bimestre, c.tenant_id
        INTO v_turma_id, v_bimestre, v_tenant_id
        FROM public.avaliacoes_config c
        WHERE c.id = NEW.avaliacao_id;
    ELSIF TG_TABLE_NAME = 'frequencia_diaria' THEN
        v_turma_id := NEW.turma_id;
        v_tenant_id := NEW.tenant_id;
        v_bimestre := (
            SELECT bimestre FROM public.calendario_letivo
            WHERE data = NEW.data_aula AND tenant_id = NEW.tenant_id
            LIMIT 1
        );
    END IF;

    IF v_bimestre IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.fechamento_bimestre
        WHERE turma_id = v_turma_id
          AND bimestre = v_bimestre
          AND tenant_id = v_tenant_id
          AND status IN ('fechado', 'conselho')
    ) THEN
        RAISE EXCEPTION 'Bimestre % já fechado. Não é possível alterar notas ou frequência.', v_bimestre;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_verifica_fechamento_avaliacoes ON public.avaliacoes_notas;
CREATE TRIGGER trg_verifica_fechamento_avaliacoes
    BEFORE INSERT OR UPDATE ON public.avaliacoes_notas
    FOR EACH ROW EXECUTE FUNCTION public.fn_verifica_fechamento_bimestre();

DROP TRIGGER IF EXISTS trg_verifica_fechamento_frequencia ON public.frequencia_diaria;
CREATE TRIGGER trg_verifica_fechamento_frequencia
    BEFORE INSERT OR UPDATE ON public.frequencia_diaria
    FOR EACH ROW EXECUTE FUNCTION public.fn_verifica_fechamento_bimestre();

-- ==============================================================================
-- 11. VIEW CONSOLIDADA DO BOLETIM (Substitui a Materialized View para compatibilidade Supabase)
-- ==============================================================================

CREATE OR REPLACE VIEW public.vw_boletim_consolidado AS
SELECT
    n.aluno_id,
    c.disciplina_id,
    c.bimestre,
    c.turma_id,
    c.tenant_id,
    ROUND(
        SUM(n.nota * c.peso * COALESCE(pb.peso_bimestre, 1.0)) /
        NULLIF(SUM(CASE WHEN n.nota IS NOT NULL AND n.ausente = false THEN c.peso * COALESCE(pb.peso_bimestre, 1.0) ELSE 0 END), 0),
        2
    ) AS media_parcial,
    COUNT(f.id) FILTER (WHERE f.presente = false AND f.deleted_at IS NULL) AS total_faltas,
    COUNT(DISTINCT f.data_aula) FILTER (WHERE cl.tipo_dia = 'letivo') AS total_aulas_bimestre,
    NOW() AS calculado_em
FROM public.avaliacoes_notas n
JOIN public.avaliacoes_config c ON n.avaliacao_id = c.id AND c.deleted_at IS NULL
LEFT JOIN public.config_pesos_bimestre pb
    ON pb.turma_id = c.turma_id
    AND pb.disciplina_id = c.disciplina_id
    AND pb.bimestre = c.bimestre
LEFT JOIN public.calendario_letivo cl
    ON cl.bimestre = c.bimestre
    AND cl.tenant_id = c.tenant_id
    AND cl.tipo_dia = 'letivo'
LEFT JOIN public.frequencia_diaria f
    ON f.aluno_id = n.aluno_id
    AND f.disciplina_id = c.disciplina_id
    AND f.data_aula = cl.data
    AND f.deleted_at IS NULL
WHERE n.deleted_at IS NULL
  AND n.ausente = false
GROUP BY n.aluno_id, c.disciplina_id, c.bimestre, c.turma_id, c.tenant_id;

-- View completa com recuperação e resultado final
CREATE OR REPLACE VIEW public.vw_boletim_completo AS
SELECT
    b.aluno_id,
    b.disciplina_id,
    d.nome AS nome_disciplina,
    b.bimestre,
    b.turma_id,
    b.tenant_id,
    b.media_parcial,
    COALESCE(b.total_faltas, 0) AS total_faltas,
    COALESCE(b.total_aulas_bimestre, 0) AS total_aulas_bimestre,
    rec.nota_recuperacao,
    CASE
        WHEN rec.nota_recuperacao IS NOT NULL
        THEN ROUND((COALESCE(b.media_parcial, 0) + rec.nota_recuperacao) / 2.0, 2)
        ELSE b.media_parcial
    END AS media_final,
    CASE
        WHEN COALESCE(b.total_aulas_bimestre, 0) > 0
             AND COALESCE(b.total_faltas, 0) > (COALESCE(b.total_aulas_bimestre, 0) * 0.25)
        THEN 'reprovado_falta'
        WHEN rec.nota_recuperacao IS NOT NULL
             AND (COALESCE(b.media_parcial, 0) + rec.nota_recuperacao) / 2.0 >= COALESCE((
                 SELECT (config_academica->>'media_aprovacao')::numeric
                 FROM public.configuracoes_escola
                 WHERE tenant_id = b.tenant_id AND vigencia_fim IS NULL
                 LIMIT 1
             ), 6.0)
        THEN 'aprovado_recuperacao'
        WHEN rec.nota_recuperacao IS NULL
             AND COALESCE(b.media_parcial, 0) >= COALESCE((
                 SELECT (config_academica->>'media_aprovacao')::numeric
                 FROM public.configuracoes_escola
                 WHERE tenant_id = b.tenant_id AND vigencia_fim IS NULL
                 LIMIT 1
             ), 6.0)
        THEN 'aprovado'
        WHEN rec.nota_recuperacao IS NOT NULL THEN 'reprovado_nota'
        ELSE 'cursando'
    END AS resultado
FROM public.vw_boletim_consolidado b
LEFT JOIN public.disciplinas d ON d.id = b.disciplina_id
LEFT JOIN public.recuperacoes rec
    ON rec.aluno_id = b.aluno_id
    AND rec.disciplina_id = b.disciplina_id
    AND rec.bimestre = b.bimestre
    AND rec.deleted_at IS NULL;

-- ==============================================================================
-- 12. RLS — PADRÃO UNIVERSAL (4 NÍVEIS) — TODAS AS NOVAS TABELAS
-- Super Admin NUNCA tem acesso a dados de escolas (princípio de isolamento)
-- ==============================================================================

ALTER TABLE public.calendario_letivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frequencia_diaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recuperacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observacoes_pedagogicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fechamento_bimestre ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_pesos_bimestre ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_notas ENABLE ROW LEVEL SECURITY;

-- CALENDÁRIO LETIVO
DO $$ BEGIN
  DROP POLICY IF EXISTS "CalendarioLetivo_Select" ON public.calendario_letivo;
  CREATE POLICY "CalendarioLetivo_Select" ON public.calendario_letivo
    FOR SELECT TO authenticated USING (
      tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      OR EXISTS (
        SELECT 1 FROM public.aluno_responsavel ar
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        JOIN public.alunos a ON a.id = ar.aluno_id
        WHERE r.user_id = auth.uid() AND a.tenant_id = calendario_letivo.tenant_id
      )
    );
  DROP POLICY IF EXISTS "CalendarioLetivo_Write" ON public.calendario_letivo;
  CREATE POLICY "CalendarioLetivo_Write" ON public.calendario_letivo
    FOR ALL TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
END $$;

-- FREQUÊNCIA DIÁRIA
DO $$ BEGIN
  DROP POLICY IF EXISTS "FrequenciaDiaria_Staff_All" ON public.frequencia_diaria;
  CREATE POLICY "FrequenciaDiaria_Staff_All" ON public.frequencia_diaria
    FOR ALL TO authenticated USING (
      tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND deleted_at IS NULL
    ) WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

  DROP POLICY IF EXISTS "FrequenciaDiaria_Responsavel_Select" ON public.frequencia_diaria;
  CREATE POLICY "FrequenciaDiaria_Responsavel_Select" ON public.frequencia_diaria
    FOR SELECT TO authenticated USING (
      deleted_at IS NULL AND EXISTS (
        SELECT 1 FROM public.aluno_responsavel ar
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        WHERE ar.aluno_id = frequencia_diaria.aluno_id AND r.user_id = auth.uid()
      )
    );
END $$;

-- AVALIAÇÕES CONFIG
DO $$ BEGIN
  DROP POLICY IF EXISTS "AvaliacoesConfig_All" ON public.avaliacoes_config;
  CREATE POLICY "AvaliacoesConfig_All" ON public.avaliacoes_config
    FOR ALL TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

  DROP POLICY IF EXISTS "AvaliacoesConfig_Responsavel" ON public.avaliacoes_config;
  CREATE POLICY "AvaliacoesConfig_Responsavel" ON public.avaliacoes_config
    FOR SELECT TO authenticated USING (
      deleted_at IS NULL AND EXISTS (
        SELECT 1 FROM public.matriculas m
        JOIN public.aluno_responsavel ar ON ar.aluno_id = m.aluno_id
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        WHERE m.turma_id = avaliacoes_config.turma_id AND r.user_id = auth.uid()
      )
    );
END $$;

-- AVALIAÇÕES NOTAS
DO $$ BEGIN
  DROP POLICY IF EXISTS "AvaliacoesNotas_Staff_All" ON public.avaliacoes_notas;
  CREATE POLICY "AvaliacoesNotas_Staff_All" ON public.avaliacoes_notas
    FOR ALL TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

  DROP POLICY IF EXISTS "AvaliacoesNotas_Responsavel" ON public.avaliacoes_notas;
  CREATE POLICY "AvaliacoesNotas_Responsavel" ON public.avaliacoes_notas
    FOR SELECT TO authenticated USING (
      deleted_at IS NULL AND EXISTS (
        SELECT 1 FROM public.aluno_responsavel ar
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        WHERE ar.aluno_id = avaliacoes_notas.aluno_id AND r.user_id = auth.uid()
      )
    );
END $$;

-- RECUPERAÇÕES
DO $$ BEGIN
  DROP POLICY IF EXISTS "Recuperacoes_All" ON public.recuperacoes;
  CREATE POLICY "Recuperacoes_All" ON public.recuperacoes
    FOR ALL TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

  DROP POLICY IF EXISTS "Recuperacoes_Responsavel" ON public.recuperacoes;
  CREATE POLICY "Recuperacoes_Responsavel" ON public.recuperacoes
    FOR SELECT TO authenticated USING (
      deleted_at IS NULL AND EXISTS (
        SELECT 1 FROM public.aluno_responsavel ar
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        WHERE ar.aluno_id = recuperacoes.aluno_id AND r.user_id = auth.uid()
      )
    );
END $$;

-- OBSERVAÇÕES PEDAGÓGICAS
DO $$ BEGIN
  DROP POLICY IF EXISTS "ObsPedagogicas_Staff" ON public.observacoes_pedagogicas;
  CREATE POLICY "ObsPedagogicas_Staff" ON public.observacoes_pedagogicas
    FOR ALL TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

  DROP POLICY IF EXISTS "ObsPedagogicas_Responsavel" ON public.observacoes_pedagogicas;
  CREATE POLICY "ObsPedagogicas_Responsavel" ON public.observacoes_pedagogicas
    FOR SELECT TO authenticated USING (
      deleted_at IS NULL AND EXISTS (
        SELECT 1 FROM public.aluno_responsavel ar
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        WHERE ar.aluno_id = observacoes_pedagogicas.aluno_id AND r.user_id = auth.uid()
      )
    );
END $$;

-- FECHAMENTO BIMESTRE
DO $$ BEGIN
  DROP POLICY IF EXISTS "FechamentoBimestre_All" ON public.fechamento_bimestre;
  CREATE POLICY "FechamentoBimestre_All" ON public.fechamento_bimestre
    FOR ALL TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
END $$;

-- CONFIG PESOS
DO $$ BEGIN
  DROP POLICY IF EXISTS "ConfigPesos_All" ON public.config_pesos_bimestre;
  CREATE POLICY "ConfigPesos_All" ON public.config_pesos_bimestre
    FOR ALL TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
END $$;

-- AUDITORIA NOTAS (read-only para o tenant)
DO $$ BEGIN
  DROP POLICY IF EXISTS "AuditoriaNotas_Select" ON public.auditoria_notas;
  CREATE POLICY "AuditoriaNotas_Select" ON public.auditoria_notas
    FOR SELECT TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
END $$;

-- ==============================================================================
-- FIM DA MIGRATION 120
-- ==============================================================================
COMMENT ON TABLE public.avaliacoes_config IS 'Motor de avaliações V2.1 — substituição do JSONB da tabela boletins';
COMMENT ON TABLE public.frequencia_diaria IS 'Frequência diária por disciplina — LDB Art. 24';
COMMENT ON VIEW public.vw_boletim_completo IS 'View consolidada do boletim com recuperação e resultado final';
