// =====================================================
// [REFERÊNCIA DOCUMENTAL] Edge Function: Webhook Gateway
// Fase Futura: Integração com Asaas / Mercado Pago
// =====================================================
// Esta função servirá como endpoint para receber webhooks 
// dos gateways de pagamento. Ela não está ativa no momento.
// 
// Fluxo esperado:
// 1. Gateway recebe o pagamento do responsável via PIX/Boleto.
// 2. Gateway faz um POST HTTP para esta Edge Function.
// 3. A Edge Function verifica a assinatura (segurança).
// 4. A Edge Function extrai o ID da cobrança e o valor real pago.
// 5. Atualiza o banco (cobrancas) definindo `pago=true`, `valor_pago` = real.
// 6. Insere um registro em `job_logs` ou `audit_logs` para rastrear.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const payload = await req.json()
    // 1. Validar webhook signature (ex: Asaas Headers)
    // 2. Extrair dados
    const evtData = payload.payment
    
    if (payload.event === 'PAYMENT_RECEIVED') {
      const externalId = evtData.externalReference // Nosso cobranca.id
      const valorPago = evtData.value
      const bancoOrigem = evtData.creditCard?.brand || 'PIX'
      
      // 3. Atualizar no Supabase via Service Role Key
      /*
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      
      const { error } = await supabase.rpc('registrar_pagamento_cobranca', {
        p_cobranca_id: externalId,
        p_forma_pagamento: bancoOrigem,
        p_comprovante_url: null,
        p_usuario_id: null // Sistema
      })
      */
      
      return new Response(JSON.stringify({ status: 'success' }), { 
        headers: { "Content-Type": "application/json" } 
      })
    }
    
    return new Response(JSON.stringify({ status: 'ignored' }), { 
      headers: { "Content-Type": "application/json" } 
    })
    
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
})
