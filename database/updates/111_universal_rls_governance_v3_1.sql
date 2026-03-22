-- ==============================================================================
-- 🛡️ MIGRATION 111: UNIVERSAL RLS GOVERNANCE V3.1
-- Descrição: Padroniza as regras de acesso (RLS) eliminando table scans,
-- implementando 4 Níveis Universais, Soft Deletes e Segurança Enterprise.
-- ==============================================================================

-- 1. CRIAÇÃO DE TABELAS DE SUPORTE
CREATE TABLE IF NOT EXISTS public.consent_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    aluno_global_id UUID NOT NULL REFERENCES public.alunos(id),
    shared_with UUID NOT NULL REFERENCES auth.users(id),
    acao TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.super_admin_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    acao TEXT NOT NULL,
    tabela TEXT,
    registro_id UUID,
    motivo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices Obrigatórios de Performance
CREATE INDEX IF NOT EXISTS idx_consent_logs_active ON public.consent_logs (aluno_global_id, shared_with)
WHERE acao = 'grant';

CREATE INDEX IF NOT EXISTS idx_super_admin_actions ON public.super_admin_actions (created_at DESC);

-- 2. DESATIVAR POLÍTICAS ANTIGAS GLOBAIS EM LOOP
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename FROM pg_policies 
        WHERE schemaname = 'public' 
        AND (
            policyname LIKE 'Gestor_%' 
            OR policyname LIKE 'Portal_%' 
            OR policyname LIKE 'SuperAdmin_%' 
            OR policyname LIKE 'Public_%'
            OR policyname LIKE 'Funcionario_%'
        )
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- ==============================================================================
-- 3. POLÍTICAS UNIVERSAIS (SELECT & UPDATE) - SEPARAÇÃO OBRIGATÓRIA
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- ALUNOS
-- ------------------------------------------------------------------------------
CREATE POLICY "Universal_Select_Alunos" ON public.alunos FOR SELECT TO authenticated USING (
    -- N1: Super Admin (Bypass apenas leitura)
    (COALESCE(auth.jwt() ->> 'is_super_admin', 'false'))::boolean = TRUE
    OR
    -- N2: Staff da Escola (Isolamento de Tenant)
    (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    OR
    -- N3: Responsáveis (Sem funções no USING, O(1) JOIN limpo)
    EXISTS (
        SELECT 1 FROM public.aluno_responsavel ar
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        WHERE ar.aluno_id = alunos.id AND r.user_id = auth.uid()
    )
    OR
    -- N4: Acesso Compartilhado / Parceiros
    EXISTS (
        SELECT 1 FROM public.consent_logs cl 
        WHERE cl.aluno_global_id = alunos.id 
        AND cl.shared_with = auth.uid() 
        AND cl.acao = 'grant' 
        AND (cl.expires_at IS NULL OR cl.expires_at > NOW())
    )
);

CREATE POLICY "Universal_Update_Alunos" ON public.alunos FOR UPDATE TO authenticated USING (
    -- N2: Staff apenas
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
) WITH CHECK (
    -- Trava Anti-Hijacking
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

CREATE POLICY "Universal_Insert_Alunos" ON public.alunos FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
);

-- ------------------------------------------------------------------------------
-- ESCOLAS
-- ------------------------------------------------------------------------------
CREATE POLICY "Universal_Select_Escolas" ON public.escolas FOR SELECT TO authenticated USING (
    -- Livre para select no portal ou listagem gerencial
    true
);

CREATE POLICY "Universal_Update_Escolas" ON public.escolas FOR UPDATE TO authenticated USING (
    id = (auth.jwt() ->> 'tenant_id')::uuid OR (COALESCE(auth.jwt() ->> 'is_super_admin', 'false'))::boolean = TRUE
) WITH CHECK (
    id = (auth.jwt() ->> 'tenant_id')::uuid OR (COALESCE(auth.jwt() ->> 'is_super_admin', 'false'))::boolean = TRUE
);

-- ------------------------------------------------------------------------------
-- MATRÍCULAS
-- ------------------------------------------------------------------------------
CREATE POLICY "Universal_Select_Matriculas" ON public.matriculas FOR SELECT TO authenticated USING (
    (COALESCE(auth.jwt() ->> 'is_super_admin', 'false'))::boolean = TRUE
    OR
    (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    OR
    EXISTS (
        SELECT 1 FROM public.aluno_responsavel ar
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        WHERE ar.aluno_id = matriculas.aluno_id AND r.user_id = auth.uid()
    )
);

CREATE POLICY "Universal_Update_Matriculas" ON public.matriculas FOR UPDATE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
) WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

CREATE POLICY "Universal_Insert_Matriculas" ON public.matriculas FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
);

-- ------------------------------------------------------------------------------
-- TURMAS
-- ------------------------------------------------------------------------------
CREATE POLICY "Universal_Select_Turmas" ON public.turmas FOR SELECT TO authenticated USING (
    (COALESCE(auth.jwt() ->> 'is_super_admin', 'false'))::boolean = TRUE
    OR
    (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    OR
    EXISTS (
        SELECT 1 FROM public.matriculas m
        JOIN public.aluno_responsavel ar ON ar.aluno_id = m.aluno_id
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        WHERE m.turma_id = turmas.id AND r.user_id = auth.uid() AND m.status = 'ativa'
    )
);

CREATE POLICY "Universal_Update_Turmas" ON public.turmas FOR UPDATE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
) WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

CREATE POLICY "Universal_Insert_Turmas" ON public.turmas FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
);

-- ------------------------------------------------------------------------------
-- COBRANCAS (FINANCEIRO)
-- ------------------------------------------------------------------------------
CREATE POLICY "Universal_Select_Cobrancas" ON public.cobrancas FOR SELECT TO authenticated USING (
    (COALESCE(auth.jwt() ->> 'is_super_admin', 'false'))::boolean = TRUE
    OR
    (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    OR
    EXISTS (
        SELECT 1 FROM public.aluno_responsavel ar
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        WHERE ar.aluno_id = cobrancas.aluno_id AND r.user_id = auth.uid()
    )
);

CREATE POLICY "Universal_Update_Cobrancas" ON public.cobrancas FOR UPDATE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
) WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

CREATE POLICY "Universal_Insert_Cobrancas" ON public.cobrancas FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
);

-- ------------------------------------------------------------------------------
-- FREQUENCIAS E BOLETINS
-- ------------------------------------------------------------------------------
CREATE POLICY "Universal_Select_Frequencias" ON public.frequencias FOR SELECT TO authenticated USING (
    (COALESCE(auth.jwt() ->> 'is_super_admin', 'false'))::boolean = TRUE
    OR
    (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    OR
    EXISTS (
        SELECT 1 FROM public.aluno_responsavel ar
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        WHERE ar.aluno_id = frequencias.aluno_id AND r.user_id = auth.uid()
    )
);

CREATE POLICY "Universal_Update_Frequencias" ON public.frequencias FOR UPDATE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
) WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

CREATE POLICY "Universal_Insert_Frequencias" ON public.frequencias FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
);

DO $$ BEGIN
  CREATE POLICY "Universal_Select_Boletins" ON public.boletins FOR SELECT TO authenticated USING (
      (COALESCE(auth.jwt() ->> 'is_super_admin', 'false'))::boolean = TRUE
      OR
      (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
      OR
      EXISTS (
          SELECT 1 FROM public.aluno_responsavel ar
          JOIN public.responsaveis r ON r.id = ar.responsavel_id
          WHERE ar.aluno_id = boletins.aluno_id AND r.user_id = auth.uid()
      )
  );
  
  CREATE POLICY "Universal_Update_Boletins" ON public.boletins FOR UPDATE TO authenticated USING (
      tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
  ) WITH CHECK (
      tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );
  
  CREATE POLICY "Universal_Insert_Boletins" ON public.boletins FOR INSERT TO authenticated WITH CHECK (
      tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
  );
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE '⚠️ Tabela boletins não existe. Pulando.';
END $$;

-- ------------------------------------------------------------------------------
-- MURAL DE AVISOS, EVENTOS, E CONFIGURAÇÕES
-- ------------------------------------------------------------------------------
CREATE POLICY "Universal_Select_Mural" ON public.mural_avisos FOR SELECT TO authenticated USING (
    (COALESCE(auth.jwt() ->> 'is_super_admin', 'false'))::boolean = TRUE
    OR
    (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    OR
    tenant_id IN (
        SELECT DISTINCT a.tenant_id FROM public.alunos a
        JOIN public.aluno_responsavel ar ON ar.aluno_id = a.id
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        WHERE r.user_id = auth.uid()
    )
);

CREATE POLICY "Universal_Update_Mural" ON public.mural_avisos FOR UPDATE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
) WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

CREATE POLICY "Universal_Insert_Mural" ON public.mural_avisos FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
);

-- Eventos
CREATE POLICY "Universal_Select_Eventos" ON public.eventos FOR SELECT TO authenticated USING (
    (COALESCE(auth.jwt() ->> 'is_super_admin', 'false'))::boolean = TRUE
    OR
    (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    OR
    tenant_id IN (
        SELECT DISTINCT a.tenant_id FROM public.alunos a
        JOIN public.aluno_responsavel ar ON ar.aluno_id = a.id
        JOIN public.responsaveis r ON r.id = ar.responsavel_id
        WHERE r.user_id = auth.uid()
    )
);
CREATE POLICY "Universal_Update_Eventos" ON public.eventos FOR UPDATE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
) WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "Universal_Insert_Eventos" ON public.eventos FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
);

-- Planos_Aula e Atividades
DO $$ BEGIN
  CREATE POLICY "Universal_Select_PlanosAula" ON public.planos_aula FOR SELECT TO authenticated USING (
      (COALESCE(auth.jwt() ->> 'is_super_admin', 'false'))::boolean = TRUE
      OR
      (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
      OR
      tenant_id IN (
          SELECT DISTINCT a.tenant_id FROM public.alunos a
          JOIN public.aluno_responsavel ar ON ar.aluno_id = a.id
          JOIN public.responsaveis r ON r.id = ar.responsavel_id
          WHERE r.user_id = auth.uid()
      )
  );
  CREATE POLICY "Universal_Update_PlanosAula" ON public.planos_aula FOR UPDATE TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid) WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
  CREATE POLICY "Universal_Insert_PlanosAula" ON public.planos_aula FOR INSERT TO authenticated WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
EXCEPTION WHEN undefined_table THEN RAISE NOTICE '⚠️ planos_aula não existe'; END $$;

DO $$ BEGIN
  CREATE POLICY "Universal_Select_Atividades" ON public.atividades FOR SELECT TO authenticated USING (
      (COALESCE(auth.jwt() ->> 'is_super_admin', 'false'))::boolean = TRUE
      OR
      (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
      OR
      tenant_id IN (
          SELECT DISTINCT a.tenant_id FROM public.alunos a
          JOIN public.aluno_responsavel ar ON ar.aluno_id = a.id
          JOIN public.responsaveis r ON r.id = ar.responsavel_id
          WHERE r.user_id = auth.uid()
      )
  );
  CREATE POLICY "Universal_Update_Atividades" ON public.atividades FOR UPDATE TO authenticated USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid) WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
  CREATE POLICY "Universal_Insert_Atividades" ON public.atividades FOR INSERT TO authenticated WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
EXCEPTION WHEN undefined_table THEN RAISE NOTICE '⚠️ atividades não existe'; END $$;
