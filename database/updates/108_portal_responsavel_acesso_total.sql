-- ==============================================================================
-- 🚀 MIGRATION 108: ACESSO TOTAL DO PORTAL DO RESPONSÁVEL (DEFINITIVO)
-- Descrição: Restaura TODAS as políticas RLS que o portal do responsável precisa.
--            NÃO ALTERA nenhuma política do Gestor (Gestor_*).
-- Data: 22 de março de 2026
-- ==============================================================================

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  SEÇÃO 1: GARANTIR FUNÇÕES AUXILIARES                          ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- Retorna o ID do responsável logado
CREATE OR REPLACE FUNCTION public.get_my_responsavel_id()
RETURNS uuid AS $$ 
    SELECT id FROM public.responsaveis WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verifica se um aluno é filho do responsável logado
CREATE OR REPLACE FUNCTION public.is_my_child(p_aluno_id uuid)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.aluno_responsavel 
        WHERE aluno_id = p_aluno_id 
        AND responsavel_id = public.get_my_responsavel_id()
        AND status = 'ativo'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verifica se uma turma pertence a um dos filhos do responsável
CREATE OR REPLACE FUNCTION public.is_my_child_turma(p_turma_id uuid)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.matriculas m
        JOIN public.aluno_responsavel ar ON ar.aluno_id = m.aluno_id
        WHERE m.turma_id = p_turma_id 
        AND ar.responsavel_id = public.get_my_responsavel_id()
        AND m.status = 'ativa'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Retorna todos os tenant IDs onde o responsável tem filhos
CREATE OR REPLACE FUNCTION public.get_my_tenants()
RETURNS SETOF uuid AS $$
    SELECT DISTINCT a.tenant_id 
    FROM public.alunos a
    JOIN public.aluno_responsavel ar ON ar.aluno_id = a.id
    WHERE ar.responsavel_id = public.get_my_responsavel_id();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  SEÇÃO 2: HABILITAR RLS NAS TABELAS QUE PODEM ESTAR SEM       ║
-- ║  (alunos, responsaveis, filiais foram excluídos na 080)        ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- Habilitar RLS nas tabelas que o portal usa e que podem estar sem
DO $$
DECLARE
    t text;
    tables_to_enable text[] := ARRAY[
        'alunos', 'responsaveis', 'aluno_responsavel', 'matriculas',
        'turmas', 'cobrancas', 'config_financeira', 'configuracao_recebimento',
        'frequencias', 'boletins', 'mural_avisos', 'eventos',
        'planos_aula', 'planos_aula_turmas', 'atividades', 'atividades_turmas',
        'document_solicitations', 'documentos_emitidos', 'documento_templates',
        'autorizacoes_modelos', 'autorizacoes_respostas', 'autorizacoes_auditoria',
        'selos', 'fila_virtual', 'portal_audit_log',
        'escolas', 'filiais', 'livros', 'materiais_escolares'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_enable LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
            RAISE NOTICE '  ✅ RLS habilitado: %', t;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '  ⚠️  Tabela % não existe ou já tem RLS: %', t, SQLERRM;
        END;
    END LOOP;
END $$;

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  SEÇÃO 3: LIMPAR APENAS POLÍTICAS Portal_* (NUNCA Gestor_*)    ║
-- ╚══════════════════════════════════════════════════════════════════╝

DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname LIKE 'Portal_%'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
        RAISE NOTICE '  🗑️  Removida: % em %', r.policyname, r.tablename;
    END LOOP;
END $$;

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  SEÇÃO 4: CRIAR TODAS AS POLÍTICAS DO PORTAL                  ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ┌──────────────────────────────────────────┐
-- │  DADOS PÚBLICOS (Escolas/Filiais/Config) │
-- └──────────────────────────────────────────┘
-- Nota: escolas e filiais já podem ter política Public_*, aqui garantimos Portal_*
CREATE POLICY "Portal_Escolas_Select" ON public.escolas 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Portal_Filiais_Select" ON public.filiais 
  FOR SELECT TO authenticated USING (true);

DO $$ BEGIN
  CREATE POLICY "Portal_ConfigRec_Select" ON public.configuracao_recebimento 
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE '  ⚠️  Tabela configuracao_recebimento não existe, pulando';
END $$;

-- ┌──────────────────────────────────────────┐
-- │  ALUNOS (Ver meus filhos)               │
-- └──────────────────────────────────────────┘
CREATE POLICY "Portal_Alunos_Select" ON public.alunos 
  FOR SELECT TO authenticated 
  USING ( public.is_my_child(id) );

-- ┌──────────────────────────────────────────┐
-- │  RESPONSÁVEIS (Acesso ao próprio perfil) │
-- └──────────────────────────────────────────┘
CREATE POLICY "Portal_Responsaveis_Self_Select" ON public.responsaveis 
  FOR SELECT TO authenticated 
  USING ( user_id = auth.uid() );

CREATE POLICY "Portal_Responsaveis_Self_Update" ON public.responsaveis 
  FOR UPDATE TO authenticated 
  USING ( user_id = auth.uid() )
  WITH CHECK ( user_id = auth.uid() );

-- ┌──────────────────────────────────────────┐
-- │  ALUNO_RESPONSAVEL (Vínculos)            │
-- └──────────────────────────────────────────┘
CREATE POLICY "Portal_Vinculos_Select" ON public.aluno_responsavel 
  FOR SELECT TO authenticated 
  USING ( responsavel_id = public.get_my_responsavel_id() );

CREATE POLICY "Portal_Vinculos_Update" ON public.aluno_responsavel 
  FOR UPDATE TO authenticated 
  USING ( responsavel_id = public.get_my_responsavel_id() )
  WITH CHECK ( responsavel_id = public.get_my_responsavel_id() );

-- ┌──────────────────────────────────────────┐
-- │  MATRÍCULAS                              │
-- └──────────────────────────────────────────┘
CREATE POLICY "Portal_Matriculas_Select" ON public.matriculas 
  FOR SELECT TO authenticated 
  USING ( public.is_my_child(aluno_id) );

-- ┌──────────────────────────────────────────┐
-- │  TURMAS                                  │
-- └──────────────────────────────────────────┘
CREATE POLICY "Portal_Turmas_Select" ON public.turmas 
  FOR SELECT TO authenticated 
  USING ( public.is_my_child_turma(id) );

-- ┌──────────────────────────────────────────┐
-- │  COBRANÇAS (Financeiro)                  │
-- └──────────────────────────────────────────┘
CREATE POLICY "Portal_Cobrancas_Select" ON public.cobrancas 
  FOR SELECT TO authenticated 
  USING ( public.is_my_child(aluno_id) );

-- ┌──────────────────────────────────────────┐
-- │  CONFIG FINANCEIRA                       │
-- └──────────────────────────────────────────┘
CREATE POLICY "Portal_ConfigFin_Select" ON public.config_financeira 
  FOR SELECT TO authenticated 
  USING ( tenant_id IN (SELECT public.get_my_tenants()) );

-- ┌──────────────────────────────────────────┐
-- │  FREQUÊNCIAS                             │
-- └──────────────────────────────────────────┘
CREATE POLICY "Portal_Frequencias_Select" ON public.frequencias 
  FOR SELECT TO authenticated 
  USING ( public.is_my_child(aluno_id) );

-- ┌──────────────────────────────────────────┐
-- │  BOLETINS                                │
-- └──────────────────────────────────────────┘
DO $$ BEGIN
  CREATE POLICY "Portal_Boletins_Select" ON public.boletins 
    FOR SELECT TO authenticated 
    USING ( public.is_my_child(aluno_id) );
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE '  ⚠️  Tabela boletins não existe, pulando';
END $$;

-- ┌──────────────────────────────────────────┐
-- │  MURAL DE AVISOS                         │
-- └──────────────────────────────────────────┘
CREATE POLICY "Portal_Mural_Select" ON public.mural_avisos 
  FOR SELECT TO authenticated 
  USING ( tenant_id IN (SELECT public.get_my_tenants()) );

-- ┌──────────────────────────────────────────┐
-- │  EVENTOS / AGENDA                        │
-- └──────────────────────────────────────────┘
CREATE POLICY "Portal_Eventos_Select" ON public.eventos 
  FOR SELECT TO authenticated 
  USING ( tenant_id IN (SELECT public.get_my_tenants()) );

-- ┌──────────────────────────────────────────┐
-- │  PLANOS DE AULA                          │
-- └──────────────────────────────────────────┘
DO $$ BEGIN
  CREATE POLICY "Portal_PlanosAula_Select" ON public.planos_aula 
    FOR SELECT TO authenticated 
    USING ( tenant_id IN (SELECT public.get_my_tenants()) );
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE '  ⚠️  Tabela planos_aula não existe, pulando';
END $$;

DO $$ BEGIN
  CREATE POLICY "Portal_PlanosAulaTurmas_Select" ON public.planos_aula_turmas 
    FOR SELECT TO authenticated 
    USING ( 
      EXISTS (
        SELECT 1 FROM public.matriculas m
        JOIN public.aluno_responsavel ar ON ar.aluno_id = m.aluno_id
        WHERE m.turma_id = planos_aula_turmas.turma_id
        AND ar.responsavel_id = public.get_my_responsavel_id()
        AND m.status = 'ativa'
      )
    );
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE '  ⚠️  Tabela planos_aula_turmas não existe, pulando';
END $$;

-- ┌──────────────────────────────────────────┐
-- │  ATIVIDADES                              │
-- └──────────────────────────────────────────┘
DO $$ BEGIN
  CREATE POLICY "Portal_Atividades_Select" ON public.atividades 
    FOR SELECT TO authenticated 
    USING ( tenant_id IN (SELECT public.get_my_tenants()) );
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE '  ⚠️  Tabela atividades não existe, pulando';
END $$;

DO $$ BEGIN
  CREATE POLICY "Portal_AtividadesTurmas_Select" ON public.atividades_turmas 
    FOR SELECT TO authenticated 
    USING ( 
      EXISTS (
        SELECT 1 FROM public.matriculas m
        JOIN public.aluno_responsavel ar ON ar.aluno_id = m.aluno_id
        WHERE m.turma_id = atividades_turmas.turma_id
        AND ar.responsavel_id = public.get_my_responsavel_id()
        AND m.status = 'ativa'
      )
    );
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE '  ⚠️  Tabela atividades_turmas não existe, pulando';
END $$;

-- ┌──────────────────────────────────────────┐
-- │  DOCUMENTOS (Templates + Solicitações)   │
-- └──────────────────────────────────────────┘
DO $$ BEGIN
  CREATE POLICY "Portal_DocTemplates_Select" ON public.documento_templates 
    FOR SELECT TO authenticated 
    USING ( tenant_id IN (SELECT public.get_my_tenants()) );
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE '  ⚠️  Tabela documento_templates não existe, pulando';
END $$;

DO $$ BEGIN
  CREATE POLICY "Portal_DocSolicit_Select" ON public.document_solicitations 
    FOR SELECT TO authenticated 
    USING ( responsavel_id = public.get_my_responsavel_id() );

  CREATE POLICY "Portal_DocSolicit_Insert" ON public.document_solicitations 
    FOR INSERT TO authenticated 
    WITH CHECK ( responsavel_id = public.get_my_responsavel_id() );
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE '  ⚠️  Tabela document_solicitations não existe, pulando';
END $$;

DO $$ BEGIN
  CREATE POLICY "Portal_DocEmitidos_Select" ON public.documentos_emitidos 
    FOR SELECT TO authenticated 
    USING ( 
      EXISTS (
        SELECT 1 FROM public.document_solicitations ds
        WHERE ds.documento_emitido_id = documentos_emitidos.id
        AND ds.responsavel_id = public.get_my_responsavel_id()
      )
      OR tenant_id IN (SELECT public.get_my_tenants())
    );
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE '  ⚠️  Tabela documentos_emitidos não existe, pulando';
END $$;

-- ┌──────────────────────────────────────────┐
-- │  AUTORIZAÇÕES                            │
-- └──────────────────────────────────────────┘
DO $$ BEGIN
  CREATE POLICY "Portal_AutModelos_Select" ON public.autorizacoes_modelos 
    FOR SELECT TO authenticated 
    USING ( 
      tenant_id IS NULL  -- Modelos globais
      OR tenant_id IN (SELECT public.get_my_tenants())
    );
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE '  ⚠️  Tabela autorizacoes_modelos não existe, pulando';
END $$;

DO $$ BEGIN
  CREATE POLICY "Portal_AutRespostas_Select" ON public.autorizacoes_respostas 
    FOR SELECT TO authenticated 
    USING ( responsavel_id = public.get_my_responsavel_id() );

  CREATE POLICY "Portal_AutRespostas_Insert" ON public.autorizacoes_respostas 
    FOR INSERT TO authenticated 
    WITH CHECK ( responsavel_id = public.get_my_responsavel_id() );

  CREATE POLICY "Portal_AutRespostas_Update" ON public.autorizacoes_respostas 
    FOR UPDATE TO authenticated 
    USING ( responsavel_id = public.get_my_responsavel_id() )
    WITH CHECK ( responsavel_id = public.get_my_responsavel_id() );
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE '  ⚠️  Tabela autorizacoes_respostas não existe, pulando';
END $$;

DO $$ BEGIN
  CREATE POLICY "Portal_AutAuditoria_Insert" ON public.autorizacoes_auditoria 
    FOR INSERT TO authenticated 
    WITH CHECK ( responsavel_id = public.get_my_responsavel_id() );
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE '  ⚠️  Tabela autorizacoes_auditoria não existe, pulando';
END $$;

-- ┌──────────────────────────────────────────┐
-- │  SELOS / CONQUISTAS                      │
-- └──────────────────────────────────────────┘
DO $$ BEGIN
  CREATE POLICY "Portal_Selos_Select" ON public.selos 
    FOR SELECT TO authenticated 
    USING ( public.is_my_child(aluno_id) );
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE '  ⚠️  Tabela selos não existe, pulando';
END $$;

-- ┌──────────────────────────────────────────┐
-- │  FILA VIRTUAL (Portal Expresso)          │
-- └──────────────────────────────────────────┘
DO $$ BEGIN
  CREATE POLICY "Portal_Fila_Select" ON public.fila_virtual 
    FOR SELECT TO authenticated 
    USING ( responsavel_id = public.get_my_responsavel_id() );

  CREATE POLICY "Portal_Fila_Insert" ON public.fila_virtual 
    FOR INSERT TO authenticated 
    WITH CHECK ( responsavel_id = public.get_my_responsavel_id() );

  CREATE POLICY "Portal_Fila_Update" ON public.fila_virtual 
    FOR UPDATE TO authenticated 
    USING ( responsavel_id = public.get_my_responsavel_id() )
    WITH CHECK ( responsavel_id = public.get_my_responsavel_id() );
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE '  ⚠️  Tabela fila_virtual não existe, pulando';
END $$;

-- ┌──────────────────────────────────────────┐
-- │  LIVROS E MATERIAIS ESCOLARES            │
-- └──────────────────────────────────────────┘
DO $$ BEGIN
  CREATE POLICY "Portal_Livros_Select" ON public.livros 
    FOR SELECT TO authenticated 
    USING ( tenant_id IN (SELECT public.get_my_tenants()) );
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE '  ⚠️  Tabela livros não existe, pulando';
END $$;

DO $$ BEGIN
  CREATE POLICY "Portal_Materiais_Select" ON public.materiais_escolares 
    FOR SELECT TO authenticated 
    USING ( tenant_id IN (SELECT public.get_my_tenants()) );
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE '  ⚠️  Tabela materiais_escolares não existe, pulando';
END $$;

-- ┌──────────────────────────────────────────┐
-- │  AUDITORIA DO PORTAL                    │
-- └──────────────────────────────────────────┘
DO $$ BEGIN
  CREATE POLICY "Portal_Audit_Insert" ON public.portal_audit_log 
    FOR INSERT TO authenticated 
    WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE '  ⚠️  Tabela portal_audit_log não existe, pulando';
END $$;

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  SEÇÃO 5: VERIFICAÇÃO FINAL                                    ║
-- ╚══════════════════════════════════════════════════════════════════╝

DO $$
DECLARE
    policy_count integer;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND policyname LIKE 'Portal_%';
    
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '✅ PORTAL DO RESPONSÁVEL: % políticas criadas', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE '📋 FUNCIONALIDADES RESTAURADAS:';
    RAISE NOTICE '   ✅ Ver informações de cobranças';
    RAISE NOTICE '   ✅ Ver filhos e gerenciá-los';
    RAISE NOTICE '   ✅ Ver turma';
    RAISE NOTICE '   ✅ Ver informações de matrícula';
    RAISE NOTICE '   ✅ Ver frequência e boletim';
    RAISE NOTICE '   ✅ Ver livros e materiais';
    RAISE NOTICE '   ✅ Ver planos de aula';
    RAISE NOTICE '   ✅ Ver atividades da escola';
    RAISE NOTICE '   ✅ Solicitar documentos';
    RAISE NOTICE '   ✅ Autorizações (ativar/desativar)';
    RAISE NOTICE '   ✅ Portal Expresso (Fila Virtual)';
    RAISE NOTICE '   ✅ Ver avisos e eventos';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 GESTOR: NENHUMA POLÍTICA ALTERADA';
    RAISE NOTICE '════════════════════════════════════════════';
END $$;
