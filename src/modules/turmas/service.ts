import { supabase } from '@/lib/supabase'
import type { TurmaInsert, TurmaUpdate } from '@/lib/database.types'

export const turmaService = {
  async listar(tenantId: string) {
    const { data, error } = await supabase
      .from('turmas')
      .select('*, filiais(nome_unidade)')
      .eq('tenant_id', tenantId)
      .order('nome')

    if (error) throw error
    return data
  },

  async buscarPorId(id: string, tenantId: string) {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) throw error
    return data
  },

  async criar(turma: any) {
    const { data, error } = await supabase
      .from('turmas')
      .insert(turma)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async atualizar(id: string, turma: any) {
    const { data, error } = await supabase
      .from('turmas')
      .update(turma)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async excluir(id: string) {
    const { error } = await supabase
      .from('turmas')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
