import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export const financeiroAvancadoService = {
  // CONTAS A PAGAR
  async listarContasPagar(tenantId: string) {
    const { data, error } = await (supabase.from('contas_pagar' as any) as any)
      .select('*').eq('tenant_id', tenantId).order('data_vencimento')
    if (error) throw error
    return (data as any[]) || []
  },
  async criarContaPagar(conta: any) {
    const { data, error } = await (supabase.from('contas_pagar' as any) as any).insert(conta).select().single()
    if (error) throw error
    return data
  },
  async atualizarContaPagar(id: string, tenantId: string, updates: any) {
    const { data, error } = await (supabase.from('contas_pagar' as any) as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select().single()
    if (error) throw error
    return data
  },
  async deletarContaPagar(id: string, tenantId: string) {
    const { error } = await (supabase.from('contas_pagar' as any) as any)
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) throw error
  },

  // BAIXA MANUAL (registrar pagamento em cobrança existente)
  async registrarPagamento(cobrancaId: string, tenantId: string, pagamento: any) {
    const { data, error } = await (supabase.from('cobrancas' as any) as any)
      .update({
        status: 'pago',
        data_pagamento: pagamento.data_pagamento,
        valor_pago: pagamento.valor_pago,
        forma_pagamento: pagamento.forma_pagamento,
        ultimos_4_digitos: pagamento.ultimos_4_digitos || null,
        bandeira_cartao: pagamento.bandeira_cartao || null,
        codigo_transacao: pagamento.codigo_transacao || null,
        comprovante_url: pagamento.comprovante_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cobrancaId)
      .eq('tenant_id', tenantId)
      .select().single()
    if (error) throw error
    return data
  },

  // ==========================================
  // FECHAMENTO DE CAIXA MENSAL (ZERO COST BI)
  // ==========================================
  async getFechamentoMensal(tenantId: string) {
    const { data, error } = await (supabase.from('mv_fechamento_mensal' as any) as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('mes', { ascending: false })

    if (error) {
      console.warn("Materialized View possivelmente não atualizada ou não foi possível consultar:", error);
      return [];
    }
    return (data as any[]) || []
  },

  // ==========================================
  // GATEWAYS DE PAGAMENTO (por escola)
  // ==========================================

  /**
   * Lista gateways disponíveis (apenas os ativos_global=true).
   */
  async getGatewaysDisponiveis(_tenantId: string) {
    const { data, error } = await (supabase.from('vw_gateways_disponiveis' as any) as any)
      .select('*')
      .order('ordem_exibicao', { ascending: true })
    if (error) throw error
    return data as any[]
  },

  /**
   * Busca a configuração de um gateway específico da escola.
   */
  async getGatewayTenantConfig(tenantId: string, gateway: string) {
    const { data, error } = await (supabase.from('gateway_tenant_config' as any) as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('gateway', gateway)
      .maybeSingle()
    if (error) throw error
    return data
  },

  /**
   * Salva ou atualiza a configuração de gateway da escola.
   * REGRA: Apenas 1 gateway pode ficar ativo por vez.
   * Ao ativar um gateway, todos os outros são desativados automaticamente.
   */
  async salvarGatewayTenantConfig(tenantId: string, gateway: string, configuracao: Record<string, unknown>, ativo: boolean, modoTeste: boolean = false) {
    // Primeiro verificar se o gateway está ativo globalmente
    const { data: globalCheck } = await (supabase.from('gateway_config' as any) as any)
      .select('ativo_global')
      .eq('gateway', gateway)
      .maybeSingle()

    if (!globalCheck || globalCheck.ativo_global !== true) {
      throw new Error(`Gateway ${gateway} não foi ativado pelo Super Admin.`)
    }

    // Se está ativando, desativar TODOS os outros gateways desta escola
    if (ativo) {
      const { error: deactivateError } = await (supabase.from('gateway_tenant_config' as any) as any)
        .update({ ativo: false, updated_at: new Date().toISOString() })
        .eq('tenant_id', tenantId)
        .neq('gateway', gateway)

      if (deactivateError) {
        logger.error('[salvarGatewayTenantConfig] Erro ao desativar outros gateways:', deactivateError)
        // Não bloqueia — continua salvando o atual
      }
    }

    // Verificar se já existe
    const { data: existing } = await (supabase.from('gateway_tenant_config' as any) as any)
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('gateway', gateway)
      .maybeSingle()

    if (existing) {
      const { data, error } = await (supabase.from('gateway_tenant_config' as any) as any)
        .update({
          configuracao,
          ativo,
          modo_teste: modoTeste,
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', tenantId)
        .eq('gateway', gateway)
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await (supabase.from('gateway_tenant_config' as any) as any)
        .insert({
          tenant_id: tenantId,
          gateway,
          configuracao,
          ativo,
          modo_teste: modoTeste,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      if (error) throw error
      return data
    }
  },

  /**
   * Desativa o gateway da escola.
   */
  async desativarGatewayTenant(tenantId: string, gateway: string) {
    const { error } = await (supabase.from('gateway_tenant_config' as any) as any)
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('gateway', gateway)
    if (error) throw error
  },
}
