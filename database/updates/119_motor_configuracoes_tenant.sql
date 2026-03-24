-- ==============================================================================
-- MIGRATION 119: MOTOR DE CONFIGURAÇÕES INSTITUCIONAIS (TENANT SETTINGS)
-- Descrição: Cria as tabelas de configurações JSONB com versionamento histórico
-- automático e validação cruzada de conformidade legal (MEC/CDC/LDB).
-- ==============================================================================

-- 1. TABELA PRINCIPAL DE CONFIGURAÇÕES
CREATE TABLE IF NOT EXISTS public.configuracoes_escola (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    contexto TEXT NOT NULL DEFAULT 'escola' CHECK (contexto IN ('escola', 'turma', 'aluno')),
    contexto_id UUID,

    config_academica JSONB NOT NULL DEFAULT '{"divisao_etapas": "4_bimestres", "media_aprovacao": 6.0, "media_recuperacao_minima": 3.0, "frequencia_minima_perc": 75, "casas_decimais": 1, "reprovacao_automatica_por_falta": true}'::jsonb,
    config_financeira JSONB NOT NULL DEFAULT '{"multa_atraso_perc": 2.0, "juros_mora_mensal_perc": 1.0, "dia_vencimento_padrao": 10, "dias_carencia": 5, "desconto_irmaos_perc": 10, "multa_fixa": 0, "pix_manual": true, "chave_pix": "", "nome_favorecido": "", "instrucoes_pix": "", "pix_auto": false, "presencial": true}'::jsonb,
    config_operacional JSONB NOT NULL DEFAULT '{"tolerancia_atraso_minutos": 15, "idade_minima_saida_desacompanhada": 12, "exige_foto_terceiros": true, "exige_documento_portaria": true, "validade_temp_dias": 30, "push_saida": true}'::jsonb,
    config_conduta JSONB NOT NULL DEFAULT '{"limite_atrasos_penalidade": 3, "notifica_pais_falta": true}'::jsonb,
    config_calendario JSONB NOT NULL DEFAULT '{"inicio_aulas": "2026-02-01", "termino_aulas": "2026-12-15", "dias_letivos": 200, "carga_horaria": 800}'::jsonb,

    vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    vigencia_fim DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),

    UNIQUE (tenant_id, contexto, vigencia_fim)
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_config_escola_tenant ON public.configuracoes_escola (tenant_id) WHERE vigencia_fim IS NULL;

-- 2. TABELA DE HISTÓRICO (IMUTÁVEL - APPEND ONLY)
CREATE TABLE IF NOT EXISTS public.configuracoes_escola_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    configuracao_id UUID REFERENCES public.configuracoes_escola(id),
    config_academica JSONB,
    config_financeira JSONB,
    config_operacional JSONB,
    config_conduta JSONB,
    config_calendario JSONB,
    vigencia_inicio DATE,
    vigencia_fim DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_config_historico_tenant ON public.configuracoes_escola_historico (tenant_id, created_at DESC);

-- 3. TRIGGER: VALIDAÇÃO LEGAL (MEC / CDC / LDB)
-- Garante conformidade em nível de banco de dados — blindagem total contra UI bugs
CREATE OR REPLACE FUNCTION public.validar_configuracoes_cruzadas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- LDB Art. 24: Frequência mínima
    IF (NEW.config_academica->>'frequencia_minima_perc')::float < 75 THEN
        RAISE EXCEPTION 'LDB: Frequência mínima deve ser 75%% (Art. 24).';
    END IF;

    -- LDB: Dias letivos mínimos
    IF (NEW.config_calendario->>'dias_letivos')::int < 200 THEN
        RAISE EXCEPTION 'LDB: Mínimo de 200 dias letivos exigido.';
    END IF;

    -- LDB: Carga horária mínima
    IF (NEW.config_calendario->>'carga_horaria')::int < 800 THEN
        RAISE EXCEPTION 'LDB: Carga horária mínima de 800h exigida.';
    END IF;

    -- CDC Art. 52: Multa moratória máxima
    IF (NEW.config_financeira->>'multa_atraso_perc')::float > 2.0 THEN
        RAISE EXCEPTION 'CDC: Multa moratória máxima permitida é de 2%% (Art. 52).';
    END IF;

    -- CDC: Juros de mora máximos
    IF (NEW.config_financeira->>'juros_mora_mensal_perc')::float > 1.0 THEN
        RAISE EXCEPTION 'CDC: Juros de mora máximos permitidos são de 1%% ao mês.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_leis ON public.configuracoes_escola;
CREATE TRIGGER trg_validar_leis
BEFORE INSERT OR UPDATE ON public.configuracoes_escola
FOR EACH ROW EXECUTE FUNCTION public.validar_configuracoes_cruzadas();

-- 4. TRIGGER: ARQUIVAMENTO AUTOMÁTICO DE HISTÓRICO
CREATE OR REPLACE FUNCTION public.arquivar_config_anterior()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Somente arquiva se a configuração anterior estava vigente (sem data de fim)
    IF OLD.vigencia_fim IS NULL THEN
        INSERT INTO public.configuracoes_escola_historico (
            tenant_id, configuracao_id,
            config_academica, config_financeira, config_operacional, config_conduta, config_calendario,
            vigencia_inicio, vigencia_fim, created_by
        )
        VALUES (
            OLD.tenant_id, OLD.id,
            OLD.config_academica, OLD.config_financeira, OLD.config_operacional, OLD.config_conduta, OLD.config_calendario,
            OLD.vigencia_inicio, CURRENT_DATE, OLD.updated_by
        );
    END IF;
    -- Atualiza o timestamp
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_arquivar_config ON public.configuracoes_escola;
CREATE TRIGGER trg_arquivar_config
BEFORE UPDATE ON public.configuracoes_escola
FOR EACH ROW EXECUTE FUNCTION public.arquivar_config_anterior();

-- 5. SEGURANÇA (RLS) - Padrão Universal do Projeto
ALTER TABLE public.configuracoes_escola ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_escola_historico ENABLE ROW LEVEL SECURITY;

-- SELECT: Gestor/Admin da escola vê suas próprias configurações
DO $$ BEGIN
    DROP POLICY IF EXISTS "Config_Select_Tenant" ON public.configuracoes_escola;
    CREATE POLICY "Config_Select_Tenant" ON public.configuracoes_escola
      FOR SELECT TO authenticated USING (
        (COALESCE(auth.jwt() ->> 'is_super_admin', 'false'))::boolean = TRUE
        OR tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      );

    DROP POLICY IF EXISTS "Config_Insert_Tenant" ON public.configuracoes_escola;
    CREATE POLICY "Config_Insert_Tenant" ON public.configuracoes_escola
      FOR INSERT TO authenticated WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      );

    DROP POLICY IF EXISTS "Config_Update_Tenant" ON public.configuracoes_escola;
    CREATE POLICY "Config_Update_Tenant" ON public.configuracoes_escola
      FOR UPDATE TO authenticated USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      ) WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      );

    -- Histórico: somente leitura para o tenant dono
    DROP POLICY IF EXISTS "ConfigHistorico_Select_Tenant" ON public.configuracoes_escola_historico;
    CREATE POLICY "ConfigHistorico_Select_Tenant" ON public.configuracoes_escola_historico
      FOR SELECT TO authenticated USING (
        (COALESCE(auth.jwt() ->> 'is_super_admin', 'false'))::boolean = TRUE
        OR tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      );
END $$;
