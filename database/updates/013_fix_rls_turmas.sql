-- ==========================================================
-- CORREÇÃO: LIBERAR ACESSO À TABELA TURMAS
-- Resolve o erro 403 Forbidden ao criar/editar turmas
-- ==========================================================

-- Desabilitar RLS na tabela turmas para permitir operações CRUD
ALTER TABLE public.turmas DISABLE ROW LEVEL SECURITY;

-- Comentário: Esta tabela é essencial para o módulo acadêmico.
-- Em produção, políticas RLS específicas devem ser implementadas.
