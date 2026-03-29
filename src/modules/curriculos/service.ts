import { supabase } from '@/lib/supabase'
import type { Curriculo, CurriculoInsert } from '@/lib/database.types'

export const curriculosService = {
  /**
   * Lista currículos públicos disponíveis para a escola
   */
  async listarPublicos(tenantId: string, filtros?: { areas?: string[]; search?: string }) {
    let query = supabase
      .from('curriculos')
      .select('*')
      .eq('is_publico', true)
      .eq('is_ativo', true)
      .eq('disponibilidade_emprego', true)
      .order('created_at', { ascending: false })

    if (filtros?.areas && filtros.areas.length > 0) {
      query = query.overlaps('areas_interesse', filtros.areas)
    }

    if (filtros?.search) {
      query = query.or(`
        resumo_profissional.ilike.%${filtros.search}%,
        observacoes.ilike.%${filtros.search}%
      `)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []).map(item => ({
      ...item,
      funcionarios: item.funcionario_id ? {
        nome_completo: 'Profissional Disponível',
        funcao: null,
      } : null,
      usuarios_sistema: null,
    }))
  },

  /**
   * Busca currículo detalhado por ID
   */
  async buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('curriculos')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    
    if (data) {
      return {
        ...data,
        funcionarios: data.funcionario_id ? {
          nome_completo: 'Profissional Disponível',
          funcao: null,
        } : null,
        usuarios_sistema: null,
      }
    }
    return null
  },

  /**
   * Busca currículo pelo user_id
   */
  async buscarPorUserId(userId: string) {
    const { data, error } = await supabase
      .from('curriculos')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    return data
  },

  /**
   * Cria ou atualiza currículo
   */
  async salvar(data: CurriculoInsert) {
    const { data: result, error } = await supabase
      .from('curriculos')
      .upsert(data, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error
    return result
  },

  /**
   * Atualiza currículo
   */
  async atualizar(id: string, data: Partial<Curriculo>) {
    const { data: result, error } = await supabase
      .from('curriculos')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return result
  },

  /**
   * Marca currículo como público/privado
   */
  async atualizarVisibilidade(id: string, isPublico: boolean) {
    return this.atualizar(id, { is_publico: isPublico })
  },

  /**
   * Ativa/desativa currículo
   */
  async atualizarStatus(id: string, isAtivo: boolean) {
    return this.atualizar(id, { is_ativo: isAtivo })
  },
}
