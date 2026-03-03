/**
 * Configurações do Sistema
 */

export const SUPER_ADMIN_EMAIL = 'zeroumbit@gmail.com'

/**
 * Verifica se um e-mail pertence ao super admin
 */
export function isSuperAdminEmail(email: string): boolean {
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
}
