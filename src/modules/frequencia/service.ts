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

    // VALIDAÇÃO: Verificar matrícula ativa para cada aluno
    const alunosSemMatricula: string[] = []

    for (const freq of frequencias) {
      if (!freq.tenant_id || !freq.aluno_id) continue

      const { data: matricula } = await (supabase.from('matriculas' as any) as any)
        .select('id')
        .eq('aluno_id', freq.aluno_id!)
        .eq('tenant_id', freq.tenant_id!)
        .eq('status' as any, 'ativa')
        .maybeSingle()

      if (!matricula) {
        alunosSemMatricula.push(freq.aluno_id)
      }
    }

    if (alunosSemMatricula.length > 0) {
      throw new Error(
        `Não é possível lançar frequência para ${alunosSemMatricula.length} aluno(s) sem matrícula ativa. ` +
        `Regularize as matrículas antes de continuar.`
      )
    }

    // Delete existing para a turma/data e reinsere
    const { tenant_id, turma_id, data_aula } = frequencias[0]
    if (tenant_id && turma_id && data_aula) {
      console.log('🔄 [frequenciaService] Limpando registros antigos:', { tenant_id, turma_id, data_aula })
      const { error: delError } = await supabase
        .from('frequencias')
        .delete()
        .eq('tenant_id', tenant_id)
        .eq('turma_id', turma_id)
        .eq('data_aula', data_aula)
      
      if (delError) {
        console.error('❌ [frequenciaService] Erro ao deletar antigos:', delError)
        throw new Error(`Erro ao limpar registros antigos: ${delError.message}`)
      }
    }

    console.log('📤 [frequenciaService] Inserindo novas frequências:', frequencias.length, 'registros')
    const { error } = await supabase
      .from('frequencias')
      .insert(frequencias)

    if (error) {
      console.error('❌ [frequenciaService] Erro no INSERT:', error)
      throw error
    }
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
      const [year, month] = mes.split('-').map(Number)
      const nextMonthDate = new Date(year, month, 1)
      const nextMonthStr = nextMonthDate.toISOString().split('T')[0]
      
      query = query.gte('data_aula', `${mes}-01`).lt('data_aula', nextMonthStr)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async buscarResumoFaltasPorPeriodo(alunoId: string, tenantId: string, dataInicio: string, dataFim: string) {
    const { count, error } = await supabase
      .from('frequencias')
      .select('id', { count: 'exact', head: true })
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .eq('status', 'falta')
      .gte('data_aula', dataInicio)
      .lte('data_aula', dataFim)

    if (error) throw error
    return count || 0
  },

  async listarAlunosDaTurma(turmaId: string, tenantId: string) {
    const { data: matriculas, error: matError } = await (supabase.from('matriculas' as any) as any)
      .select('aluno_id, alunos(id, nome_completo)')
      .eq('turma_id', turmaId)
      .eq('tenant_id', tenantId)
      .eq('status', 'ativa')

    if (matError) throw matError

    return (matriculas || [])
      .map((m: any) => m.alunos)
      .filter(Boolean)
      .sort((a: any, b: any) => a.nome_completo.localeCompare(b.nome_completo)) as { id: string, nome_completo: string }[]
  },

  async buscarFaltasTurmaPeriodo(turmaId: string, tenantId: string, dataInicio: string, dataFim: string) {
    const { data, error } = await supabase
      .from('frequencias')
      .select('aluno_id, status')
      .eq('turma_id', turmaId)
      .eq('tenant_id', tenantId)
      .eq('status', 'falta')
      .gte('data_aula', dataInicio)
      .lte('data_aula', dataFim)

    if (error) throw error

    const resumo: Record<string, number> = {}
    ;(data || []).forEach((f: any) => {
      if (f.aluno_id) {
        resumo[f.aluno_id] = (resumo[f.aluno_id] || 0) + 1
      }
    })
    return resumo
  },
}
