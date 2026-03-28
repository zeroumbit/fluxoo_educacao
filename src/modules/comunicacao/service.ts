import { supabase } from '@/lib/supabase'
import type { MuralAvisoInsert } from '@/lib/database.types'

/** Retorna true se o aviso ainda está dentro do período de vigência */
export function isAvisoAtivo(aviso: { data_fim?: string | null }): boolean {
  if (!aviso.data_fim) return true  // sem prazo = sempre ativo
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const fim = new Date(aviso.data_fim + 'T00:00:00')
  return fim >= hoje
}

export const muralService = {
  /**
   * Lista TODOS os avisos do tenant — ativos + expirados.
   * Usado na página /mural (escola). Ordena: ativos primeiro, depois expirados.
   */
  async listar(tenantId: string, professorId?: string) {
    let query = supabase
      .from('mural_avisos')
      .select('*, turmas(nome)')
      .eq('tenant_id', tenantId)

    if (professorId) {
      // Filtra avisos que são públicos (turma_id nulo) OU que pertencem às turmas do professor
      query = query.or(`turma_id.is.null,turma_id.in.(select turma_id from turma_professores where funcionario_id.eq.${professorId})`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  /**
   * Lista avisos por turma — ativos + expirados.
   * Usado na página /portal/avisos. Ordena: ativos primeiro.
   */
  async listarPorTurma(turmaId: string | null, tenantId: string) {
    let query = supabase
      .from('mural_avisos')
      .select('*, turmas(nome)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (turmaId) {
      query = query.or(`turma_id.is.null,turma_id.eq.${turmaId}`)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  /**
   * Lista apenas avisos ATIVOS (dentro da vigência).
   * Usado nas dashboards para não mostrar avisos expirados.
   */
  async listarAtivos(tenantId: string, limite = 6, professorId?: string) {
    const hoje = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    let query = supabase
      .from('mural_avisos')
      .select('*, turmas(nome)')
      .eq('tenant_id', tenantId)
      // Ativo = sem data_fim OU data_fim >= hoje
      .or(`data_fim.is.null,data_fim.gte.${hoje}`)

    if (professorId) {
      query = query.or(`turma_id.is.null,turma_id.in.(select turma_id from turma_professores where funcionario_id.eq.${professorId})`)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limite)

    if (error) throw error
    return data ?? []
  },

  /**
   * Lista avisos ativos por turma — para a dashboard do portal.
   */
  async listarAtivosPorTurma(turmaId: string | null, tenantId: string) {
    const hoje = new Date().toISOString().split('T')[0]

    let query = supabase
      .from('mural_avisos')
      .select('*, turmas(nome)')
      .eq('tenant_id', tenantId)
      .or(`data_fim.is.null,data_fim.gte.${hoje}`)
      .order('created_at', { ascending: false })
      .limit(5)

    if (turmaId) {
      query = query.or(`turma_id.is.null,turma_id.eq.${turmaId}`)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  async criar(aviso: MuralAvisoInsert) {
    const { data, error } = await supabase
      .from('mural_avisos')
      .insert(aviso)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async excluir(id: string) {
    const { error } = await supabase
      .from('mural_avisos')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async editar(id: string, aviso: Partial<MuralAvisoInsert>) {
    const { data, error } = await supabase
      .from('mural_avisos')
      .update(aviso)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
