import type { Aluno, DisciplinaDb, Matricula, Turma } from '@/lib/database.types'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'
import type { AgendaAula, AlertaProfessor, Pendencia, SaudeTurma } from './types'

type TurmaProfessorVinculo = {
  turma_id: string
  turmas?: Turma | null
  disciplinas?: DisciplinaDb | null
}

type MatriculaComAlunoTurma = Pick<Matricula, 'id' | 'turma_id' | 'aluno_id'> & {
  alunos: Pick<Aluno, 'id' | 'nome_completo'> | null
  turmas: Pick<Turma, 'id' | 'nome'> | null
}

type AlunoProfessorResumo = {
  id: string | undefined
  nome: string | undefined
  turma_id: string | null
  turma_nome: string | undefined
  matricula_id: string
  frequencia: number
  media: number
  alertas: number
}

type AlunoTurmaResumo = Pick<Aluno, 'id' | 'nome_completo' | 'foto_url'>
type MatriculaTurmaResumo = Pick<Matricula, 'id' | 'aluno_id' | 'status'>
type TurmaDetalhesProfessor = Turma & {
  disciplina?: DisciplinaDb | null
  alunos: {
    id: string
    nome: string | undefined
    foto_url: string | null | undefined
    matricula_id: string
    status: Matricula['status']
  }[]
  total_alunos: number
  percentual_presenca: number
  media_geral: number
}

type TurmaProfessorDisciplina = {
  turma_id: string
  turmas: Pick<Turma, 'id' | 'nome'> | null
  disciplinas: Pick<DisciplinaDb, 'id' | 'nome'> | null
}

type TurmaDisciplinaVinculo = {
  turma_id: string
  disciplinas: Pick<DisciplinaDb, 'id' | 'nome'> | null
}

type TurmaAlunoResumo = Pick<Turma, 'id' | 'nome' | 'turno'>
type MatriculaAlunoDetalhe = Pick<Matricula, 'id' | 'status' | 'data_matricula' | 'turma_id'>
type AlunoDetalheProfessor = Aluno & {
  turmas: {
    matricula_id: string
    turma_id: string | null
    turma_nome: string | undefined
    disciplina_nome: string | undefined
    turno: string | null | undefined
    status: Matricula['status']
  }[]
  tem_vinculo: boolean
  percentual_presenca?: number
  media_geral?: number
  total_faltas?: number
  total_aulas?: number
}

type LegacyProfessorClient = {
  from(table: 'turma_professores'): {
    select(columns: string): {
      eq(column: string, value: string): LegacyProfessorQuery
      in(column: string, values: string[]): LegacyProfessorQuery
      single(): Promise<{ data: TurmaProfessorVinculo | null; error: unknown }>
    }
  }
}

type LegacyProfessorQuery = PromiseLike<{ data: unknown[] | null; error: unknown }> & {
  eq(column: string, value: string): LegacyProfessorQuery
  in(column: string, values: string[]): LegacyProfessorQuery
  single(): Promise<{ data: TurmaProfessorVinculo | null; error: unknown }>
}

const legacyProfessorClient = supabase as unknown as LegacyProfessorClient

export const professorService = {
  async buscarAgendaHoje(professorId: string, tenantId: string): Promise<AgendaAula[]> {
    const { data, error } = await supabase
      .from('vw_professor_agenda_hoje')
      .select('*')
      .eq('professor_id', professorId)
      .eq('tenant_id', tenantId)
      .order('hora_inicio', { ascending: true })

    if (error) {
      logger.error('[professorService] Erro ao buscar agenda', error)
      return []
    }
    return (data as AgendaAula[]) || []
  },

  async buscarPendencias(professorId: string, tenantId: string): Promise<Pendencia[]> {
    const { data, error } = await supabase
      .from('vw_professor_pendencias')
      .select('*')
      .eq('professor_id', professorId)
      .eq('tenant_id', tenantId)
      .order('data_referencia', { ascending: true })

    if (error) {
      logger.error('[professorService] Erro ao buscar pendencias', error)
      return []
    }
    return (data as Pendencia[]) || []
  },

  async buscarSaudeTurmas(professorId: string, tenantId: string): Promise<SaudeTurma[]> {
    const { data, error } = await supabase
      .from('vw_professor_saude_turmas')
      .select('*')
      .eq('professor_id', professorId)
      .eq('tenant_id', tenantId)
      .order('turma_nome', { ascending: true })

    if (error) {
      logger.error('[professorService] Erro ao buscar saude das turmas', error)
      return []
    }
    return (data as SaudeTurma[]) || []
  },

  async buscarAlertas(_professorId: string, tenantId: string): Promise<AlertaProfessor[]> {
    const { data, error } = await supabase
      .from('vw_alertas_professor')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'ativo')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('[professorService] Erro ao buscar alertas', error)
      return []
    }
    return (data as AlertaProfessor[]) || []
  },

  async concluirAlerta(alertaId: string, observacao?: string): Promise<boolean> {
    const { error } = await supabase.rpc('concluir_alerta_professor', {
      p_alerta_id: alertaId,
      p_observacao: observacao
    })

    if (error) {
      logger.error('[professorService] Erro ao concluir alerta', error)
      return false
    }
    return true
  },

  async buscarAlunosDoProfessor(professorId: string, tenantId: string): Promise<AlunoProfessorResumo[]> {
    const { data: turmasVinc } = await legacyProfessorClient
      .from('turma_professores')
      .select('turma_id')
      .eq('professor_id', professorId)

    const idsTurmas = (turmasVinc as TurmaProfessorVinculo[] | null)?.map((t) => t.turma_id) || []
    if (idsTurmas.length === 0) return []

    const { data, error } = await supabase
      .from('matriculas')
      .select(`
        id,
        turma_id,
        aluno_id,
        alunos (id, nome_completo),
        turmas (id, nome)
      `)
      .in('turma_id', idsTurmas)
      .eq('tenant_id', tenantId)
      .eq('status', 'ativa')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('[professorService] Erro ao buscar alunos', error)
      return []
    }

    return ((data as MatriculaComAlunoTurma[] | null) || []).map((m) => ({
      id: m.alunos?.id,
      nome: m.alunos?.nome_completo,
      turma_id: m.turma_id,
      turma_nome: m.turmas?.nome,
      matricula_id: m.id,
      frequencia: 0,
      media: 0,
      alertas: 0
    })).sort((a, b) => a.nome?.localeCompare(b.nome || '') || 0)
  },

  async buscarDetalhesTurma(turmaId: string, professorId: string, tenantId: string): Promise<TurmaDetalhesProfessor | null> {
    const { data: vinculo } = await legacyProfessorClient
      .from('turma_professores')
      .select('*, turmas!inner(*), disciplinas!inner(*)')
      .eq('turma_id', turmaId)
      .eq('professor_id', professorId)
      .single()

    if (!vinculo) return null

    const { data: turmaData } = await supabase
      .from('turmas')
      .select('*')
      .eq('id', turmaId)
      .single()

    if (!turmaData) return null

    const { data: matriculas } = await supabase
      .from('matriculas')
      .select('id, aluno_id, status')
      .eq('turma_id', turmaId)
      .eq('tenant_id', tenantId)
      .eq('status', 'ativa')

    const matriculasResumo = (matriculas as MatriculaTurmaResumo[] | null) || []
    const alunoIds = matriculasResumo.map((m) => m.aluno_id)

    let alunosData: AlunoTurmaResumo[] = []
    if (alunoIds.length > 0) {
      const { data: alunos } = await supabase
        .from('alunos')
        .select('id, nome_completo, foto_url')
        .in('id', alunoIds)

      alunosData = (alunos as AlunoTurmaResumo[] | null) || []
    }

    const alunosFormatados = matriculasResumo.map((m) => {
      const aluno = alunosData.find((a) => a.id === m.aluno_id)
      return {
        id: m.aluno_id,
        nome: aluno?.nome_completo,
        foto_url: aluno?.foto_url,
        matricula_id: m.id,
        status: m.status,
      }
    }).sort((a, b) => a.nome?.localeCompare(b.nome || '') || 0)

    return {
      ...turmaData,
      disciplina: vinculo.disciplinas,
      alunos: alunosFormatados,
      total_alunos: alunosFormatados.length,
      percentual_presenca: 0,
      media_geral: 0,
    }
  },

  async buscarDetalhesAluno(alunoId: string, professorId: string, tenantId: string): Promise<AlunoDetalheProfessor | null> {
    const { data: alunoData, error: alunoError } = await supabase
      .from('alunos')
      .select('*')
      .eq('id', alunoId)
      .single()

    if (alunoError || !alunoData) return null

    const { data: turmasProfessor } = await legacyProfessorClient
      .from('turma_professores')
      .select('turma_id, turmas!inner(id, nome), disciplinas!inner(id, nome)')
      .eq('professor_id', professorId)

    const turmasProfessorResumo = (turmasProfessor as TurmaProfessorDisciplina[] | null) || []
    const idsTurmasProfessor = turmasProfessorResumo.map((t) => t.turma_id)

    if (idsTurmasProfessor.length === 0) {
      return {
        ...alunoData,
        turmas: [],
        tem_vinculo: false,
      }
    }

    const { data: turmasData } = await supabase
      .from('turmas')
      .select('id, nome, turno')
      .in('id', idsTurmasProfessor)

    const { data: turmasDisciplinas } = await legacyProfessorClient
      .from('turma_professores')
      .select('turma_id, disciplinas(id, nome)')
      .in('turma_id', idsTurmasProfessor)
      .eq('professor_id', professorId)

    const discMap = new Map<string, string | undefined>()
    ;((turmasDisciplinas as TurmaDisciplinaVinculo[] | null) || []).forEach((td) => {
      discMap.set(td.turma_id, td.disciplinas?.nome)
    })

    const { data: matriculas } = await supabase
      .from('matriculas')
      .select('id, status, data_matricula, turma_id')
      .eq('aluno_id', alunoId)
      .in('turma_id', idsTurmasProfessor)
      .eq('tenant_id', tenantId)
      .eq('status', 'ativa')

    const turmasFormatadas = ((matriculas as MatriculaAlunoDetalhe[] | null) || []).map((m) => {
      const turma = ((turmasData as TurmaAlunoResumo[] | null) || []).find((t) => t.id === m.turma_id)
      return {
        matricula_id: m.id,
        turma_id: m.turma_id,
        turma_nome: turma?.nome,
        disciplina_nome: m.turma_id ? discMap.get(m.turma_id) : undefined,
        turno: turma?.turno,
        status: m.status,
      }
    })

    return {
      ...alunoData,
      turmas: turmasFormatadas,
      tem_vinculo: turmasFormatadas.length > 0,
      percentual_presenca: 0,
      media_geral: 0,
      total_faltas: 0,
      total_aulas: 0,
    }
  }
}
