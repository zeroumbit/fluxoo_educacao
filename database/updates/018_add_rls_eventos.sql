-- ==========================================================
-- POLÍTICAS DE SEGURANÇA (RLS) PARA TABELA EVENTOS
-- ==========================================================

-- 1. Habilitar RLS na tabela eventos
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Gestores podem gerenciar eventos da sua escola" ON public.eventos;

-- 3. Política para Gestores - CRUD completo nos eventos da sua escola
-- Apenas gestores vinculados a uma escola podem criar/editar/excluir eventos
CREATE POLICY "Gestores podem gerenciar eventos da sua escola"
ON public.eventos FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT id FROM public.escolas 
    WHERE gestor_user_id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT id FROM public.escolas 
    WHERE gestor_user_id = auth.uid()
  )
);
