import { supabase } from '@/lib/supabase'
import type { Notificacao, NotificacaoInsert as DBNotificacaoInsert } from '@/lib/database.types'

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
  /**
   * Busca todas as notificações não resolvidas do tenant
   */
  async buscarNotificacoes(tenantId: string, userId?: string, limit = 50) {
    let query = (supabase.from('notificacoes') as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('resolvida', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Se tiver userId, filtra também (notificações do usuário ou globais)
    if (userId) {
      query = query.or(`user_id.is.null,user_id.eq.${userId}`)
    }

    const { data, error } = await query
    if (error) throw error
    return data as Notificacao[]
  },

  /**
   * Busca contagem de notificações não lidas e não resolvidas
   */
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

  /**
   * Marca notificação como lida
   */
  async marcarComoLida(notificacaoId: string) {
    const { error } = await supabase
      .rpc('marcar_notificacao_lida', { notificacao_id: notificacaoId })
    
    if (error) throw error
  },

  /**
   * Marca notificação como resolvida (remove do sino)
   */
  async marcarComoResolvida(notificacaoId: string) {
    const { error } = await supabase
      .rpc('marcar_notificacao_resolvida', { notificacao_id: notificacaoId })
    
    if (error) throw error
  },

  /**
   * Marca múltiplas notificações como lidas
   */
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

  /**
   * Cria nova notificação
   */
  async criarNotificacao(notificacao: NotificacaoInsert) {
    const { data, error } = await supabase
      .from('notificacoes')
      .insert({
        ...notificacao,
        lida: false,
        resolvida: false
      } as DBNotificacaoInsert)
      .select()
      .single()
    
    if (error) throw error
    return data as Notificacao
  },

  /**
   * Cria notificação de radar de evasão (automática)
   */
  async criarNotificacaoRadarEvasao(
    tenantId: string,
    alunoId: string,
    alunoNome: string
  ) {
    // Verifica se já existe notificação ativa para este aluno
    const { data: existente } = await (supabase.from('notificacoes') as any)
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('tipo', 'RADAR_EVASAO')
      .eq('resolvida', false)
      .eq('metadata->>aluno_id', alunoId)
      .maybeSingle()

    if (existente) return existente

    // Cria nova notificação
    const { data, error } = await supabase
      .from('notificacoes')
      .insert({
        tenant_id: tenantId,
        user_id: null,
        tipo: 'RADAR_EVASAO',
        titulo: 'Aluno em risco de evasão',
        mensagem: `${alunoNome} apresenta sinais de risco de evasão.`,
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

  /**
   * Remove notificações resolvidas (limpeza)
   */
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

  /**
   * Busca notificações agrupadas por tipo para exibição no sino
   */
  async buscarNotificacoesAgrupadas(tenantId: string, userId?: string) {
    const notificacoes = await this.buscarNotificacoes(tenantId, userId)

    // Agrupa por tipo
    const agrupadas = notificacoes.reduce((acc, notif) => {
      if (!acc[notif.tipo]) {
        acc[notif.tipo] = []
      }
      acc[notif.tipo].push(notif)
      return acc
    }, {} as Record<string, Notificacao[]>)

    // Formata para o padrão do NotificationBell
    const items = Object.entries(agrupadas).map(([tipo, notifs]) => ({
      id: tipo,
      label: `${notifs.length} ${this.getTipoLabel(tipo, notifs.length)}`,
      href: notifs[0]?.href || '/dashboard',
      category: notifs[0]?.categoria || 'ESCOLAS',
      notifications: notifs
    }))

    return {
      total: notificacoes.length,
      items,
      notificacoes
    }
  },

  /**
   * Helper para label do tipo
   */
  getTipoLabel(tipo: string, count: number): string {
    const labels: Record<string, string> = {
      RADAR_EVASAO: count === 1 ? 'Perigo de evasão' : 'Perigo de evasão',
      DOCUMENTO: count === 1 ? 'Pedido de documento' : 'Pedidos de documentação',
      FINANCEIRO: count === 1 ? 'Alerta financeiro' : 'Alertas financeiros',
      MATRICULA: count === 1 ? 'Matrícula pendente' : 'Matrículas pendentes'
    }
    return labels[tipo] || 'Notificações'
  }
}
