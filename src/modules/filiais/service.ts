import { supabase } from '@/lib/supabase'
import type { FilialInsert, FilialUpdate } from '@/lib/database.types'

export const filialService = {
  async listar(tenantId: string) {
    const { data, error } = await supabase
      .from('filiais')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('is_matriz', { ascending: false })
      .order('nome_unidade')

    if (error) throw error
    return data
  },

  async criar(filial: FilialInsert) {
    const { data, error } = await supabase
      .from('filiais')
      .insert(filial)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async atualizar(id: string, filial: FilialUpdate) {
    const { data, error } = await supabase
      .from('filiais')
      .update(filial)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async excluir(id: string) {
    const { error } = await supabase
      .from('filiais')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
