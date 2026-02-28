import { supabase } from '@/lib/supabase'
import type { CobrancaInsert } from '@/lib/database.types'

export const financeirService = {
  async listar(tenantId: string, filtroStatus?: string) {
    let query = supabase
      .from('cobrancas')
      .select('*, alunos(nome)')
      .eq('tenant_id', tenantId)
      .order('vencimento', { ascending: false })

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
    const { data, error } = await supabase
      .from('cobrancas')
      .update({
        status: 'pago',
        data_pagamento: new Date().toISOString().split('T')[0],
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async contarAbertas(tenantId: string) {
    const { count, error } = await supabase
      .from('cobrancas')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('status', ['pendente', 'atrasado'])

    if (error) throw error
    return count || 0
  },

  async listarPorAluno(alunoId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('cobrancas')
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .order('vencimento', { ascending: false })

    if (error) throw error
    return data
  },
}
