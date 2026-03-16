-- Migration 058: Correção de Triggers e Tabelas de Log
-- Descrição: Cria a tabela logs_financeiros (faltante) e corrige triggers 
--            que apontavam para tabelas inexistentes (contas_receber).

-- 1. Criar tabela de logs financeiros (mencionada em várias triggers mas inexistente)
CREATE TABLE IF NOT EXISTS public.logs_financeiros (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid,
    acao text,
    detalhes jsonb,
    created_at timestamptz DEFAULT now()
);

-- Habilitar RLS por segurança
ALTER TABLE public.logs_financeiros ENABLE ROW LEVEL SECURITY;

-- Política básica para gestores verem logs (mantendo o padrão do sistema)
DROP POLICY IF EXISTS "Gestores podem ver logs do seu tenant" ON public.logs_financeiros;
CREATE POLICY "Gestores podem ver logs do seu tenant" ON public.logs_financeiros
    FOR ALL USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

-- 2. Corrigir função de sincronização de mensalidade (Referência: Migration 055)
CREATE OR REPLACE FUNCTION public.fn_sincronizar_mensalidade_do_aluno()
RETURNS TRIGGER AS $$
DECLARE
    v_valor_mensalidade NUMERIC(10,2);
    v_turma_nome TEXT;
BEGIN
    -- Buscar o valor da mensalidade da nova turma
    SELECT valor_mensalidade, nome INTO v_valor_mensalidade, v_turma_nome
    FROM public.turmas WHERE id = NEW.turma_id;

    -- Atualizar o aluno com o novo valor
    IF FOUND THEN
        UPDATE public.alunos
        SET 
            valor_mensalidade_atual = COALESCE(v_valor_mensalidade, 0),
            updated_at = NOW()
        WHERE id = NEW.aluno_id;

        -- Registrar log (agora seguro pois a tabela foi criada acima)
        INSERT INTO public.logs_financeiros (tenant_id, acao, detalhes)
        VALUES (
            NEW.tenant_id,
            'SINCRONIZACAO_MENSALIDADE',
            jsonb_build_object(
                'aluno_id', NEW.aluno_id,
                'turma_id', NEW.turma_id,
                'turma_nome', v_turma_nome,
                'valor_mensalidade', v_valor_mensalidade,
                'data_operacao', NOW()
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Corrigir geração de fatura proporcional de ingresso (Referência: Migration 037)
-- Mudando 'contas_receber' (inexistente) para 'cobrancas' (tabela real) e ajustando campos
CREATE OR REPLACE FUNCTION public.fn_gerar_primeira_fatura_proporcional()
RETURNS TRIGGER AS $$
DECLARE
    v_valor_final DECIMAL;
BEGIN
    -- Se não houver valor ou data, não cria cobrança
    IF NEW.valor_mensalidade_atual IS NULL OR NEW.valor_mensalidade_atual = 0 OR NEW.data_ingresso IS NULL THEN
        RETURN NEW;
    END IF;

    -- Calcula o valor baseado na regra de proporcionalidade (fn já existe da migração 037)
    v_valor_final := public.fn_calcular_proporcional_ingresso(NEW.valor_mensalidade_atual, NEW.data_ingresso);

    -- Insere na tabela 'cobrancas' (substituindo a 'contas_receber' que falhava)
    INSERT INTO public.cobrancas (
        tenant_id, 
        aluno_id, 
        valor, 
        data_vencimento, 
        status, 
        descricao,
        tipo_cobranca,
        created_at,
        updated_at
    ) VALUES (
        NEW.tenant_id,
        NEW.id,
        v_valor_final,
        COALESCE(NEW.data_ingresso, CURRENT_DATE) + interval '5 days',
        'a_vencer',
        'Mensalidade - Mês de Ingresso (Proporcional)',
        'mensalidade',
        NOW(),
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-garante os comentários
COMMENT ON FUNCTION public.fn_sincronizar_mensalidade_do_aluno() IS 
    'Sincroniza automaticamente o valor da mensalidade do aluno baseado na turma vinculada e registra log financeiro';
