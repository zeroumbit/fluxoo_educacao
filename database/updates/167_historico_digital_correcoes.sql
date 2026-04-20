-- ==============================================================================
-- Correção da tabela historicos_digitais_emitidos para suportar transferências
-- ==============================================================================

-- 1. Adicionar coluna de transferência que referencia a tabela correta
ALTER TABLE public.historicos_digitais_emitidos 
ADD COLUMN IF NOT EXISTS transferencia_id_new UUID REFERENCES public.transferencias(id) ON DELETE SET NULL;

-- 2. Migrar dados se houver
UPDATE public.historicos_digitais_emitidos h
SET transferencia_id_new = (
  SELECT t.id FROM public.transferencias t 
  WHERE t.aluno_id = h.aluno_id 
  ORDER BY t.created_at DESC 
  LIMIT 1
)
WHERE transferencia_id_new IS NULL;

-- 3. Remover coluna antiga se existir e renomear
ALTER TABLE public.historicos_digitais_emitidos 
DROP COLUMN IF EXISTS transferencia_id;

ALTER TABLE public.historicos_digitais_emitidos 
RENAME COLUMN transferencia_id_new TO transferencia_id;

-- 4. Renomear coluna emitido_por para criado_por se necessário
ALTER TABLE public.historicos_digitais_emitidos 
ADD COLUMN IF NOT EXISTS criado_por UUID;

UPDATE public.historicos_digitais_emitidos
SET criado_por = emitido_por
WHERE criado_por IS NULL;

-- 5. Criar política RLS adicional para visualização de históricos no portal
DROP POLICY IF EXISTS "Historicos_Select_Aluno" ON public.historicos_digitais_emitidos;
CREATE POLICY "Historicos_Select_Aluno" ON public.historicos_digitais_emitidos
FOR SELECT TO authenticated
USING (
  aluno_id IN (
    SELECT aluno_id FROM public.matriculas 
    WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  )
);

-- 6. Criar bucket de storage se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('historicos_oficiais', 'historicos_oficiais', true, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- 7. Configurar políticas de storage para o bucket
DROP POLICY IF EXISTS "Historicos_Storage_Public_Read" ON storage.objects;
CREATE POLICY "Historicos_Storage_Public_Read" ON storage.objects
FOR SELECT USING (bucket_id = 'historicos_oficiais');

DROP POLICY IF EXISTS "Historicos_Storage_Auth_Write" ON storage.objects;
CREATE POLICY "Historicos_Storage_Auth_Write" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'historicos_oficiais' AND auth.role() = 'authenticated');

-- 8. Adicionar coluna para tracking de status via RPC
ALTER TABLE public.historicos_digitais_emitidos 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente_geracao' 
CHECK (status IN ('pendente_geracao', 'final_emitido', 'revogado'));