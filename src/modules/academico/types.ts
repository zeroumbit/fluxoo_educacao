import type { 
  Matricula, 
  Aluno, 
  MatriculaInsert, 
  PlanoAulaInsert, 
  AtividadeInsert
} from '@/lib/database.types';

export interface MatriculaComAluno extends Matricula {
  aluno: Pick<Aluno, 'nome_completo' | 'cpf'> | null;
}

export interface HistoricoRpcResponse {
  disciplinas: {
    disciplina: string;
    media_final: number | string;
    resultado: string;
  }[];
  frequencia: {
    presencas: number;
    faltas: number;
    justificadas: number;
    total_aulas: number;
    percentual: number | string;
  };
  media_geral: number | string;
}

export interface AlertaSaude {
  tipo_alerta: string;
  descricao: string;
  cuidados_especificos: string | null;
}

export interface TurmaProfessorComDisciplina {
  disciplina: {
    id: string;
    nome: string;
  } | null;
}

export interface PlanoAulaComTurmas extends Partial<PlanoAulaInsert> {
  turmas?: {
    turma_id: string;
    turno: string;
    horario?: string | null;
  }[];
}

export interface AtividadeComTurmas extends Partial<AtividadeInsert> {
  turmas?: {
    turma_id: string;
    turno?: string | null;
    horario?: string | null;
  }[];
}

export type MatriculaPayload = Partial<MatriculaInsert> & Record<string, unknown>;
