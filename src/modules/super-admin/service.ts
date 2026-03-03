import { supabase } from '@/lib/supabase'

export const superAdminService = {
  // ==========================================
  // DASHBOARD
  // ==========================================
  async getDashboardStats() {
    const { count: totalEscolas } = await (supabase.from('escolas' as any) as any).select('*', { count: 'exact', head: true })

    const { count: assinaturasAtivas } = await (supabase.from('assinaturas' as any) as any).select('*', { count: 'exact', head: true })
      .eq('status', 'ativa')

    const { count: totalAlunos } = await (supabase.from('alunos' as any) as any).select('*', { count: 'exact', head: true })

    const { count: faturasPendentes } = await (supabase.from('faturas' as any) as any).select('*', { count: 'exact', head: true })
      .eq('status', 'pendente_confirmacao')

    const { data: escolasRecentes } = await (supabase.from('escolas' as any) as any)
      .select('id, razao_social, created_at, status_assinatura')
      .order('created_at', { ascending: false })
      .limit(5)

    return {
      totalEscolas: totalEscolas || 0,
      assinaturasAtivas: assinaturasAtivas || 0,
      totalAlunos: totalAlunos || 0,
      faturasPendentes: faturasPendentes || 0,
      escolasRecentes: (escolasRecentes as any[]) || [],
    }
  },

  // ==========================================
  // PLANOS
  // ==========================================
  async getPlanos() {
    const { data, error } = await (supabase.from('planos' as any) as any).select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data as any[]
  },

  async upsertPlano(plano: any) {
    const { data, error } = await (supabase.from('planos' as any) as any)
      .upsert({ ...plano, updated_at: new Date().toISOString() })
      .select().single()
    if (error) throw error
    return data
  },

  async deletePlano(id: string) {
    const { error } = await (supabase.from('planos' as any) as any)
      .update({ status: false, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
    if (error) throw error
  },

  // ==========================================
  // MÓDULOS
  // ==========================================
  async getModulos() {
    const { data, error } = await (supabase.from('modulos' as any) as any).select('*').order('nome')
    if (error) throw error
    return data as any[]
  },

  async upsertModulo(modulo: any) {
    const { data, error } = await (supabase.from('modulos' as any) as any).upsert(modulo).select().single()
    if (error) throw error
    return data
  },

  async deleteModulo(id: string) {
    const { error } = await (supabase.from('modulos' as any) as any).delete().eq('id', id)
    if (error) throw error
  },

  // ==========================================
  // PLANO_MODULO (vínculo)
  // ==========================================
  async getPlanoModulos(planoId: string) {
    const { data, error } = await (supabase.from('plano_modulo' as any) as any).select('*, modulo:modulos(*)').eq('plano_id', planoId)
    if (error) throw error
    return data as any[]
  },

  async setPlanoModulos(planoId: string, moduloIds: string[]) {
    // Remove vínculos atuais
    await (supabase.from('plano_modulo' as any) as any).delete().eq('plano_id', planoId)
    // Insere novos
    if (moduloIds.length > 0) {
      const rows = moduloIds.map(mid => ({ plano_id: planoId, modulo_id: mid }))
      const { error } = await (supabase.from('plano_modulo' as any) as any).insert(rows as any)
      if (error) throw error
    }
  },

  // ==========================================
  // ESCOLAS (TENANTS)
  // ==========================================
  async getEscolas() {
    const { data, error } = await (supabase.from('escolas' as any) as any)
      .select('*, plano:planos(nome, valor_por_aluno)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },

  async updateEscolaStatus(id: string, status: string) {
    const { data, error } = await (supabase.from('escolas' as any) as any)
      .update({
        status_assinatura: status,
        updated_at: new Date().toISOString(),
        data_inicio: status === 'ativa' ? new Date().toISOString() : null
      } as any)
      .eq('id', id).select().single()
    if (error) throw error
    return data
  },

  // ==========================================
  // ASSINATURAS
  // ==========================================
  async getAssinaturas() {
    const { data, error } = await (supabase.from('assinaturas' as any) as any)
      .select('*, escola:escolas(razao_social, cnpj), plano:planos(nome)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },

  async createAssinatura(assinatura: any) {
    const { data, error } = await (supabase.from('assinaturas' as any) as any).insert(assinatura as any).select().single()
    if (error) throw error
    return data
  },

  async updateAssinatura(id: string, updates: any) {
    const { data, error } = await (supabase.from('assinaturas' as any) as any)
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id).select().single()
    if (error) throw error
    return data
  },

  // ==========================================
  // FATURAS
  // ==========================================
  async getFaturas(filters?: { status?: string }) {
    let query = (supabase.from('faturas' as any) as any)
      .select('*, escola:escolas(razao_social), assinatura:assinaturas(plano_id)')
      .order('created_at', { ascending: false })
    if (filters?.status) query = query.eq('status', filters.status)
    const { data, error } = await query
    if (error) throw error
    return (data as any[]) || []
  },

  async confirmarFatura(id: string, adminId: string) {
    // 1. Atualiza a fatura para paga
    const { data: fatura, error: faturaError } = await (supabase.from('faturas' as any) as any)
      .update({
        status: 'pago',
        confirmado_por: adminId,
        data_confirmacao: new Date().toISOString(),
        data_pagamento: new Date().toISOString().split('T')[0],
      } as any)
      .eq('id', id).select('*, escola:escolas(*)').single()

    if (faturaError) throw faturaError

    // 2. Se a escola estiver pendente, ativa ela automaticamente (fluxo de onboarding)
    const escola = (fatura as any).escola
    if (escola && (escola.status_assinatura === 'pendente' || escola.status_assinatura === 'aguardando_pagamento')) {
      await (supabase.from('escolas' as any) as any)
        .update({
          status_assinatura: 'ativa',
          data_inicio: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', escola.id)
    }

    return fatura
  },

  // ==========================================
  // SOLICITAÇÕES DE UPGRADE
  // ==========================================
  async getSolicitacoesUpgrade() {
    const { data, error } = await (supabase.from('solicitacoes_upgrade' as any) as any)
      .select('*, escola:escolas(razao_social)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },

  async aprovarUpgrade(id: string, tenantId: string, novoLimite: number, novoValor: number) {
    // 1. Aprovar solicitação
    await (supabase.from('solicitacoes_upgrade' as any) as any)
      .update({ status: 'aprovado' } as any).eq('id', id)

    // 2. Atualizar assinatura ativa
    const { data: assinatura } = await (supabase.from('assinaturas' as any) as any)
      .select('*').eq('tenant_id', tenantId).eq('status', 'ativa').single()

    if (assinatura) {
      // 3. Salvar snapshot no histórico (imutável)
      await (supabase.from('historico_assinatura' as any) as any).insert({
        tenant_id: tenantId,
        plano_id: (assinatura as any).plano_id,
        valor_por_aluno_contratado: (assinatura as any).valor_por_aluno_contratado,
        limite_alunos_contratado: (assinatura as any).limite_alunos_contratado,
        valor_total_contratado: (assinatura as any).valor_total_contratado,
        data_inicio: (assinatura as any).data_inicio,
        data_fim: new Date().toISOString().split('T')[0],
      } as any)

      // 4. Atualizar assinatura com novos valores
      await (supabase.from('assinaturas' as any) as any)
        .update({
          limite_alunos_contratado: novoLimite,
          valor_total_contratado: novoValor,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', (assinatura as any).id)

      // 5. Sincronizar limite na tabela principal da escola (usado no dashboard)
      await (supabase.from('escolas' as any) as any)
        .update({
          limite_alunos_contratado: novoLimite,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', tenantId)
    }
  },

  async recusarUpgrade(id: string) {
    const { error } = await (supabase.from('solicitacoes_upgrade' as any) as any)
      .update({ status: 'recusado' } as any).eq('id', id)
    if (error) throw error
  },

  // ==========================================
  // CONFIGURAÇÃO DE RECEBIMENTO (PIX MANUAL)
  // ==========================================
  async getConfiguracaoRecebimento() {
    const { data, error } = await (supabase.from('configuracao_recebimento' as any) as any).select('*').limit(1).maybeSingle()
    if (error) throw error
    return data as any
  },

  async updateConfiguracaoRecebimento(config: any) {
    // Upsert no registro único
    const { data, error } = await (supabase.from('configuracao_recebimento' as any) as any)
      .upsert({ ...config, updated_at: new Date().toISOString() })
      .select().maybeSingle()
    if (error) throw error
    return data
  },

  // ==========================================
  // INTELIGÊNCIA E INSIGHTS (ZERO COST)
  // ==========================================
  async getTenantHealthScores() {
    const { data, error } = await (supabase.from('vw_tenant_health_score' as any) as any)
      .select('*')
      .order('health_score', { ascending: true }) // Mostra os piores primeiro para ação rápida
    if (error) throw error
    return (data as any[]) || []
  },

  async getRadarEvasaoGeral() {
    // Visão consolidada para o Super Admin ver alertas em todas as escolas
    const { data, error } = await (supabase.from('vw_radar_evasao' as any) as any)
      .select('*, escolas:tenant_id(razao_social)')
    if (error) throw error
    return (data as any[]) || []
  },
}
