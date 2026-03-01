/**
 * Tipos TypeScript gerados a partir do schema REAL do Supabase.
 * NÃO ALTERE MANUALMENTE — espelha exatamente o banco de dados.
 */



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
  numero: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  nome_gestor: string | null
  cpf_gestor: string | null
  plano_id: string | null
  limite_alunos_contratado: number
  status_assinatura: string
  metodo_pagamento: string | null
  gestor_user_id: string | null
  data_vencimento_assinatura: string | null
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
  cep: string | null
  logradouro: string | null
  numero: string | null
  bairro: string | null
  estado: string | null
  cidade: string | null
  is_matriz: boolean
  created_at: string
  updated_at: string
}
export type FilialInsert = Omit<Filial, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; created_at?: string; updated_at?: string
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
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  created_at: string
  updated_at: string
}
export type AlunoInsert = Omit<Aluno, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; created_at?: string; updated_at?: string
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
  id?: string; created_at?: string; updated_at?: string
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
  id?: string; created_at?: string; updated_at?: string
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
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  created_at: string
  updated_at: string
}
export type ResponsavelInsert = Omit<Responsavel, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; created_at?: string; updated_at?: string
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
  id?: string; created_at?: string
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
  id?: string; created_at?: string; updated_at?: string
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
  id?: string; created_at?: string; updated_at?: string
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
  id?: string; created_at?: string; updated_at?: string
}
export type CobrancaUpdate = Partial<CobrancaInsert>

// ========== PLANOS DE AULA ==========
export type PlanoAula = {
  id: string
  tenant_id: string
  filial_id: string | null
  disciplina: string
  data_aula: string
  conteudo_previsto: string | null
  conteudo_realizado: string | null
  observacoes: string | null
  professor_id: string | null
  created_at: string
  updated_at: string
}
export type PlanoAulaInsert = Omit<PlanoAula, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; created_at?: string; updated_at?: string
}
export type PlanoAulaUpdate = Partial<PlanoAulaInsert>

export type PlanoAulaTurma = {
  id: string
  plano_aula_id: string
  turma_id: string
  turno: 'manha' | 'tarde' | 'integral' | 'noturno'
  horario: string | null
  created_at: string
}
export type PlanoAulaTurmaInsert = Omit<PlanoAulaTurma, 'id' | 'created_at'> & {
  id?: string; created_at?: string
}
export type PlanoAulaTurmaUpdate = Partial<PlanoAulaTurmaInsert>
 
 // ========== ATIVIDADES ==========
 export type Atividade = {
   id: string
   tenant_id: string
   filial_id: string | null
   titulo: string
   disciplina: string | null
   tipo_material: 'pdf' | 'link_video' | 'imagem' | 'outro' | null
   anexo_url: string | null
   descricao: string | null
   created_at: string
   updated_at: string
 }
 export type AtividadeInsert = Omit<Atividade, 'id' | 'created_at' | 'updated_at'> & {
   id?: string; created_at?: string; updated_at?: string
 }
 export type AtividadeUpdate = Partial<AtividadeInsert>
 
 export type AtividadeTurma = {
   id: string
   atividade_id: string
   turma_id: string
   turno: 'manha' | 'tarde' | 'integral' | 'noturno' | null
   horario: string | null
   created_at: string
 }
 export type AtividadeTurmaInsert = Omit<AtividadeTurma, 'id' | 'created_at'> & {
   id?: string; created_at?: string
 }
 export type AtividadeTurmaUpdate = Partial<AtividadeTurmaInsert>
 
 // ========== PLANOS ==========
export type Plano = {
  id: string
  nome: string
  descricao_curta: string | null
  valor_por_aluno: number
  status: boolean
  created_at: string
  updated_at: string
}
export type PlanoInsert = Omit<Plano, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; created_at?: string; updated_at?: string
}
export type PlanoUpdate = Partial<PlanoInsert>

// ========== MÓDULOS ==========
export type Modulo = {
  id: string
  nome: string
  codigo: string
  descricao: string | null
  created_at: string
}
export type ModuloInsert = Omit<Modulo, 'id' | 'created_at'> & {
  id?: string; created_at?: string
}
export type ModuloUpdate = Partial<ModuloInsert>

// ========== PLANO_MODULO (N:N) ==========
export type PlanoModulo = {
  plano_id: string
  modulo_id: string
}
export type PlanoModuloInsert = PlanoModulo
export type PlanoModuloUpdate = Partial<PlanoModuloInsert>

// ========== ASSINATURAS ==========
export type Assinatura = {
  id: string
  tenant_id: string
  plano_id: string
  valor_por_aluno_contratado: number
  limite_alunos_contratado: number
  valor_total_contratado: number
  dia_vencimento: number
  status: 'ativa' | 'inadimplente' | 'cancelada'
  data_inicio: string
  data_fim: string | null
  created_at: string
  updated_at: string
}
export type AssinaturaInsert = Omit<Assinatura, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; created_at?: string; updated_at?: string
}
export type AssinaturaUpdate = Partial<AssinaturaInsert>

// ========== HISTORICO_ASSINATURA (IMUTÁVEL) ==========
export type HistoricoAssinatura = {
  id: string
  tenant_id: string | null
  plano_id: string | null
  valor_por_aluno_contratado: number
  limite_alunos_contratado: number
  valor_total_contratado: number
  data_inicio: string
  data_fim: string | null
  created_at: string
}
export type HistoricoAssinaturaInsert = Omit<HistoricoAssinatura, 'id' | 'created_at'> & {
  id?: string; created_at?: string
}
export type HistoricoAssinaturaUpdate = Partial<HistoricoAssinaturaInsert>

// ========== FATURAS ==========
export type Fatura = {
  id: string
  tenant_id: string
  assinatura_id: string
  competencia: string
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  status: 'pendente' | 'pendente_confirmacao' | 'pago' | 'atrasado' | 'cancelado'
  forma_pagamento: string | null
  gateway_referencia: string | null
  comprovante_url: string | null
  confirmado_por: string | null
  data_confirmacao: string | null
  created_at: string
  updated_at: string
}
export type FaturaInsert = Omit<Fatura, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; created_at?: string; updated_at?: string
}
export type FaturaUpdate = Partial<FaturaInsert>

// ========== SOLICITAÇÕES DE UPGRADE ==========
export type SolicitacaoUpgrade = {
  id: string
  tenant_id: string
  limite_atual: number
  limite_solicitado: number
  valor_atual: number
  valor_proposto: number
  status: 'pendente' | 'aprovado' | 'recusado'
  created_at: string
}
export type SolicitacaoUpgradeInsert = Omit<SolicitacaoUpgrade, 'id' | 'created_at'> & {
  id?: string; created_at?: string
}
export type SolicitacaoUpgradeUpdate = Partial<SolicitacaoUpgradeInsert>

// ========== CONFIGURAÇÃO DE RECEBIMENTO (PIX MANUAL) ==========
export type ConfiguracaoRecebimento = {
  id: string
  pix_manual_ativo: boolean
  tipo_chave_pix: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria' | null
  chave_pix: string | null
  favorecido: string | null
  instrucoes_extras: string | null
  created_at: string
  updated_at: string
}
export type ConfiguracaoRecebimentoInsert = Omit<ConfiguracaoRecebimento, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; created_at?: string; updated_at?: string
}
export type ConfiguracaoRecebimentoUpdate = Partial<ConfiguracaoRecebimentoInsert>

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
  id?: string; created_at?: string
}
export type AuditLogUpdate = Partial<AuditLogInsert>

// ========== STATUS TYPES ==========
export type FrequenciaStatus = 'presente' | 'falta' | 'justificada'
export type CobrancaStatus = 'a_vencer' | 'pago' | 'atrasado' | 'cancelado'
export type StatusAssinatura = 'ativa' | 'inadimplente' | 'cancelada'
export type FaturaStatus = 'pendente' | 'pendente_confirmacao' | 'pago' | 'atrasado' | 'cancelado'
export type UpgradeStatus = 'pendente' | 'aprovado' | 'recusado'

// ========== AUTH TYPES ==========
export type UserRole = 'super_admin' | 'admin' | 'gestor' | 'professor' | 'funcionario' | 'responsavel'

export type Database = {
  public: {
    Tables: {
      escolas: { Row: Escola; Insert: EscolaInsert; Update: EscolaUpdate }
      filiais: { Row: Filial; Insert: FilialInsert; Update: FilialUpdate }
      alunos: { Row: Aluno; Insert: AlunoInsert; Update: AlunoUpdate }
      turmas: { Row: Turma; Insert: TurmaInsert; Update: TurmaUpdate }
      funcionarios: { Row: Funcionario; Insert: FuncionarioInsert; Update: FuncionarioUpdate }
      responsaveis: { Row: Responsavel; Insert: ResponsavelInsert; Update: ResponsavelUpdate }
      aluno_responsavel: { Row: AlunoResponsavel; Insert: AlunoResponsavelInsert; Update: AlunoResponsavelUpdate }
      frequencias: { Row: Frequencia; Insert: FrequenciaInsert; Update: FrequenciaUpdate }
      mural_avisos: { Row: MuralAviso; Insert: MuralAvisoInsert; Update: MuralAvisoUpdate }
      cobrancas: { Row: Cobranca; Insert: CobrancaInsert; Update: CobrancaUpdate }
      atividades: { Row: Atividade; Insert: AtividadeInsert; Update: AtividadeUpdate }
      atividades_turmas: { Row: AtividadeTurma; Insert: AtividadeTurmaInsert; Update: AtividadeTurmaUpdate }
      planos_aula: { Row: PlanoAula; Insert: PlanoAulaInsert; Update: PlanoAulaUpdate }
      planos_aula_turmas: { Row: PlanoAulaTurma; Insert: PlanoAulaTurmaInsert; Update: PlanoAulaTurmaUpdate }
      planos: { Row: Plano; Insert: PlanoInsert; Update: PlanoUpdate }
      modulos: { Row: Modulo; Insert: ModuloInsert; Update: ModuloUpdate }
      plano_modulo: { Row: PlanoModulo; Insert: PlanoModuloInsert; Update: PlanoModuloUpdate }
      assinaturas: { Row: Assinatura; Insert: AssinaturaInsert; Update: AssinaturaUpdate }
      historico_assinatura: { Row: HistoricoAssinatura; Insert: HistoricoAssinaturaInsert; Update: HistoricoAssinaturaUpdate }
      faturas: { Row: Fatura; Insert: FaturaInsert; Update: FaturaUpdate }
      solicitacoes_upgrade: { Row: SolicitacaoUpgrade; Insert: SolicitacaoUpgradeInsert; Update: SolicitacaoUpgradeUpdate }
      configuracao_recebimento: { Row: ConfiguracaoRecebimento; Insert: ConfiguracaoRecebimentoInsert; Update: ConfiguracaoRecebimentoUpdate }
      audit_logs: { Row: AuditLog; Insert: AuditLogInsert; Update: AuditLogUpdate }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
