/**
 * Tipo visual da cobranca para exibicao na UI.
 * A regra principal vem de cobrancas.subtipo_cobranca; descricao fica apenas como fallback legado.
 */
export type TipoVisualCobranca =
  | 'matricula'
  | 'mensalidade_proporcional'
  | 'mensalidade_cheia'
  | 'material_didatico'
  | 'fardamento_uniforme'
  | 'eventos_passeios'
  | 'taxas_administrativas'
  | 'atividades_extracurriculares'
  | 'multa_juros'
  | 'avulsa'

export type SubtipoCobranca =
  | 'matricula_rematricula'
  | 'mensalidade'
  | 'material_didatico'
  | 'fardamento_uniforme'
  | 'eventos_passeios'
  | 'taxas_administrativas'
  | 'atividades_extracurriculares'
  | 'avulso'
  | 'multa_juros'

export function detectarTipoCobranca(cobranca: {
  descricao: string
  tipo_cobranca?: string
  subtipo_cobranca?: SubtipoCobranca | string | null
  valor?: number
  valor_original?: number
}): TipoVisualCobranca {
  switch (cobranca.subtipo_cobranca) {
    case 'matricula_rematricula':
      return 'matricula'
    case 'mensalidade':
      return cobranca.descricao?.toLowerCase().includes('proporcional')
        ? 'mensalidade_proporcional'
        : 'mensalidade_cheia'
    case 'material_didatico':
      return 'material_didatico'
    case 'fardamento_uniforme':
      return 'fardamento_uniforme'
    case 'eventos_passeios':
      return 'eventos_passeios'
    case 'taxas_administrativas':
      return 'taxas_administrativas'
    case 'atividades_extracurriculares':
      return 'atividades_extracurriculares'
    case 'multa_juros':
      return 'multa_juros'
    case 'avulso':
      return 'avulsa'
  }

  const desc = (cobranca.descricao || '').toLowerCase()
  const isMatricula = (desc.includes('matricula') || desc.includes('matrícula')) && !desc.includes('mensalidade')
  if (isMatricula) return 'matricula'
  if (desc.includes('proporcional')) return 'mensalidade_proporcional'
  if (cobranca.tipo_cobranca === 'mensalidade' && desc.includes('mensalidade')) return 'mensalidade_cheia'
  return 'avulsa'
}

export function getLabelTipoCobranca(tipo: TipoVisualCobranca): string {
  switch (tipo) {
    case 'matricula': return 'Matricula/Rematricula'
    case 'mensalidade_proporcional': return 'Mensalidade Proporcional'
    case 'mensalidade_cheia': return 'Mensalidade'
    case 'material_didatico': return 'Material Didatico'
    case 'fardamento_uniforme': return 'Fardamento/Uniforme'
    case 'eventos_passeios': return 'Eventos/Passeios'
    case 'taxas_administrativas': return 'Taxa Administrativa'
    case 'atividades_extracurriculares': return 'Atividade Extra'
    case 'multa_juros': return 'Multa/Juros'
    case 'avulsa': return 'Avulsa'
  }
}

export function getBadgeTipoCobranca(tipo: TipoVisualCobranca): string {
  switch (tipo) {
    case 'matricula': return 'bg-orange-50 text-orange-600 border-orange-200'
    case 'mensalidade_proporcional': return 'bg-emerald-50 text-emerald-600 border-emerald-200'
    case 'mensalidade_cheia': return 'bg-blue-50 text-blue-600 border-blue-200'
    case 'material_didatico': return 'bg-violet-50 text-violet-600 border-violet-200'
    case 'fardamento_uniforme': return 'bg-cyan-50 text-cyan-600 border-cyan-200'
    case 'eventos_passeios': return 'bg-pink-50 text-pink-600 border-pink-200'
    case 'taxas_administrativas': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'atividades_extracurriculares': return 'bg-lime-50 text-lime-700 border-lime-200'
    case 'multa_juros': return 'bg-red-50 text-red-600 border-red-200'
    case 'avulsa': return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

export function getIconeTipoCobranca(tipo: TipoVisualCobranca): string {
  switch (tipo) {
    case 'matricula': return 'bg-orange-100 text-orange-600'
    case 'mensalidade_proporcional': return 'bg-emerald-100 text-emerald-600'
    case 'mensalidade_cheia': return 'bg-blue-100 text-blue-600'
    case 'material_didatico': return 'bg-violet-100 text-violet-600'
    case 'fardamento_uniforme': return 'bg-cyan-100 text-cyan-600'
    case 'eventos_passeios': return 'bg-pink-100 text-pink-600'
    case 'taxas_administrativas': return 'bg-amber-100 text-amber-700'
    case 'atividades_extracurriculares': return 'bg-lime-100 text-lime-700'
    case 'multa_juros': return 'bg-red-100 text-red-600'
    case 'avulsa': return 'bg-slate-100 text-slate-600'
  }
}

export function extrairDiasProporcionais(descricao: string): number | null {
  const match = descricao.match(/(\d+)\s*dias?/i)
  return match ? parseInt(match[1], 10) : null
}

export function getValorExibicao(cobranca: {
  valor?: number
  valor_original?: number
  valor_total_projetado?: number
}): number {
  if (cobranca.valor_total_projetado && cobranca.valor_total_projetado > 0) {
    return Number(cobranca.valor_total_projetado)
  }
  return Number(cobranca.valor || 0)
}

export function isValorProporcional(cobranca: { descricao: string; tipo_cobranca?: string; subtipo_cobranca?: string | null }): boolean {
  return detectarTipoCobranca(cobranca) === 'mensalidade_proporcional'
}

export function isTaxaMatricula(cobranca: { descricao: string; tipo_cobranca?: string; subtipo_cobranca?: string | null }): boolean {
  return detectarTipoCobranca(cobranca) === 'matricula'
}

export function getSubtextoTipoCobranca(cobranca: { descricao: string; valor?: number; valor_original?: number; subtipo_cobranca?: string | null }): string | null {
  const tipo = detectarTipoCobranca(cobranca)
  const dias = extrairDiasProporcionais(cobranca.descricao)

  switch (tipo) {
    case 'matricula': return 'Taxa unica de matricula/rematricula'
    case 'mensalidade_proporcional': return dias ? `Referente a ${dias} dias do mes` : 'Valor proporcional ao mes'
    case 'mensalidade_cheia': return 'Valor integral da mensalidade'
    case 'material_didatico': return 'Material didatico e plataformas'
    case 'fardamento_uniforme': return 'Uniforme e fardamento escolar'
    case 'eventos_passeios': return 'Evento, passeio ou formatura'
    case 'taxas_administrativas': return 'Taxa administrativa escolar'
    case 'atividades_extracurriculares': return 'Atividade extracurricular'
    case 'multa_juros': return 'Encargos ou renegociacao'
    case 'avulsa': return null
  }
}
