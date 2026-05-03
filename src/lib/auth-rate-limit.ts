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
      supabase.rpc('fn_login_precheck' as any, {
        p_identifier: normalized,
        p_user_agent: getUserAgent(),
      } as any) as Promise<{ data: PrecheckResponse[] | PrecheckResponse | null; error: any }>
    )

    if (!result || result.error || !result.data) {
      return { allowed: true, delayMs: 0, reason: null }
    }

    const row = Array.isArray(result.data) ? result.data[0] : result.data
    return {
      allowed: row?.allowed !== false,
      delayMs: Math.max(0, Number(row?.delay_ms || 0)),
      reason: row?.reason || null,
    }
  } catch {
    return { allowed: true, delayMs: 0, reason: null }
  }
}

export async function recordLoginAttempt(input: LoginAttemptInput): Promise<void> {
  const identifier = normalizeIdentifier(input.identifier)
  if (!identifier) return

  try {
    await withTimeout(
      supabase.rpc('fn_login_record_attempt' as any, {
        p_identifier: identifier,
        p_success: input.success,
        p_reason: input.reason || null,
        p_tenant_id: input.tenantId || null,
        p_user_agent: getUserAgent(),
      } as any) as Promise<unknown>
    )
  } catch {
    // Auth must keep working if the optional rate-limit RPC is not deployed yet.
  }
}
