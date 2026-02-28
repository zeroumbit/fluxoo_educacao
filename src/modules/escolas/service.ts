import { supabase } from '@/lib/supabase'
import type { EscolaInsert, EscolaUpdate } from '@/lib/database.types'

export const escolaService = {
  async listar() {
    const { data, error } = await supabase
      .from('escolas')
      .select('*, planos(nome, valor_por_aluno)')
      .order('razao_social')

    if (error) throw error
    return data
  },

  async buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('escolas')
      .select('*, planos(nome, valor_por_aluno), filiais(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async criar(escola: EscolaInsert) {
    const { data, error } = await supabase
      .from('escolas')
      .insert(escola)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async atualizar(id: string, escola: EscolaUpdate) {
    const { data, error } = await supabase
      .from('escolas')
      .update(escola)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async listarPlanos() {
    const { data, error } = await supabase
      .from('planos')
      .select('*')
      .eq('status', true)
      .order('valor_por_aluno')

    if (error) throw error
    return data
  },
}
