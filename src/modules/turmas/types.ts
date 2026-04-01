export interface Turma {
  id: string;
  tenant_id: string;
  filial_id: string | null;
  nome: string;
  sala: string | null;
  capacidade_maxima: number | null;
  max_alunos?: number | null;
  capacidade?: number; // compatibilidade
  turno: 'matutino' | 'vespertino' | 'noturno' | 'integral' | string | null;
  valor_mensalidade: number | null;
  status: 'ativa' | 'inativa' | string | null;
  professores_ids: string[] | null;
  alunos_ids: string[] | null;
  created_at: string;
  updated_at?: string;
  // Campos virtuais úteis para UI
  horario_inicio?: string; 
  horario_fim?: string;
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
  especialidades: string[]; // nomes das funções que contêm "professor"
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
  data_inicio?: string;
  data_fim?: string | null;
  status: 'ativo' | 'inativo' | 'substituicao' | string;
}

export interface GradeHoraria {
  id: string;
  turma_id: string;
  disciplina_id: string;
  professor_id: string | null;
  dia_semana: number; // 1-5 (Seg-Sex)
  hora_inicio: string;
  hora_fim: string;
  sala: string | null;
  status: 'ativo' | 'inativo' | string;
  conflitos?: {
    tipo: 'professor' | 'turma' | 'sala';
    descricao: string;
  }[];
}

export interface AlunoCompacto {
  id: string;
  nome_completo: string;
  matricula?: string | null;
  status: string;
  foto_url?: string | null;
  turma_id?: string | null;
  cpf?: string | null;
  turma_atual?: any; // Para o filtro na aba de alunos
}

export interface TurmaStoreState {
  turmas: Turma[];
  disciplinas: Disciplina[];
  professores: Professor[];
  grade_horaria: GradeHoraria[];
  professor_turma: ProfessorTurma[];
  alunos: AlunoCompacto[];
}
