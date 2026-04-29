/**
 * Health Check — Validação de variáveis de ambiente críticas
 *
 * Executa no startup da aplicação e bloqueia o build/execução
 * se variáveis obrigatórias estiverem ausentes.
 *
 * Hierarquia:
 * - CRÍTICAS: Bloqueiam execução em produção
 * - IMPORTANTES: Warn em desenvolvimento, erro em produção
 * - OPCIONAIS: Apenas warn em desenvolvimento
 */

interface EnvCheck {
  key: string
  label: string
  criticality: 'critical' | 'important' | 'optional'
  validateFn?: (value: string) => boolean
}

const ENV_CHECKS: EnvCheck[] = [
  {
    key: 'VITE_SUPABASE_URL',
    label: 'URL do Supabase',
    criticality: 'critical',
    validateFn: (v) => v.startsWith('https://') && v.includes('.supabase.co'),
  },
  {
    key: 'VITE_SUPABASE_ANON_KEY',
    label: 'Chave Anon do Supabase',
    criticality: 'critical',
    validateFn: (v) => v.length > 100,
  },
  {
    key: 'VITE_SUPER_ADMIN_EMAIL',
    label: 'Email do Super Admin',
    criticality: 'critical',
    validateFn: (v) => v.includes('@') && !v.includes('gmail.com'),
  },
  {
    key: 'VITE_SENTRY_DSN',
    label: 'DSN do Sentry (monitoramento)',
    criticality: 'important',
    validateFn: (v) => v.startsWith('https://') && v.includes('sentry.io'),
  },
  {
    key: 'VITE_APP_VERSION',
    label: 'Versão da aplicação',
    criticality: 'optional',
  },
]

export interface HealthCheckResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Executa verificação de saúde das variáveis de ambiente.
 * Em produção, lança erro se variável crítica ou importante estiver ausente.
 * Em desenvolvimento, apenas avisa.
 */
export function runHealthCheck(): HealthCheckResult {
  const errors: string[] = []
  const warnings: string[] = []
  const isProd = import.meta.env.PROD

  for (const check of ENV_CHECKS) {
    const value = import.meta.env[check.key]

    if (!value) {
      const msg = `${check.label} (${check.key}) não está definida`

      if (check.criticality === 'critical') {
        errors.push(msg)
      } else if (check.criticality === 'important') {
        if (isProd) {
          errors.push(msg)
        } else {
          warnings.push(`⚠️ ${msg}`)
        }
      } else {
        warnings.push(`ℹ️ ${msg} (opcional)`)
      }
      continue
    }

    if (check.validateFn && !check.validateFn(value)) {
      const msg = `${check.label} (${check.key}) tem formato inválido`
      if (check.criticality === 'critical') {
        errors.push(msg)
      } else {
        warnings.push(`⚠️ ${msg}`)
      }
    }
  }

  // Em produção: qualquer erro é fatal
  if (isProd && errors.length > 0) {
    throw new Error(
      `❌ CONFIGURAÇÃO INVÁLIDA — Variáveis obrigatórias ausentes ou inválidas:\n` +
      errors.map((e) => `  • ${e}`).join('\n') +
      `\n\nConfigure as variáveis de ambiente antes de fazer deploy.`
    )
  }

  // Em desenvolvimento: apenas log
  if (!isProd) {
    if (errors.length > 0) {
      console.error('🔴 Health Check — Variáveis faltando:', errors)
    }
    if (warnings.length > 0) {
      console.warn('🟡 Health Check — Avisos:', warnings)
    }
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ Health Check OK — Todas as variáveis configuradas')
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  }
}

// Auto-executa no import
let _healthCheckResult: HealthCheckResult | null = null
export function getHealthCheckResult(): HealthCheckResult {
  if (!_healthCheckResult) {
    _healthCheckResult = runHealthCheck()
  }
  return _healthCheckResult
}
