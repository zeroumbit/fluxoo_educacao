import { supabase } from '@/lib/supabase'

export const financeiroAvancadoService = {
  // CONFIG FINANCEIRA (Motor de Configurações Unificado)
  async getConfig(tenantId: string) {
    const { data, error } = await (supabase.from('configuracoes_escola' as any) as any)
      .select('config_financeira')
      .eq('tenant_id', tenantId)
      .is('vigencia_fim', null)
      .maybeSingle()
    
    if (error) throw error
    // Mapeia o JSONB para o formato que os componentes esperam (compatibilidade)
    return data?.config_financeira ? { 
      ...data.config_financeira,
      tenant_id: tenantId,
      pix_habilitado: data.config_financeira.pix_manual, // mapeamento legado
      pix_chave: data.config_financeira.chave_pix        // mapeamento legado
    } : null
  },

  async upsertConfig(config: any) {
    // Busca a config atual para preservar campos não enviados no payload 'any'
    const { data: current } = await (supabase.from('configuracoes_escola' as any) as any)
      .select('*')
      .eq('tenant_id', config.tenant_id)
      .is('vigencia_fim', null)
      .maybeSingle()

    const payload = {
      config_financeira: {
        ...(current?.config_financeira || {}),
        ...config,
        // Garante mapeamento reverso se vier do formato antigo
        pix_manual: config.pix_habilitado !== undefined ? config.pix_habilitado : config.pix_manual,
        chave_pix: config.pix_chave || config.chave_pix
      }
    }

    if (current?.id) {
      const { data, error } = await (supabase.from('configuracoes_escola' as any) as any)
        .update(payload)
        .eq('id', current.id)
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await (supabase.from('configuracoes_escola' as any) as any)
        .insert({
          tenant_id: config.tenant_id,
          contexto: 'escola',
          ...payload
        })
        .select()
        .single()
      if (error) throw error
      return data
    }
  },

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
  async atualizarContaPagar(id: string, updates: any) {
    const { data, error } = await (supabase.from('contas_pagar' as any) as any)
      .update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deletarContaPagar(id: string) {
    const { error } = await (supabase.from('contas_pagar' as any) as any)
      .delete().eq('id', id)
    if (error) throw error
  },

  // BAIXA MANUAL (registrar pagamento em cobrança existente)
  async registrarPagamento(cobrancaId: string, pagamento: any) {
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
      }).eq('id', cobrancaId).select().single()
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
  }
}
