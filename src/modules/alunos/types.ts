export type { Aluno, AlunoInsert, AlunoUpdate } from '@/lib/database.types'

export interface AlunoWithRelations {
  id: string
  tenant_id: string
  nome: string
  data_nascimento: string | null
  cpf: string | null
  sexo: string | null
  endereco: string | null
  telefone: string | null
  email: string | null
  foto_url: string | null
  alergias: string | null
  medicamentos: string | null
  tipo_sanguineo: string | null
  observacoes_saude: string | null
  turma_id: string | null
  responsavel_id: string | null
  status: string
  criado_em: string
  atualizado_em: string
  turmas?: { nome: string; turno: string } | null
  responsaveis?: { nome: string; telefone: string | null; email: string | null } | null
}

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
