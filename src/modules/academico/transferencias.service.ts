import { supabase } from '@/lib/supabase'
import type { TransferenciaEscolarStatus, TransferenciaEscolarIniciador } from '@/lib/database.types'

// Re-exportar tipos do database.types para uso externo
export type { TransferenciaEscolarStatus, TransferenciaEscolarIniciador }

// ─── Interface enriquecida para o frontend ────────────────────

export interface TransferenciaRow {
  id: string
  aluno_id: string
  escola_origem_id: string
  escola_destino_id: string | null
  escola_destino_nome_manual: string | null
  escola_destino_cnpj_manual: string | null
  responsavel_id: string | null
  iniciado_por: TransferenciaEscolarIniciador
  status: TransferenciaEscolarStatus
  motivo_solicitacao: string
  justificativa_recusa: string | null
  prazo_liberacao: string | null
  prazo_responsavel: string | null
  prazo_aceite_destino: string | null
  aceite_destino_em: string | null
  recusado_por: string | null
  recusado_em: string | null
  created_at: string
  aprovado_em: string | null
  concluido_em: string | null
  // Campos enriquecidos (resolvidos no frontend)
  transferencia_id: string
  aluno_nome: string
  escola_origem: string
  escola_destino: string
  data_solicitacao: string
  solicitante_tipo: TransferenciaEscolarIniciador
  origem_id: string
  destino_id: string | null
}

// ─── Labels e cores para status ───────────────────────────────

export const STATUS_LABEL: Record<TransferenciaEscolarStatus, string> = {
  aguardando_responsavel:      'Aguardando Responsável',
  aguardando_aceite_destino:   'Aguardando Escola Destino',
  aguardando_liberacao_origem: 'Liberar em 30 dias',
  concluido:                   'Concluída',
  recusado:                    'Recusada',
  cancelado:                   'Cancelada',
  expirado:                    'Expirada',
}

export const STATUS_COLOR: Record<TransferenciaEscolarStatus, { color: string; bg: string }> = {
  aguardando_responsavel:      { color: 'text-amber-700',   bg: 'bg-amber-50'   },
  aguardando_aceite_destino:   { color: 'text-indigo-700',  bg: 'bg-indigo-50'  },
  aguardando_liberacao_origem: { color: 'text-blue-700',    bg: 'bg-blue-50'    },
  concluido:                   { color: 'text-emerald-700', bg: 'bg-emerald-50' },
  recusado:                    { color: 'text-rose-700',    bg: 'bg-rose-50'    },
  cancelado:                   { color: 'text-zinc-500',    bg: 'bg-zinc-50'    },
  expirado:                    { color: 'text-stone-500',   bg: 'bg-stone-50'   },
}

// ─── Helpers internos ─────────────────────────────────────────

interface EscolaMin { id: string; razao_social: string }
interface AlunoMin { id: string; nome_completo: string }

async function fetchEscolasMap(ids: string[]): Promise<Record<string, string>> {
  const uniq = [...new Set(ids.filter(Boolean))]
  if (!uniq.length) return {}
  const { data } = await supabase.from('escolas').select('id, razao_social').in('id', uniq)
  const map: Record<string, string> = {}
  ;(data as EscolaMin[] | null)?.forEach((e) => { map[e.id] = e.razao_social })
  return map
}

async function fetchAlunosMap(ids: string[]): Promise<Record<string, string>> {
  const uniq = [...new Set(ids.filter(Boolean))]
  if (!uniq.length) return {}
  const { data } = await supabase.from('alunos').select('id, nome_completo').in('id', uniq)
  const map: Record<string, string> = {}
  ;(data as AlunoMin[] | null)?.forEach((a) => { map[a.id] = a.nome_completo })
  return map
}

// Tipo raw retornado pelo Supabase (sem enriquecimento)
interface TransferenciaRaw {
  id: string
  aluno_id: string
  escola_origem_id: string
  escola_destino_id: string | null
  escola_destino_nome_manual: string | null
  escola_destino_cnpj_manual: string | null
  responsavel_id: string | null
  iniciado_por: TransferenciaEscolarIniciador
  status: TransferenciaEscolarStatus
  motivo_solicitacao: string
  justificativa_recusa: string | null
  prazo_liberacao: string | null
  prazo_responsavel: string | null
  prazo_aceite_destino: string | null
  aceite_destino_em: string | null
  recusado_por: string | null
  recusado_em: string | null
  created_at: string
  aprovado_em: string | null
  concluido_em: string | null
  updated_at: string
}

function enrichTransferencia(
  t: TransferenciaRaw,
  escolasMap: Record<string, string>,
  alunosMap: Record<string, string>
): TransferenciaRow {
  return {
    ...t,
    transferencia_id: t.id,
    solicitante_tipo: t.iniciado_por,
    data_solicitacao: t.created_at,
    aluno_nome: alunosMap[t.aluno_id] || `Aluno ${t.aluno_id.substring(0, 4)}`,
    origem_id: t.escola_origem_id,
    escola_origem: escolasMap[t.escola_origem_id] || 'Escola de Origem',
    destino_id: t.escola_destino_id,
    escola_destino: (t.escola_destino_id ? escolasMap[t.escola_destino_id] : null)
      || t.escola_destino_nome_manual
      || 'Escola de Destino',
  }
}

// ─── Service ──────────────────────────────────────────────────

export const transferenciasService = {
  /** ESCOLA DESTINO inicia pedido de transferência pelo código do aluno */
  async solicitar(alunoId: string, origemId: string, destinoId: string, motivo: string) {
    const { data, error } = await supabase
      .from('transferencias_escolares')
      .insert({
        aluno_id: alunoId,
        escola_origem_id: origemId,
        escola_destino_id: destinoId,
        iniciado_por: 'destino' as const,
        status: 'aguardando_responsavel' as const,
        motivo_solicitacao: motivo,
        responsavel_id: null,
      } as never)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /** ESCOLA ORIGEM inicia transferência de saída do aluno */
  async solicitarSaida(payload: {
    alunoId: string
    origemId: string
    destinoId: string | null
    nomeEscolaManual?: string
    cnpjEscolaManual?: string
    responsavelId: string | null
    motivo: string
    iniciadoPor: TransferenciaEscolarIniciador
  }) {
    const { data, error } = await supabase
      .from('transferencias_escolares')
      .insert({
        aluno_id: payload.alunoId,
        escola_origem_id: payload.origemId,
        escola_destino_id: payload.destinoId,
        escola_destino_nome_manual: payload.nomeEscolaManual || null,
        escola_destino_cnpj_manual: payload.cnpjEscolaManual || null,
        responsavel_id: payload.responsavelId,
        iniciado_por: payload.iniciadoPor,
        status: 'aguardando_responsavel' as const,
        motivo_solicitacao: payload.motivo,
      } as never)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /** RESPONSÁVEL inicia transferência via portal */
  async solicitarPeloResponsavel(payload: {
    alunoId: string
    origemId: string
    responsavelId: string
    destinoNome?: string
    destinoCnpj?: string
    motivo: string
  }) {
    const { data, error } = await supabase
      .from('transferencias_escolares')
      .insert({
        aluno_id: payload.alunoId,
        escola_origem_id: payload.origemId,
        escola_destino_id: null,
        escola_destino_nome_manual: payload.destinoNome || null,
        escola_destino_cnpj_manual: payload.destinoCnpj || null,
        responsavel_id: payload.responsavelId,
        iniciado_por: 'responsavel' as const,
        status: 'aguardando_liberacao_origem' as const, // Responsável já é o aprovador implícito
        motivo_solicitacao: payload.motivo,
        aprovado_em: new Date().toISOString(),
      } as never)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /** Lista transferências por escola (admin panel) */
  async listarPorEscola(tenantId: string): Promise<TransferenciaRow[]> {
    const { data, error } = await supabase
      .from('transferencias_escolares')
      .select('*')
      .or(`escola_origem_id.eq.${tenantId},escola_destino_id.eq.${tenantId}`)
      .order('created_at', { ascending: false })

    if (error) throw error
    const rows = (data || []) as unknown as TransferenciaRaw[]
    if (!rows.length) return []

    const [escolasMap, alunosMap] = await Promise.all([
      fetchEscolasMap([
        ...rows.map((t) => t.escola_origem_id),
        ...rows.map((t) => t.escola_destino_id).filter((id): id is string => id !== null),
      ]),
      fetchAlunosMap(rows.map((t) => t.aluno_id)),
    ])

    return rows.map((t) => enrichTransferencia(t, escolasMap, alunosMap))
  },

  /** Lista transferências por responsável (portal família) */
  async listarPorResponsavel(alunoIds: string[]) {
    if (!alunoIds.length) return []

    const { data, error } = await supabase
      .from('transferencias_escolares')
      .select('*')
      .in('aluno_id', alunoIds)
      .order('created_at', { ascending: false })

    if (error) throw error
    const rows = (data || []) as unknown as TransferenciaRaw[]
    if (!rows.length) return []

    const [escolasMap, alunosMap] = await Promise.all([
      fetchEscolasMap([
        ...rows.map((t) => t.escola_origem_id),
        ...rows.map((t) => t.escola_destino_id).filter((id): id is string => id !== null),
      ]),
      fetchAlunosMap(rows.map((t) => t.aluno_id)),
    ])

    return rows.map((t) => ({
      ...t,
      data_solicitacao: t.created_at,
      origem_tenant_id: t.escola_origem_id,
      destino_tenant_id: t.escola_destino_id,
      solicitante_tipo: t.iniciado_por,
      aprovacao_responsavel: t.status !== 'aguardando_responsavel' && t.status !== 'recusado' && t.status !== 'cancelado',
      aluno: { nome_completo: alunosMap[t.aluno_id] || 'Aluno' },
      escola_origem: { razao_social: escolasMap[t.escola_origem_id] || 'Escola de Origem' },
      escola_destino: {
        razao_social: (t.escola_destino_id ? escolasMap[t.escola_destino_id] : null)
          || t.escola_destino_nome_manual
          || 'Escola de Destino'
      },
    }))
  },

  /** Responsável aprova ou recusa transferência */
  async responderResponsavel(id: string, aprovado: boolean, motivoRecusa?: string) {
    if (aprovado) {
      const { error } = await supabase.rpc('aprovar_transferencia', { p_transferencia_id: id })
      if (error) throw error
      return { status: 'aprovado' as const }
    } else {
      const { error } = await supabase.rpc('recusar_transferencia', {
        p_transferencia_id: id,
        p_justificativa: motivoRecusa || 'Recusado pelo responsável'
      })
      if (error) throw error
      return { status: 'recusado' as const }
    }
  },

  /** ESCOLA DESTINO aceita a transferência */
  async aceitarTransferenciaDestino(id: string) {
    const { error } = await supabase.rpc('aceitar_transferencia_destino' as never, {
      p_transferencia_id: id
    } as never)
    if (error) throw error
    return { status: 'aguardando_liberacao_origem' as const }
  },

  /** ESCOLA DESTINO recusa a transferência */
  async recusarTransferenciaDestino(id: string, justificativa: string) {
    const { error } = await supabase.rpc('recusar_transferencia_destino' as never, {
      p_transferencia_id: id,
      p_justificativa: justificativa
    } as never)
    if (error) throw error
    return { status: 'recusado' as const }
  },

  /** ESCOLA ORIGEM conclui a transferência com integração de dados */
  async concluirTransferencia(id: string) {
    const { error } = await supabase.rpc('concluir_transferencia_integrar' as never, {
      p_transferencia_id: id
    } as never)
    if (error) throw error
    return { status: 'concluido' as const }
  },

  /** Verifica permissão de transferência da escola */
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
