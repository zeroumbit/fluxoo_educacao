-- ==============================================================================
-- 🛡️ MIGRATION 165: FIX ACADEMIC V2 RLS (AVALIAÇÕES E FREQUÊNCIA)
-- Descrição: Restaura e fortalece as políticas RLS para o motor de avaliações V2
--            e frequência diária, corrigindo o erro 403 Forbidden.
--            Utiliza o padrão de blindagem robusta (JWT + Helpers V2).
-- ==============================================================================

BEGIN;

-- 1. LIMPEZA DE POLÍTICAS FRÁGEIS OU ANTIGAS
DO $$ 
BEGIN
    -- avaliacoes_config
    DROP POLICY IF EXISTS "AvaliacoesConfig_All" ON public.avaliacoes_config;
    DROP POLICY IF EXISTS "AvaliacoesConfig_Responsavel" ON public.avaliacoes_config;
    DROP POLICY IF EXISTS "tenant_acesso_avaliacoes_config" ON public.avaliacoes_config;

    -- avaliacoes_notas
    DROP POLICY IF EXISTS "AvaliacoesNotas_Staff_All" ON public.avaliacoes_notas;
    DROP POLICY IF EXISTS "AvaliacoesNotas_Responsavel" ON public.avaliacoes_notas;

    -- frequencia_diaria
    DROP POLICY IF EXISTS "FrequenciaDiaria_Staff_All" ON public.frequencia_diaria;
    DROP POLICY IF EXISTS "FrequenciaDiaria_Responsavel_Select" ON public.frequencia_diaria;

    -- recuperacoes
    DROP POLICY IF EXISTS "Recuperacoes_All" ON public.recuperacoes;
    DROP POLICY IF EXISTS "Recuperacoes_Responsavel" ON public.recuperacoes;

    -- observacoes_pedagogicas
    DROP POLICY IF EXISTS "ObsPedagogicas_Staff" ON public.observacoes_pedagogicas;
    DROP POLICY IF EXISTS "ObsPedagogicas_Responsavel" ON public.observacoes_pedagogicas;

    -- Outras tabelas do motor acadêmico
    DROP POLICY IF EXISTS "CalendarioLetivo_Select" ON public.calendario_letivo;
    DROP POLICY IF EXISTS "CalendarioLetivo_Write" ON public.calendario_letivo;
    DROP POLICY IF EXISTS "FechamentoBimestre_All" ON public.fechamento_bimestre;
    DROP POLICY IF EXISTS "ConfigPesos_All" ON public.config_pesos_bimestre;
    DROP POLICY IF EXISTS "AuditoriaNotas_Select" ON public.auditoria_notas;
END $$;

-- 2. POLÍTICAS ROBUSTAS PARA STAFF (CREATE, READ, UPDATE, DELETE)
-- Definimos um padrão universal que busca o tenant_id em todos os locais possíveis do JWT
-- e utiliza o helper is_staff_of_school como redundância de segurança.

-- Aplicamos individualmente para garantir precisão total e evitar erros de escape em blocos dinâmicos.
ALTER TABLE public.calendario_letivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frequencia_diaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recuperacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observacoes_pedagogicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fechamento_bimestre ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_pesos_bimestre ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_notas ENABLE ROW LEVEL SECURITY;

-- AVALIACOES_CONFIG
CREATE POLICY "Academic_Staff_Access_avaliacoes_config" ON public.avaliacoes_config FOR ALL TO authenticated 
USING (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2())
WITH CHECK (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2());

-- AVALIACOES_NOTAS
CREATE POLICY "Academic_Staff_Access_avaliacoes_notas" ON public.avaliacoes_notas FOR ALL TO authenticated 
USING (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2())
WITH CHECK (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2());

-- FREQUENCIA_DIARIA
CREATE POLICY "Academic_Staff_Access_frequencia_diaria" ON public.frequencia_diaria FOR ALL TO authenticated 
USING (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2())
WITH CHECK (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2());

-- RECUPERACOES
CREATE POLICY "Academic_Staff_Access_recuperacoes" ON public.recuperacoes FOR ALL TO authenticated 
USING (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2())
WITH CHECK (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2());

-- OBSERVACOES_PEDAGOGICAS
CREATE POLICY "Academic_Staff_Access_observacoes_pedagogicas" ON public.observacoes_pedagogicas FOR ALL TO authenticated 
USING (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2())
WITH CHECK (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2());

-- FECHAMENTO_BIMESTRE
CREATE POLICY "Academic_Staff_Access_fechamento_bimestre" ON public.fechamento_bimestre FOR ALL TO authenticated 
USING (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2())
WITH CHECK (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2());

-- CONFIG_PESOS_BIMESTRE
CREATE POLICY "Academic_Staff_Access_config_pesos_bimestre" ON public.config_pesos_bimestre FOR ALL TO authenticated 
USING (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2())
WITH CHECK (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2());

-- CALENDARIO_LETIVO
CREATE POLICY "Academic_Staff_Access_calendario_letivo" ON public.calendario_letivo FOR ALL TO authenticated 
USING (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2())
WITH CHECK (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2());

-- AUDITORIA_NOTAS (Apenas Leitura)
CREATE POLICY "Academic_Staff_Access_auditoria_notas" ON public.auditoria_notas FOR SELECT TO authenticated 
USING (tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid OR public.is_staff_of_school(tenant_id) OR public.is_super_admin_v2());


-- 3. POLÍTICAS PARA PAIS/RESPONSÁVEIS (SELECT APENAS)
-- Utiliza os helpers get_my_responsavel_id e is_my_child_v2 para evitar loops.

-- FREQUENCIA_DIARIA (Select de fllhos)
CREATE POLICY "Parents_Select_frequencia_diaria" ON public.frequencia_diaria FOR SELECT TO authenticated
USING ( 
    deleted_at IS NULL AND (
        (SELECT public.is_my_child_v2(aluno_id))
    )
);

-- AVALIACOES_NOTAS (Select de fllhos)
CREATE POLICY "Parents_Select_avaliacoes_notas" ON public.avaliacoes_notas FOR SELECT TO authenticated
USING ( 
    deleted_at IS NULL AND (
        (SELECT public.is_my_child_v2(aluno_id))
    )
);

-- RECUPERACOES (Select de fllhos)
CREATE POLICY "Parents_Select_recuperacoes" ON public.recuperacoes FOR SELECT TO authenticated
USING ( 
    deleted_at IS NULL AND (
        (SELECT public.is_my_child_v2(aluno_id))
    )
);

-- OBSERVACOES_PEDAGOGICAS (Select de fllhos)
CREATE POLICY "Parents_Select_observacoes_pedagogicas" ON public.observacoes_pedagogicas FOR SELECT TO authenticated
USING ( 
    deleted_at IS NULL AND (
        (SELECT public.is_my_child_v2(aluno_id))
    )
);

-- AVALIACOES_CONFIG (Select via turma dos filhos)
CREATE POLICY "Parents_Select_avaliacoes_config" ON public.avaliacoes_config FOR SELECT TO authenticated
USING (
    deleted_at IS NULL AND EXISTS (
        SELECT 1 FROM public.matriculas m
        WHERE m.turma_id = avaliacoes_config.turma_id 
          AND (SELECT public.is_my_child_v2(m.aluno_id))
    )
);

-- CALENDARIO_LETIVO (Leitura Geral do Tenant do Filho)
CREATE POLICY "Parents_Select_calendario_letivo" ON public.calendario_letivo FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.alunos a 
        WHERE a.tenant_id = calendario_letivo.tenant_id 
          AND (SELECT public.is_my_child_v2(a.id))
    )
);

COMMIT;
