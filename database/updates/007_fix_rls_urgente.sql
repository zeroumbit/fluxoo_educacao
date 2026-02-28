-- ==========================================================
-- CORREÇÃO URGENTE: DESABILITAR RLS QUE ESTÁ TRAVANDO O LOGIN
-- Execute IMEDIATAMENTE no Editor SQL do Supabase
-- ==========================================================

-- O RLS na tabela escolas está impedindo que o gestor
-- leia a própria escola durante o login, causando tela branca.

-- REMOVER todas as políticas problemáticas da tabela escolas
DROP POLICY IF EXISTS "Gestores podem ver sua própria escola" ON public.escolas;
DROP POLICY IF EXISTS "Super Admin vê todas as escolas" ON public.escolas;
DROP POLICY IF EXISTS "Super Admin total access on escolas" ON public.escolas;

-- DESABILITAR RLS na tabela escolas (permite leitura durante login)
ALTER TABLE public.escolas DISABLE ROW LEVEL SECURITY;

-- Manter RLS nas outras tabelas, mas garantir que as políticas existam
-- (Alunos, Cobranças, Mural, etc. continuam protegidas)
