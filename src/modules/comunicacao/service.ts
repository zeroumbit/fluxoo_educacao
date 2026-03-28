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
    // Se for professor, busca as turmas dele primeiro
    if (professorId) {
      const { data: vincs } = await (supabase as any)
        .from('turma_professores')
        .select('turma_id')
        .eq('professor_id', professorId)

      const idsT = vincs?.map((v: any) => v.turma_id) || []

      // Se não tem turmas, retorna apenas avisos globais
      if (idsT.length === 0) {
        const { data, error } = await supabase
          .from('mural_avisos')
          .select('*, turmas(nome)')
          .eq('tenant_id', tenantId)
          .is('turma_id', null)
          .order('created_at' as any, { ascending: false } as any)

        if (error) throw error
        return data ?? []
      }

      // Filtra avisos globais OU das turmas do professor
      const { data, error } = await supabase
        .from('mural_avisos')
        .select('*, turmas(nome)')
        .eq('tenant_id', tenantId)
        .or(`turma_id.is.null,turma_id.in.(${idsT.join(',')})`)
        .order('created_at' as any, { ascending: false } as any)

      if (error) throw error
      return data ?? []
    }

    // Não é professor: retorna todos os avisos
    const { data, error } = await supabase
      .from('mural_avisos')
      .select('*, turmas(nome)')
      .eq('tenant_id', tenantId)
      .order('created_at' as any, { ascending: false } as any)

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
      .order('created_at' as any, { ascending: false } as any)

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

    // Se for professor, busca as turmas dele primeiro
    if (professorId) {
      const { data: vincs } = await (supabase as any)
        .from('turma_professores')
        .select('turma_id')
        .eq('professor_id', professorId)

      const idsT = vincs?.map((v: any) => v.turma_id) || []

      // Se não tem turmas, retorna apenas avisos globais ativos
      if (idsT.length === 0) {
        const { data, error } = await supabase
          .from('mural_avisos')
          .select('*, turmas(nome)')
          .eq('tenant_id', tenantId)
          .is('turma_id', null)
          .or(`data_fim.is.null,data_fim.gte.${hoje}`)
          .order('created_at' as any, { ascending: false } as any)
          .limit(limite)

        if (error) throw error
        return data ?? []
      }

      // Filtra avisos globais OU das turmas do professor, apenas ativos
      const { data, error } = await supabase
        .from('mural_avisos')
        .select('*, turmas(nome)')
        .eq('tenant_id', tenantId)
        .or(`turma_id.is.null,turma_id.in.(${idsT.join(',')})`)
        .or(`data_fim.is.null,data_fim.gte.${hoje}`)
        .order('created_at' as any, { ascending: false } as any)
        .limit(limite)

      if (error) throw error
      return data ?? []
    }

    // Não é professor: retorna todos os avisos ativos
    const { data, error } = await supabase
      .from('mural_avisos')
      .select('*, turmas(nome)')
      .eq('tenant_id', tenantId)
      .or(`data_fim.is.null,data_fim.gte.${hoje}`)
      .order('created_at' as any, { ascending: false } as any)
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
      .order('created_at' as any, { ascending: false } as any)
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
