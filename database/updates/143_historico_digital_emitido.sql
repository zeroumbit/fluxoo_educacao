-- ==============================================================================
-- 📜 MIGRATION: HISTÓRICO ESCOLAR DIGITAL / GUIA DE SAÍDA
-- Objetivo: Rastreabilidade, Autenticidade (Hash) e Snapshot LGPD-Compliant
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.historicos_digitais_emitidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    transferencia_id UUID REFERENCES public.transferencias_escolares(id) ON DELETE SET NULL,
    
    validation_hash VARCHAR(64) UNIQUE NOT NULL,
    payload_snapshot JSONB NOT NULL, -- Foto exata dos dados na emissão (Imutável)
    storage_path TEXT, -- Link para o PDF gerado no Supabase Storage
    
    status TEXT NOT NULL DEFAULT 'rascunho' 
        CHECK (status IN ('rascunho', 'final_emitido', 'revogado')),
        
    emitido_em TIMESTAMPTZ DEFAULT NOW(),
    emitido_por UUID NOT NULL, -- auth.users.id
    
    -- Auditoria base
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices otimizados para busca
CREATE INDEX IF NOT EXISTS idx_historicos_tenant ON public.historicos_digitais_emitidos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_historicos_aluno ON public.historicos_digitais_emitidos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_historicos_hash ON public.historicos_digitais_emitidos(validation_hash);

-- RLS (Row Level Security)
ALTER TABLE public.historicos_digitais_emitidos ENABLE ROW LEVEL SECURITY;

-- Escolas só veem os históricos que emitiram
CREATE POLICY "Historicos_Select_Tenant" ON public.historicos_digitais_emitidos
FOR SELECT TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Apenas escolas podem inserir
CREATE POLICY "Historicos_Insert_Tenant" ON public.historicos_digitais_emitidos
FOR INSERT TO authenticated
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Atualização restrita (ex: revogação)
CREATE POLICY "Historicos_Update_Tenant" ON public.historicos_digitais_emitidos
FOR UPDATE TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
