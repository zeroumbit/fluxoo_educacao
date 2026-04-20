import { supabase } from '@/lib/supabase'
import type { FrequenciaInsert } from '@/lib/database.types'
import { logger } from '@/lib/logger'

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

    // VALIDAÇÃO EM LOTE: Verificar matrícula ativa para todos os alunos
    const tenantId = frequencias[0].tenant_id!
    const alunoIds = frequencias.map(f => f.aluno_id!)

    const { data: matriculas, error: matError } = await (supabase.from('matriculas' as any) as any)
      .select('aluno_id')
      .in('aluno_id', alunoIds)
      .eq('tenant_id', tenantId)
      .eq('status', 'ativa')

    if (matError) {
      logger.error('❌ [frequenciaService] Erro ao validar matrículas:', matError)
      throw matError
    }

    const alunosComMatricula = new Set((matriculas as any[])?.map(m => m.aluno_id))
    const alunosSemMatricula = alunoIds.filter(id => !alunosComMatricula.has(id))

    if (alunosSemMatricula.length > 0) {
      logger.warn('⚠️ [frequenciaService] Alunos sem matrícula ativa detectados:', alunosSemMatricula)
      throw new Error(
        `Não é possível lançar frequência para ${alunosSemMatricula.length} aluno(s) sem matrícula ativa. ` +
        `Regularize as matrículas antes de continuar.`
      )
    }

    // Delete existing para a turma/data e reinsere
    const { turma_id, data_aula } = frequencias[0]
    if (tenantId && turma_id && data_aula) {
      logger.debug('🔄 [frequenciaService] Limpando registros antigos:', { tenantId, turma_id, data_aula })
      const { error: delError } = await supabase
        .from('frequencias')
        .delete()
        .eq('tenant_id', tenantId)
        .eq('turma_id', turma_id)
        .eq('data_aula', data_aula)
      
      if (delError) {
        logger.error('❌ [frequenciaService] Erro ao deletar antigos:', delError)
        throw new Error(`Erro ao limpar registros antigos: ${delError.message}`)
      }
    }

    logger.info('📤 [frequenciaService] Inserindo novas frequências:', frequencias.length, 'registros')
    
    // Log de segurança para debugar 403
    if (frequencias.length > 0) {
      const amostra = frequencias[0];
      logger.debug('🔍 [frequenciaService] Amostra de payload para INSERT:', {
        tenant_id: amostra.tenant_id,
        turma_id: amostra.turma_id,
        aluno_id: amostra.aluno_id,
        status: amostra.status,
        data_aula: amostra.data_aula
      })
    }

    const { error } = await supabase
      .from('frequencias')
      .insert(frequencias)

    if (error) {
      logger.error('❌ [frequenciaService] Erro no INSERT:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
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
      .select(`
        aluno_id, 
        alunos (
          id, 
          nome_completo, 
          nome_social, 
          foto_url, 
          data_nascimento,
          patologias,
          medicamentos,
          alertas_saude_nee (
            tipo_alerta,
            descricao
          )
        )
      `)
      .eq('turma_id', turmaId)
      .eq('tenant_id', tenantId)
      .eq('status', 'ativa')

    if (matError) {
      logger.error('❌ [frequenciaService] Erro ao buscar alunos da turma:', matError)
      throw matError
    }

    return (matriculas || [])
      .map((m: any) => m.alunos)
      .filter(Boolean)
      .sort((a: any, b: any) => (a.nome_social || a.nome_completo).localeCompare(b.nome_social || b.nome_completo))
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
