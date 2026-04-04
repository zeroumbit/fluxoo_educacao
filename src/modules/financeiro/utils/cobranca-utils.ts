import { cn } from '@/lib/utils'

/**
 * Tipo visual da cobrança para exibição na UI
 */
export type TipoVisualCobranca = 
  | 'matricula'           // Taxa de matrícula
  | 'mensalidade_proporcional'  // Primeira mensalidade proporcional
  | 'mensalidade_cheia'   // Mensalidade valor integral
  | 'avulsa'             // Cobrança avulsa manual

/**
 * Detecta o tipo visual da cobrança baseado na descrição e campos
 */
export function detectarTipoCobranca(cobranca: {
  descricao: string
  tipo_cobranca?: string
  valor?: number
  valor_original?: number
}): TipoVisualCobranca {
  const desc = cobranca.descricao.toLowerCase()
  
  // Matrícula: descrição contém "matrícula" ou "matricula" mas NÃO "mensalidade"
  const isMatricula = (desc.includes('matrícula') || desc.includes('matricula')) && !desc.includes('mensalidade')
  if (isMatricula) return 'matricula'
  
  // Mensalidade proporcional: descrição contém "proporcional"
  const isProporcional = desc.includes('proporcional')
  if (isProporcional) return 'mensalidade_proporcional'
  
  // Mensalidade cheia: tipo_cobranca = 'mensalidade' e NÃO é proporcional nem matrícula
  if (cobranca.tipo_cobranca === 'mensalidade' && desc.includes('mensalidade')) {
    return 'mensalidade_cheia'
  }
  
  // Avulsa: tudo mais
  return 'avulsa'
}

/**
 * Retorna o label legível para o tipo de cobrança
 */
export function getLabelTipoCobranca(tipo: TipoVisualCobranca): string {
  switch (tipo) {
    case 'matricula':
      return 'Matrícula'
    case 'mensalidade_proporcional':
      return 'Mensalidade Proporcional'
    case 'mensalidade_cheia':
      return 'Mensalidade'
    case 'avulsa':
      return 'Avulsa'
  }
}

/**
 * Retorna as classes CSS para o badge do tipo de cobrança
 */
export function getBadgeTipoCobranca(tipo: TipoVisualCobranca): string {
  switch (tipo) {
    case 'matricula':
      return 'bg-orange-50 text-orange-600 border-orange-200'
    case 'mensalidade_proporcional':
      return 'bg-emerald-50 text-emerald-600 border-emerald-200'
    case 'mensalidade_cheia':
      return 'bg-blue-50 text-blue-600 border-blue-200'
    case 'avulsa':
      return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

/**
 * Retorna classes para o ícone do tipo de cobrança
 */
export function getIconeTipoCobranca(tipo: TipoVisualCobranca): string {
  switch (tipo) {
    case 'matricula':
      return 'bg-orange-100 text-orange-600'
    case 'mensalidade_proporcional':
      return 'bg-emerald-100 text-emerald-600'
    case 'mensalidade_cheia':
      return 'bg-blue-100 text-blue-600'
    case 'avulsa':
      return 'bg-slate-100 text-slate-600'
  }
}

/**
 * Extrai informações de dias proporcionais da descrição
 * Ex: "1ª Mensalidade Proporcional (25 dias) - Turma A" → retorna 25
 */
export function extrairDiasProporcionais(descricao: string): number | null {
  const match = descricao.match(/(\d+)\s*dias?/i)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Retorna o valor correto a ser exibido para a cobrança
 * - Para proporcionais: usa o valor proporcional (já está no campo valor)
 * - Para demais: usa o valor padrão
 */
export function getValorExibicao(cobranca: {
  valor?: number
  valor_original?: number
  valor_total_projetado?: number
}): number {
  // Prioriza valor_total_projetado (com encargos) se existir
  if (cobranca.valor_total_projetado && cobranca.valor_total_projetado > 0) {
    return Number(cobranca.valor_total_projetado)
  }
  // Fallback para valor padrão
  return Number(cobranca.valor || 0)
}

/**
 * Retorna se o valor é proporcional (para exibir tag indicativa)
 */
export function isValorProporcional(cobranca: { descricao: string; tipo_cobranca?: string }): boolean {
  return detectarTipoCobranca(cobranca) === 'mensalidade_proporcional'
}

/**
 * Retorna se é taxa de matrícula
 */
export function isTaxaMatricula(cobranca: { descricao: string; tipo_cobranca?: string }): boolean {
  return detectarTipoCobranca(cobranca) === 'matricula'
}

/**
 * Retorna subtexto informativo para o tipo de cobrança
 */
export function getSubtextoTipoCobranca(cobranca: { descricao: string; valor?: number; valor_original?: number }): string | null {
  const tipo = detectarTipoCobranca(cobranca)
  const dias = extrairDiasProporcionais(cobranca.descricao)
  
  switch (tipo) {
    case 'matricula':
      return 'Taxa única de matrícula'
    case 'mensalidade_proporcional':
      if (dias) {
        return `Referente a ${dias} dias do mês`
      }
      return 'Valor proporcional ao mês'
    case 'mensalidade_cheia':
      return 'Valor integral da mensalidade'
    case 'avulsa':
      return null
  }
}
