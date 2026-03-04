-- ==========================================================
-- SCRIPT PARA CRIAR BUCKET DE LIVROS NO SUPABASE
-- ==========================================================

-- 1. Criar o bucket 'livros' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('livros', 'livros', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Segurança para o bucket 'livros'

-- Permitir INSERT para usuários autenticados (Gestores/Staff)
DROP POLICY IF EXISTS "Permitir upload para gestores" ON storage.objects;
CREATE POLICY "Permitir upload para gestores"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'livros');

-- Permitir SELECT (Visualização) para todos (Bucket é público, mas políticas reforçam)
DROP POLICY IF EXISTS "Permitir visualização pública de capas" ON storage.objects;
CREATE POLICY "Permitir visualização pública de capas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'livros');

-- Permitir UPDATE/DELETE para o dono do arquivo (ou gestores do tenant se houver metadados)
DROP POLICY IF EXISTS "Permitir delete para gestores" ON storage.objects;
CREATE POLICY "Permitir delete para gestores"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'livros');

-- 3. Configurações de restrição
UPDATE storage.buckets
SET allowed_mime_types = '{image/jpeg,image/png,image/webp,application/pdf}',
    file_size_limit = 5242880 -- 5MB
WHERE id = 'livros';
