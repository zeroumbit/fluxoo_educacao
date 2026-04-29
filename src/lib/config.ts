/**
 * Configurações do Sistema
 */

import { getHealthCheckResult } from './health-check'

export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL

// Executar o health check (lança erro em prod se faltar algo)
getHealthCheckResult()

/**
 * Verifica se um e-mail pertence ao super admin
 */
export function isSuperAdminEmail(email: string): boolean {
  if (!email || !SUPER_ADMIN_EMAIL) return false
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
}
