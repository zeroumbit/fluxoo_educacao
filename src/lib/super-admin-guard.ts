/**
 * Super Admin Guard — Defesa em profundidade no frontend
 *
 * Complementa as políticas RLS do banco (Regra Imutável R2):
 * Super Admin NUNCA executa ações operacionais em escolas.
 *
 * Esta camada de frontend é uma "segunda linha de defesa".
 * O banco é a fonte de verdade — este guard é para UX e prevenção de erros.
 */

import type { AuthUser } from '@/modules/auth/AuthContext'
import { captureException } from '@/lib/sentry'

/** Ações que o Super Admin JAMAIS pode executar */
const SA_BLOCKED_ACTIONS = [
  'insert:alunos',
  'update:alunos',
  'delete:alunos',
  'insert:matriculas',
  'update:matriculas',
  'delete:matriculas',
  'insert:cobrancas',
  'update:cobrancas',
  'insert:notas',
  'update:notas',
  'insert:frequencias',
  'update:frequencias',
  'insert:turmas',
  'update:turmas',
  'delete:turmas',
  'insert:funcionarios',
  'update:funcionarios',
  'delete:funcionarios',
  'insert:mural_avisos',
  'update:mural_avisos',
] as const

type SABlockedAction = typeof SA_BLOCKED_ACTIONS[number]

/**
 * Verifica se a ação é permitida para o Super Admin.
 * Lança erro em produção, loga aviso em desenvolvimento.
 */
export function assertNotSuperAdmin(
  authUser: AuthUser | null,
  action: SABlockedAction,
  context?: string
): void {
  if (!authUser?.isSuperAdmin) return

  const message = `[SuperAdminGuard] Super Admin tentou executar ação operacional bloqueada: ${action}${context ? ` — ${context}` : ''}`

  captureException(new Error(message), {
    action,
    role: 'super_admin',
  })

  if (import.meta.env.DEV) {
    console.error('🚨 ' + message)
  }

  throw new Error(
    'Ação não permitida: Super Admin não pode executar ações operacionais em escolas.'
  )
}

/**
 * Guard que retorna false se for Super Admin (para uso em condicionais)
 * Não lança erro — apenas bloqueia silenciosamente.
 */
export function canActAsOperator(authUser: AuthUser | null): boolean {
  if (!authUser) return false
  return !authUser.isSuperAdmin
}

/**
 * Wrapper para operações — bloqueia automaticamente Super Admin
 *
 * @example
 * const result = await withSuperAdminGuard(authUser, 'insert:alunos', () =>
 *   supabase.from('alunos').insert(data)
 * )
 */
export async function withSuperAdminGuard<T>(
  authUser: AuthUser | null,
  action: SABlockedAction,
  fn: () => Promise<T>
): Promise<T> {
  assertNotSuperAdmin(authUser, action)
  return fn()
}
