-- Migration 033: QRCode de Pagamento PIX
-- Permite que a escola salve uma imagem de QR Code para exibir aos pais

-- 1. Adicionar a coluna para armazenar a URL da imagem nas configurações financeiras
ALTER TABLE public.config_financeira 
ADD COLUMN IF NOT EXISTS pix_qr_code_url text;

-- 2. Garantir que o bucket para as fotos seja público (se já não houver um geral)
-- Usaremos o bucket 'comprovantes' ou 'public' se existir. 
-- Mas para organização, vamos usar o 'comprovantes' que já existe e é público.
