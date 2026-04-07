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

// =====================================================
// HANDLER PRINCIPAL
// =====================================================

serve(async (req: Request) => {
  const timeoutId = setTimeout(() => {
    console.error("[webhook-gateway] TIMEOUT: processamento excedeu limite")
  }, GATEWAY_TIMEOUT_MS)

  try {
    const contentType = req.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      return jsonResponse(400, { error: "Content-Type deve ser application/json" })
    }

    // Detectar gateway
    const isAsaas = req.headers.has("accessToken") || req.headers.get("user-agent")?.includes("Asaas")
    const isMercadoPago = req.headers.has("x-request-id") && req.headers.has("x-signature")

    if (!isAsaas && !isMercadoPago) {
      return jsonResponse(400, { error: "Gateway nao identificado" })
    }

    let rawBody: string
    try {
      rawBody = await req.text()
    } catch {
      return jsonResponse(400, { error: "Falha ao ler corpo da requisicao" })
    }

    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return jsonResponse(400, { error: "JSON invalido" })
    }

    const supabase = createSupabaseClient()

    if (isAsaas) {
      return await handleAsaasWebhook(payload, rawBody, supabase)
    } else {
      return await handleMercadoPagoWebhook(payload, rawBody, supabase)
    }

  } catch (err: any) {
    console.error("[webhook-gateway] Erro nao tratado:", err.message, err.stack)
    return jsonResponse(500, { error: "Erro interno do servidor", message: err.message })
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
  supabase: any
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
      console.error("[asaas] Erro ao buscar cobranca:", cobrancaErr.message)
      return jsonResponse(500, { error: "Erro interno", retry: true })
    }

    if (!cobranca) {
      console.error("[asaas] Cobranca nao encontrada:", cobrancaId)
      return jsonResponse(404, { error: "Cobranca nao encontrada", cobranca_id: cobrancaId })
    }

    // -----------------------------------------------
    // B) Verificar se o gateway esta ativo para este tenant
    //    (Super Admin ativou globalmente + escola ativou)
    // -----------------------------------------------
    const gatewayCheck = await verificarGatewayAtivo(supabase, cobranca.tenant_id, "asaas")
    if (!gatewayCheck.disponivel) {
      console.error("[asaas] Gateway nao disponivel para tenant:", cobranca.tenant_id, gatewayCheck.motivo)
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
      console.error("[asaas] Token invalido para tenant:", cobranca.tenant_id)
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
    return jsonResponse(500, { error: "Erro interno no handler Asaas", message: err.message, retry: true })
  }
}

// =====================================================
// HANDLER: MERCADO PAGO (Multi-Tenant)
// =====================================================

async function handleMercadoPagoWebhook(
  payload: any,
  rawBody: string,
  supabase: any
): Promise<Response> {
  try {
    if (!payload.type || !payload.data || !payload.data.id) {
      return jsonResponse(400, { error: "Payload invalido" })
    }

    const eventData: MercadoPagoPaymentEvent = payload
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

    if (!mpAccessToken) {
      return jsonResponse(500, { error: "Access Token do MP nao configurado" })
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
    return jsonResponse(500, { error: "Erro interno MP", message: err.message, retry: true })
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

  // Comparacao constante para evitar timing attacks
  return constantTimeCompare(receivedToken, storedToken)
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

function createSupabaseClient() {
  const url = Deno.env.get("SUPABASE_URL")
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !key) throw new Error("Variaveis do Supabase nao configuradas")
  return createClient(url, key)
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
