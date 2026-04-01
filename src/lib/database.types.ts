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

// ========== FUNCOES_ESCOLA ==========
export type FuncaoEscola = {
  id: string
  tenant_id: string | null
  nome: string
  categoria: string
  is_padrao: boolean
  ativo: boolean
  created_at: string
}
export type FuncaoEscolaInsert = Omit<FuncaoEscola, 'id' | 'created_at'> & {
  id?: string; created_at?: string
}
export type FuncaoEscolaUpdate = Partial<FuncaoEscolaInsert>

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
  rg: string | null
  genero: string | null
  foto_url: string | null
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
  desconto_valor: number | null
  desconto_tipo: 'valor' | 'porcentagem' | null
  desconto_inicio: string | null
  desconto_fim: string | null
  valor_mensalidade_atual: number | null
  data_ingresso: string | null
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
  valor_mensalidade: number | null
  professores_ids: string[] | null
  alunos_ids: string[] | null
  livros: string[] | null
  status: string | null
  created_at: string
  updated_at: string
}
export type TurmaInsert = Omit<Turma, 'id' | 'created_at' | 'updated_at' | 'professores_ids' | 'alunos_ids' | 'livros' | 'status'> & {
  id?: string; professores_ids?: string[] | null; alunos_ids?: string[] | null; livros?: string[] | null; status?: string | null; created_at?: string; updated_at?: string
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
  funcoes: string[]
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
  user_id: string | null
  primeiro_acesso: boolean
  termos_aceitos: boolean
  status: 'ativo' | 'inativo'
  created_at: string
  updated_at: string
}
export type ResponsavelInsert = Omit<Responsavel, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'primeiro_acesso' | 'termos_aceitos' | 'status'> & {
  id?: string; user_id?: string | null; primeiro_acesso?: boolean; termos_aceitos?: boolean; status?: 'ativo' | 'inativo'; created_at?: string; updated_at?: string
}
export type ResponsavelUpdate = Partial<ResponsavelInsert>

// ========== MATRICULAS ==========
export type Matricula = {
  id: string
  tenant_id: string
  aluno_id: string
  ano_letivo: number
  serie_ano: string
  turma_id: string | null
  turno: string
  valor_matricula: number
  status: 'ativa' | 'encerrada' | 'trancada' | 'cancelada'
  data_matricula: string
  created_at: string
  updated_at: string
}
export type MatriculaInsert = Omit<Matricula, 'id' | 'created_at' | 'updated_at' | 'turma_id'> & {
  id?: string; turma_id?: string | null; created_at?: string; updated_at?: string
}
export type MatriculaUpdate = Partial<MatriculaInsert>

// ========== EVENTOS ==========
export type Evento = {
  id: string
  tenant_id: string
  filial_id: string | null
  titulo: string
  descricao: string | null
  data_inicio: string
  data_fim: string
  tipo: string
  cor: string | null
  created_at: string
  updated_at: string
}
export type EventoInsert = Omit<Evento, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; created_at?: string; updated_at?: string
}
export type EventoUpdate = Partial<EventoInsert>

// ========== CONFIG_RECADOS ==========
export type ConfigRecados = {
  id: string
  tenant_id: string
  whatsapp_contato: string | null
  email_contato: string | null
  link_ajuda: string | null
  updated_at: string
}
export type ConfigRecadosInsert = Omit<ConfigRecados, 'id' | 'updated_at'> & {
  id?: string; updated_at?: string
}
export type ConfigRecadosUpdate = Partial<ConfigRecadosInsert>

// ========== CONFIG_FINANCEIRA ==========
export type ConfigFinanceira = {
  id: string
  tenant_id: string
  pix_chave: string | null
  pix_favorecido: string | null
  dia_vencimento_padrao: number
  instrucoes_pagamento: string | null
  updated_at: string
}
export type ConfigFinanceiraInsert = Omit<ConfigFinanceira, 'id' | 'updated_at'> & {
  id?: string; updated_at?: string
}
export type ConfigFinanceiraUpdate = Partial<ConfigFinanceiraInsert>

// ========== CONTAS_PAGAR ==========
export type ContaPagar = {
  id: string
  tenant_id: string
  descricao: string
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado'
  categoria: string | null
  created_at: string
  updated_at: string
}
export type ContaPagarInsert = Omit<ContaPagar, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; created_at?: string; updated_at?: string
}
export type ContaPagarUpdate = Partial<ContaPagarInsert>

// ========== DOCUMENTOS ==========
export type DocumentoTemplate = {
  id: string
  tenant_id: string
  tipo: string
  titulo: string
  corpo_html: string
  created_at: string
}
export type DocumentoTemplateInsert = Omit<DocumentoTemplate, 'id' | 'created_at'> & {
  id?: string; created_at?: string
}
export type DocumentoTemplateUpdate = Partial<DocumentoTemplateInsert>

export type DocumentoEmitido = {
  id: string
  tenant_id: string
  template_id: string | null
  aluno_id: string
  titulo: string
  conteudo_final: string
  status: string
  created_at: string
}
export type DocumentoEmitidoInsert = Omit<DocumentoEmitido, 'id' | 'created_at'> & {
  id?: string; created_at?: string
}
export type DocumentoEmitidoUpdate = Partial<DocumentoEmitidoInsert>

export type DocumentSolicitation = {
  id: string
  tenant_id: string
  aluno_id: string
  responsavel_id: string
  documento_tipo: string
  status: 'pendente' | 'em_analise' | 'pronto' | 'entregue' | 'recusado'
  observacoes: string | null
  documento_emitido_id: string | null
  analysed_at: string | null
  created_at: string
  updated_at: string
}
export type DocumentSolicitationInsert = Omit<DocumentSolicitation, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; created_at?: string; updated_at?: string
}
export type DocumentSolicitationUpdate = Partial<DocumentSolicitationInsert>

// ========== AUTORIZACOES ==========
export type AutorizacaoModelo = {
  id: string
  tenant_id: string | null
  categoria: string
  titulo: string
  descricao_curta: string
  texto_completo: string
  obrigatoria: boolean
  ordem: number
  ativa: boolean
  created_at: string
  updated_at: string
}
export type AutorizacaoModeloInsert = Omit<AutorizacaoModelo, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; created_at?: string; updated_at?: string
}
export type AutorizacaoModeloUpdate = Partial<AutorizacaoModeloInsert>

export type AutorizacaoResposta = {
  id: string
  tenant_id: string
  modelo_id: string
  aluno_id: string
  responsavel_id: string
  aceita: boolean
  texto_lido: boolean
  data_resposta: string
  data_revogacao: string | null
  created_at: string
  updated_at: string
}
export type AutorizacaoRespostaInsert = Omit<AutorizacaoResposta, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; created_at?: string; updated_at?: string
}
export type AutorizacaoRespostaUpdate = Partial<AutorizacaoRespostaInsert>

export type AutorizacaoAuditoria = {
  id: string
  tenant_id: string
  modelo_id: string
  aluno_id: string
  responsavel_id: string
  acao: 'autorizou' | 'revogou' | 'releu'
  created_at: string
}
export type AutorizacaoAuditoriaInsert = Omit<AutorizacaoAuditoria, 'id' | 'created_at'> & {
  id?: string; created_at?: string
}

// ========== SELOS ==========
export type Selo = {
  id: string
  tenant_id: string
  aluno_id: string
  tipo: string
  titulo: string
  pontos: number
  created_at: string
}
export type SeloInsert = Omit<Selo, 'id' | 'created_at'> & {
  id?: string; created_at?: string
}

// ========== FILA VIRTUAL ==========
export type FilaVirtual = {
  id: string
  tenant_id: string
  aluno_id: string
  responsavel_id: string
  status: 'aguardando' | 'atendido'
  created_at: string
  updated_at: string
}
export type FilaVirtualInsert = Omit<FilaVirtual, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; created_at?: string; updated_at?: string
}
export type FilaVirtualUpdate = Partial<FilaVirtualInsert>

// ========== ALMOXARIFADO ==========
export type AlmoxarifadoItem = {
  id: string
  tenant_id: string
  nome: string
  quantidade: number
  unidade: string
  estoque_minimo: number
  created_at: string
  updated_at: string
}
export type AlmoxarifadoItemInsert = Omit<AlmoxarifadoItem, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; created_at?: string; updated_at?: string
}
export type AlmoxarifadoItemUpdate = Partial<AlmoxarifadoItemInsert>

export type AlmoxarifadoMovimentacao = {
  id: string
  tenant_id: string
  item_id: string
  quantidade: number
  tipo: 'entrada' | 'saida'
  observacao: string | null
  responsavel_id: string | null
  created_at: string
}
export type AlmoxarifadoMovimentacaoInsert = Omit<AlmoxarifadoMovimentacao, 'id' | 'created_at'> & {
  id?: string; created_at?: string
}

// ========== ALUNO_RESPONSAVEL (N:N) ==========
export type AlunoResponsavel = {
  id: string
  aluno_id: string | null
  responsavel_id: string | null
  grau_parentesco: string | null
  is_financeiro: boolean
  is_academico: boolean
  status: 'ativo' | 'inativo'
  created_at: string
}
export type AlunoResponsavelInsert = Omit<AlunoResponsavel, 'id' | 'created_at' | 'is_financeiro' | 'is_academico' | 'status'> & {
  id?: string; is_financeiro?: boolean; is_academico?: boolean; status?: 'ativo' | 'inativo'; created_at?: string
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
  data_inicio: string | null
  data_fim: string | null
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
  tipo_cobranca: 'mensalidade' | 'avulso'; // Novo campo: tipo de cobrança
  turma_id?: string | null;
  ano_letivo?: number | null;
  created_at: string
  updated_at: string
}
export type CobrancaInsert = Omit<Cobranca, 'id' | 'created_at' | 'updated_at' | 'tipo_cobranca'> & {
  id?: string; tipo_cobranca?: 'mensalidade' | 'avulso'; created_at?: string; updated_at?: string
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
  tipo_empresa: 'escolas' | 'lojistas' | 'profissionais'
  tipo_pagamento: 'gratuito' | 'pix' | 'mercado_pago' | 'pix_manual'
  validade_meses: number | null
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

// ========== BOLETIM ==========
export type DisciplinaBoletim = {
  disciplina: string
  nota: number
  faltas: number
  observacoes?: string
}

export type Boletim = {
  id: string
  tenant_id: string | null
  filial_id: string | null
  aluno_id: string | null
  turma_id: string | null
  ano_letivo: number
  bimestre: number
  disciplinas: DisciplinaBoletim[]
  status: string | null
  observacoes_gerais: string | null
  data_emissao: string | null
  created_at: string
  updated_at: string
}

export type BoletimInsert = Omit<Boletim, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type BoletimUpdate = Partial<BoletimInsert>

// ========== OVERRIDES FINANCEIROS ==========
export type TipoOverrideFinanceiro = 'desconto_pontual' | 'desconto_permanente' | 'acordo' | 'negociacao'
export type MotivoOverrideFinanceiro = 'vinculo_familiar' | 'bolsa_merito' | 'bolsa_atleta' | 'bolsa_funcionario' | 'retencao_evasao' | 'promocional' | 'outro'

export type OverrideFinanceiro = {
  id: string
  tenant_id: string
  aluno_id: string
  tipo: TipoOverrideFinanceiro
  motivo: MotivoOverrideFinanceiro
  detalhes_motivo: string | null
  percentual_desconto: number | null
  valor_fixo_desconto: number | null
  teto_maximo_desconto: number | null
  vigencia_inicio: string
  vigencia_fim: string | null
  recalcular_automatico_em_reajuste: boolean
  aplicado_por: string
  status: string
  created_at: string
  updated_at: string
}
export type OverrideFinanceiroInsert = Omit<OverrideFinanceiro, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; created_at?: string; updated_at?: string;
}
export type OverrideFinanceiroUpdate = Partial<OverrideFinanceiroInsert>

// ========== ALERTAS FINANCEIROS IGNORADOS ==========
export type AlertaFinanceiroIgnorado = {
  id: string
  tenant_id: string
  aluno_id: string
  tipo_alerta: string
  ignorado_por: string
  ignorado_ate: string | null
  created_at: string
}
export type AlertaFinanceiroIgnoradoInsert = Omit<AlertaFinanceiroIgnorado, 'id' | 'created_at'> & {
  id?: string; created_at?: string;
}

// ========== CURRÍCULOS ==========
export type FormacaoAcademica = {
  nivel: 'fundamental' | 'medio' | 'tecnico' | 'superior' | 'pos_graduacao' | 'mestrado' | 'doutorado'
  instituicao: string
  ano_conclusao: number
  area: string
}

export type ExperienciaProfissional = {
  empresa: string
  cargo: string
  periodo: string
  atividades: string
}

export type Certificacao = {
  nome: string
  instituicao: string
  ano: number
  carga_horaria?: number
}

// ========== LOJISTAS ==========
export type Lojista = {
  id: string
  user_id: string
  razao_social: string
  nome_fantasia: string | null
  cnpj: string
  email: string | null
  telefone: string | null
  categoria: string | null
  descricao: string | null
  plano_id: string
  status: string
  created_at: string
  updated_at: string
}

export type LojistaInsert = Omit<Lojista, 'id' | 'created_at' | 'updated_at' | 'plano_id' | 'status'> & {
  id?: string
  plano_id?: string
  status?: string
  created_at?: string
  updated_at?: string
}

export type LojistaUpdate = Partial<LojistaInsert>

// ========== NOTIFICACOES ==========
export type Notificacao = {
  id: string
  tenant_id: string
  user_id: string | null
  tipo: string
  titulo: string
  mensagem: string
  href: string
  categoria: string
  prioridade: number
  lida: boolean
  resolvida: boolean
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
  lida_em: string | null
  resolvida_em: string | null
}
export type NotificacaoInsert = Omit<Notificacao, 'id' | 'created_at' | 'updated_at' | 'lida_em' | 'resolvida_em'> & {
  id?: string
  created_at?: string
  updated_at?: string
  lida_em?: string | null
  resolvida_em?: string | null
}
export type NotificacaoUpdate = Partial<NotificacaoInsert>

export type Curriculo = {
  id: string
  user_id: string
  tenant_id: string | null
  funcionario_id: string | null
  disponibilidade_emprego: boolean
  disponibilidade_tipo: string[]
  areas_interesse: string[]
  pretensao_salarial: number | null
  formacao: FormacaoAcademica[]
  experiencia: ExperienciaProfissional[]
  habilidades: string[]
  certificacoes: Certificacao[]
  resumo_profissional: string | null
  observacoes: string | null
  is_publico: boolean
  is_ativo: boolean
  busca_vaga: boolean
  presta_servico: boolean
  telefone: string | null
  cpf: string | null
  created_at: string
  updated_at: string
}

export type CurriculoInsert = Omit<Curriculo, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type CurriculoUpdate = Partial<CurriculoInsert>

// ========== AUTH TYPES ==========
export type UserRole = 'super_admin' | 'admin' | 'gestor' | 'professor' | 'funcionario' | 'responsavel' | 'lojista' | 'profissional'

export type Database = {
  public: {
    Tables: {
      escolas: { Row: Escola; Insert: EscolaInsert; Update: EscolaUpdate; Relationships: any[] }
      filiais: { Row: Filial; Insert: FilialInsert; Update: FilialUpdate; Relationships: any[] }
      alunos: { Row: Aluno; Insert: AlunoInsert; Update: AlunoUpdate; Relationships: any[] }
      turmas: { Row: Turma; Insert: TurmaInsert; Update: TurmaUpdate; Relationships: any[] }
      funcionarios: { Row: Funcionario; Insert: FuncionarioInsert; Update: FuncionarioUpdate; Relationships: any[] }
      responsaveis: { Row: Responsavel; Insert: ResponsavelInsert; Update: ResponsavelUpdate; Relationships: any[] }
      aluno_responsavel: { Row: AlunoResponsavel; Insert: AlunoResponsavelInsert; Update: AlunoResponsavelUpdate; Relationships: any[] }
      frequencias: { Row: Frequencia; Insert: FrequenciaInsert; Update: FrequenciaUpdate; Relationships: any[] }
      mural_avisos: { Row: MuralAviso; Insert: MuralAvisoInsert; Update: MuralAvisoUpdate; Relationships: any[] }
      cobrancas: { Row: Cobranca; Insert: CobrancaInsert; Update: CobrancaUpdate; Relationships: any[] }
      atividades: { Row: Atividade; Insert: AtividadeInsert; Update: AtividadeUpdate; Relationships: any[] }
      atividades_turmas: { Row: AtividadeTurma; Insert: AtividadeTurmaInsert; Update: AtividadeTurmaUpdate; Relationships: any[] }
      planos_aula: { Row: PlanoAula; Insert: PlanoAulaInsert; Update: PlanoAulaUpdate; Relationships: any[] }
      planos_aula_turmas: { Row: PlanoAulaTurma; Insert: PlanoAulaTurmaInsert; Update: PlanoAulaTurmaUpdate; Relationships: any[] }
      planos: { Row: Plano; Insert: PlanoInsert; Update: PlanoUpdate; Relationships: any[] }
      modulos: { Row: Modulo; Insert: ModuloInsert; Update: ModuloUpdate; Relationships: any[] }
      plano_modulo: { Row: PlanoModulo; Insert: PlanoModuloInsert; Update: PlanoModuloUpdate; Relationships: any[] }
      assinaturas: { Row: Assinatura; Insert: AssinaturaInsert; Update: AssinaturaUpdate; Relationships: any[] }
      historico_assinatura: { Row: HistoricoAssinatura; Insert: HistoricoAssinaturaInsert; Update: HistoricoAssinaturaUpdate; Relationships: any[] }
      faturas: { Row: Fatura; Insert: FaturaInsert; Update: FaturaUpdate; Relationships: any[] }
      solicitacoes_upgrade: { Row: SolicitacaoUpgrade; Insert: SolicitacaoUpgradeInsert; Update: SolicitacaoUpgradeUpdate; Relationships: any[] }
      configuracao_recebimento: { Row: ConfiguracaoRecebimento; Insert: ConfiguracaoRecebimentoInsert; Update: ConfiguracaoRecebimentoUpdate; Relationships: any[] }
      audit_logs: { Row: AuditLog; Insert: AuditLogInsert; Update: AuditLogUpdate; Relationships: any[] }
      matriculas: { Row: Matricula; Insert: MatriculaInsert; Update: MatriculaUpdate; Relationships: any[] }
      eventos: { Row: Evento; Insert: EventoInsert; Update: EventoUpdate; Relationships: any[] }
      config_recados: { Row: ConfigRecados; Insert: ConfigRecadosInsert; Update: ConfigRecadosUpdate; Relationships: any[] }
      config_financeira: { Row: ConfigFinanceira; Insert: ConfigFinanceiraInsert; Update: ConfigFinanceiraUpdate; Relationships: any[] }
      contas_pagar: { Row: ContaPagar; Insert: ContaPagarInsert; Update: ContaPagarUpdate; Relationships: any[] }
      documento_templates: { Row: DocumentoTemplate; Insert: DocumentoTemplateInsert; Update: DocumentoTemplateUpdate; Relationships: any[] }
      documentos_emitidos: { Row: DocumentoEmitido; Insert: DocumentoEmitidoInsert; Update: DocumentoEmitidoUpdate; Relationships: any[] }
      document_solicitations: { Row: DocumentSolicitation; Insert: DocumentSolicitationInsert; Update: DocumentSolicitationUpdate; Relationships: any[] }
      autorizacoes_modelos: { Row: AutorizacaoModelo; Insert: AutorizacaoModeloInsert; Update: AutorizacaoModeloUpdate; Relationships: any[] }
      autorizacoes_respostas: { Row: AutorizacaoResposta; Insert: AutorizacaoRespostaInsert; Update: AutorizacaoRespostaUpdate; Relationships: any[] }
      autorizacoes_auditoria: { Row: AutorizacaoAuditoria; Insert: AutorizacaoAuditoriaInsert; Update: any; Relationships: any[] }
      selos: { Row: Selo; Insert: SeloInsert; Update: any; Relationships: any[] }
      fila_virtual: { Row: FilaVirtual; Insert: FilaVirtualInsert; Update: FilaVirtualUpdate; Relationships: any[] }
      almoxarifado_itens: { Row: AlmoxarifadoItem; Insert: AlmoxarifadoItemInsert; Update: AlmoxarifadoItemUpdate; Relationships: any[] }
      almoxarifado_movimentacoes: { Row: AlmoxarifadoMovimentacao; Insert: AlmoxarifadoMovimentacaoInsert; Update: any; Relationships: any[] }
      overrides_financeiros: { Row: OverrideFinanceiro; Insert: OverrideFinanceiroInsert; Update: OverrideFinanceiroUpdate; Relationships: any[] }
      alertas_financeiros_ignorados: { Row: AlertaFinanceiroIgnorado; Insert: AlertaFinanceiroIgnoradoInsert; Update: any; Relationships: any[] }
      curriculos: { Row: Curriculo; Insert: CurriculoInsert; Update: CurriculoUpdate; Relationships: any[] }
      lojistas: { Row: Lojista; Insert: LojistaInsert; Update: LojistaUpdate; Relationships: any[] }
      notificacoes: { Row: Notificacao; Insert: NotificacaoInsert; Update: NotificacaoUpdate; Relationships: any[] }
    }
    Views: { 
      vw_fila_tempo_medio: { Row: { id: string; status: string; fila_id: string; tempo_espera: number; tempo_medio_minutos: number }; Relationships: any[] }
      vw_alerta_evasao_familiar: { 
        Row: { 
          aluno_ativo_id: string
          tenant_id: string
          aluno_ativo_nome: string
          turma_atual: string | null
          responsavel: string
          telefone_contato: string | null
          irmao_que_saiu: string
          motivo_saida: string
          data_saida: string
          nivel_risco: 'CRITICO' | 'ALTO' | 'MONITORAMENTO'
        }
        Relationships: any[]
      }
    }
    Functions: {
      funcionario_tem_acesso_area: { Args: { p_funcionario_id: string; p_area: string }; Returns: boolean };
      get_portal_login_info: { Args: { cpf_input: string }; Returns: any };
      marcar_notificacao_lida: { Args: { notificacao_id: string }; Returns: void };
      marcar_notificacao_resolvida: { Args: { notificacao_id: string }; Returns: void };
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

