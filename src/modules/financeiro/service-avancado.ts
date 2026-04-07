import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export const financeiroAvancadoService = {
  // CONFIG FINANCEIRA (Motor de Configurações Unificado)
  async getConfig(tenantId: string) {
    const { data, error } = await (supabase.from('configuracoes_escola' as any) as any)
      .select('config_financeira')
      .eq('tenant_id', tenantId)
      .is('vigencia_fim', null)
      .maybeSingle()

    if (error) throw error
    
    // Se não existir configuração, retorna null (será criada quando salvar)
    if (!data?.config_financeira) return null
    
    const config = data.config_financeira
    
    // Mapeia o JSONB para o formato que os componentes esperam (compatibilidade)
    // Formato esperado pela ConfigFinanceiraPage e outros componentes legados
    return {
      id: data.id,
      tenant_id: tenantId,
      // Campos diretos do JSONB com valores padrão
      dia_vencimento_padrao: config.dia_vencimento_padrao || 10,
      dias_carencia: config.dias_carencia || 5,
      multa_atraso_percentual: config.multa_atraso_perc || 2,
      multa_atraso_valor_fixo: config.multa_fixa || 0,
      juros_mora_mensal: config.juros_mora_mensal_perc || 1,
      desconto_irmaos: config.desconto_irmaos_perc || 0,
      desconto_pontualidade: config.desconto_pontualidade || 0,
      // Mapeamento: pix_manual -> pix_habilitado (compatibilidade com legado)
      pix_habilitado: config.pix_manual || false,
      chave_pix: config.chave_pix || '',
      nome_favorecido: config.nome_favorecido || '',
      // Mapeamento: instrucoes_pix -> instrucoes_responsavel (compatibilidade)
      instrucoes_responsavel: config.instrucoes_pix || '',
      // Mapeamento: pix_auto -> qr_code_auto (compatibilidade)
      qr_code_auto: config.pix_auto || false,
      // Mapeamento: presencial -> dinheiro_cartao_presencial (compatibilidade)
      dinheiro_cartao_presencial: config.presencial ?? true,
      pix_qr_code_url: '',
      qtd_mensalidades_automaticas: config.qtd_mensalidades_automaticas || 12,
      // Campos adicionais para compatibilidade total
      pix_chave: config.chave_pix || '', // legado
      pix_manual: config.pix_manual, // para compatibilidade com outros serviços
      cobrar_matricula: config.cobrar_matricula || false,
      valor_matricula_padrao: config.valor_matricula_padrao || 0,
      contrato_modelo: config.contrato_modelo || '',
    }
  },

  async upsertConfig(config: any) {
    // Busca a config atual para preservar campos não enviados no payload 'any'
    const { data: current } = await (supabase.from('configuracoes_escola' as any) as any)
      .select('*')
      .eq('tenant_id', config.tenant_id)
      .is('vigencia_fim', null)
      .maybeSingle()

    // Mapeamento reverso: do formato legado/Componente para o formato JSONB interno
    const payload = {
      config_financeira: {
        ...(current?.config_financeira || {}),
        // Campos diretos (mesmo nome)
        dia_vencimento_padrao: config.dia_vencimento_padrao ?? current?.config_financeira?.dia_vencimento_padrao ?? 10,
        dias_carencia: config.dias_carencia ?? current?.config_financeira?.dias_carencia ?? 5,
        multa_atraso_perc: config.multa_atraso_percentual ?? current?.config_financeira?.multa_atraso_perc ?? 2,
        multa_fixa: config.multa_atraso_valor_fixo ?? current?.config_financeira?.multa_fixa ?? 0,
        juros_mora_mensal_perc: config.juros_mora_mensal ?? current?.config_financeira?.juros_mora_mensal_perc ?? 1,
        desconto_irmaos_perc: config.desconto_irmaos ?? current?.config_financeira?.desconto_irmaos_perc ?? 0,
        desconto_pontualidade: config.desconto_pontualidade ?? current?.config_financeira?.desconto_pontualidade ?? 0,
        // Mapeamento reverso: pix_habilitado -> pix_manual
        pix_manual: config.pix_habilitado !== undefined ? config.pix_habilitado : (current?.config_financeira?.pix_manual ?? false),
        chave_pix: config.chave_pix ?? current?.config_financeira?.chave_pix ?? '',
        nome_favorecido: config.nome_favorecido ?? current?.config_financeira?.nome_favorecido ?? '',
        // Mapeamento reverso: instrucoes_responsavel -> instrucoes_pix
        instrucoes_pix: config.instrucoes_responsavel ?? current?.config_financeira?.instrucoes_pix ?? '',
        // Mapeamento reverso: qr_code_auto -> pix_auto
        pix_auto: config.qr_code_auto !== undefined ? config.qr_code_auto : (current?.config_financeira?.pix_auto ?? false),
        // Mapeamento reverso: dinheiro_cartao_presencial -> presencial
        presencial: config.dinheiro_cartao_presencial !== undefined ? config.dinheiro_cartao_presencial : (current?.config_financeira?.presencial ?? true),
        // Campos adicionais
        qtd_mensalidades_automaticas: config.qtd_mensalidades_automaticas ?? current?.config_financeira?.qtd_mensalidades_automaticas ?? 12,
        cobrar_matricula: config.cobrar_matricula !== undefined ? config.cobrar_matricula : (current?.config_financeira?.cobrar_matricula ?? false),
        valor_matricula_padrao: config.valor_matricula_padrao ?? current?.config_financeira?.valor_matricula_padrao ?? 0,
        contrato_modelo: config.contrato_modelo ?? current?.config_financeira?.contrato_modelo ?? '',
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
  },

  // ==========================================
  // GATEWAYS DE PAGAMENTO (por escola)
  // ==========================================

  /**
   * Lista gateways disponíveis (apenas os ativos_global=true).
   */
  async getGatewaysDisponiveis(tenantId: string) {
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
   * IMPORTANTE: Os tokens devem ser enviados por HTTPS e serão
   * armazenados no banco. Em produção, considerar criptografia pgcrypto.
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
