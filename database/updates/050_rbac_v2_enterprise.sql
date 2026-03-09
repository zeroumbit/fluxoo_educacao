-- ==============================================================================
-- 🚀 MIGRATION V2.2: SISTEMA DE FUNCIONÁRIOS & RBAC ENTERPRISE
-- Descrição: Implementa Controle de Acesso Baseado em Perfis (RBAC),
--            Escopos de Acesso, Dupla Validação Financeira e Auditoria.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. ENUMS (PADRONIZAÇÃO FORTE)
-- ==============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_funcionario_v2') THEN
        CREATE TYPE status_funcionario_v2 AS ENUM ('ativo', 'licenca', 'desligado');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_usuario') THEN
        CREATE TYPE status_usuario AS ENUM ('ativo', 'bloqueado');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scope_type') THEN
        CREATE TYPE scope_type AS ENUM ('self', 'minhas_turmas', 'minhas_disciplinas', 'minha_unidade', 'toda_escola', 'rede');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'override_status') THEN
        CREATE TYPE override_status AS ENUM ('allow', 'deny');
    END IF;
END $$;

-- ==============================================================================
-- 2. CATÁLOGO GLOBAL (SYSTEM MODULES & PERMISSIONS)
-- Estas tabelas não possuem tenant_id, pois são globais do sistema SaaS.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.system_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    icone TEXT,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    modulo_key TEXT NOT NULL REFERENCES public.system_modules(key) ON DELETE CASCADE,
    recurso TEXT NOT NULL,
    acao TEXT NOT NULL,
    descricao TEXT NOT NULL,
    requires_approval BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. PERFIS DE ACESSO & CARGOS (V2)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.cargos_v2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    nome TEXT NOT NULL,
    is_template_sistema BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.perfis_acesso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,
    nome TEXT NOT NULL,
    descricao TEXT,
    parent_perfil_id UUID REFERENCES public.perfis_acesso(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matriz de Acesso (RBAC)
CREATE TABLE IF NOT EXISTS public.perfil_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    perfil_id UUID NOT NULL REFERENCES public.perfis_acesso(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    scope_type scope_type NOT NULL DEFAULT 'toda_escola',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(perfil_id, permission_id)
);

-- ==============================================================================
-- 4. TABELA PONTE: FUNCIONÁRIO ↔ CARGOS V2
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.funcionario_cargos_v2 (
    funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
    cargo_id UUID NOT NULL REFERENCES public.cargos_v2(id) ON DELETE CASCADE,
    PRIMARY KEY (funcionario_id, cargo_id)
);

-- ==============================================================================
-- 5. USUÁRIOS DO SISTEMA (RBAC) - Vincula auth.users → funcionários → perfis
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.usuarios_sistema (
    id UUID PRIMARY KEY, -- Referencia auth.users(id) do Supabase
    tenant_id UUID NOT NULL,
    funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE CASCADE,
    email_login TEXT NOT NULL UNIQUE,
    status status_usuario DEFAULT 'ativo',
    perfil_id UUID REFERENCES public.perfis_acesso(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exceções pontuais (Overrides)
CREATE TABLE IF NOT EXISTS public.user_permission_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES public.usuarios_sistema(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    status override_status NOT NULL,
    concedido_por UUID REFERENCES public.usuarios_sistema(id),
    motivo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, permission_id)
);

-- ==============================================================================
-- 6. GOVERNANÇA E COMPLIANCE (FINANCEIRO & AUDITORIA)
-- ==============================================================================

-- Fluxos de Aprovação Dupla Configuráveis
CREATE TABLE IF NOT EXISTS public.approval_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    permission_key TEXT NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
    threshold NUMERIC(10,2) NOT NULL,
    required_role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, permission_key)
);

-- Auditoria Implacável (Logs V2 - Inalteráveis)
CREATE TABLE IF NOT EXISTS public.audit_logs_v2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    acao TEXT NOT NULL,
    recurso_id UUID NOT NULL,
    valor_anterior JSONB,
    valor_novo JSONB,
    motivo_declarado TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. TRIGGERS E FUNÇÕES DE SEGURANÇA (ZERO TRUST)
-- ==============================================================================

-- Função: Garantir limite de herança de Perfis (Máximo 3 níveis)
CREATE OR REPLACE FUNCTION public.fn_check_perfil_heranca()
RETURNS TRIGGER AS $$
DECLARE
    v_depth INTEGER := 0;
    v_current_parent UUID := NEW.parent_perfil_id;
BEGIN
    WHILE v_current_parent IS NOT NULL LOOP
        v_depth := v_depth + 1;
        IF v_depth > 2 THEN
            RAISE EXCEPTION 'A herança de perfis não pode ultrapassar 3 níveis de profundidade (Base -> Filho -> Neto).';
        END IF;
        SELECT parent_perfil_id INTO v_current_parent FROM public.perfis_acesso WHERE id = v_current_parent;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_perfil_heranca ON public.perfis_acesso;
CREATE TRIGGER trg_check_perfil_heranca
BEFORE INSERT OR UPDATE ON public.perfis_acesso
FOR EACH ROW EXECUTE FUNCTION public.fn_check_perfil_heranca();

-- Função: Revogação imediata de acesso ao desligar funcionário
CREATE OR REPLACE FUNCTION public.fn_revogar_acesso_desligamento_v2()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'inativo' AND OLD.status != 'inativo' THEN
        -- 1. Bloqueia o usuário correspondente no schema public
        UPDATE public.usuarios_sistema 
        SET status = 'bloqueado', updated_at = NOW() 
        WHERE funcionario_id = NEW.id;
        
        -- 2. Insere log de auditoria
        INSERT INTO public.audit_logs_v2 (tenant_id, user_id, acao, recurso_id, motivo_declarado)
        VALUES (
            NEW.tenant_id, 
            COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), 
            'seguranca.usuario.revogado_por_desligamento', 
            NEW.id, 
            'Desligamento de colaborador via RH'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_revogar_acesso_desligamento_v2 ON public.funcionarios;
CREATE TRIGGER trg_revogar_acesso_desligamento_v2
AFTER UPDATE ON public.funcionarios
FOR EACH ROW EXECUTE FUNCTION public.fn_revogar_acesso_desligamento_v2();

-- ==============================================================================
-- 8. RPC: Resolver permissões com herança de perfil
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_resolve_user_permissions(p_user_id UUID)
RETURNS TABLE(
    permission_key TEXT,
    scope scope_type,
    source TEXT
) AS $$
DECLARE
    v_perfil_id UUID;
    v_current_perfil UUID;
    v_depth INTEGER := 0;
BEGIN
    -- Buscar perfil do usuário
    SELECT us.perfil_id INTO v_perfil_id
    FROM public.usuarios_sistema us
    WHERE us.id = p_user_id AND us.status = 'ativo';
    
    IF v_perfil_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Resolver herança de perfis (até 3 níveis)
    v_current_perfil := v_perfil_id;
    WHILE v_current_perfil IS NOT NULL AND v_depth < 3 LOOP
        RETURN QUERY
        SELECT p.key, pp.scope_type, 'perfil'::TEXT
        FROM public.perfil_permissions pp
        JOIN public.permissions p ON p.id = pp.permission_id
        WHERE pp.perfil_id = v_current_perfil;
        
        SELECT pa.parent_perfil_id INTO v_current_perfil
        FROM public.perfis_acesso pa
        WHERE pa.id = v_current_perfil;
        
        v_depth := v_depth + 1;
    END LOOP;
    
    -- Adicionar overrides (allow) e remover (deny)
    RETURN QUERY
    SELECT p.key, 'toda_escola'::scope_type, 'override_allow'::TEXT
    FROM public.user_permission_overrides upo
    JOIN public.permissions p ON p.id = upo.permission_id
    WHERE upo.user_id = p_user_id AND upo.status = 'allow';
    
    -- Nota: overrides 'deny' são processados no frontend
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 9. ISOLAMENTO ABSOLUTO MULTI-TENANT (RLS COM JWT CLAIMS)
-- ==============================================================================

ALTER TABLE public.cargos_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionario_cargos_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs_v2 ENABLE ROW LEVEL SECURITY;

-- Políticas de Isolamento por tenant
CREATE POLICY "tenant_isolation_cargos_v2" ON public.cargos_v2 FOR ALL 
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "tenant_isolation_perfis" ON public.perfis_acesso FOR ALL 
USING (tenant_id IS NULL OR tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "tenant_isolation_usuarios_sistema" ON public.usuarios_sistema FOR ALL 
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "tenant_isolation_overrides" ON public.user_permission_overrides FOR ALL 
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "tenant_isolation_workflows" ON public.approval_workflows FOR ALL 
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Audit Logs: Insert e Select apenas (imutáveis)
CREATE POLICY "tenant_isolation_audit_v2_select" ON public.audit_logs_v2 FOR SELECT 
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "tenant_isolation_audit_v2_insert" ON public.audit_logs_v2 FOR INSERT 
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Perfil_permissions: acesso via join com perfis_acesso (precisa de policy separada)
CREATE POLICY "perfil_permissions_access" ON public.perfil_permissions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.perfis_acesso pa
        WHERE pa.id = perfil_permissions.perfil_id
        AND (pa.tenant_id IS NULL OR pa.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    )
);

-- funcionario_cargos_v2: acesso via join com funcionarios
CREATE POLICY "funcionario_cargos_v2_access" ON public.funcionario_cargos_v2 FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.funcionarios f
        WHERE f.id = funcionario_cargos_v2.funcionario_id
        AND f.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
);

-- ==============================================================================
-- 10. ÍNDICES DE PERFORMANCE PARA RBAC
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_usuarios_sistema_funcionario ON public.usuarios_sistema(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_sistema_tenant ON public.usuarios_sistema(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_sistema_perfil ON public.usuarios_sistema(perfil_id);
CREATE INDEX IF NOT EXISTS idx_perfil_permissions_perfil ON public.perfil_permissions(perfil_id);
CREATE INDEX IF NOT EXISTS idx_overrides_user ON public.user_permission_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_v2_tenant_recurso ON public.audit_logs_v2(tenant_id, recurso_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_v2_created ON public.audit_logs_v2(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cargos_v2_tenant ON public.cargos_v2(tenant_id);
CREATE INDEX IF NOT EXISTS idx_perfis_acesso_tenant ON public.perfis_acesso(tenant_id);
CREATE INDEX IF NOT EXISTS idx_perfis_acesso_parent ON public.perfis_acesso(parent_perfil_id);

-- ==============================================================================
-- 11. SEED: MÓDULOS PADRÃO DO SISTEMA
-- ==============================================================================

INSERT INTO public.system_modules (key, nome, icone, ordem) VALUES
    ('dashboard', 'Dashboard', 'LayoutDashboard', 0),
    ('academico', 'Acadêmico', 'GraduationCap', 10),
    ('comunicacao', 'Comunicação', 'Megaphone', 20),
    ('financeiro', 'Financeiro', 'CreditCard', 30),
    ('gestao', 'Gestão', 'Briefcase', 40),
    ('configuracoes', 'Configurações', 'Settings', 50)
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- 12. SEED: CATÁLOGO DE PERMISSÕES PADRÃO
-- ==============================================================================

INSERT INTO public.permissions (key, modulo_key, recurso, acao, descricao, requires_approval) VALUES
    -- Dashboard
    ('dashboard.view', 'dashboard', 'dashboard', 'view', 'Visualizar dashboard principal', false),
    ('dashboard.export', 'dashboard', 'dashboard', 'export', 'Exportar dados do dashboard', false),
    
    -- Acadêmico - Alunos
    ('academico.alunos.view', 'academico', 'alunos', 'view', 'Visualizar lista de alunos', false),
    ('academico.alunos.create', 'academico', 'alunos', 'create', 'Cadastrar novos alunos', false),
    ('academico.alunos.edit', 'academico', 'alunos', 'edit', 'Editar dados de alunos', false),
    ('academico.alunos.delete', 'academico', 'alunos', 'delete', 'Excluir/inativar alunos', false),
    ('academico.alunos.export', 'academico', 'alunos', 'export', 'Exportar dados de alunos', false),
    
    -- Acadêmico - Matrículas
    ('academico.matriculas.view', 'academico', 'matriculas', 'view', 'Visualizar matrículas', false),
    ('academico.matriculas.create', 'academico', 'matriculas', 'create', 'Criar matrículas', false),
    ('academico.matriculas.edit', 'academico', 'matriculas', 'edit', 'Editar matrículas', false),
    ('academico.matriculas.cancel', 'academico', 'matriculas', 'cancel', 'Cancelar matrículas', true),
    
    -- Acadêmico - Turmas
    ('academico.turmas.view', 'academico', 'turmas', 'view', 'Visualizar turmas', false),
    ('academico.turmas.create', 'academico', 'turmas', 'create', 'Criar turmas', false),
    ('academico.turmas.edit', 'academico', 'turmas', 'edit', 'Editar turmas', false),
    ('academico.turmas.delete', 'academico', 'turmas', 'delete', 'Excluir turmas', false),
    
    -- Acadêmico - Frequência
    ('academico.frequencia.view', 'academico', 'frequencia', 'view', 'Visualizar frequência', false),
    ('academico.frequencia.register', 'academico', 'frequencia', 'register', 'Registrar frequência', false),
    ('academico.frequencia.edit', 'academico', 'frequencia', 'edit', 'Editar registros de frequência', false),
    
    -- Acadêmico - Notas
    ('academico.notas.view', 'academico', 'notas', 'view', 'Visualizar notas/boletim', false),
    ('academico.notas.register', 'academico', 'notas', 'register', 'Registrar notas', false),
    ('academico.notas.edit', 'academico', 'notas', 'edit', 'Editar notas', false),
    
    -- Acadêmico - Livros
    ('academico.livros.view', 'academico', 'livros', 'view', 'Visualizar livros', false),
    ('academico.livros.manage', 'academico', 'livros', 'manage', 'Gerenciar livros', false),
    
    -- Acadêmico - Planos de Aula
    ('academico.planos_aula.view', 'academico', 'planos_aula', 'view', 'Visualizar planos de aula', false),
    ('academico.planos_aula.create', 'academico', 'planos_aula', 'create', 'Criar planos de aula', false),
    ('academico.planos_aula.edit', 'academico', 'planos_aula', 'edit', 'Editar planos de aula', false),
    
    -- Acadêmico - Atividades
    ('academico.atividades.view', 'academico', 'atividades', 'view', 'Visualizar atividades', false),
    ('academico.atividades.create', 'academico', 'atividades', 'create', 'Criar atividades', false),
    ('academico.atividades.edit', 'academico', 'atividades', 'edit', 'Editar atividades', false),
    
    -- Acadêmico - Documentos
    ('academico.documentos.view', 'academico', 'documentos', 'view', 'Visualizar documentos', false),
    ('academico.documentos.create', 'academico', 'documentos', 'create', 'Emitir documentos', false),
    ('academico.documentos.manage', 'academico', 'documentos', 'manage', 'Gerenciar templates de documentos', false),
    
    -- Acadêmico - Portaria
    ('academico.portaria.view', 'academico', 'portaria', 'view', 'Visualizar portaria expresso', false),
    ('academico.portaria.manage', 'academico', 'portaria', 'manage', 'Gerenciar portaria expresso', false),
    
    -- Comunicação - Mural
    ('comunicacao.mural.view', 'comunicacao', 'mural', 'view', 'Visualizar mural de avisos', false),
    ('comunicacao.mural.create', 'comunicacao', 'mural', 'create', 'Criar avisos no mural', false),
    ('comunicacao.mural.edit', 'comunicacao', 'mural', 'edit', 'Editar avisos do mural', false),
    ('comunicacao.mural.delete', 'comunicacao', 'mural', 'delete', 'Excluir avisos do mural', false),
    
    -- Comunicação - Agenda
    ('comunicacao.agenda.view', 'comunicacao', 'agenda', 'view', 'Visualizar agenda/eventos', false),
    ('comunicacao.agenda.create', 'comunicacao', 'agenda', 'create', 'Criar eventos na agenda', false),
    ('comunicacao.agenda.edit', 'comunicacao', 'agenda', 'edit', 'Editar eventos', false),
    ('comunicacao.agenda.delete', 'comunicacao', 'agenda', 'delete', 'Excluir eventos', false),
    
    -- Financeiro - Cobranças
    ('financeiro.cobrancas.view', 'financeiro', 'cobrancas', 'view', 'Visualizar cobranças', false),
    ('financeiro.cobrancas.create', 'financeiro', 'cobrancas', 'create', 'Criar cobranças', false),
    ('financeiro.cobrancas.edit', 'financeiro', 'cobrancas', 'edit', 'Editar cobranças', false),
    ('financeiro.cobrancas.baixa_manual', 'financeiro', 'cobrancas', 'baixa_manual', 'Dar baixa manual em cobrança', true),
    ('financeiro.cobrancas.cancel', 'financeiro', 'cobrancas', 'cancel', 'Cancelar cobranças', true),
    
    -- Financeiro - Faturas
    ('financeiro.fatura.view', 'financeiro', 'fatura', 'view', 'Visualizar faturas', false),
    ('financeiro.fatura.discount', 'financeiro', 'fatura', 'discount', 'Aplicar desconto em fatura', true),
    ('financeiro.fatura.estorno', 'financeiro', 'fatura', 'estorno', 'Estornar fatura', true),
    
    -- Financeiro - Contas a Pagar
    ('financeiro.contas_pagar.view', 'financeiro', 'contas_pagar', 'view', 'Visualizar contas a pagar', false),
    ('financeiro.contas_pagar.create', 'financeiro', 'contas_pagar', 'create', 'Criar contas a pagar', false),
    ('financeiro.contas_pagar.edit', 'financeiro', 'contas_pagar', 'edit', 'Editar contas a pagar', false),
    ('financeiro.contas_pagar.pay', 'financeiro', 'contas_pagar', 'pay', 'Marcar como pago', false),
    
    -- Financeiro - Relatórios
    ('financeiro.relatorios.view', 'financeiro', 'relatorios', 'view', 'Visualizar relatórios financeiros', false),
    ('financeiro.relatorios.export', 'financeiro', 'relatorios', 'export', 'Exportar relatórios financeiros', false),
    
    -- Financeiro - Configurações
    ('financeiro.config.view', 'financeiro', 'config', 'view', 'Visualizar config financeira', false),
    ('financeiro.config.edit', 'financeiro', 'config', 'edit', 'Editar config financeira', false),
    
    -- Gestão - Funcionários
    ('gestao.funcionarios.view', 'gestao', 'funcionarios', 'view', 'Visualizar funcionários', false),
    ('gestao.funcionarios.create', 'gestao', 'funcionarios', 'create', 'Cadastrar funcionários', false),
    ('gestao.funcionarios.edit', 'gestao', 'funcionarios', 'edit', 'Editar dados de funcionários', false),
    ('gestao.funcionarios.desligar', 'gestao', 'funcionarios', 'desligar', 'Desligar funcionários', true),
    ('gestao.funcionarios.create_user', 'gestao', 'funcionarios', 'create_user', 'Criar acesso de sistema para funcionário', false),
    
    -- Gestão - Unidades/Filiais
    ('gestao.filiais.view', 'gestao', 'filiais', 'view', 'Visualizar unidades/filiais', false),
    ('gestao.filiais.create', 'gestao', 'filiais', 'create', 'Criar unidades/filiais', false),
    ('gestao.filiais.edit', 'gestao', 'filiais', 'edit', 'Editar unidades/filiais', false),
    
    -- Gestão - Almoxarifado
    ('gestao.almoxarifado.view', 'gestao', 'almoxarifado', 'view', 'Visualizar almoxarifado', false),
    ('gestao.almoxarifado.manage', 'gestao', 'almoxarifado', 'manage', 'Gerenciar almoxarifado', false),
    
    -- Gestão - Perfil Escola
    ('gestao.perfil_escola.view', 'gestao', 'perfil_escola', 'view', 'Visualizar perfil da escola', false),
    ('gestao.perfil_escola.edit', 'gestao', 'perfil_escola', 'edit', 'Editar perfil da escola', false),
    
    -- Gestão - Plano/Assinatura
    ('gestao.plano.view', 'gestao', 'plano', 'view', 'Visualizar plano/assinatura', false),
    ('gestao.plano.manage', 'gestao', 'plano', 'manage', 'Gerenciar plano/assinatura', false),
    
    -- Configurações - RBAC
    ('configuracoes.perfis.view', 'configuracoes', 'perfis', 'view', 'Visualizar perfis de acesso', false),
    ('configuracoes.perfis.manage', 'configuracoes', 'perfis', 'manage', 'Gerenciar perfis de acesso', false),
    ('configuracoes.auditoria.view', 'configuracoes', 'auditoria', 'view', 'Visualizar logs de auditoria', false),
    ('configuracoes.aprovacoes.view', 'configuracoes', 'aprovacoes', 'view', 'Visualizar fluxos de aprovação', false),
    ('configuracoes.aprovacoes.manage', 'configuracoes', 'aprovacoes', 'manage', 'Gerenciar fluxos de aprovação', false)
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- 13. SEED: PERFIS PADRÃO DO SISTEMA (Templates Fluxoo)
-- ==============================================================================

-- Perfil: Professor (Base)
INSERT INTO public.perfis_acesso (id, tenant_id, nome, descricao, parent_perfil_id)
VALUES ('a0000001-0000-0000-0000-000000000001', NULL, 'Professor', 'Acesso básico para professores - frequência, notas, planos de aula', NULL)
ON CONFLICT DO NOTHING;

-- Perfil: Secretária
INSERT INTO public.perfis_acesso (id, tenant_id, nome, descricao, parent_perfil_id)
VALUES ('a0000001-0000-0000-0000-000000000002', NULL, 'Secretária', 'Acesso administrativo - alunos, matrículas, documentos, mural', NULL)
ON CONFLICT DO NOTHING;

-- Perfil: Coordenador Pedagógico (herda de Professor)
INSERT INTO public.perfis_acesso (id, tenant_id, nome, descricao, parent_perfil_id)
VALUES ('a0000001-0000-0000-0000-000000000003', NULL, 'Coordenador Pedagógico', 'Coordenação pedagógica - herda professor + gestão de turmas/notas', 'a0000001-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Perfil: Diretor Financeiro
INSERT INTO public.perfis_acesso (id, tenant_id, nome, descricao, parent_perfil_id)
VALUES ('a0000001-0000-0000-0000-000000000004', NULL, 'Diretor Financeiro', 'Acesso total ao financeiro + aprovação de ações críticas', NULL)
ON CONFLICT DO NOTHING;

-- Perfil: Administrador (Full Access)
INSERT INTO public.perfis_acesso (id, tenant_id, nome, descricao, parent_perfil_id)
VALUES ('a0000001-0000-0000-0000-000000000005', NULL, 'Administrador', 'Acesso total ao sistema - todas as permissões', NULL)
ON CONFLICT DO NOTHING;

-- Vincular permissões ao perfil Professor
INSERT INTO public.perfil_permissions (perfil_id, permission_id, scope_type)
SELECT 'a0000001-0000-0000-0000-000000000001', p.id, 
    CASE 
        WHEN p.key LIKE '%frequencia%' THEN 'minhas_turmas'::scope_type
        WHEN p.key LIKE '%notas%' THEN 'minhas_turmas'::scope_type
        WHEN p.key LIKE '%planos_aula%' THEN 'self'::scope_type
        WHEN p.key LIKE '%atividades%' THEN 'self'::scope_type
        ELSE 'toda_escola'::scope_type
    END
FROM public.permissions p
WHERE p.key IN (
    'dashboard.view',
    'academico.frequencia.view', 'academico.frequencia.register',
    'academico.notas.view', 'academico.notas.register',
    'academico.planos_aula.view', 'academico.planos_aula.create', 'academico.planos_aula.edit',
    'academico.atividades.view', 'academico.atividades.create', 'academico.atividades.edit',
    'academico.turmas.view',
    'academico.alunos.view',
    'comunicacao.mural.view'
)
ON CONFLICT (perfil_id, permission_id) DO NOTHING;

-- Vincular permissões ao perfil Secretária
INSERT INTO public.perfil_permissions (perfil_id, permission_id, scope_type)
SELECT 'a0000001-0000-0000-0000-000000000002', p.id, 'toda_escola'::scope_type
FROM public.permissions p
WHERE p.key IN (
    'dashboard.view',
    'academico.alunos.view', 'academico.alunos.create', 'academico.alunos.edit',
    'academico.matriculas.view', 'academico.matriculas.create', 'academico.matriculas.edit',
    'academico.turmas.view',
    'academico.frequencia.view',
    'academico.documentos.view', 'academico.documentos.create',
    'academico.portaria.view', 'academico.portaria.manage',
    'comunicacao.mural.view', 'comunicacao.mural.create', 'comunicacao.mural.edit',
    'comunicacao.agenda.view', 'comunicacao.agenda.create', 'comunicacao.agenda.edit',
    'financeiro.cobrancas.view', 'financeiro.cobrancas.create',
    'gestao.funcionarios.view'
)
ON CONFLICT (perfil_id, permission_id) DO NOTHING;

-- Vincular permissões ao perfil Diretor Financeiro
INSERT INTO public.perfil_permissions (perfil_id, permission_id, scope_type)
SELECT 'a0000001-0000-0000-0000-000000000004', p.id, 'toda_escola'::scope_type
FROM public.permissions p
WHERE p.key LIKE 'financeiro.%'
   OR p.key = 'dashboard.view'
   OR p.key = 'dashboard.export'
   OR p.key = 'gestao.funcionarios.view'
ON CONFLICT (perfil_id, permission_id) DO NOTHING;

-- Vincular TODAS as permissões ao perfil Administrador
INSERT INTO public.perfil_permissions (perfil_id, permission_id, scope_type)
SELECT 'a0000001-0000-0000-0000-000000000005', p.id, 'toda_escola'::scope_type
FROM public.permissions p
ON CONFLICT (perfil_id, permission_id) DO NOTHING;
