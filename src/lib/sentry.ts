/**
 * Sentry — Monitoramento de erros em produção (LGPD-compliant)
 *
 * LGPD: Dados pessoais são removidos via beforeSend antes de qualquer envio.
 * PII: CPF, email, nome, telefone são mascarados automaticamente.
 *
 * Variável obrigatória em produção: VITE_SENTRY_DSN
 */

import * as Sentry from '@sentry/react'

/** Campos de PII que serão removidos antes do envio ao Sentry */
const PII_FIELDS = [
  'cpf', 'cnpj', 'rg', 'email', 'nome', 'name',
  'phone', 'telefone', 'celular', 'address', 'endereco',
  'password', 'senha', 'token', 'secret', 'api_key',
]

/**
 * Remove recursivamente campos de PII de objetos aninhados
 */
function scrubPII(obj: unknown, depth = 0): unknown {
  if (depth > 6 || obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map((item) => scrubPII(item, depth + 1))

  const scrubbed: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (PII_FIELDS.some((field) => key.toLowerCase().includes(field))) {
      scrubbed[key] = '[REDACTED-LGPD]'
    } else {
      scrubbed[key] = scrubPII(value, depth + 1)
    }
  }
  return scrubbed
}

/** Inicializa o Sentry. Deve ser chamado antes de qualquer render. */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN

  if (!dsn) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ VITE_SENTRY_DSN não definida. Sentry desativado.')
    }
    return
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: `fluxoo-edu@${import.meta.env.VITE_APP_VERSION ?? '0.0.0'}`,

    // Amostragem: 10% das transações em produção para não explodir a cota
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // Não enviar erros em desenvolvimento
    enabled: import.meta.env.PROD,

    // LGPD: Desabilitar dados automáticos do usuário
    sendDefaultPii: false,
    autoSessionTracking: false,

    // Integrations mínimas para não coletar PII extra
    integrations: [
      Sentry.browserTracingIntegration({
        tracePropagationTargets: [
          /^https:\/\/phuyqtdpedfigbfsevte\.supabase\.co/,
        ],
      }),
    ],

    // Filtros de eventos desnecessários
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Network request failed',
      'Load failed',
      'AbortError',
      'ChunkLoadError',
    ],

    // LGPD: Dupla camada de scrubbing antes do envio
    beforeSend(event) {
      // Scrub do contexto do usuário (não enviar dados pessoais)
      if (event.user) {
        event.user = {
          id: event.user.id,       // UUID anônimo está ok
          // Sem email, username, ip_address
        }
      }

      // Scrub dos breadcrumbs
      if (event.breadcrumbs?.values) {
        event.breadcrumbs.values = event.breadcrumbs.values.map((b) => ({
          ...b,
          data: b.data ? (scrubPII(b.data) as Record<string, unknown>) : b.data,
          message: b.message?.replace(/cpf[=:]\s*\d{11}/gi, 'cpf=[REDACTED]'),
        }))
      }

      // Scrub de extras e contexto
      if (event.extra) {
        event.extra = scrubPII(event.extra) as Record<string, unknown>
      }
      if (event.contexts) {
        event.contexts = scrubPII(event.contexts) as Record<string, unknown>
      }

      return event
    },

    beforeSendTransaction(transaction) {
      // Não enviar transações de usuários internos (super admin)
      if (transaction.tags?.user_role === 'super_admin') return null
      return transaction
    },
  })
}

/**
 * Captura exceção com contexto seguro (sem PII)
 */
export function captureException(
  error: unknown,
  context?: { action?: string; tenantId?: string; role?: string }
): void {
  if (!import.meta.env.PROD) return

  Sentry.withScope((scope) => {
    if (context?.action) scope.setTag('action', context.action)
    if (context?.role)   scope.setTag('user_role', context.role)
    // Nunca logar tenant_id completo — apenas os 8 primeiros caracteres para debug
    if (context?.tenantId) {
      scope.setTag('tenant_prefix', context.tenantId.slice(0, 8))
    }
    Sentry.captureException(error)
  })
}

/**
 * Define o usuário no Sentry de forma LGPD-safe (apenas ID anônimo)
 */
export function setSentryUser(userId: string | null, role?: string): void {
  if (!import.meta.env.PROD) return

  if (!userId) {
    Sentry.setUser(null)
    return
  }

  // Apenas ID anônimo — sem email, nome, CPF ou qualquer PII
  Sentry.setUser({ id: userId })
  if (role) Sentry.setTag('user_role', role)
}

export { Sentry }
