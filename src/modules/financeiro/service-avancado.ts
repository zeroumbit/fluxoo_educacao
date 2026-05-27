import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'
import type {
  CobrancaUpdate,
  ContaPagar,
  ContaPagarInsert,
  ContaPagarUpdate,
  GatewayConfig,
  GatewayDisponivelView,
  GatewayTenantConfigInsert,
  GatewayTenantConfigUpdate,
} from '@/lib/database.types'

type RegistroPagamentoManual = Pick<
  CobrancaUpdate,
  | 'data_pagamento'
  | 'valor_pago'
  | 'forma_pagamento'
  | 'ultimos_4_digitos'
  | 'bandeira_cartao'
  | 'codigo_transacao'
  | 'comprovante_url'
>

type FechamentoMensal = {
  tenant_id: string
  mes: string
  total_receitas?: number | null
  total_despesas?: number | null
  saldo?: number | null
}

type FinanceiroAvancadoViewClient = {
  from(table: 'mv_fechamento_mensal'): {
    select(columns: string): {
      eq(column: string, value: string): {
        order(column: string, options?: { ascending?: boolean }): Promise<{ data: FechamentoMensal[] | null; error: unknown }>
      }
    }
  }
  from(table: 'vw_gateways_disponiveis'): {
    select(columns: string): {
      order(column: string, options?: { ascending?: boolean }): Promise<{ data: GatewayDisponivelView[] | null; error: unknown }>
    }
  }
}

const financeiroAvancadoViewClient = supabase as unknown as FinanceiroAvancadoViewClient

export const financeiroAvancadoService = {
  // CONTAS A PAGAR
  async listarContasPagar(tenantId: string) {
    const { data, error } = await supabase
      .from('contas_pagar')
      .select('*').eq('tenant_id', tenantId).order('data_vencimento')
    if (error) throw error
    return (data as ContaPagar[] | null) || []
  },
  async criarContaPagar(conta: ContaPagarInsert) {
    const { data, error } = await supabase.from('contas_pagar').insert(conta).select().single()
    if (error) throw error
    return data
  },
  async atualizarContaPagar(id: string, tenantId: string, updates: ContaPagarUpdate) {
    const updatePayload: ContaPagarUpdate = { ...updates, updated_at: new Date().toISOString() }
    const { data, error } = await supabase
      .from('contas_pagar')
      .update(updatePayload)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select().single()
    if (error) throw error
    return data
  },
  async deletarContaPagar(id: string, tenantId: string) {
    const { error } = await supabase
      .from('contas_pagar')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) throw error
  },

  // BAIXA MANUAL (registrar pagamento em cobrança existente)
  async registrarPagamento(cobrancaId: string, tenantId: string, pagamento: RegistroPagamentoManual) {
    const updatePayload: CobrancaUpdate = {
      status: 'pago',
      data_pagamento: pagamento.data_pagamento,
      valor_pago: pagamento.valor_pago,
      forma_pagamento: pagamento.forma_pagamento,
      ultimos_4_digitos: pagamento.ultimos_4_digitos || null,
      bandeira_cartao: pagamento.bandeira_cartao || null,
      codigo_transacao: pagamento.codigo_transacao || null,
      comprovante_url: pagamento.comprovante_url || null,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('cobrancas')
      .update(updatePayload)
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
    const { data, error } = await financeiroAvancadoViewClient
      .from('mv_fechamento_mensal')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('mes', { ascending: false })

    if (error) {
      console.warn("Materialized View possivelmente não atualizada ou não foi possível consultar:", error);
      return [];
    }
    return data || []
  },

  // ==========================================
  // GATEWAYS DE PAGAMENTO (por escola)
  // ==========================================

  /**
   * Lista gateways disponíveis (apenas os ativos_global=true).
   */
  async getGatewaysDisponiveis(_tenantId: string) {
    const { data, error } = await financeiroAvancadoViewClient
      .from('vw_gateways_disponiveis')
      .select('*')
      .order('ordem_exibicao', { ascending: true })
    if (error) throw error
    return data || []
  },

  /**
   * Busca a configuração de um gateway específico da escola.
   */
  async getGatewayTenantConfig(tenantId: string, gateway: string) {
    const { data, error } = await supabase
      .from('gateway_tenant_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('gateway', gateway as GatewayConfig['gateway'])
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
    const { data: globalCheck } = await supabase
      .from('gateway_config')
      .select('ativo_global')
      .eq('gateway', gateway as GatewayConfig['gateway'])
      .maybeSingle()

    if (!globalCheck || globalCheck.ativo_global !== true) {
      throw new Error(`Gateway ${gateway} não foi ativado pelo Super Admin.`)
    }

    // Se está ativando, desativar TODOS os outros gateways desta escola
    if (ativo) {
      const deactivatePayload: GatewayTenantConfigUpdate = { ativo: false, updated_at: new Date().toISOString() }
      const { error: deactivateError } = await supabase
        .from('gateway_tenant_config')
        .update(deactivatePayload)
        .eq('tenant_id', tenantId)
        .neq('gateway', gateway)

      if (deactivateError) {
        logger.error('[salvarGatewayTenantConfig] Erro ao desativar outros gateways:', deactivateError)
        // Não bloqueia — continua salvando o atual
      }
    }

    // Verificar se já existe
    const { data: existing } = await supabase
      .from('gateway_tenant_config')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('gateway', gateway as GatewayConfig['gateway'])
      .maybeSingle()

    if (existing) {
      const updatePayload: GatewayTenantConfigUpdate = {
        configuracao,
        ativo,
        modo_teste: modoTeste,
        updated_at: new Date().toISOString()
      }
      const { data, error } = await supabase
        .from('gateway_tenant_config')
        .update(updatePayload)
        .eq('tenant_id', tenantId)
        .eq('gateway', gateway as GatewayConfig['gateway'])
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      const insertPayload: GatewayTenantConfigInsert = {
        tenant_id: tenantId,
        gateway: gateway as GatewayTenantConfigInsert['gateway'],
        configuracao,
        ativo,
        modo_teste: modoTeste,
        updated_at: new Date().toISOString()
      }
      const { data, error } = await supabase
        .from('gateway_tenant_config')
        .insert(insertPayload)
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
    const updatePayload: GatewayTenantConfigUpdate = { ativo: false, updated_at: new Date().toISOString() }
    const { error } = await supabase
      .from('gateway_tenant_config')
      .update(updatePayload)
      .eq('tenant_id', tenantId)
      .eq('gateway', gateway as GatewayConfig['gateway'])
    if (error) throw error
  },
}
