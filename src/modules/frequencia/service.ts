import { supabase } from '@/lib/supabase'
import type { FrequenciaInsert } from '@/lib/database.types'

export const frequenciaService = {
  async listarPorTurmaData(turmaId: string, data: string, tenantId: string) {
    const { data: frequencias, error } = await supabase
      .from('frequencias')
      .select('*, alunos(nome)')
      .eq('turma_id', turmaId)
      .eq('data', data)
      .eq('tenant_id', tenantId)

    if (error) throw error
    return frequencias
  },

  async salvarFrequencias(frequencias: FrequenciaInsert[]) {
    // Primeiro, remove as frequências existentes para a mesma turma/data
    if (frequencias.length > 0) {
      const { error: deleteError } = await supabase
        .from('frequencias')
        .delete()
        .eq('turma_id', frequencias[0].turma_id)
        .eq('data', frequencias[0].data)
        .eq('tenant_id', frequencias[0].tenant_id)

      if (deleteError) throw deleteError
    }

    const { data, error } = await supabase
      .from('frequencias')
      .insert(frequencias)
      .select()

    if (error) throw error
    return data
  },

  async listarPorAluno(alunoId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('frequencias')
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .order('data', { ascending: false })

    if (error) throw error
    return data
  },

  async listarHistoricoPorTurma(turmaId: string, tenantId: string, mes?: string) {
    let query = supabase
      .from('frequencias')
      .select('*, alunos(nome)')
      .eq('turma_id', turmaId)
      .eq('tenant_id', tenantId)
      .order('data', { ascending: false })

    if (mes) {
      query = query.gte('data', `${mes}-01`).lte('data', `${mes}-31`)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },
}
