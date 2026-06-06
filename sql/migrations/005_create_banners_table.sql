-- ============================================================
-- Migração 005: Criar Tabela e Storage de Banners
-- ============================================================

-- 1. Criar tabela de banners
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    link_redirecionamento TEXT NOT NULL,
    cidade TEXT NOT NULL,
    url_imagem TEXT NOT NULL,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativo', -- 'ativo' ou 'inativo'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Ativar Row Level Security (RLS)
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 3. Política Universal de Escrita/Leitura para Super Admin
DROP POLICY IF EXISTS "banners_super_admin_all" ON public.banners;
CREATE POLICY "banners_super_admin_all" ON public.banners
FOR ALL TO authenticated
USING (
  (auth.jwt() ->> 'is_super_admin')::boolean = true
  OR auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin'
)
WITH CHECK (
  (auth.jwt() ->> 'is_super_admin')::boolean = true
  OR auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin'
);

-- 4. Política de Leitura para Escolas (Gestores / Funcionários / Alunos / Responsáveis)
-- Permite leitura de banners ativos no período de vigência para qualquer usuário autenticado.
DROP POLICY IF EXISTS "banners_school_users_select" ON public.banners;
CREATE POLICY "banners_school_users_select" ON public.banners
FOR SELECT TO authenticated
USING (
  status = 'ativo'
  AND data_inicio <= NOW()
  AND data_fim >= NOW()
);

-- 5. Bucket de Storage para Imagens de Banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Políticas de RLS para o bucket 'banners'
DROP POLICY IF EXISTS "Allow public read access on banners" ON storage.objects;
CREATE POLICY "Allow public read access on banners"
ON storage.objects FOR SELECT TO authenticated, anon
USING ( bucket_id = 'banners' );

DROP POLICY IF EXISTS "Allow super admin full control on banners" ON storage.objects;
CREATE POLICY "Allow super admin full control on banners"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'banners'
  AND (
    (auth.jwt() ->> 'is_super_admin')::boolean = true
    OR auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin'
  )
)
WITH CHECK (
  bucket_id = 'banners'
  AND (
    (auth.jwt() ->> 'is_super_admin')::boolean = true
    OR auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin'
  )
);
