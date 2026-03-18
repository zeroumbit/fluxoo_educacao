/**
 * Configurações do Sistema
 */

export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL

if (import.meta.env.PROD && !SUPER_ADMIN_EMAIL) {
  console.warn('⚠️ VITE_SUPER_ADMIN_EMAIL não definido em ambiente de produção!')
}

/**
 * Verifica se um e-mail pertence ao super admin
 */
export function isSuperAdminEmail(email: string): boolean {
  if (!email) return false
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
}
