import type { Notificacao, NotificacaoInsert as DBNotificacaoInsert } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export interface NotificacaoInsert {
  tenant_id: string
  user_id?: string | null
  tipo: string
  titulo: string
  mensagem: string
  href: string
  categoria: string
  prioridade?: number
  metadata?: Record<string, any>
}

export const notificacoesService = {
  async buscarNotificacoes(tenantId: string, userId?: string, limit = 50) {
    let query = (supabase.from('notificacoes') as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('resolvida', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (userId) {
      query = query.or(`user_id.is.null,user_id.eq.${userId}`)
    }

    const { data, error } = await query
    if (error) throw error
    return data as Notificacao[]
  },

  async buscarNotificacaoPorId(notificacaoId: string) {
    const { data, error } = await (supabase.from('notificacoes') as any)
      .select('*')
      .eq('id', notificacaoId)
      .maybeSingle()

    if (error) throw error
    return data as Notificacao | null
  },

  async buscarContagemNaoLidas(tenantId: string, userId?: string) {
    let query = (supabase.from('notificacoes') as any)
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('lida', false)
      .eq('resolvida', false)

    if (userId) {
      query = query.or(`user_id.is.null,user_id.eq.${userId}`)
    }

    const { count, error } = await query
    if (error) throw error
    return count || 0
  },

  async marcarComoLida(notificacaoId: string) {
    const { error } = await supabase.rpc('marcar_notificacao_lida', { notificacao_id: notificacaoId })
    if (error) throw error
  },

  async marcarComoResolvida(notificacaoId: string) {
    const { error } = await supabase.rpc('marcar_notificacao_resolvida', { notificacao_id: notificacaoId })
    if (error) throw error
  },

  async marcarMultiplasComoLidas(notificacaoIds: string[]) {
    if (notificacaoIds.length === 0) return

    const { error } = await supabase
      .from('notificacoes')
      .update({
        lida: true,
        lida_em: new Date().toISOString()
      })
      .in('id', notificacaoIds)

    if (error) throw error
  },

  async criarNotificacao(notificacao: NotificacaoInsert) {
    const { data, error } = await supabase
      .from('notificacoes')
      .insert({
        ...notificacao,
        href: this.getTipoHref(notificacao.tipo, notificacao.href),
        lida: false,
        resolvida: false
      } as DBNotificacaoInsert)
      .select()
      .single()

    if (error) throw error
    return data as Notificacao
  },

  async criarNotificacaoRadarEvasao(tenantId: string, alunoId: string, alunoNome: string) {
    const { data: existente } = await (supabase.from('notificacoes') as any)
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('tipo', 'RADAR_EVASAO')
      .eq('resolvida', false)
      .eq('metadata->>aluno_id', alunoId)
      .maybeSingle()

    if (existente) return existente

    const { data, error } = await supabase
      .from('notificacoes')
      .insert({
        tenant_id: tenantId,
        user_id: null,
        tipo: 'RADAR_EVASAO',
        titulo: 'Aluno em risco de evasao',
        mensagem: `${alunoNome} apresenta sinais de risco de evasao.`,
        href: '/dashboard',
        categoria: 'ESCOLAS',
        prioridade: 1,
        metadata: { aluno_id: alunoId, aluno_nome: alunoNome },
        lida: false,
        resolvida: false
      } as DBNotificacaoInsert)
      .select()
      .single()

    if (error) throw error
    return data as Notificacao
  },

  async limparNotificacoesResolvidas(tenantId: string, diasAntigos = 30) {
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() - diasAntigos)

    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('resolvida', true)
      .lt('created_at', dataLimite.toISOString())

    if (error) throw error
  },

  async buscarNotificacoesAgrupadas(tenantId: string, userId?: string) {
    const notificacoes = await this.buscarNotificacoes(tenantId, userId)

    const agrupadas = notificacoes.reduce((acc, notif) => {
      if (!acc[notif.tipo]) acc[notif.tipo] = []
      acc[notif.tipo].push(notif)
      return acc
    }, {} as Record<string, Notificacao[]>)

    const items = Object.entries(agrupadas).map(([tipo, notifs]) => {
      const href = this.getTipoHref(tipo, notifs[0]?.href || '/dashboard')

      return {
        id: tipo,
        label: `${notifs.length} ${this.getTipoLabel(tipo, notifs.length)}`,
        href,
        category: notifs[0]?.categoria || 'ESCOLAS',
        notifications: notifs.map((notif) => ({ ...notif, href }))
      }
    })

    return {
      total: notificacoes.length,
      items,
      notificacoes
    }
  },

  getTipoLabel(tipo: string, count: number): string {
    const labels: Record<string, string> = {
      RADAR_EVASAO: count === 1 ? 'Perigo de evasao' : 'Perigo de evasao',
      DOCUMENTO: count === 1 ? 'Pedido de documento' : 'Pedidos de documentacao',
      FINANCEIRO: count === 1 ? 'Alerta financeiro' : 'Alertas financeiros',
      MATRICULA: count === 1 ? 'Matricula pendente' : 'Matriculas pendentes',
      PAGAMENTO_PIX_MANUAL: count === 1 ? 'Comprovante PIX' : 'Comprovantes PIX'
    }
    return labels[tipo] || 'Notificacoes'
  },

  getTipoHref(tipo: string, fallback: string): string {
    const hrefs: Record<string, string> = {
      DOCUMENTO: '/documentos?tab=solicitacoes',
      RADAR_EVASAO: '/dashboard',
      FINANCEIRO: '/financeiro',
      MATRICULA: '/matriculas',
      PAGAMENTO_PIX_MANUAL: '/financeiro',
      TRANSFERENCIA_DESTINO: '/transferencias',
      TRANSFERENCIA_ORIGEM: '/transferencias',
      TRANSFERENCIA_CONCLUIDA: '/transferencias',
      TRANSFERENCIA_RECUSADA: '/transferencias',
    }

    return hrefs[tipo] || fallback
  }
}
