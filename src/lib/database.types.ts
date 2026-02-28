/**
 * Tipos TypeScript gerados a partir do schema REAL do Supabase.
 * NÃO ALTERE MANUALMENTE — espelha exatamente o banco de dados.
 */

export type Database = {
  public: {
    Tables: {
      escolas: {
        Row: Escola
        Insert: EscolaInsert
        Update: EscolaUpdate
      }
      filiais: {
        Row: Filial
        Insert: FilialInsert
        Update: FilialUpdate
      }
      alunos: {
        Row: Aluno
        Insert: AlunoInsert
        Update: AlunoUpdate
      }
      turmas: {
        Row: Turma
        Insert: TurmaInsert
        Update: TurmaUpdate
      }
      funcionarios: {
        Row: Funcionario
        Insert: FuncionarioInsert
        Update: FuncionarioUpdate
      }
      responsaveis: {
        Row: Responsavel
        Insert: ResponsavelInsert
        Update: ResponsavelUpdate
      }
      aluno_responsavel: {
        Row: AlunoResponsavel
        Insert: AlunoResponsavelInsert
        Update: AlunoResponsavelUpdate
      }
      frequencias: {
        Row: Frequencia
        Insert: FrequenciaInsert
        Update: FrequenciaUpdate
      }
      mural_avisos: {
        Row: MuralAviso
        Insert: MuralAvisoInsert
        Update: MuralAvisoUpdate
      }
      cobrancas: {
        Row: Cobranca
        Insert: CobrancaInsert
        Update: CobrancaUpdate
      }
      planos: {
        Row: Plano
        Insert: PlanoInsert
        Update: PlanoUpdate
      }
      historico_assinatura: {
        Row: HistoricoAssinatura
        Insert: HistoricoAssinaturaInsert
        Update: HistoricoAssinaturaUpdate
      }
      audit_logs: {
        Row: AuditLog
        Insert: AuditLogInsert
        Update: AuditLogUpdate
      }
    }
  }
}

// ========== ESCOLAS ==========
export type Escola = {
  id: string
  slug: string
  razao_social: string
  cnpj: string
  email_gestor: string
  telefone: string | null
  cep: string | null
  logradouro: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  plano_id: string | null
  limite_alunos_contratado: number
  status_assinatura: string
  data_inicio: string | null
  data_fim: string | null
  created_at: string
  updated_at: string
}
export type EscolaInsert = Omit<Escola, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}
export type EscolaUpdate = Partial<EscolaInsert>

// ========== FILIAIS ==========
export type Filial = {
  id: string
  tenant_id: string | null
  nome_unidade: string
  cnpj_proprio: string | null
  endereco_completo: string | null
  is_matriz: boolean
  created_at: string
  updated_at: string
}
export type FilialInsert = Omit<Filial, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}
export type FilialUpdate = Partial<FilialInsert>

// ========== ALUNOS ==========
export type Aluno = {
  id: string
  tenant_id: string | null
  filial_id: string | null
  nome_completo: string
  nome_social: string | null
  data_nascimento: string
  cpf: string | null
  patologias: string[] | null
  medicamentos: string[] | null
  observacoes_saude: string | null
  status: string
  created_at: string
  updated_at: string
}
export type AlunoInsert = Omit<Aluno, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}
export type AlunoUpdate = Partial<AlunoInsert>

// ========== TURMAS ==========
export type Turma = {
  id: string
  tenant_id: string | null
  filial_id: string | null
  nome: string
  sala: string | null
  capacidade_maxima: number | null
  turno: string | null
  created_at: string
  updated_at: string
}
export type TurmaInsert = Omit<Turma, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}
export type TurmaUpdate = Partial<TurmaInsert>

// ========== FUNCIONARIOS ==========
export type Funcionario = {
  id: string
  tenant_id: string | null
  filial_id: string | null
  nome_completo: string
  funcao: string | null
  salario_bruto: number | null
  dia_pagamento: number | null
  data_admissao: string | null
  is_usuario_sistema: boolean
  created_at: string
  updated_at: string
}
export type FuncionarioInsert = Omit<Funcionario, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}
export type FuncionarioUpdate = Partial<FuncionarioInsert>

// ========== RESPONSAVEIS ==========
export type Responsavel = {
  id: string
  cpf: string
  nome: string
  email: string | null
  telefone: string | null
  senha_hash: string
  created_at: string
  updated_at: string
}
export type ResponsavelInsert = Omit<Responsavel, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}
export type ResponsavelUpdate = Partial<ResponsavelInsert>

// ========== ALUNO_RESPONSAVEL (N:N) ==========
export type AlunoResponsavel = {
  id: string
  aluno_id: string | null
  responsavel_id: string | null
  grau_parentesco: string | null
  created_at: string
}
export type AlunoResponsavelInsert = Omit<AlunoResponsavel, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}
export type AlunoResponsavelUpdate = Partial<AlunoResponsavelInsert>

// ========== FREQUENCIAS ==========
export type Frequencia = {
  id: string
  tenant_id: string | null
  turma_id: string | null
  aluno_id: string | null
  data_aula: string
  status: string
  justificativa: string | null
  created_at: string
  updated_at: string
}
export type FrequenciaInsert = Omit<Frequencia, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}
export type FrequenciaUpdate = Partial<FrequenciaInsert>

// ========== MURAL_AVISOS ==========
export type MuralAviso = {
  id: string
  tenant_id: string | null
  titulo: string
  conteudo: string
  publico_alvo: string
  turma_id: string | null
  data_agendamento: string | null
  created_at: string
  updated_at: string
}
export type MuralAvisoInsert = Omit<MuralAviso, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}
export type MuralAvisoUpdate = Partial<MuralAvisoInsert>

// ========== COBRANCAS ==========
export type Cobranca = {
  id: string
  tenant_id: string | null
  aluno_id: string | null
  descricao: string
  valor: number
  data_vencimento: string
  status: string
  created_at: string
  updated_at: string
}
export type CobrancaInsert = Omit<Cobranca, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}
export type CobrancaUpdate = Partial<CobrancaInsert>

// ========== PLANOS ==========
export type Plano = {
  id: string
  nome: string
  valor_por_aluno: number
  status: boolean
  created_at: string
  updated_at: string
}
export type PlanoInsert = Omit<Plano, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}
export type PlanoUpdate = Partial<PlanoInsert>

// ========== HISTORICO_ASSINATURA ==========
export type HistoricoAssinatura = {
  id: string
  tenant_id: string | null
  plano_id: string | null
  limite_alunos: number | null
  valor_total: number | null
  data_inicio: string | null
  data_fim: string | null
  created_at: string
}
export type HistoricoAssinaturaInsert = Omit<HistoricoAssinatura, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}
export type HistoricoAssinaturaUpdate = Partial<HistoricoAssinaturaInsert>

// ========== AUDIT_LOGS ==========
export type AuditLog = {
  id: string
  tenant_id: string | null
  usuario_id: string | null
  tabela: string | null
  operacao: string | null
  registro_id: string | null
  dados_antigos: Record<string, unknown> | null
  dados_novos: Record<string, unknown> | null
  created_at: string
}
export type AuditLogInsert = Omit<AuditLog, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}
export type AuditLogUpdate = Partial<AuditLogInsert>

// ========== STATUS TYPES ==========
export type FrequenciaStatus = 'presente' | 'falta' | 'justificada'
export type CobrancaStatus = 'a_vencer' | 'pago' | 'atrasado' | 'cancelado'
export type StatusAssinatura = 'pendente' | 'ativa' | 'cancelada' | 'expirada'
