import { supabase } from '@/lib/supabase'

export interface MonthlyMetric {
  rotulo: string
  valor: number
}

export interface RevenueComparison {
  rotulo: string
  previsto: number
  recebido: number
}

export interface ClassComparison {
  turmaNome: string
  presencaMedia: number
}

export interface DashboardAnalytics {
  novasMatriculasPorMes: MonthlyMetric[]
  frequenciaPorMes: MonthlyMetric[]
  receitaComparada: RevenueComparison[]
  inadimplenciaPorMes: MonthlyMetric[]
}

function gerarMeses(qtd: number): { chave: string; rotulo: string; inicio: string; fim: string }[] {
  const meses: { chave: string; rotulo: string; inicio: string; fim: string }[] = []
  const hoje = new Date()
  for (let i = qtd - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const rotulo = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace(/\.? de /g, '/').replace('.', '')
    const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
    meses.push({ chave, rotulo, inicio: d.toISOString().split('T')[0], fim })
  }
  return meses
}

interface MatriculaRow {
  created_at: string
  status: string
}

interface FrequenciaRow {
  data_aula: string
  status: string
}

interface CobrancaRow {
  data_vencimento: string
  valor: number
  status: string
  pago: boolean
  subtipo_cobranca: string
}

interface TurmaRow {
  id: string
  nome: string
}

export const dashboardAnalyticsService = {
  async buscarAnalytics(
    tenantId: string,
    professorId?: string,
  ): Promise<DashboardAnalytics> {
    if (!tenantId) throw new Error('Tenant ID não fornecido.')

    let idsTurmasProfessor: string[] = []
    let idsAlunosProfessor: string[] = []

    if (professorId) {
      const { data: vinc } = await supabase
        .from('turma_professores')
        .select('turma_id')
        .eq('professor_id', professorId)
      idsTurmasProfessor = vinc?.map((t) => t.turma_id) || []

      if (idsTurmasProfessor.length > 0) {
        const { data: mats } = await supabase
          .from('matriculas')
          .select('aluno_id')
          .in('turma_id', idsTurmasProfessor)
          .eq('status', 'ativa')
        idsAlunosProfessor = Array.from(new Set(mats?.map((m) => m.aluno_id) || []))
      }
    }

    const meses = gerarMeses(12)
    const dataInicio = meses[0].inicio

    const isProfessorScope = !!professorId

    const [
      matriculasRes,
      frequenciasRes,
      cobrancasRes,
      turmasRes,
    ] = await Promise.all([
      isProfessorScope
        ? Promise.resolve({ data: null as MatriculaRow[] | null })
        : supabase
            .from('matriculas')
            .select('created_at, status')
            .eq('tenant_id', tenantId)
            .gte('created_at', dataInicio)
            .returns<MatriculaRow[]>(),
      supabase
        .from('frequencias')
        .select('data_aula, status')
        .eq('tenant_id', tenantId)
        .gte('data_aula', dataInicio)
        .returns<FrequenciaRow[]>(),
      isProfessorScope
        ? Promise.resolve({ data: null as CobrancaRow[] | null })
        : supabase
            .from('cobrancas')
            .select('data_vencimento, valor, status, pago, subtipo_cobranca')
            .eq('tenant_id', tenantId)
            .gte('data_vencimento', dataInicio)
            .returns<CobrancaRow[]>(),
      supabase
        .from('turmas')
        .select('id, nome')
        .eq('tenant_id', tenantId)
        .returns<TurmaRow[]>(),
    ])

    const matriculas = (matriculasRes.data || []) as MatriculaRow[]
    const frequencias = (frequenciasRes.data || []) as FrequenciaRow[]
    const cobrancas = (cobrancasRes.data || []) as CobrancaRow[]
    const turmas = (turmasRes.data || []) as TurmaRow[]

    const novasMatriculasPorMes = meses.map((mes) => ({
      rotulo: mes.rotulo,
      valor: matriculas.filter((m) => {
        const criada = m.created_at?.split('T')[0] || ''
        return criada >= mes.inicio && criada <= mes.fim
      }).length,
    }))

    const frequenciaPorMes = meses.map((mes) => {
      const registros = frequencias.filter((f) => {
        const data = f.data_aula || ''
        return data >= mes.inicio && data <= mes.fim
      })
      const total = registros.length
      const presentes = registros.filter((f) => f.status === 'presente').length
      return {
        rotulo: mes.rotulo,
        valor: total > 0 ? Math.round((presentes / total) * 100) : 0,
      }
    })

    const receitaComparada: RevenueComparison[] = meses.map((mes) => {
      const doMes = cobrancas.filter((c) => {
        const venc = c.data_vencimento || ''
        return venc >= mes.inicio && venc <= mes.fim
      })
      const recebido = doMes
        .filter((c) => c.pago)
        .reduce((acc, c) => acc + (Number(c.valor) || 0), 0)
      const previsto = doMes
        .filter((c) => !c.pago)
        .reduce((acc, c) => acc + (Number(c.valor) || 0), 0)
      return {
        rotulo: mes.rotulo,
        previsto: Math.round(previsto),
        recebido: Math.round(recebido),
      }
    })

    const inadimplenciaPorMes: MonthlyMetric[] = meses.map((mes) => {
      const valor = cobrancas
        .filter((c) => {
          const venc = c.data_vencimento || ''
          return (
            venc >= mes.inicio &&
            venc <= mes.fim &&
            !c.pago &&
            c.status === 'atrasado'
          )
        })
        .reduce((acc, c) => acc + (Number(c.valor) || 0), 0)
      return { rotulo: mes.rotulo, valor: Math.round(valor) }
    })

    let turmasComparacao: { id: string; nome: string }[] = turmas
    if (isProfessorScope && idsTurmasProfessor.length > 0) {
      turmasComparacao = turmas.filter((t) => idsTurmasProfessor.includes(t.id))
    }

    const comparacaoTurmas: ClassComparison[] = []
    for (const turma of turmasComparacao.slice(0, 10)) {
      const { data: freqData } = await supabase
        .from('frequencias')
        .select('status')
        .eq('tenant_id', tenantId)
        .eq('turma_id', turma.id)
        .gte('data_aula', dataInicio)

      const registros = (freqData || []) as FrequenciaRow[]
      const total = registros.length
      const presentes = registros.filter((f) => f.status === 'presente').length
      comparacaoTurmas.push({
        turmaNome: turma.nome,
        presencaMedia: total > 0 ? Math.round((presentes / total) * 100) : 0,
      })
    }

    return {
      novasMatriculasPorMes,
      frequenciaPorMes,
      receitaComparada,
      inadimplenciaPorMes,
    }
  },
}
