-- ==============================================================================
-- 🚨 MIGRATION 141: Ecossistema de Alertas do Professor (Fluxoo EDU)
-- Descrição: Expansão do motor de alertas para apoiar a visão micro do docente.
-- Categorias: Pedagógicos, Frequência, Cuidado/Inclusão e Operacionais.
-- ==============================================================================

-- 1. Criação/Garantia da Tabela Base (Caso não exista em alguma instância)
-- Nota: O usuário informou que ela já existe com auditoria, mas garantimos aqui os campos.
CREATE TABLE IF NOT EXISTS public.alertas_alunos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    aluno_id UUID, -- NULL para alertas operacionais do próprio professor
    usuario_id UUID, -- ID do autor ou professor vinculado (para operacional)
    tipo TEXT NOT NULL, -- Enum/Check será atualizado abaixo
    gravidade TEXT NOT NULL DEFAULT 'media' CHECK (gravidade IN ('baixa', 'media', 'alta', 'critica')),
    titulo TEXT NOT NULL,
    descricao TEXT,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'arquivado')),
    dados_origem JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Atualização dos Tipos (Alterando o CHECK de tipo)
-- Removemos o check antigo se houver e adicionamos o novo com as 4 categorias solicitadas + legados se houver.
ALTER TABLE public.alertas_alunos DROP CONSTRAINT IF EXISTS alertas_alunos_tipo_check;
ALTER TABLE public.alertas_alunos ADD CONSTRAINT alertas_alunos_tipo_check 
    CHECK (tipo IN ('pedagogico', 'frequencia', 'saude', 'inclusao', 'operacional_prof', 'financeiro', 'evasao'));

-- 3. Índices Estratégicos
CREATE INDEX IF NOT EXISTS idx_alertas_alunos_tenant_aluno ON public.alertas_alunos(tenant_id, aluno_id) WHERE aluno_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_alertas_alunos_professor ON public.alertas_alunos(usuario_id) WHERE aluno_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_alertas_alunos_status ON public.alertas_alunos(status);

-- 4. View Otimizada: Alertas do Professor
-- Esta view faz o isolamento para que o professor veja:
--   a) Alertas dos alunos que estão em turmas onde ele leciona.
--   b) Alertas operacionais vinculados ao ID de usuário dele.
CREATE OR REPLACE VIEW public.vw_alertas_professor WITH (security_invoker = on) AS
SELECT DISTINCT ON (a.id)
    a.id,
    a.tenant_id,
    a.aluno_id,
    al.nome_completo AS aluno_nome,
    al.nome_social   AS aluno_nome_social,
    al.foto_url      AS aluno_foto_url,
    a.tipo,
    a.gravidade,
    a.titulo,
    a.descricao,
    a.status,
    a.dados_origem,
    a.created_at,
    -- Contexto da turma/disciplina (opcional para o widget)
    t.nome AS turma_nome,
    tp.professor_id -- Usado para o filtro de RLS da View se necessário
FROM public.alertas_alunos a
LEFT JOIN public.alunos al ON a.aluno_id = al.id
-- Join para descobrir quais alunos pertencem às turmas do professor
LEFT JOIN public.matriculas m ON m.aluno_id = a.aluno_id AND m.status = 'ativa'
LEFT JOIN public.turmas t ON t.id = m.turma_id
LEFT JOIN public.turma_professores tp ON tp.turma_id = t.id
WHERE 
    -- Alertas de Alunos: Professor deve dar aula para a turma do aluno
    (a.aluno_id IS NOT NULL AND tp.status = 'ativo')
    OR 
    -- Alertas Operacionais: Vinculados diretamente ao professor (usuario_id)
    (a.aluno_id IS NULL AND a.usuario_id IS NOT NULL);

-- 5. RPC para Concluir Alerta (com Trilha de Auditoria)
-- Como solicitado, manter o padrão de auditoria do sistema.
CREATE OR REPLACE FUNCTION public.concluir_alerta_professor(
    p_alerta_id UUID,
    p_observacao TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_usuario_id UUID;
    v_usuario_nome TEXT;
    v_tenant_id UUID;
    v_aluno_nome TEXT;
BEGIN
    v_usuario_id := (auth.jwt() ->> 'sub')::uuid;
    
    -- Busca dados do alerta
    SELECT 
        tenant_id, 
        COALESCE((SELECT nome_completo FROM public.alunos WHERE id = aluno_id), 'OPERACIONAL')
    INTO v_tenant_id, v_aluno_nome
    FROM public.alertas_alunos 
    WHERE id = p_alerta_id;

    -- Update do status
    UPDATE public.alertas_alunos
    SET 
        status = 'concluido',
        updated_at = NOW()
    WHERE id = p_alerta_id;

    -- Registro no Histórico (Trilha de Auditoria)
    INSERT INTO public.alertas_historico (
        tenant_id,
        alerta_id,
        aluno_nome,
        status_anterior,
        status_novo,
        observacao,
        usuario_id,
        data_acao
    ) VALUES (
        v_tenant_id,
        p_alerta_id,
        v_aluno_nome,
        'ativo',
        'concluido',
        p_observacao,
        v_usuario_id,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS (Garantindo que professor só veja o seu)
ALTER TABLE public.alertas_alunos ENABLE ROW LEVEL SECURITY;

-- Drop policy existente (idempotente)
DROP POLICY IF EXISTS "Professores visualizam alertas de seus alunos e operacionais" ON public.alertas_alunos;

-- Política para Professores
CREATE POLICY "Professores visualizam alertas de seus alunos e operacionais"
    ON public.alertas_alunos
    FOR SELECT
    TO authenticated
    USING (
        -- Alerta operacional do próprio professor
        (aluno_id IS NULL AND (auth.jwt() ->> 'sub')::uuid = usuario_id)
        OR
        -- Alerta de aluno das turmas do professor
        (aluno_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.turma_professores tp
            JOIN public.matriculas m ON m.turma_id = tp.turma_id
            WHERE m.aluno_id = public.alertas_alunos.aluno_id
              AND tp.professor_id = (auth.jwt() ->> 'sub')::uuid
              AND tp.status = 'ativo'
        ))
    );

COMMENT ON VIEW public.vw_alertas_professor IS 'Visão consolidada de alertas para o cockpit do professor (Micro-visão).';
