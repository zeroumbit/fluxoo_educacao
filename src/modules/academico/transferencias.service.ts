import { supabase } from '@/lib/supabase'

export type TransferenciaStatus =
  | 'aguardando_responsavel'
  | 'aguardando_liberacao_origem'
  | 'concluido'
  | 'recusado'
  | 'cancelado'

export type TipoSolicitante = 'origem' | 'destino' | 'responsavel'

export interface TransferenciaRow {
  id: string
  aluno_id: string
  escola_origem_id: string
  escola_destino_id: string | null
  escola_destino_nome_manual: string | null
  responsavel_id: string | null
  iniciado_por: TipoSolicitante
  status: TransferenciaStatus
  motivo_solicitacao: string
  justificativa_recusa: string | null
  prazo_liberacao: string | null
  created_at: string
  aprovado_em: string | null
  concluido_em: string | null
  // Campos enriquecidos no frontend
  transferencia_id: string
  aluno_nome: string
  escola_origem: string
  escola_destino: string
  data_solicitacao: string
  solicitante_tipo: TipoSolicitante
  origem_id: string
  destino_id: string | null
}

export const STATUS_LABEL: Record<string, string> = {
  aguardando_responsavel:      'Aguardando Responsável',
  aguardando_liberacao_origem: 'Liberar em 30 dias',
  concluido:                   'Concluída',
  recusado:                    'Recusada',
  cancelado:                   'Cancelada',
}

export const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  aguardando_responsavel:      { color: 'text-amber-700',   bg: 'bg-amber-50'   },
  aguardando_liberacao_origem: { color: 'text-blue-700',    bg: 'bg-blue-50'    },
  concluido:                   { color: 'text-emerald-700', bg: 'bg-emerald-50' },
  recusado:                    { color: 'text-rose-700',    bg: 'bg-rose-50'    },
  cancelado:                   { color: 'text-zinc-500',    bg: 'bg-zinc-50'    },
}

async function fetchEscolasMap(ids: string[]): Promise<Record<string, string>> {
  const uniq = [...new Set(ids.filter(Boolean))]
  if (!uniq.length) return {}
  const { data } = await supabase.from('escolas').select('id, razao_social').in('id', uniq)
  const map: Record<string, string> = {}
  data?.forEach((e: any) => { map[e.id] = e.razao_social })
  return map
}

async function fetchAlunosMap(ids: string[]): Promise<Record<string, string>> {
  const uniq = [...new Set(ids.filter(Boolean))]
  if (!uniq.length) return {}
  const { data } = await supabase.from('alunos').select('id, nome_completo').in('id', uniq)
  const map: Record<string, string> = {}
  data?.forEach((a: any) => { map[a.id] = a.nome_completo })
  return map
}

export const transferenciasService = {
  /** ESCOLA DESTINO inicia pedido de transferência pelo código do aluno */
  async solicitar(alunoId: string, origemId: string, destinoId: string, motivo: string) {
    const { data, error } = await (supabase.from('transferencias_escolares' as any) as any)
      .insert({
        aluno_id: alunoId,
        escola_origem_id: origemId,
        escola_destino_id: destinoId,
        iniciado_por: 'destino',
        status: 'aguardando_responsavel',
        motivo_solicitacao: motivo,
        responsavel_id: null,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /** ESCOLA ORIGEM ou RESPONSÁVEL inicia pedido de saída do aluno */
  async solicitarSaida(payload: {
    alunoId: string
    origemId: string
    destinoId: string | null
    nomeEscolaManual?: string
    cnpjEscolaManual?: string
    responsavelId: string | null
    motivo: string
    iniciadoPor: TipoSolicitante
  }) {
    const { data, error } = await (supabase.from('transferencias_escolares' as any) as any)
      .insert({
        aluno_id: payload.alunoId,
        escola_origem_id: payload.origemId,
        escola_destino_id: payload.destinoId,
        escola_destino_nome_manual: payload.nomeEscolaManual || null,
        escola_destino_cnpj_manual: payload.cnpjEscolaManual || null,
        responsavel_id: payload.responsavelId,
        iniciado_por: payload.iniciadoPor,
        status: 'aguardando_responsavel',
        motivo_solicitacao: payload.motivo,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async listarPorEscola(tenantId: string): Promise<TransferenciaRow[]> {
    const { data, error } = await (supabase
      .from('transferencias_escolares' as any) as any)
      .select('*')
      .or(`escola_origem_id.eq.${tenantId},escola_destino_id.eq.${tenantId}`)
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!data || data.length === 0) return []

    const [escolasMap, alunosMap] = await Promise.all([
      fetchEscolasMap([
        ...data.map((t: any) => t.escola_origem_id),
        ...data.map((t: any) => t.escola_destino_id),
      ].filter(Boolean)),
      fetchAlunosMap(data.map((t: any) => t.aluno_id)),
    ])

    return data.map((t: any) => ({
      ...t,
      transferencia_id: t.id,
      status: t.status as TransferenciaStatus,
      solicitante_tipo: t.iniciado_por as TipoSolicitante,
      data_solicitacao: t.created_at,
      prazo_liberacao: t.prazo_liberacao,
      aluno_nome: alunosMap[t.aluno_id] || `Aluno ${String(t.aluno_id).substring(0, 4)}`,
      origem_id: t.escola_origem_id,
      escola_origem: escolasMap[t.escola_origem_id] || 'Escola de Origem',
      destino_id: t.escola_destino_id,
      escola_destino: escolasMap[t.escola_destino_id] || t.escola_destino_nome_manual || 'Escola de Destino',
      motivo_solicitacao: t.motivo_solicitacao,
      justificativa_recusa: t.justificativa_recusa,
    }))
  },

  async listarPorResponsavel(alunoIds: string[]) {
    if (!alunoIds.length) return []

    const { data, error } = await (supabase
      .from('transferencias_escolares' as any) as any)
      .select('*')
      .in('aluno_id', alunoIds)
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!data || data.length === 0) return []

    const [escolasMap, alunosMap] = await Promise.all([
      fetchEscolasMap([
        ...data.map((t: any) => t.escola_origem_id),
        ...data.map((t: any) => t.escola_destino_id),
      ].filter(Boolean)),
      fetchAlunosMap(data.map((t: any) => t.aluno_id)),
    ])

    return data.map((t: any) => ({
      ...t,
      created_at: t.created_at,
      origem_tenant_id: t.escola_origem_id,
      destino_tenant_id: t.escola_destino_id,
      solicitante_tipo: t.iniciado_por,
      aprovacao_responsavel: t.status !== 'aguardando_responsavel' && t.status !== 'recusado' && t.status !== 'cancelado',
      aluno: { nome_completo: alunosMap[t.aluno_id] || 'Aluno' },
      escola_origem: { razao_social: escolasMap[t.escola_origem_id] || 'Escola de Origem' },
      escola_destino: { razao_social: escolasMap[t.escola_destino_id] || t.escola_destino_nome_manual || 'Escola de Destino' },
    })) as any[]
  },

  async responderResponsavel(id: string, aprovado: boolean, motivoRecusa?: string) {
    if (aprovado) {
      const { error } = await supabase.rpc('aprovar_transferencia', { p_transferencia_id: id })
      if (error) throw error
      return { status: 'aguardando_liberacao_origem' }
    } else {
      const { error } = await supabase.rpc('recusar_transferencia', {
        p_transferencia_id: id,
        p_justificativa: motivoRecusa || 'Recusado pelo responsável'
      })
      if (error) throw error
      return { status: 'recusado' }
    }
  },

  /** ESCOLA ORIGEM conclui a transferência liberando o aluno */
  async liberarAluno(id: string) {
    const { error } = await supabase.rpc('liberar_aluno_transferencia' as any, {
      p_transferencia_id: id
    })
    if (error) throw error
    return { status: 'concluido' }
  },

  async checkPermissaoEscola(tenantId: string) {
    const { data, error } = await supabase
      .from('escolas')
      .select('permissao_solicitacao_ativa, reputacao_rede')
      .eq('id', tenantId)
      .single()

    if (error) throw error
    return data as unknown as { permissao_solicitacao_ativa: boolean; reputacao_rede: number }
  }
}
