-- ========================================================
-- 🛒 MIGRATION 135: MARKETPLACE ENHANCED (SUBCATEGORIAS & RBAC FIX)
-- Descrição: Adiciona suporte a subcategorias e corrige o relacionamento
--            do marketplace com o sistema de usuários (RBAC).
-- ========================================================

-- 1. Melhorar Categorias do Marketplace
ALTER TABLE public.marketplace_categorias 
ADD COLUMN IF NOT EXISTS subcategorias JSONB DEFAULT '[]'::jsonb;

-- Garantir que a coluna 'ativo' existe (caso não tenha rodado 062 corretamente)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketplace_categorias' AND column_name='ativo') THEN
        ALTER TABLE public.marketplace_categorias ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 2. Corrigir Relacionamento de Profissionais (Curriculos)
-- PostgREST (Supabase) precisa de uma FK clara para permitir o join select '*, usuarios_sistema(*)'
-- Como vário profissionais não são necessariamente funcionários da escola,
-- garantimos que a vinculação via user_id -> usuarios_sistema(id) seja possível.
-- Nota: usuarios_sistema.id possui o mesmo valor de auth.users.id.

ALTER TABLE public.curriculos
DROP CONSTRAINT IF EXISTS curriculos_usuarios_sistema_fkey;

ALTER TABLE public.curriculos
ADD CONSTRAINT curriculos_usuarios_sistema_fkey 
FOREIGN KEY (user_id) REFERENCES public.usuarios_sistema(id)
ON DELETE CASCADE;

-- 3. Corrigir Relacionamento de Lojistas
ALTER TABLE public.lojistas
DROP CONSTRAINT IF EXISTS lojistas_usuarios_sistema_fkey;

ALTER TABLE public.lojistas
ADD CONSTRAINT lojistas_usuarios_sistema_fkey 
FOREIGN KEY (user_id) REFERENCES public.usuarios_sistema(id)
ON DELETE CASCADE;

-- 4. Criar índices para performance de Marketplace
CREATE INDEX IF NOT EXISTS idx_marketplace_categorias_ativo ON public.marketplace_categorias(ativo) WHERE ativo = true;

-- Comentários explicativos
COMMENT ON COLUMN public.marketplace_categorias.subcategorias IS 'Lista de subcategorias (tags) em formato JSONB';
COMMENT ON CONSTRAINT curriculos_usuarios_sistema_fkey ON public.curriculos IS 'Permite join com dados de usuário (email, perfil) no Marketplace';
