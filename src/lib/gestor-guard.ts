/**
 * Gestor Guard — Ação Excepcional com Justificativa Obrigatória
 *
 * Regra Imutável R1:
 * Gestor pode lançar notas/faltas APENAS em caráter excepcional,
 * com justificativa obrigatória registrada no audit_log.
 *
 * O banco valida via trigger trg_audit_notas_gestor().
 * Este módulo garante que o frontend colete a justificativa antes de agir.
 */

import type { AuthUser } from '@/modules/auth/AuthContext'
import { supabase } from '@/lib/supabase'

/** Ações que requerem justificativa obrigatória quando feitas pelo Gestor */
export const GESTOR_EXCEPTIONAL_ACTIONS = {
  LANCAR_NOTA: 'lancamento_gestor_nota',
  LANCAR_FALTA: 'lancamento_gestor_falta',
  ALTERAR_NOTA: 'alteracao_nota',
  CANCELAR_MATRICULA: 'cancelamento_matricula',
  TRANSFERIR_ALUNO: 'transferencia_aluno',
  CONCEDER_DESCONTO: 'concessao_desconto',
} as const

export type GestorExceptionalAction = typeof GESTOR_EXCEPTIONAL_ACTIONS[keyof typeof GESTOR_EXCEPTIONAL_ACTIONS]

export interface GestorActionContext {
  action: GestorExceptionalAction
  justificativa: string
  registroId?: string
  dadosPayload?: Record<string, unknown>
}

/**
 * Verifica se o usuário é Gestor com privilégios de ação excepcional.
 * (Não é Super Admin, pois Super Admin não pode agir operacionalmente)
 */
export function isGestorOperational(authUser: AuthUser | null): boolean {
  if (!authUser) return false
  if (authUser.isSuperAdmin) return false   // R2: Super Admin nunca opera
  return authUser.isGestor
}

/**
 * Define a justificativa na sessão PostgreSQL para o trigger capturar
 * Deve ser chamado ANTES de qualquer INSERT/UPDATE na mesma transação.
 */
export async function setJustificativaForAudit(justificativa: string): Promise<void> {
  await supabase.rpc('set_config' as any, {
    setting: 'app.audit_justificativa',
    value: justificativa,
    is_local: true,
  } as any)
}

/**
 * Executa uma ação excepcional do Gestor com justificativa registrada.
 *
 * @example
 * const result = await executeGestorExceptionalAction(authUser, {
 *   action: GESTOR_EXCEPTIONAL_ACTIONS.LANCAR_NOTA,
 *   justificativa: 'Professor ausente por doença. Ação de emergência.',
 * }, async () => {
 *   return supabase.from('notas').insert({ ... })
 * })
 */
export async function executeGestorExceptionalAction<T>(
  authUser: AuthUser | null,
  context: GestorActionContext,
  fn: () => Promise<T>
): Promise<T> {
  if (!isGestorOperational(authUser)) {
    throw new Error(
      'Esta ação é permitida apenas para Gestores/Diretores. ' +
      'Super Admin não pode executar ações operacionais.'
    )
  }

  if (!context.justificativa || context.justificativa.trim().length < 10) {
    throw new Error(
      'Justificativa obrigatória para esta ação (mínimo 10 caracteres). ' +
      'Esta ação será registrada no histórico de auditoria da escola.'
    )
  }

  // Registrar justificativa para o trigger do banco capturar
  await setJustificativaForAudit(context.justificativa.trim())

  // Executar a ação — o trigger trg_audit_notas_gestor() captura automaticamente
  const result = await fn()

  // Criar aprovação no workflow (para rastreabilidade)
  await supabase.rpc('fn_solicitar_aprovacao' as any, {
    p_tipo_acao:     context.action,
    p_titulo:        `Ação excepcional do Gestor: ${context.action}`,
    p_descricao:     `Gestor realizou ação excepcional que normalmente requer aprovação.`,
    p_justificativa: context.justificativa,
    p_registro_id:   context.registroId ?? null,
    p_dados_payload: context.dadosPayload ?? null,
  } as any).catch(() => {
    // Não bloquear a ação se o workflow falhar — o audit_log já registrou
  })

  return result
}

/**
 * Cria uma solicitação de aprovação para o Gestor aprovar
 */
export async function solicitarAprovacaoGestor(
  tipo: GestorExceptionalAction,
  titulo: string,
  descricao: string,
  justificativa: string,
  registroId?: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc('fn_solicitar_aprovacao' as any, {
    p_tipo_acao:     tipo,
    p_titulo:        titulo,
    p_descricao:     descricao,
    p_justificativa: justificativa,
    p_registro_id:   registroId ?? null,
  } as any)

  if (error) throw new Error(error.message)
  return data as string
}
