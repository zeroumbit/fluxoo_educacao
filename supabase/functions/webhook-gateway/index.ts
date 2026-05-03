// =====================================================
// Edge Function: Webhook Gateway (Asaas / Mercado Pago)
// Caminho: supabase/functions/webhook-gateway/index.ts
// =====================================================
// Arquitetura MULTI-TENANT:
// 1. Super Admin ativa gateway em gateway_config (ativo_global)
// 2. Cada escola configura seus tokens em gateway_tenant_config
// 3. Edge Function identifica o tenant pelo externalReference
//    e busca as credenciais corretas no banco
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

// =====================================================
// TIPOS
// =====================================================

interface AsaasPaymentEvent {
  event: string
  payment: {
    id: string
    externalReference: string  // nosso cobranca.id (UUID)
    value: number
    netValue: number
    status: string
    billingType: string
    invoiceUrl?: string
    bankSlipUrl?: string
    transactionReceiptUrl?: string
    creditCard?: { brand: string }
    pix?: { transactionReceipt?: string }
    dateCreated: string
    confirmedDate?: string
  }
}

interface MercadoPagoPaymentEvent {
  type: string
  data: { id: string }
  application_id: string
  action: string
  api_version: string
}

interface GatewayTenantConfig {
  tenant_id: string
  gateway: string
  ativo: boolean
  configuracao: Record<string, unknown>
  modo_teste: boolean
}

// =====================================================
// CONSTANTES
// =====================================================

const ASAAS_PROCESSED_STATUSES = ["CONFIRMED", "RECEIVED", "CREDIT_CARD_CAPTURE_CLOSE"]
const GATEWAY_TIMEOUT_MS = 25000
const RATE_LIMIT_WINDOW_MS = 60000 // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 30 // max 30 requests por minuto por IP

// =====================================================
// RATE LIMITING (in-memory)
// =====================================================
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(clientIp: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(clientIp)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS
    rateLimitMap.set(clientIp, { count: 1, resetAt })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt }
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count, resetAt: entry.resetAt }
}

// =====================================================
// HANDLER PRINCIPAL
// =====================================================

serve(async (req: Request) => {
  const timeoutId = setTimeout(() => {
    console.error("[webhook-gateway] TIMEOUT: processamento excedeu limite")
  }, GATEWAY_TIMEOUT_MS)

  try {
    // -----------------------------------------------
    // Rate Limiting - pegar IP do cliente
    // -----------------------------------------------
    const clientIp = getClientIp(req)
    const rateLimit = checkRateLimit(clientIp)

    // Header de rate limit sempre presente (para debug)
    const responseHeaders = new Headers({
      "Content-Type": "application/json",
      "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": new Date(rateLimit.resetAt).toISOString(),
    })

    if (!rateLimit.allowed) {
      console.warn("[webhook-gateway] Rate limit excedido para IP:", clientIp)
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: responseHeaders,
      })
    }

    const contentType = req.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      return jsonResponse(400, { error: "Content-Type deve ser application/json" })
    }

    // Detectar gateway
    const isAsaas = req.headers.has("accessToken") || req.headers.get("user-agent")?.includes("Asaas")
    const isMercadoPago = req.headers.has("x-request-id") && req.headers.has("x-signature")
    // Abacate Pay e outros serão detectados pelo payload ou headers específicos
    // Por enquanto, fallback para validação pelo externalReference
    const isAbacatePay = req.headers.get("user-agent")?.includes("Abacate") || req.headers.has("x-abacate-signature")

    if (!isAsaas && !isMercadoPago && !isAbacatePay) {
      console.warn("[webhook-gateway] Tentativa de acesso com gateway nao identificado")
      return jsonResponse(400, { error: "Gateway nao identificado" })
    }

    let rawBody: string
    try {
      rawBody = await req.text()
    } catch {
      console.warn("[webhook-gateway] Falha ao ler corpo da requisicao")
      return jsonResponse(400, { error: "Falha ao ler corpo da requisicao" })
    }

    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch {
      console.warn("[webhook-gateway] JSON invalido recebido")
      return jsonResponse(400, { error: "JSON invalido" })
    }

    const supabase = createSupabaseClient()

    // Headers para validacao
    const headers = {
      signature: req.headers.get("x-signature") || "",
      timestamp: req.headers.get("x-request-id") || "",
    }

    if (isAsaas) {
      return await handleAsaasWebhook(payload, rawBody, supabase, headers)
    } else if (isMercadoPago) {
      return await handleMercadoPagoWebhook(payload, rawBody, supabase, headers)
    } else if (isAbacatePay) {
      return await handleAbacatePayWebhook(payload, rawBody, supabase, headers)
    }

    return jsonResponse(400, { error: "Gateway nao suportado" })

  } catch (err: any) {
    console.error("[webhook-gateway] Erro CRITICO nao tratado:", err.message, err.stack)
    return jsonResponse(500, { error: "Erro interno do servidor" })
  } finally {
    clearTimeout(timeoutId)
  }
})

// =====================================================
// HANDLER: ASAAS (Multi-Tenant)
// =====================================================

async function handleAsaasWebhook(
  payload: any,
  rawBody: string,
  supabase: any,
  _headers: { signature: string; timestamp: string }
): Promise<Response> {
  try {
    // -----------------------------------------------
    // A) Validar assinatura do webhook
    //    O Asaas envia o token no proprio payload
    // -----------------------------------------------
    const receivedToken = payload.accessToken || ""

    // Primeiro: descobrir qual tenant pertence este evento
    // para depois validar com o token correto
    const cobrancaId = payload.payment?.externalReference

    if (!cobrancaId) {
      return jsonResponse(400, { error: "externalReference (cobranca_id) e obrigatorio" })
    }

    // Buscar cobranca para descobrir o tenant
    const { data: cobranca, error: cobrancaErr } = await supabase
      .from("cobrancas")
      .select("id, tenant_id, valor, status, pago, data_vencimento, deleted_at")
      .eq("id", cobrancaId)
      .is("deleted_at", null)
      .maybeSingle()

    if (cobrancaErr) {
      console.error("[asaas] Erro ao buscar cobranca no banco:", cobrancaErr.message)
      return jsonResponse(500, { error: "Erro interno", retry: true })
    }

    if (!cobranca) {
      console.warn("[asaas] Cobranca nao encontrada para id:", cobrancaId)
      return jsonResponse(404, { error: "Cobranca nao encontrada", cobranca_id: cobrancaId })
    }

    // -----------------------------------------------
    // B) Verificar se o gateway esta ativo para este tenant
    //    (Super Admin ativou globalmente + escola ativou)
    // -----------------------------------------------
    const gatewayCheck = await verificarGatewayAtivo(supabase, cobranca.tenant_id, "asaas")
    if (!gatewayCheck.disponivel) {
      console.warn("[asaas] Gateway nao disponivel para tenant:", cobranca.tenant_id, gatewayCheck.motivo)
      return jsonResponse(403, {
        error: "Gateway nao disponivel para esta escola",
        motivo: gatewayCheck.motivo,
        cobranca_id: cobrancaId
      })
    }

    // -----------------------------------------------
    // C) Validar token com a configuracao da escola
    // -----------------------------------------------
    const tokenValido = await validarTokenAsaas(supabase, cobranca.tenant_id, receivedToken)
    if (!tokenValido) {
      console.warn("[asaas] Token invalido para tenant:", cobranca.tenant_id)
      return jsonResponse(401, { error: "Token de autenticacao invalido" })
    }

    // -----------------------------------------------
    // D) Validar estrutura do evento
    // -----------------------------------------------
    if (!payload.event || !payload.payment || !payload.payment.id) {
      return jsonResponse(400, { error: "Payload invalido" })
    }

    const eventData: AsaasPaymentEvent = payload

    if (!ASAAS_PROCESSED_STATUSES.includes(eventData.payment.status)) {
      console.log("[asaas] Evento ignorado (status nao processavel):", eventData.payment.status)
      return jsonResponse(200, { status: "ignored", reason: `Status ${eventData.payment.status} nao requer acao` })
    }

    // -----------------------------------------------
    // E) Extrair dados
    // -----------------------------------------------
    const gatewayEventId = eventData.payment.id
    const valorPago = eventData.payment.value
    const billingType = eventData.payment.billingType

    console.log("[asaas] Evento recebido:", {
      gatewayEventId, cobrancaId, valorPago, billingType,
      tenant_id: cobranca.tenant_id
    })

    // -----------------------------------------------
    // F) Idempotencia: verificar se ja processou
    // -----------------------------------------------
    const { data: existingEvent } = await supabase
      .from("webhook_events_log")
      .select("id, processing_status, cobranca_id")
      .eq("gateway", "asaas")
      .eq("gateway_event_id", gatewayEventId)
      .maybeSingle()

    if (existingEvent?.processing_status === "processed") {
      console.log("[asaas] Idempotencia: evento ja processado:", gatewayEventId)
      return jsonResponse(200, {
        status: "ignored_duplicate",
        message: "Evento ja processado anteriormente",
        gateway_event_id: gatewayEventId,
        cobranca_id: existingEvent.cobranca_id
      })
    }

    // -----------------------------------------------
    // G) Protecao contra dupla baixa (nivel app)
    // -----------------------------------------------
    if (cobranca.pago === true || cobranca.status === "pago") {
      await logWebhookEvent(supabase, {
        gateway_event_id: gatewayEventId,
        gateway: "asaas",
        tenant_id: cobranca.tenant_id,
        event_type: eventData.event,
        raw_payload: JSON.parse(rawBody),
        cobranca_id: cobrancaId,
        processing_status: "ignored_duplicate",
        processing_details: { reason: "Cobranca ja estava paga" }
      })

      return jsonResponse(200, {
        status: "ignored_duplicate",
        message: "Cobranca ja estava paga",
        cobranca_id: cobrancaId
      })
    }

    // -----------------------------------------------
    // H) Processar pagamento via RPC (com FOR UPDATE)
    // -----------------------------------------------
    const comprovanteUrl = eventData.payment.invoiceUrl
      || eventData.payment.bankSlipUrl
      || eventData.payment.transactionReceiptUrl
      || eventData.payment.pix?.transactionReceipt
      || null

    const formaPagamento = mapAsaasBillingType(billingType)

    const { data: rpcResult, error: rpcError } = await supabase
      .rpc("registrar_pagamento_webhook", {
        p_cobranca_id: cobrancaId,
        p_gateway: "asaas",
        p_gateway_event_id: gatewayEventId,
        p_valor_pago: valorPago,
        p_forma_pagamento: formaPagamento,
        p_codigo_transacao: gatewayEventId,
        p_comprovante_url: comprovanteUrl,
        p_webhook_payload: JSON.parse(rawBody)
      })

    if (rpcError) {
      console.error("[asaas] Erro na RPC:", rpcError.message)
      await logWebhookEvent(supabase, {
        gateway_event_id: gatewayEventId, gateway: "asaas",
        tenant_id: cobranca.tenant_id, event_type: eventData.event,
        raw_payload: JSON.parse(rawBody), cobranca_id: cobrancaId,
        processing_status: "error",
        processing_details: { error: rpcError.message }
      })

      if (rpcError.message?.includes("ja foi paga") || rpcError.message?.includes("bloqueada")) {
        return jsonResponse(200, { status: "ignored", message: rpcError.message })
      }

      return jsonResponse(500, { error: "Erro ao processar pagamento", message: rpcError.message, retry: true })
    }

    if (!rpcResult?.success) {
      console.error("[asaas] RPC sem sucesso:", rpcResult)

      if (rpcResult.error?.includes("ja foi paga")) {
        return jsonResponse(200, { status: "ignored", message: rpcResult.error })
      }

      await logWebhookEvent(supabase, {
        gateway_event_id: gatewayEventId, gateway: "asaas",
        tenant_id: cobranca.tenant_id, event_type: eventData.event,
        raw_payload: JSON.parse(rawBody), cobranca_id: cobrancaId,
        processing_status: "error", processing_details: { error: rpcResult.error }
      })

      return jsonResponse(422, { error: rpcResult.error || "Erro ao processar", retry: rpcResult.retry === true })
    }

    console.log("[asaas] Sucesso:", { cobranca_id: cobrancaId, valor_pago: rpcResult.valor_pago })
    return jsonResponse(200, {
      status: "success", cobranca_id: cobrancaId,
      valor_original: rpcResult.valor_original, valor_pago: rpcResult.valor_pago,
      gateway_event_id: gatewayEventId, gateway: "asaas"
    })

  } catch (err: any) {
    console.error("[asaas] Erro nao tratado:", err.message)
    return jsonResponse(500, { error: "Erro interno no handler Asaas", retry: true })
  }
}

// =====================================================
// HANDLER: MERCADO PAGO (Multi-Tenant)
// =====================================================

async function handleMercadoPagoWebhook(
  payload: any,
  rawBody: string,
  supabase: any,
  headers: { signature: string; timestamp: string }
): Promise<Response> {
  try {
    if (!payload.type || !payload.data || !payload.data.id) {
      return jsonResponse(400, { error: "Payload invalido" })
    }

    // -----------------------------------------------
    // A) Validar assinatura do webhook MP
    //    MP usa x-signature com timestamp no formato: t=timestamp,v1=signature
    // -----------------------------------------------
    const { signature, timestamp } = headers
    if (!signature || !timestamp) {
      console.warn("[mp] Headers x-signature ou x-request-id faltando")
      return jsonResponse(401, { error: "Headers obrigatorios faltando" })
    }

    // Buscar tenant pelo external_reference antes de validar
    // Precisamos do token secret para validar a assinatura
    // Por agora, vamos aceitar e validar o token na configuracao

    const _eventData: MercadoPagoPaymentEvent = payload
    const mpPaymentId = payload.data.id

    if (payload.action !== "payment.created" && payload.action !== "payment.updated") {
      return jsonResponse(200, { status: "ignored", reason: `Acao ${payload.action} nao requer acao` })
    }

    // -----------------------------------------------
    // A) Buscar detalhes na API do MP
    //    (MP so envia o ID no webhook, precisamos buscar o resto)
    // -----------------------------------------------
    // Para MP, precisamos do external_reference para achar o tenant.
    // Vamos buscar o pagamento e depois descobrir o tenant.
    let mpPaymentDetails: any
    try {
      const response = await fetch(
        `https://api.mercadopago.com/v1/payments/${mpPaymentId}`,
        { headers: { "Content-Type": "application/json" } }
        // Sem token ainda - vamos descobrir o tenant primeiro
      )

      if (!response.ok) {
        // Sem token, nao conseguimos acessar.
        // Usar external_reference direto se disponivel no payload de notificacao
        console.warn("[mp] Nao foi buscar detalhes sem token. Tentando notificacao direta.")
        // MP envia o external_reference em alguns payloads
        return jsonResponse(200, { status: "pending_token_config" })
      }

      mpPaymentDetails = await response.json()
    } catch {
      return jsonResponse(500, { error: "Erro ao comunicar com API do MP", retry: true })
    }

    // O ideal e o MP enviar o tenant_id no external_reference
    // Formato sugerido: "tenant_id:cobranca_id"
    const externalRef = mpPaymentDetails.external_reference
    if (!externalRef) {
      return jsonResponse(400, { error: "external_reference e obrigatorio no MP" })
    }

    // Parse: esperamos "cobranca_id" puro ou "tenant_id:cobranca_id"
    let cobrancaId: string
    let tenantIdOverride: string | null = null

    if (externalRef.includes(":")) {
      const parts = externalRef.split(":")
      tenantIdOverride = parts[0]
      cobrancaId = parts[1]
    } else {
      cobrancaId = externalRef
    }

    // Buscar cobranca
    const { data: cobranca } = await supabase
      .from("cobrancas")
      .select("id, tenant_id, valor, status, pago")
      .eq("id", cobrancaId)
      .is("deleted_at", null)
      .maybeSingle()

    if (!cobranca) {
      return jsonResponse(404, { error: "Cobranca nao encontrada", cobranca_id: cobrancaId })
    }

    // Se tenant_id veio override, validar
    const tenantId = tenantIdOverride || cobranca.tenant_id

    // -----------------------------------------------
    // B) Verificar gateway ativo
    // -----------------------------------------------
    const gatewayCheck = await verificarGatewayAtivo(supabase, tenantId, "mercado_pago")
    if (!gatewayCheck.disponivel) {
      return jsonResponse(403, { error: "Gateway nao disponivel", motivo: gatewayCheck.motivo })
    }

    // -----------------------------------------------
    // C) Buscar token do MP da escola
    // -----------------------------------------------
    const mpConfig = await buscarConfigGateway(supabase, tenantId, "mercado_pago")
    if (!mpConfig) {
      return jsonResponse(500, { error: "Gateway nao configurado pela escola" })
    }

    const mpAccessToken = mpConfig.configuracao.access_token as string
    const mpClientSecret = mpConfig.configuracao.client_secret as string

    if (!mpAccessToken) {
      return jsonResponse(500, { error: "Access Token do MP nao configurado" })
    }

    // -----------------------------------------------
    // D) Validar assinatura do webhook
    // -----------------------------------------------
    if (mpClientSecret) {
      const signatureValida = await validarAssinaturaMercadoPago(
        timestamp,
        rawBody,
        mpClientSecret,
        signature
      )
      if (!signatureValida) {
        console.warn("[mp] Assinatura invalida para tenant:", tenantId)
        return jsonResponse(401, { error: "Assinatura do webhook invalida" })
      }
    }

    // Re-fazer a chamada com o token correto
    const responseRetry = await fetch(
      `https://api.mercadopago.com/v1/payments/${mpPaymentId}`,
      { headers: { "Authorization": `Bearer ${mpAccessToken}`, "Content-Type": "application/json" } }
    )

    if (!responseRetry.ok) {
      return jsonResponse(500, { error: "Falha ao buscar pagamento no MP", retry: true })
    }

    mpPaymentDetails = await responseRetry.json()

    if (mpPaymentDetails.status !== "approved") {
      return jsonResponse(200, { status: "ignored", reason: `Status ${mpPaymentDetails.status}` })
    }

    // -----------------------------------------------
    // D) Processar
    // -----------------------------------------------
    const gatewayEventId = `mp_${mpPaymentId}`
    const valorPago = mpPaymentDetails.transaction_amount
    const formaPagamento = mpPaymentDetails.payment_method_id || "desconhecido"
    const comprovanteUrl = mpPaymentDetails.transaction_details?.external_resource_url || null

    // Idempotencia
    const { data: existingEvent } = await supabase
      .from("webhook_events_log")
      .select("id, processing_status")
      .eq("gateway", "mercado_pago")
      .eq("gateway_event_id", gatewayEventId)
      .maybeSingle()

    if (existingEvent?.processing_status === "processed") {
      return jsonResponse(200, { status: "ignored_duplicate", message: "Evento ja processado" })
    }

    if (cobranca.pago === true || cobranca.status === "pago") {
      return jsonResponse(200, { status: "ignored_duplicate", message: "Cobranca ja paga" })
    }

    const { data: rpcResult, error: rpcError } = await supabase
      .rpc("registrar_pagamento_webhook", {
        p_cobranca_id: cobrancaId,
        p_gateway: "mercado_pago",
        p_gateway_event_id: gatewayEventId,
        p_valor_pago: valorPago,
        p_forma_pagamento: formaPagamento,
        p_codigo_transacao: String(mpPaymentId),
        p_comprovante_url: comprovanteUrl,
        p_webhook_payload: JSON.parse(rawBody)
      })

    if (rpcError || !rpcResult?.success) {
      console.error("[mp] Erro:", rpcError?.message || rpcResult?.error)
      return jsonResponse(500, { error: "Erro ao processar", retry: true })
    }

    return jsonResponse(200, {
      status: "success", cobranca_id: cobrancaId,
      valor_pago: rpcResult.valor_pago, gateway_event_id: gatewayEventId
    })

  } catch (err: any) {
    console.error("[mp] Erro nao tratado:", err.message)
    return jsonResponse(500, { error: "Erro interno MP", retry: true })
  }
}

// =====================================================
// HANDLER: ABACATE PAY (Multi-Tenant)
// =====================================================

async function handleAbacatePayWebhook(
  payload: any,
  rawBody: string,
  supabase: any,
  headers: { signature: string; timestamp: string }
): Promise<Response> {
  try {
    // Abacate Pay envia: { event: "payment.completed", data: { id, external_reference, amount, ... } }
    if (!payload.event || !payload.data || !payload.data.id) {
      return jsonResponse(400, { error: "Payload invalido. Esperado: { event, data: { id, external_reference } }" })
    }

    const _eventData = payload
    const gatewayEventId = `abacate_${payload.data.id}`
    const cobrancaId = payload.data.external_reference

    if (!cobrancaId) {
      return jsonResponse(400, { error: "external_reference (cobranca_id) e obrigatorio" })
    }

    // Buscar cobranca para descobrir tenant
    const { data: cobranca, error: cobrancaErr } = await supabase
      .from("cobrancas")
      .select("id, tenant_id, valor, status, pago, data_vencimento, deleted_at")
      .eq("id", cobrancaId)
      .is("deleted_at", null)
      .maybeSingle()

    if (cobrancaErr) {
      return jsonResponse(500, { error: "Erro interno", retry: true })
    }

    if (!cobranca) {
      return jsonResponse(404, { error: "Cobranca nao encontrada", cobranca_id: cobrancaId })
    }

    // Verificar gateway ativo
    const gatewayCheck = await verificarGatewayAtivo(supabase, cobranca.tenant_id, "abacate_pay")
    if (!gatewayCheck.disponivel) {
      return jsonResponse(403, { error: "Gateway nao disponivel", motivo: gatewayCheck.motivo })
    }

    // Validar token/assinatura
    const abacateConfig = await buscarConfigGateway(supabase, cobranca.tenant_id, "abacate_pay")
    if (!abacateConfig) {
      return jsonResponse(500, { error: "Gateway nao configurado pela escola" })
    }

    const storedToken = abacateConfig.configuracao.webhook_token as string
    const receivedToken = payload.token || ""

    // Verificar se tem assinatura HMAC (header x-abacate-signature) - mais seguro
    const abacateSignature = headers.signature
    if (abacateSignature && storedToken) {
      const signatureValida = await validarAssinaturaAbacate(
        rawBody,
        storedToken,
        abacateSignature
      )
      if (!signatureValida) {
        console.warn("[abacate] Assinatura invalida para tenant:", cobranca.tenant_id)
        return jsonResponse(401, { error: "Assinatura do webhook invalida" })
      }
    } else if (storedToken && receivedToken !== storedToken) {
      // Fallback: token simples
      return jsonResponse(401, { error: "Token invalido" })
    }

    // Ignorar eventos que nao sao de pagamento confirmado
    if (payload.data.status !== "confirmed" && payload.data.status !== "completed" && payload.data.status !== "paid") {
      return jsonResponse(200, { status: "ignored", reason: `Status ${payload.data.status} nao requer acao` })
    }

    // Idempotencia
    const { data: existingEvent } = await supabase
      .from("webhook_events_log")
      .select("id, processing_status")
      .eq("gateway", "abacate_pay")
      .eq("gateway_event_id", gatewayEventId)
      .maybeSingle()

    if (existingEvent?.processing_status === "processed") {
      return jsonResponse(200, { status: "ignored_duplicate", message: "Evento ja processado" })
    }

    if (cobranca.pago === true || cobranca.status === "pago") {
      return jsonResponse(200, { status: "ignored_duplicate", message: "Cobranca ja paga" })
    }

    // Processar
    const valorPago = payload.data.amount || payload.data.valor || cobranca.valor
    const formaPagamento = payload.data.payment_method || "abacate_pay"
    const comprovanteUrl = payload.data.receipt_url || payload.data.comprovante || null

    const { data: rpcResult, error: rpcError } = await supabase
      .rpc("registrar_pagamento_webhook", {
        p_cobranca_id: cobrancaId,
        p_gateway: "abacate_pay",
        p_gateway_event_id: gatewayEventId,
        p_valor_pago: valorPago,
        p_forma_pagamento: formaPagamento,
        p_codigo_transacao: payload.data.id,
        p_comprovante_url: comprovanteUrl,
        p_webhook_payload: JSON.parse(rawBody)
      })

    if (rpcError || !rpcResult?.success) {
      console.error("[abacate] Erro:", rpcError?.message || rpcResult?.error)
      return jsonResponse(500, { error: "Erro ao processar", retry: true })
    }

    return jsonResponse(200, {
      status: "success", cobranca_id: cobrancaId,
      valor_pago: rpcResult.valor_pago, gateway_event_id: gatewayEventId
    })

  } catch (err: any) {
    console.error("[abacate] Erro nao tratado:", err.message)
    return jsonResponse(500, { error: "Erro interno Abacate Pay", retry: true })
  }
}

// =====================================================
// FUNCOES AUXILIARES - Multi-Tenant
// =====================================================

/**
 * Verifica se o gateway esta disponivel para o tenant.
 * 1. gateway_config.ativo_global = true (Super Admin ativou)
 * 2. gateway_tenant_config.ativo = true (Escola ativou)
 */
async function verificarGatewayAtivo(
  supabase: any,
  tenantId: string,
  gateway: string
): Promise<{ disponivel: boolean; motivo?: string }> {
  try {
    // Checar se Super Admin ativou globalmente
    const { data: globalConfig } = await supabase
      .from("gateway_config")
      .select("ativo_global")
      .eq("gateway", gateway)
      .maybeSingle()

    if (!globalConfig || globalConfig.ativo_global !== true) {
      return { disponivel: false, motivo: `Gateway ${gateway} nao ativado pelo Super Admin` }
    }

    // Checar se a escola ativou e configurou
    const { data: tenantConfig } = await supabase
      .from("gateway_tenant_config")
      .select("ativo, configuracao")
      .eq("tenant_id", tenantId)
      .eq("gateway", gateway)
      .maybeSingle()

    if (!tenantConfig || tenantConfig.ativo !== true) {
      return { disponivel: false, motivo: `Gateway ${gateway} nao ativado pela escola` }
    }

    // Verificar se tem token configurado
    const config = tenantConfig.configuracao as Record<string, unknown>
    if (!config || Object.keys(config).length === 0) {
      return { disponivel: false, motivo: `Gateway ${gateway} sem tokens configurados` }
    }

    return { disponivel: true }

  } catch (err: any) {
    console.error("[verificarGatewayAtivo] Erro:", err.message)
    return { disponivel: false, motivo: "Erro ao verificar configuracao do gateway" }
  }
}

/**
 * Busca a configuracao de gateway de uma escola.
 * Retorna null se nao existir.
 */
async function buscarConfigGateway(
  supabase: any,
  tenantId: string,
  gateway: string
): Promise<GatewayTenantConfig | null> {
  const { data } = await supabase
    .from("gateway_tenant_config")
    .select("tenant_id, gateway, ativo, configuracao, modo_teste")
    .eq("tenant_id", tenantId)
    .eq("gateway", gateway)
    .eq("ativo", true)
    .maybeSingle()

  return data as GatewayTenantConfig | null
}

/**
 * Valida o token do webhook Asaas contra o token armazenado da escola.
 * Suporta both: token simples e JWT.
 */
async function validarTokenAsaas(
  supabase: any,
  tenantId: string,
  receivedToken: string
): Promise<boolean> {
  if (!receivedToken) return false

  const config = await buscarConfigGateway(supabase, tenantId, "asaas")
  if (!config) return false

  const storedToken = config.configuracao.webhook_token as string
  if (!storedToken) return false

  // Verificar se e um JWT (formato: header.payload.signature)
  if (receivedToken.split(".").length === 3) {
    return await validarJwtAsaas(receivedToken, storedToken)
  }

  // Token simples - comparacao constante
  return constantTimeCompare(receivedToken, storedToken)
}

/**
 * Valida JWT do Asaas.
 */
async function validarJwtAsaas(jwt: string, secret: string): Promise<boolean> {
  try {
    const [headerB64, payloadB64, signatureB64] = jwt.split(".")

    // Validar estrutura basica do JWT
    const header = JSON.parse(atob(headerB64))
    if (!header.typ || !header.alg) {
      return false
    }

    // Validar claim 'exp' (expiracao)
    const payload = JSON.parse(atob(payloadB64))
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp < now) {
        console.warn("[asaas] JWT expirado:", payload.exp)
        return false
      }
    }

    // Validar assinatura (HS256)
    const data = `${headerB64}.${payloadB64}`
    const expectedSignature = await hmacSha256Base64Url(secret, data)
    return constantTimeCompare(expectedSignature, signatureB64)
  } catch (err) {
    console.error("[asaas] Erro ao validar JWT:", err)
    return false
  }
}

/**
 * Comparacao segura de strings (constante no tempo).
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Registra evento na tabela webhook_events_log.
 */
async function logWebhookEvent(
  supabase: any,
  params: {
    gateway_event_id: string
    gateway: string
    tenant_id?: string
    event_type: string
    raw_payload: any
    cobranca_id: string | null
    processing_status: string
    processing_details?: any
  }
) {
  try {
    const { error } = await supabase
      .from("webhook_events_log")
      .insert({
        gateway_event_id: params.gateway_event_id,
        gateway: params.gateway,
        tenant_id: params.tenant_id || null,
        event_type: params.event_type,
        raw_payload: params.raw_payload,
        cobranca_id: params.cobranca_id,
        processing_status: params.processing_status,
        processing_details: params.processing_details || null,
        processed_at: new Date().toISOString()
      })

    if (error && !error.message?.includes("unique")) {
      console.error("[logWebhookEvent] Erro:", error.message)
    }
  } catch (err: any) {
    console.error("[logWebhookEvent] Excecao:", err.message)
  }
}

function mapAsaasBillingType(billingType: string): string {
  const map: Record<string, string> = {
    BOLETO: "boleto", CREDIT_CARD: "cartao_credito", DEBIT_CARD: "cartao_debito",
    PIX: "pix", TRANSFER: "transferencia", DEPOSIT: "deposito"
  }
  return map[billingType] || billingType.toLowerCase()
}

/**
 * Valida assinatura HMAC-SHA256 do Mercado Pago.
 * Formato: x-signature = "t=timestamp,v1=signature"
 * Ohash e gerado de: timestamp.payload (raw body)
 */
async function validarAssinaturaMercadoPago(
  timestamp: string,
  rawBody: string,
  clientSecret: string,
  receivedSignature: string
): Promise<boolean> {
  if (!timestamp || !rawBody || !clientSecret || !receivedSignature) {
    return false
  }

  try {
    // Parse do header de assinatura: t=timestamp,v1=signature
    const parts = receivedSignature.split(",")
    let sigTimestamp = ""
    let sigHash = ""

    for (const part of parts) {
      const [key, value] = part.split("=")
      if (key === "t") sigTimestamp = value
      if (key === "v1") sigHash = value
    }

    // Validar timestamp (evitar replay attacks - 5min timeout)
    const now = Math.floor(Date.now() / 1000)
    const reqTime = parseInt(sigTimestamp || timestamp, 10)
    if (Math.abs(now - reqTime) > 300) {
      console.warn("[mp] Timestamp expirado:", reqTime, "vs", now)
      return false
    }

    // Gerar hash esperado
    const data = `${sigTimestamp || timestamp}.${rawBody}`
    const expectedHash = await hmacSha256(clientSecret, data)

    // Comparacao constante
    return constantTimeCompare(expectedHash, sigHash)
  } catch (err) {
    console.error("[mp] Erro ao validar assinatura:", err)
    return false
  }
}

/**
 * Gera HMAC-SHA256.
 */
async function hmacSha256(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(key)
  const dataData = encoder.encode(data)

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataData)
  const hashArray = new Uint8Array(signature)
  return Array.from(hashArray, (b) => b.toString(16).padStart(2, "0")).join("")
}

async function hmacSha256Base64Url(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(key)
  const dataData = encoder.encode(data)

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataData)
  const bytes = new Uint8Array(signature)
  let binary = ""
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

/**
 * Valida assinatura HMAC-SHA256 do Abacate Pay.
 * O Abacate pode enviar assinatura no header x-abacate-signature.
 */
async function validarAssinaturaAbacate(
  rawBody: string,
  webhookSecret: string,
  receivedSignature: string
): Promise<boolean> {
  if (!rawBody || !webhookSecret || !receivedSignature) {
    return false
  }

  try {
    // Abacate pode usar formato simples ou timestamp.body
    const expectedSignature = await hmacSha256(webhookSecret, rawBody)
    return constantTimeCompare(expectedSignature, receivedSignature)
  } catch (err) {
    console.error("[abacate] Erro ao validar assinatura:", err)
    return false
  }
}

function createSupabaseClient() {
  const url = Deno.env.get("SUPABASE_URL")
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !key) throw new Error("Variaveis do Supabase nao configuradas")
  return createClient(url, key)
}

/**
 * Pega IP real do cliente.
 * Suporta proxy/reverse proxy (X-Forwarded-For) e Direct.
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  const realIp = req.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  return "unknown"
}

function jsonResponse(status: number, body: Record<string, any>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Processed-At": new Date().toISOString()
    }
  })
}
