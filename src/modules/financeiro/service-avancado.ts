import { supabase } from '@/lib/supabase'

export const financeiroAvancadoService = {
  // CONFIG FINANCEIRA
  async getConfig(tenantId: string) {
    const { data, error } = await (supabase.from('config_financeira' as any) as any)
      .select('*').eq('tenant_id', tenantId).maybeSingle()
    if (error) throw error
    return data
  },
  async upsertConfig(config: any) {
    const { data, error } = await (supabase.from('config_financeira' as any) as any)
      .upsert({ ...config, updated_at: new Date().toISOString() }).select().single()
    if (error) throw error
    return data
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
}
