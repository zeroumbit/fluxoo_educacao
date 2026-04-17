export type { Aluno, AlunoInsert, AlunoUpdate } from '@/lib/database.types'

export type { AlunoWithRelations } from '@/types/shared';

export interface AlunoFormData {
  // Etapa 1 - Dados pessoais
  nome: string
  data_nascimento: string
  cpf: string
  sexo: string
  endereco: string
  telefone: string
  email: string
  // Etapa 2 - Saúde
  alergias: string
  medicamentos: string
  tipo_sanguineo: string
  observacoes_saude: string
  // Etapa 3 - Responsável
  responsavel_nome: string
  responsavel_cpf: string
  responsavel_telefone: string
  responsavel_email: string
  responsavel_parentesco: string
  // Etapa 4 - Turma
  turma_id: string
}
