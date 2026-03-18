import { create } from 'zustand'
import type { Turma, Disciplina, Professor, GradeHoraria, ProfessorTurma, AlunoCompacto, TurmaStoreState } from './types'

interface TurmaStore extends TurmaStoreState {
  // Setters para sincronização com Query hooks
  setTurmas: (turmas: Turma[]) => void;
  setAlunos: (alunos: AlunoCompacto[]) => void;
  setProfessores: (professores: Professor[]) => void;
  setDisciplinas: (disciplinas: Disciplina[]) => void;
  setAtribuicoes: (atribuicoes: ProfessorTurma[]) => void;
  setGrade: (grade: GradeHoraria[]) => void;

  // Actions locais para otimismo (UI imediata)
  adicionarTurma: (turma: Omit<Turma, 'id' | 'created_at'>) => void;
  atualizarTurma: (id: string, turma: Partial<Turma>) => void;
  atribuirProfessor: (atribuicao: Omit<ProfessorTurma, 'id'>) => void;
  removerAtribuicao: (id: string) => void;
  atualizarGrade: (grade: GradeHoraria) => void;
}

// Dados iniciais vazios para integração com hooks REAIS
export const useTurmaStore = create<TurmaStore>((set) => ({
  turmas: [],
  disciplinas: [],
  professores: [],
  grade_horaria: [],
  professor_turma: [],
  alunos: [],

  setTurmas: (turmas) => set({ turmas }),
  setAlunos: (alunos) => set({ alunos }),
  setProfessores: (professores) => set({ professores }),
  setDisciplinas: (disciplinas) => set({ disciplinas }),
  setAtribuicoes: (atribuicoes) => set({ professor_turma: atribuicoes }),
  setGrade: (grade) => set({ grade_horaria: grade }),

  adicionarTurma: (turma) => set((state) => ({
    turmas: [...state.turmas, { ...turma, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() }]
  })),

  atualizarTurma: (id, data) => set((state) => ({
    turmas: state.turmas.map(t => t.id === id ? { ...t, ...data } : t)
  })),

  atribuirProfessor: (atribuicao) => set((state) => ({
    professor_turma: [...state.professor_turma, { ...atribuicao, id: Math.random().toString(36).substr(2, 9) }]
  })),

  removerAtribuicao: (id) => set((state) => ({
    professor_turma: state.professor_turma.filter(p => p.id !== id)
  })),

  atualizarGrade: (grade) => set((state) => {
    const exists = state.grade_horaria.find(g => g.dia_semana === grade.dia_semana && g.hora_inicio === grade.hora_inicio && g.turma_id === grade.turma_id);
    if (exists) {
      return {
        grade_horaria: state.grade_horaria.map(g => g.id === exists.id ? { ...g, ...grade } : g)
      }
    }
    return {
      grade_horaria: [...state.grade_horaria, { ...grade, id: Math.random().toString(36).substr(2, 9) }]
    }
  })
}))
