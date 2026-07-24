import { supabase } from '@/lib/supabase'

interface PrecheckResponse {
  allowed: boolean
  delay_ms?: number | null
  retry_after_seconds?: number | null
  reason?: string | null
}

interface LoginAttemptInput {
  identifier: string
  success: boolean
  reason?: string | null
  tenantId?: string | null
}

const RPC_TIMEOUT_MS = 2500
const RATE_LIMIT_UNAVAILABLE_MESSAGE = 'Nao foi possivel validar a seguranca do login. Tente novamente em instantes.'

type RpcError = { message?: string } | null

type LoginPrecheckRpcResult = {
  data: PrecheckResponse[] | PrecheckResponse | null
  error: RpcError
}

type LoginRateLimitRpcClient = {
  rpc(
    fn: 'fn_login_precheck',
    args: {
      p_identifier: string
      p_user_agent: string | null
    }
  ): Promise<LoginPrecheckRpcResult>
  rpc(
    fn: 'fn_login_record_attempt',
    args: {
      p_identifier: string
      p_success: boolean
      p_reason: string | null
      p_tenant_id: string | null
      p_user_agent: string | null
    }
  ): Promise<unknown>
}

const loginRateLimitClient = supabase as unknown as LoginRateLimitRpcClient

function withTimeout<T>(promise: Promise<T>, ms = RPC_TIMEOUT_MS): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ])
}

function normalizeIdentifier(identifier: string): string {
  return identifier.trim().toLowerCase()
}

function getUserAgent(): string | null {
  return typeof navigator === 'undefined' ? null : navigator.userAgent
}

function unavailableRateLimitResult() {
  // Em producao, permitir o login sem o precheck transformaria uma falha de
  // infraestrutura em uma janela para ataque de forca bruta.
  return import.meta.env.PROD
    ? { allowed: false, delayMs: 0, reason: RATE_LIMIT_UNAVAILABLE_MESSAGE }
    : { allowed: true, delayMs: 0, reason: null }
}

export async function precheckLogin(identifier: string): Promise<{
  allowed: boolean
  delayMs: number
  reason: string | null
}> {
  const normalized = normalizeIdentifier(identifier)
  if (!normalized) {
    return { allowed: true, delayMs: 0, reason: null }
  }

  try {
    const result = await withTimeout(
      loginRateLimitClient.rpc('fn_login_precheck', {
        p_identifier: normalized,
        p_user_agent: getUserAgent(),
      })
    )

    if (!result || result.error || !result.data) {
      return unavailableRateLimitResult()
    }

    const row = Array.isArray(result.data) ? result.data[0] : result.data
    return {
      allowed: row?.allowed !== false,
      delayMs: Math.max(0, Number(row?.delay_ms || 0)),
      reason: row?.reason || null,
    }
  } catch {
    return unavailableRateLimitResult()
  }
}

export async function recordLoginAttempt(input: LoginAttemptInput): Promise<void> {
  const identifier = normalizeIdentifier(input.identifier)
  if (!identifier) return

  try {
    await withTimeout(
      loginRateLimitClient.rpc('fn_login_record_attempt', {
        p_identifier: identifier,
        p_success: input.success,
        p_reason: input.reason || null,
        p_tenant_id: input.tenantId || null,
        p_user_agent: getUserAgent(),
      })
    )
  } catch {
    // Auth must keep working if the optional rate-limit RPC is not deployed yet.
  }
}
