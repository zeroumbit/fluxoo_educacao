/**
 * Professor Scope — Utilitários de escopo pedagógico
 *
 * Garante que professores só acessem dados das suas turmas e disciplinas.
 * Complementa as políticas RLS granulares da migration 188.
 */

import { supabase } from '@/lib/supabase'
import type { AuthUser } from '@/modules/auth/AuthContext'

export interface ProfessorScope {
  turmaId: string
  disciplinaId: string
  anoLetivo: string
}

/** Cache em memória do escopo do professor (por sessão) */
let _scopeCache: ProfessorScope[] | null = null
let _cacheUserId: string | null = null

/**
 * Retorna o escopo pedagógico do professor logado.
 * Usa a view vw_professor_escopo (filtrada por RLS no banco).
 */
export async function getProfessorScope(authUser: AuthUser | null): Promise<ProfessorScope[]> {
  if (!authUser || authUser.isSuperAdmin) return []
  if (!authUser.isProfessor) return []

  // Cache por usuário (limpa ao trocar de sessão)
  if (_scopeCache && _cacheUserId === authUser.user.id) {
    return _scopeCache
  }

  const { data, error } = await supabase
    .from('vw_professor_escopo' as any)
    .select('turma_id, disciplina_id, ano_letivo')

  if (error || !data) {
    _scopeCache = []
  } else {
    _scopeCache = (data as any[]).map((row) => ({
      turmaId: row.turma_id,
      disciplinaId: row.disciplina_id,
      anoLetivo: row.ano_letivo,
    }))
  }
  _cacheUserId = authUser.user.id
  return _scopeCache
}

/** Invalida o cache do escopo (chamar ao trocar de sessão) */
export function invalidateProfessorScopeCache(): void {
  _scopeCache = null
  _cacheUserId = null
}

/**
 * Verifica se o professor tem acesso a uma turma específica
 * (Para validação no frontend antes de enviar dados ao banco)
 */
export async function professorCanAccessTurma(
  authUser: AuthUser | null,
  turmaId: string
): Promise<boolean> {
  // Gestor sempre pode (R1)
  if (authUser?.isGestor && !authUser.isSuperAdmin) return true

  const scope = await getProfessorScope(authUser)
  return scope.some((s) => s.turmaId === turmaId)
}

/**
 * Verifica se o professor pode lançar nota para uma turma+disciplina
 */
export async function professorCanLancarNota(
  authUser: AuthUser | null,
  turmaId: string,
  disciplinaId: string
): Promise<boolean> {
  // Gestor pode (ação excepcional — R1, com justificativa)
  if (authUser?.isGestor && !authUser.isSuperAdmin) return true
  // Super Admin nunca (R2)
  if (authUser?.isSuperAdmin) return false

  const scope = await getProfessorScope(authUser)
  return scope.some((s) => s.turmaId === turmaId && s.disciplinaId === disciplinaId)
}

/**
 * Hook para listar turmas disponíveis para o professor logado
 */
export async function listarTurmasProfessor(
  authUser: AuthUser | null
): Promise<ProfessorScope[]> {
  return getProfessorScope(authUser)
}
