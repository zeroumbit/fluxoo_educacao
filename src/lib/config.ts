/**
 * Configurações do Sistema
 */

export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL

// Validação rigorosa: Impede o app de rodar sem SUPER_ADMIN_EMAIL em produção
if (import.meta.env.PROD && !SUPER_ADMIN_EMAIL) {
  throw new Error(
    '❌ VITE_SUPER_ADMIN_EMAIL é obrigatória em produção. ' +
    'Configure a variável de ambiente antes de iniciar o aplicativo.'
  )
}

// Warn em desenvolvimento (não bloqueia)
if (import.meta.env.DEV && !SUPER_ADMIN_EMAIL) {
  console.warn('⚠️ VITE_SUPER_ADMIN_EMAIL não definida. Super Admin não estará disponível.')
}

/**
 * Verifica se um e-mail pertence ao super admin
 */
export function isSuperAdminEmail(email: string): boolean {
  if (!email || !SUPER_ADMIN_EMAIL) return false
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
}
