-- ==========================================================
-- 💰 MOTOR DE OVERRIDES E AUDITORIA FINANCEIRA
-- Descrição: Implementação da regra "Descontos SEMPRE Manuais"
-- ==========================================================

-- 1. Tipos de Override Permitidos (Regra 1.1)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_override_financeiro') THEN
        CREATE TYPE tipo_override_financeiro AS ENUM (
            'desconto_pontual', 
            'desconto_permanente', 
            'acordo', 
            'negociacao'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'motivo_override_financeiro') THEN
        CREATE TYPE motivo_override_financeiro AS ENUM (
            'vinculo_familiar', 
            'bolsa_merito', 
            'bolsa_atleta', 
            'bolsa_funcionario', 
            'retencao_evasao',
            'promocional',
            'outro'
        );
    END IF;
END $$;

-- 2. Tabela de Overrides Ativos (Onde a decisão da escola fica salva)
CREATE TABLE IF NOT EXISTS public.overrides_financeiros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.escolas(id),
    aluno_id UUID NOT NULL REFERENCES public.alunos(id),
    
    tipo tipo_override_financeiro NOT NULL,
    motivo motivo_override_financeiro NOT NULL,
    detalhes_motivo TEXT, -- Campo de texto livre obrigatório se motivo for 'outro'
    
    -- A escola define se o desconto é fixo em R$ ou percentual
    percentual_desconto DECIMAL(5,2), 
    valor_fixo_desconto DECIMAL(10,2),
    teto_maximo_desconto DECIMAL(10,2), -- Regra 6.2 (Melhoria Integrada: Limite de impacto em reajustes)
    
    vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    vigencia_fim DATE, -- NULL significa permanente até o aluno sair
    
    -- Flag para a Matriz de Decisão (Regra 6.5)
    -- Quando a turma mudar de valor, o sistema verifica esta flag para saber se deve perguntar à escola
    recalcular_automatico_em_reajuste BOOLEAN DEFAULT FALSE,
    
    -- AUDITORIA (Quem aplicou o desconto)
    aplicado_por UUID NOT NULL REFERENCES auth.users(id),
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'revogado', 'expirado')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Oportunidades Ignoradas (Melhoria Integrada - Resumo das Mudanças)
-- Salva as sugestões de desconto familiar que a escola clicou em "IGNORAR"
CREATE TABLE IF NOT EXISTS public.alertas_financeiros_ignorados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.escolas(id),
    aluno_id UUID NOT NULL REFERENCES public.alunos(id),
    tipo_alerta TEXT NOT NULL, -- Ex: 'sugestao_desconto_familiar'
    ignorado_por UUID NOT NULL REFERENCES auth.users(id),
    ignorado_ate DATE, -- Pode ser ignorado por 30 dias ou NULL (para sempre)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Gatilhos de Segurança e RLS
ALTER TABLE public.overrides_financeiros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "RLS Overrides" ON public.overrides_financeiros;
CREATE POLICY "RLS Overrides" ON public.overrides_financeiros FOR ALL USING (tenant_id = public.uid_tenant());

DROP TRIGGER IF EXISTS trg_overrides_updated_at ON public.overrides_financeiros;
CREATE TRIGGER trg_overrides_updated_at
BEFORE UPDATE ON public.overrides_financeiros
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.alertas_financeiros_ignorados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "RLS Alertas Ignorados" ON public.alertas_financeiros_ignorados;
CREATE POLICY "RLS Alertas Ignorados" ON public.alertas_financeiros_ignorados FOR ALL USING (tenant_id = public.uid_tenant());
