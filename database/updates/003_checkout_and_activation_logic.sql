-- [MANDATORY] Atualização do Banco de Dados para Aprovação e Checkout
-- Suporte ao fluxo de onboarding e ativação automática/manual

-- 1. Adicionar colunas de controle de pagamento e UID do gestor
ALTER TABLE public.escolas 
ADD COLUMN IF NOT EXISTS metodo_pagamento TEXT DEFAULT 'mercado_pago',
ADD COLUMN IF NOT EXISTS gestor_user_id UUID,
ADD COLUMN IF NOT EXISTS data_vencimento_assinatura DATE;

-- 2. Garantir que possamos filtrar escolas por status para a fila de aprovação
CREATE INDEX IF NOT EXISTS idx_escolas_status ON public.escolas(status_assinatura);

-- 3. Comentários para clareza técnica
COMMENT ON COLUMN public.escolas.metodo_pagamento IS 'Metodo escolhido: mercado_pago, pix, ou boleto';
COMMENT ON COLUMN public.escolas.gestor_user_id IS 'ID do usuário no Supabase Auth que cadastrou a escola';
COMMENT ON COLUMN public.escolas.status_assinatura IS 'Status do onboarding: pendente (aguardando pagto), ativa (aprovado), cancelada';

-- 4. Notificar o sistema que o Super Admin tem poder de ativação
-- (Assumindo que o Super Admin já tem acesso total via RLS conforme sugerido anteriormente)
