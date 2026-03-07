-- ==========================================
-- SOLICITAÇÕES DE DOCUMENTOS (PORTAL DO RESPONSÁVEL)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.document_solicitations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    responsavel_id uuid NOT NULL REFERENCES public.responsaveis(id) ON DELETE CASCADE,
    documento_tipo text NOT NULL,
    observacoes text,
    status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'pronto', 'entregue', 'recusado')),
    documento_emitido_id uuid REFERENCES public.documentos_emitidos(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    analysed_at timestamptz,
    analysed_by uuid REFERENCES public.funcionarios(id) ON DELETE SET NULL
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_document_solicitations_tenant ON public.document_solicitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_solicitations_aluno ON public.document_solicitations(aluno_id);
CREATE INDEX IF NOT EXISTS idx_document_solicitations_responsavel ON public.document_solicitations(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_document_solicitations_status ON public.document_solicitations(status);

-- RLS (Row Level Security)
ALTER TABLE public.document_solicitations ENABLE ROW LEVEL SECURITY;

-- Policy: Escola vê todas as solicitações dos seus alunos (Ajustado para evitar erro 400)
CREATE POLICY "Escolas veem solicitacoes dos seus alunos"
ON public.document_solicitations
FOR ALL
USING (
    tenant_id = (current_setting('app.settings.current_tenant', true))::uuid
);

-- Policy: Responsável vê apenas as suas solicitações
CREATE POLICY "Responsaveis veem suas proprias solicitacoes"
ON public.document_solicitations
FOR ALL
USING (
    responsavel_id IN (
        SELECT id FROM public.responsaveis 
        WHERE user_id = auth.uid()
    )
);

-- Comments
COMMENT ON TABLE public.document_solicitations IS 'Solicitações de documentos feitas pelos responsáveis via portal';
COMMENT ON COLUMN public.document_solicitations.documento_tipo IS 'Tipo de documento solicitado (ex: ficha_matricula, declaracao_matricula, etc)';
COMMENT ON COLUMN public.document_solicitations.observacoes IS 'Observações adicionais do responsável (ex: pedir para enviar pelo aluno)';
COMMENT ON COLUMN public.document_solicitations.status IS 'pendente: aguardando análise | em_analise: sendo processado | pronto: disponível | entregue: entregue ao responsável | recusado: não foi possível criar';
COMMENT ON COLUMN public.document_solicitations.documento_emitido_id IS 'Referência ao documento gerado pela escola (se aplicável)';
