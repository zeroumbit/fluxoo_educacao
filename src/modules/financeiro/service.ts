import { supabase } from '@/lib/supabase'
import type { CobrancaInsert } from '@/lib/database.types'

export const financeirService = {
  async listar(tenantId: string, filtroStatus?: string) {
    let query = supabase
      .from('cobrancas')
      .select('*, alunos(nome_completo)')
      .eq('tenant_id', tenantId)
      .order('data_vencimento', { ascending: false })

    if (filtroStatus && filtroStatus !== 'todos') {
      query = query.eq('status', filtroStatus)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async criar(cobranca: CobrancaInsert) {
    const { data, error } = await supabase
      .from('cobrancas')
      .insert(cobranca)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async marcarComoPago(id: string) {
    const { error } = await supabase
      .from('cobrancas')
      .update({ status: 'pago' })
      .eq('id', id)

    if (error) throw error
  },

  async contarAbertas(tenantId: string) {
    const { count, error } = await supabase
      .from('cobrancas')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('status', ['a_vencer', 'atrasado'])

    if (error) throw error
    return count || 0
  },

  async listarPorAluno(alunoId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('cobrancas')
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .order('data_vencimento', { ascending: false })

    if (error) throw error
    return data
  },
}
