/**
 * Validação de Senha Forte
 * 
 * Regras de validação para senhas na plataforma FluxoEdu.
 * 
 * REGRAS ATUAIS:
 * - Mínimo 8 caracteres
 * - Pelo menos 1 letra maiúscula
 * 
 * RECOMENDAÇÃO (opcional, para UX):
 * - Letras maiúsculas e minúsculas
 * - Números
 * - Símbolos especiais
 * 
 * IMPORTANTE: Senhas existentes fora do padrão continuam válidas.
 * Esta validação aplica-se apenas a NOVAS senhas ou alteração de senha.
 */

import { z } from 'zod'

/**
 * Schema Zod para validação de senha forte
 * 
 * USO:
 * const schema = z.object({
 *   password: strongPasswordSchema,
 * })
 */
export const strongPasswordSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')

/**
 * Mensagens de validação para exibição ao usuário
 */
export const passwordValidationMessages = {
  minLength: 'A senha deve ter no mínimo 8 caracteres',
  uppercase: 'A senha deve conter pelo menos uma letra maiúscula',
  recommendation: 'Para maior segurança, use também letras minúsculas, números e símbolos especiais.',
}

/**
 * Valida se uma senha atende aos requisitos mínimos
 * 
 * @param password - Senha para validar
 * @returns Objeto com resultado da validação e mensagens de erro
 */
export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
  messages: string[]
} {
  const errors: string[] = []
  const messages: string[] = []

  // Valida tamanho mínimo
  if (password.length < 8) {
    errors.push('minLength')
    messages.push(passwordValidationMessages.minLength)
  }

  // Valida letra maiúscula
  if (!/[A-Z]/.test(password)) {
    errors.push('uppercase')
    messages.push(passwordValidationMessages.uppercase)
  }

  return {
    valid: errors.length === 0,
    errors,
    messages,
  }
}

/**
 * Retorna dicas de senha forte para exibição na UI
 */
export function getPasswordStrengthTips(): string[] {
  return [
    'Use no mínimo 8 caracteres',
    'Inclua pelo menos uma letra maiúscula',
    'Considere usar letras minúsculas também',
    'Adicione números para mais segurança',
    'Inclua símbolos especiais (!@#$%^&*)',
  ]
}

/**
 * Calcula força da senha (para UI de feedback visual)
 * 
 * @param password - Senha para avaliar
 * @returns Score de 0 a 4 (0=fraca, 4=forte)
 */
export function getPasswordStrength(password: string): number {
  let score = 0

  // Tamanho
  if (password.length >= 8) score++
  if (password.length >= 12) score++

  // Complexidade
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  // Normaliza para 0-4
  return Math.min(4, Math.floor(score / 2))
}
