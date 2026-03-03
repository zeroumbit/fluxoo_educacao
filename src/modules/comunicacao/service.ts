import { supabase } from '@/lib/supabase'
import type { MuralAvisoInsert } from '@/lib/database.types'

export const muralService = {
  async listar(tenantId: string) {
    const { data, error } = await supabase
      .from('mural_avisos')
      .select('*, turmas(nome)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

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
    return data
  },

  async listarRecentes(tenantId: string, limite = 5) {
    const { data, error } = await supabase
      .from('mural_avisos')
      .select('*, turmas(nome)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limite)

    if (error) throw error
    return data
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
