export interface Turma {
  id: string;
  nome: string;
  turno: 'matutino' | 'vespertino' | 'noturno' | 'integral';
  horario_inicio: string;
  horario_fim: string;
  capacidade: number;
  valor_mensalidade: number;
  status: 'ativa' | 'inativa';
  created_at: string;
}

export interface Disciplina {
  id: string;
  nome: string;
  codigo: string;
  carga_horaria_total: number;
  cor: string;
  ativa: boolean;
}

export interface Professor {
  id: string;
  nome: string;
  especialidades: string[]; // ids das disciplinas
  carga_horaria_maxima: number;
  ativo: boolean;
  avatar_url?: string;
}

export interface ProfessorTurma {
  id: string;
  turma_id: string;
  professor_id: string;
  disciplina_id: string;
  carga_horaria_semanal: number;
  data_inicio: string;
  data_fim: string | null;
  status: 'ativo' | 'inativo' | 'substituicao';
}

export interface GradeHoraria {
  id: string;
  turma_id: string;
  disciplina_id: string;
  professor_id: string | null;
  dia_semana: 1 | 2 | 3 | 4 | 5; // 1-5 (Seg-Sex)
  hora_inicio: string;
  hora_fim: string;
  sala: string;
  status: 'ativo' | 'inativo';
  conflitos?: {
    tipo: 'professor' | 'turma' | 'sala';
    descricao: string;
  }[];
}

export interface AlunoCompacto {
  id: string;
  nome_completo: string;
  matricula: string;
  status: 'ativo' | 'inativo';
  foto_url?: string;
  turma_id: string;
}

export interface TurmaStoreState {
  turmas: Turma[];
  disciplinas: Disciplina[];
  professores: Professor[];
  grade_horaria: GradeHoraria[];
  professor_turma: ProfessorTurma[];
  alunos: AlunoCompacto[];
}
