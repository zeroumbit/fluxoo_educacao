/**
 * Tipos Compartilhados do Fluxoo EDU
 * A fonte da verdade para entidades que cruzam múltiplos módulos.
 */

export interface AlunoBase {
  id: string
  tenant_id: string
  nome_completo: string
  status: string
  foto_url: string | null
  turma_id: string | null
  data_nascimento?: string | null
  cpf?: string | null
}

export interface TurmaCompacta {
  id: string
  nome: string
  turno: string
  horario?: string | null
  valor_mensalidade?: number | null
}

export interface FilialCompacta {
  nome_unidade: string
}

/**
 * Usado pelo Portal do Aluno/Responsável
 * Extende o AlunoBase com dados financeiros, de saúde e filial.
 */
export interface AlunoVinculado extends AlunoBase {
  nome_social: string | null
  filial_id: string | null
  turma: TurmaCompacta | null
  filial: FilialCompacta | null
  valor_matricula: number | null
  genero?: string | null
  cep?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
  patologias?: string[] | null
  medicamentos?: string[] | null
  observacoes_saude?: string | null
}

/**
 * Usado pelas listagens e dashboards simplificados (ex: ABA Turmas)
 */
export interface AlunoCompacto extends AlunoBase {
  matricula?: string | null
  turma_atual?: any
}

/**
 * Usado no Módulo Acadêmico/Secretaria com todos os relacionamentos preenchidos
 */
export interface AlunoWithRelations extends Omit<AlunoBase, 'nome_completo'> {
  nome: string // Nota: O banco usa 'nome' em algumas views
  sexo: string | null
  endereco: string | null
  telefone: string | null
  email: string | null
  alergias: string | null
  tipo_sanguineo: string | null
  observacoes_saude: string | null
  responsavel_id: string | null
  criado_em: string
  atualizado_em: string
  turmas?: { nome: string; turno: string } | null
  responsaveis?: { nome: string; telefone: string | null; email: string | null } | null
}

export interface ResponsavelBase {
  id: string
  nome: string
  email: string | null
  telefone: string | null
}
