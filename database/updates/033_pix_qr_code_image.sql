-- Migration 033: QRCode de Pagamento PIX e Bucket de Armazenamento
-- Garante que a escola possa salvar imagens de QR Code e que elas sejam visíveis no portal

-- 1. Adicionar a coluna para armazenar a URL da imagem nas configurações financeiras
ALTER TABLE public.config_financeira 
ADD COLUMN IF NOT EXISTS pix_qr_code_url text;

-- 2. Garantir que o bucket de armazenamento exista e seja público
-- Nota: Supabase storage buckets e policies precisam ser configurados via dashboard ou comandos específicos.
-- Aqui seguem as instruções/comandos SQL para garantir permissões de acesso público para leitura.

-- Criar o bucket se não existir (Requer extensões de storage habilitadas)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('comprovantes', 'comprovantes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Adicionar política para permitir acesso público de leitura aos arquivos no bucket 'comprovantes'
CREATE POLICY "Acesso Público para Leitura de Comprovantes" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'comprovantes');

-- Adicionar política para permitir upload por usuários autenticados (opcional, se desejar restringir)
-- Aqui simplificamos permitindo que o admin envie via dashboard ou as chaves anon/service_role
CREATE POLICY "Usuários Autenticados podem fazer Upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'comprovantes');
