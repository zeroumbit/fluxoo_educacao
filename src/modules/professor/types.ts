// Tipos para o Dashboard Operacional do Professor

export interface AgendaAula {
  grade_id: string
  turma_id: string
  turma_nome: string
  disciplina_id: string
  disciplina_nome: string
  hora_inicio: string
  hora_fim: string
  sala: string
  data_aula: string
  chamada_realizada: boolean
  conteudo_registrado: boolean
}

export interface Pendencia {
  tipo_pendencia: 'conteudo' | 'notas' | 'outros'
  descricao: string
  contexto: string
  data_referencia: string
}

export interface SaudeTurma {
  turma_id: string
  turma_nome: string
  total_alunos: number
  percentual_presenca: number
  media_geral: number
}

export interface ProfessorDashboardData {
  agenda: AgendaAula[]
  pendencias: Pendencia[]
  saudeTurmas: SaudeTurma[]
}
