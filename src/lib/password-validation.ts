/**
 * Validação de Senha Forte
 * 
 * Regras de validação para senhas na plataforma FluxoEdu.
 * 
 * REGRAS ATUAIS:
 * - NOVAS senhas: Mínimo 8 caracteres + Pelo menos 1 letra maiúscula
 * - Senhas ANTIGAS: Continuam válidas (6+ caracteres, sem maiúscula)
 * 
 * IMPORTANTE: Senhas existentes fora do padrão continuam válidas para LOGIN.
 * Esta validação forte aplica-se apenas a NOVAS senhas ou alteração de senha.
 */

import { z } from 'zod'

/**
 * Schema Zod para LOGIN - Aceita qualquer senha (retrocompatibilidade)
 * 
 * USO:
 * const loginSchema = z.object({
 *   password: loginPasswordSchema,
 * })
 * 
 * PERMITE: Senhas antigas de 6+ caracteres, mesmo sem maiúscula
 */
export const loginPasswordSchema = z
  .string()
  .min(1, 'Senha é obrigatória')

/**
 * Schema Zod para CADASTRO/TROCA DE SENHA - Exige senha forte
 * 
 * USO:
 * const cadastroSchema = z.object({
 *   password: strongPasswordSchema,
 * })
 * 
 * EXIGE: 8+ caracteres e 1 maiúscula (apenas para novas senhas)
 */
export const strongPasswordSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')

/**
 * Schema Zod para TROCA DE SENHA (Portal) - Exige senha forte
 * 
 * USO:
 * const trocaSenhaSchema = z.object({
 *   novaSenha: changePasswordSchema,
 * })
 */
export const changePasswordSchema = strongPasswordSchema

/**
 * Mensagens de validação para exibição ao usuário
 */
export const passwordValidationMessages = {
  minLength: 'A senha deve ter no mínimo 8 caracteres',
  uppercase: 'A senha deve conter pelo menos uma letra maiúscula',
  recommendation: 'Para maior segurança, use também letras minúsculas, números e símbolos especiais.',
  loginError: 'Senha inválida. Verifique se está digitando corretamente.',
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
