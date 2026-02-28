import { supabase } from '@/lib/supabase'
import type { FrequenciaInsert } from '@/lib/database.types'

export const frequenciaService = {
  async listarPorTurmaData(turmaId: string, dataAula: string, tenantId: string) {
    const { data, error } = await supabase
      .from('frequencias')
      .select('*, alunos(nome_completo)')
      .eq('turma_id', turmaId)
      .eq('data_aula', dataAula)
      .eq('tenant_id', tenantId)

    if (error) throw error
    return data
  },

  async salvarFrequencias(frequencias: FrequenciaInsert[]) {
    if (frequencias.length === 0) return

    // Delete existing para a turma/data e reinsere
    const { tenant_id, turma_id, data_aula } = frequencias[0]
    if (tenant_id && turma_id && data_aula) {
      await supabase
        .from('frequencias')
        .delete()
        .eq('tenant_id', tenant_id)
        .eq('turma_id', turma_id)
        .eq('data_aula', data_aula)
    }

    const { error } = await supabase
      .from('frequencias')
      .insert(frequencias)

    if (error) throw error
  },

  async listarPorAluno(alunoId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('frequencias')
      .select('*, turmas(nome)')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .order('data_aula', { ascending: false })
      .limit(30)

    if (error) throw error
    return data
  },

  async listarHistoricoPorTurma(turmaId: string, tenantId: string, mes?: string) {
    let query = supabase
      .from('frequencias')
      .select('*, alunos(nome_completo)')
      .eq('turma_id', turmaId)
      .eq('tenant_id', tenantId)
      .order('data_aula', { ascending: false })

    if (mes) {
      query = query.gte('data_aula', `${mes}-01`).lt('data_aula', `${mes}-32`)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  /** Busca alunos que tiveram frequência em uma turma (para deduzir matrícula) */
  async listarAlunosDaTurma(turmaId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('alunos')
      .select('id, nome_completo')
      .eq('tenant_id', tenantId)
      .eq('status', 'ativo')
      .order('nome_completo')

    if (error) throw error
    return data
  },
}
