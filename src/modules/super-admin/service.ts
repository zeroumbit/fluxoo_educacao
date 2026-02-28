import { supabase } from '@/lib/supabase'

export const superAdminService = {
  // ==========================================
  // DASHBOARD
  // ==========================================
  async getDashboardStats() {
    const { count: totalEscolas } = await supabase
      .from('escolas' as any).select('*', { count: 'exact', head: true })

    const { count: assinaturasAtivas } = await supabase
      .from('assinaturas' as any).select('*', { count: 'exact', head: true })
      .eq('status', 'ativa')

    const { count: totalAlunos } = await supabase
      .from('alunos' as any).select('*', { count: 'exact', head: true })

    const { count: faturasPendentes } = await supabase
      .from('faturas' as any).select('*', { count: 'exact', head: true })
      .eq('status', 'pendente_confirmacao')

    const { data: escolasRecentes } = await supabase
      .from('escolas' as any)
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
    const { data, error } = await supabase
      .from('planos' as any).select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data as any[]
  },

  async upsertPlano(plano: any) {
    const { data, error } = await supabase
      .from('planos' as any)
      .upsert({ ...plano, updated_at: new Date().toISOString() })
      .select().single()
    if (error) throw error
    return data
  },

  async deletePlano(id: string) {
    const { error } = await supabase
      .from('planos' as any)
      .update({ status: false, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
    if (error) throw error
  },

  // ==========================================
  // MÓDULOS
  // ==========================================
  async getModulos() {
    const { data, error } = await supabase
      .from('modulos' as any).select('*').order('nome')
    if (error) throw error
    return data as any[]
  },

  async upsertModulo(modulo: any) {
    const { data, error } = await supabase
      .from('modulos' as any).upsert(modulo).select().single()
    if (error) throw error
    return data
  },

  async deleteModulo(id: string) {
    const { error } = await supabase
      .from('modulos' as any).delete().eq('id', id)
    if (error) throw error
  },

  // ==========================================
  // PLANO_MODULO (vínculo)
  // ==========================================
  async getPlanoModulos(planoId: string) {
    const { data, error } = await supabase
      .from('plano_modulo' as any).select('*, modulo:modulos(*)').eq('plano_id', planoId)
    if (error) throw error
    return data as any[]
  },

  async setPlanoModulos(planoId: string, moduloIds: string[]) {
    // Remove vínculos atuais
    await supabase.from('plano_modulo' as any).delete().eq('plano_id', planoId)
    // Insere novos
    if (moduloIds.length > 0) {
      const rows = moduloIds.map(mid => ({ plano_id: planoId, modulo_id: mid }))
      const { error } = await supabase.from('plano_modulo' as any).insert(rows as any)
      if (error) throw error
    }
  },

  // ==========================================
  // ESCOLAS (TENANTS)
  // ==========================================
  async getEscolas() {
    const { data, error } = await supabase
      .from('escolas' as any)
      .select('*, plano:planos(nome, valor_por_aluno)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },

  async updateEscolaStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('escolas' as any)
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
    const { data, error } = await supabase
      .from('assinaturas' as any)
      .select('*, escola:escolas(razao_social, cnpj), plano:planos(nome)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },

  async createAssinatura(assinatura: any) {
    const { data, error } = await supabase
      .from('assinaturas' as any).insert(assinatura as any).select().single()
    if (error) throw error
    return data
  },

  async updateAssinatura(id: string, updates: any) {
    const { data, error } = await supabase
      .from('assinaturas' as any)
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id).select().single()
    if (error) throw error
    return data
  },

  // ==========================================
  // FATURAS
  // ==========================================
  async getFaturas(filters?: { status?: string }) {
    let query = supabase
      .from('faturas' as any)
      .select('*, escola:escolas(razao_social), assinatura:assinaturas(plano_id)')
      .order('created_at', { ascending: false })
    if (filters?.status) query = query.eq('status', filters.status)
    const { data, error } = await query
    if (error) throw error
    return (data as any[]) || []
  },

  async confirmarFatura(id: string, adminId: string) {
    const { data, error } = await supabase
      .from('faturas' as any)
      .update({
        status: 'pago',
        confirmado_por: adminId,
        data_confirmacao: new Date().toISOString(),
        data_pagamento: new Date().toISOString().split('T')[0],
      } as any)
      .eq('id', id).select().single()
    if (error) throw error
    return data
  },

  // ==========================================
  // SOLICITAÇÕES DE UPGRADE
  // ==========================================
  async getSolicitacoesUpgrade() {
    const { data, error } = await supabase
      .from('solicitacoes_upgrade' as any)
      .select('*, escola:escolas(razao_social)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },

  async aprovarUpgrade(id: string, tenantId: string, novoLimite: number, novoValor: number) {
    // 1. Aprovar solicitação
    await supabase.from('solicitacoes_upgrade' as any)
      .update({ status: 'aprovado' } as any).eq('id', id)

    // 2. Atualizar assinatura ativa
    const { data: assinatura } = await supabase
      .from('assinaturas' as any)
      .select('*').eq('tenant_id', tenantId).eq('status', 'ativa').single()

    if (assinatura) {
      // 3. Salvar snapshot no histórico (imutável)
      await supabase.from('historico_assinatura' as any).insert({
        tenant_id: tenantId,
        plano_id: (assinatura as any).plano_id,
        valor_por_aluno_contratado: (assinatura as any).valor_por_aluno_contratado,
        limite_alunos_contratado: (assinatura as any).limite_alunos_contratado,
        valor_total_contratado: (assinatura as any).valor_total_contratado,
        data_inicio: (assinatura as any).data_inicio,
        data_fim: new Date().toISOString().split('T')[0],
      } as any)

      // 4. Atualizar assinatura com novos valores
      await supabase.from('assinaturas' as any)
        .update({
          limite_alunos_contratado: novoLimite,
          valor_total_contratado: novoValor,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', (assinatura as any).id)
    }
  },

  async recusarUpgrade(id: string) {
    const { error } = await supabase.from('solicitacoes_upgrade' as any)
      .update({ status: 'recusado' } as any).eq('id', id)
    if (error) throw error
  },

  // ==========================================
  // CONFIGURAÇÃO DE RECEBIMENTO (PIX MANUAL)
  // ==========================================
  async getConfiguracaoRecebimento() {
    const { data, error } = await supabase
      .from('configuracao_recebimento' as any).select('*').limit(1).single()
    if (error && error.code !== 'PGRST116') throw error
    return data as any
  },

  async updateConfiguracaoRecebimento(config: any) {
    // Upsert no registro único
    const { data, error } = await supabase
      .from('configuracao_recebimento' as any)
      .upsert({ ...config, updated_at: new Date().toISOString() })
      .select().single()
    if (error) throw error
    return data
  },
}
