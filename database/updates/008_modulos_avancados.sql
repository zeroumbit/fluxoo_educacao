-- ==========================================
-- SCHEMA: MÓDULOS AVANÇADOS DO PORTAL DAS ESCOLAS
-- Fluxoo Educação — Tabelas para Funcionários, Acadêmico, 
-- Financeiro Avançado, Agenda, Documentos e Almoxarifado
-- Execute no Editor SQL do Supabase
-- ==========================================

-- ==========================================
-- 1. FUNCIONÁRIOS E USUÁRIOS DA ESCOLA
-- ==========================================
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS como_chamado text;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS funcao text;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS salario_bruto numeric(10,2);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS dia_pagamento integer default 5;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS data_admissao date;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS areas_acesso text[] default '{}';
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS status text default 'ativo';
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();

-- ==========================================
-- 2. MATRÍCULAS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.matriculas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    tipo text NOT NULL DEFAULT 'nova' CHECK (tipo IN ('nova', 'rematricula')),
    ano_letivo integer NOT NULL,
    serie_ano text NOT NULL,
    turno text NOT NULL CHECK (turno IN ('manha', 'tarde', 'integral', 'noturno')),
    data_matricula date NOT NULL DEFAULT CURRENT_DATE,
    valor_matricula numeric(10,2) DEFAULT 0,
    status text DEFAULT 'ativa' CHECK (status IN ('ativa', 'cancelada', 'transferida')),
    documentos_urls text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- 3. PLANOS DE AULA
-- ==========================================
CREATE TABLE IF NOT EXISTS public.planos_aula (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    turma_id uuid REFERENCES public.turmas(id) ON DELETE SET NULL,
    disciplina text NOT NULL,
    data_aula date NOT NULL,
    conteudo_previsto text,
    conteudo_realizado text,
    observacoes text,
    professor_id uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- 4. ATIVIDADES E MATERIAIS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.atividades (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    turma_id uuid REFERENCES public.turmas(id) ON DELETE SET NULL,
    titulo text NOT NULL,
    disciplina text,
    tipo_material text CHECK (tipo_material IN ('pdf', 'link_video', 'imagem', 'outro')),
    anexo_url text,
    descricao text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- 5. SELOS / GAMIFICAÇÃO
-- ==========================================
CREATE TABLE IF NOT EXISTS public.selos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    tipo_selo text NOT NULL,
    mensagem text,
    atribuido_por uuid,
    created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 6. EVENTOS DO CALENDÁRIO
-- ==========================================
CREATE TABLE IF NOT EXISTS public.eventos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    nome text NOT NULL,
    data_inicio date NOT NULL,
    data_termino date,
    publico_alvo text DEFAULT 'toda_escola',
    descricao text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- 7. CONFIGURAÇÃO DE RECADOS (CHAT)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.config_recados (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE UNIQUE,
    horario_inicio time DEFAULT '08:00',
    horario_termino time DEFAULT '17:00',
    mensagem_fora_expediente text DEFAULT 'Nosso atendimento funciona em horário comercial. Retornaremos em breve.',
    updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- 8. CONFIGURAÇÕES FINANCEIRAS DA ESCOLA
-- ==========================================
CREATE TABLE IF NOT EXISTS public.config_financeira (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE UNIQUE,
    dia_vencimento_padrao integer DEFAULT 10,
    dias_carencia integer DEFAULT 5,
    multa_atraso_percentual numeric(5,2) DEFAULT 2.00,
    multa_atraso_valor_fixo numeric(10,2) DEFAULT 0,
    juros_mora_mensal numeric(5,2) DEFAULT 1.00,
    desconto_irmaos numeric(5,2) DEFAULT 0,
    desconto_pontualidade numeric(5,2) DEFAULT 0,
    pix_habilitado boolean DEFAULT false,
    chave_pix text,
    qr_code_auto boolean DEFAULT false,
    dinheiro_cartao_presencial boolean DEFAULT true,
    valores_matricula_serie jsonb DEFAULT '{}',
    valores_mensalidade_turma jsonb DEFAULT '{}',
    updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- 9. CONTAS A PAGAR (DESPESAS)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.contas_pagar (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    nome text NOT NULL,
    favorecido text,
    data_vencimento date NOT NULL,
    valor numeric(10,2) NOT NULL,
    recorrente boolean DEFAULT false,
    status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pago')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- 10. PAGAMENTOS (BAIXA MANUAL)
-- ==========================================
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS data_pagamento timestamptz;
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS valor_pago numeric(10,2);
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS forma_pagamento text;
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS ultimos_4_digitos text;
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS bandeira_cartao text;
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS codigo_transacao text;
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS comprovante_url text;
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS parcela_atual integer DEFAULT 1;
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS total_parcelas integer DEFAULT 1;
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS observacoes text;

-- ==========================================
-- 11. TEMPLATES DE DOCUMENTOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.documento_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    tipo text NOT NULL CHECK (tipo IN ('declaracao_matricula', 'historico', 'contrato', 'personalizado')),
    titulo text NOT NULL,
    corpo_html text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- 12. DOCUMENTOS EMITIDOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.documentos_emitidos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    template_id uuid REFERENCES public.documento_templates(id),
    aluno_id uuid REFERENCES public.alunos(id),
    titulo text NOT NULL,
    conteudo_final text NOT NULL,
    status text DEFAULT 'gerado' CHECK (status IN ('gerado', 'enviado_assinatura', 'assinado')),
    created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 13. ALMOXARIFADO
-- ==========================================
CREATE TABLE IF NOT EXISTS public.almoxarifado_itens (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    nome text NOT NULL,
    categoria text,
    quantidade integer NOT NULL DEFAULT 0,
    alerta_estoque_minimo integer DEFAULT 5,
    custo_unitario numeric(10,2) DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.almoxarifado_movimentacoes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    item_id uuid NOT NULL REFERENCES public.almoxarifado_itens(id) ON DELETE CASCADE,
    tipo text NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    quantidade integer NOT NULL,
    justificativa text,
    created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 14. MELHORIAS NAS TURMAS (professores e livros)
-- ==========================================
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS sala text;
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS professores_ids uuid[] DEFAULT '{}';
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS alunos_ids uuid[] DEFAULT '{}';
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS livros text[] DEFAULT '{}';
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo';

-- ==========================================
-- 15. MURAL MELHORADO
-- ==========================================
ALTER TABLE public.mural_avisos ADD COLUMN IF NOT EXISTS publico_alvo text DEFAULT 'toda_escola';
ALTER TABLE public.mural_avisos ADD COLUMN IF NOT EXISTS imagem_url text;
ALTER TABLE public.mural_avisos ADD COLUMN IF NOT EXISTS publicar_imediatamente boolean DEFAULT true;
ALTER TABLE public.mural_avisos ADD COLUMN IF NOT EXISTS data_agendamento timestamptz;

-- ==========================================
-- TRIGGERS updated_at
-- ==========================================
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN VALUES 
        ('matriculas'), ('planos_aula'), ('atividades'), 
        ('eventos'), ('config_financeira'), ('contas_pagar'),
        ('documento_templates'), ('almoxarifado_itens')
    LOOP
        BEGIN
            EXECUTE format(
                'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I 
                FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
                t
            );
        EXCEPTION WHEN OTHERS THEN
            -- trigger já existe
        END;
    END LOOP;
END $$;

-- DESABILITAR RLS nas novas tabelas para evitar travamentos
ALTER TABLE public.matriculas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_aula DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.selos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_recados DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_financeira DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documento_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_emitidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.almoxarifado_itens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.almoxarifado_movimentacoes DISABLE ROW LEVEL SECURITY;
