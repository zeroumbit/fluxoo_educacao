import { supabase } from '@/lib/supabase'

export const precificacaoService = {
  async getPrecoGlobal() {
    const { data, error } = await supabase
      .from('precos' as any)
      .select('*')
      .eq('tipo', 'global')
      .eq('ativo', true)
      .maybeSingle()
    if (error) throw error
    return data as any
  },

  async upsertPrecoGlobal(valores: { valor_matriz: number; valor_filial: number }) {
    const existente = await this.getPrecoGlobal()
    if (existente) {
      const { data, error } = await supabase
        .from('precos' as any)
        .update({ ...valores, updated_at: new Date().toISOString() })
        .eq('id', existente.id)
        .select()
        .single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase
      .from('precos' as any)
      .insert({ ...valores, tipo: 'global' })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getPrecoCliente(tenantId: string) {
    const { data, error } = await supabase
      .from('precos' as any)
      .select('*')
      .eq('tipo', 'cliente')
      .eq('tenant_id', tenantId)
      .eq('ativo', true)
      .maybeSingle()
    if (error) throw error
    return data as any
  },

  async upsertPrecoCliente(tenantId: string, valores: { valor_matriz: number; valor_filial: number }) {
    const existente = await this.getPrecoCliente(tenantId)
    if (existente) {
      const { data, error } = await supabase
        .from('precos' as any)
        .update({ ...valores, updated_at: new Date().toISOString() })
        .eq('id', existente.id)
        .select()
        .single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase
      .from('precos' as any)
      .insert({ ...valores, tipo: 'cliente', tenant_id: tenantId })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async removerPrecoCliente(tenantId: string) {
    const { error } = await supabase
      .from('precos' as any)
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('tipo', 'cliente')
      .eq('tenant_id', tenantId)
    if (error) throw error
  },

  async getPrecosModulos(tenantId?: string) {
    if (tenantId) {
      const { data, error } = await supabase
        .from('vw_preco_modulo_vigente' as any)
        .select('*')
        .eq('tenant_id', tenantId)
      if (error) throw error
      return data as any[]
    }
    const { data, error } = await supabase
      .from('precos_modulos' as any)
      .select('*, modulo:modulos(*)')
      .eq('tipo', 'global')
      .eq('ativo', true)
    if (error) throw error
    return data as any[]
  },

  async upsertPrecoModuloGlobal(moduloId: string, valores: { valor: number; trial_dias: number }) {
    const existente = await supabase
      .from('precos_modulos' as any)
      .select('id')
      .eq('tipo', 'global')
      .eq('modulo_id', moduloId)
      .eq('ativo', true)
      .maybeSingle()

    if (existente.data) {
      const { data, error } = await supabase
        .from('precos_modulos' as any)
        .update({ ...valores, updated_at: new Date().toISOString() })
        .eq('id', existente.data.id)
        .select()
        .single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase
      .from('precos_modulos' as any)
      .insert({ ...valores, tipo: 'global', modulo_id: moduloId })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async upsertPrecoModuloCliente(tenantId: string, moduloId: string, valores: { valor: number; trial_dias: number }) {
    const existente = await supabase
      .from('precos_modulos' as any)
      .select('id')
      .eq('tipo', 'cliente')
      .eq('tenant_id', tenantId)
      .eq('modulo_id', moduloId)
      .eq('ativo', true)
      .maybeSingle()

    if (existente.data) {
      const { data, error } = await supabase
        .from('precos_modulos' as any)
        .update({ ...valores, updated_at: new Date().toISOString() })
        .eq('id', existente.data.id)
        .select()
        .single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase
      .from('precos_modulos' as any)
      .insert({ ...valores, tipo: 'cliente', tenant_id: tenantId, modulo_id: moduloId })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getAssinaturaModulos(tenantId: string) {
    const { data, error } = await supabase
      .from('assinatura_modulos' as any)
      .select('*, modulo:modulos(*)')
      .eq('tenant_id', tenantId)
      .in('status', ['trial', 'ativo'])
    if (error) throw error
    return data as any[]
  },

  async ativarModulo(tenantId: string, moduloCodigo: string) {
    const { data, error } = await supabase.rpc('fn_ativar_modulo' as any, {
      p_tenant_id: tenantId,
      p_modulo_codigo: moduloCodigo,
    })
    if (error) throw error
    return data
  },

  async desativarModulo(assinaturaModuloId: string) {
    const { error } = await supabase
      .from('assinatura_modulos' as any)
      .update({ status: 'cancelado', data_cancelamento: new Date().toISOString().split('T')[0], updated_at: new Date().toISOString() })
      .eq('id', assinaturaModuloId)
    if (error) throw error
  },

  async calcularFatura(tenantId: string, diaVencimento?: number) {
    const { data, error } = await supabase.rpc('fn_calcular_fatura' as any, {
      p_tenant_id: tenantId,
      p_dia_vencimento: diaVencimento || 5,
    })
    if (error) throw error
    return data as any
  },

  async getPrecoVigente(tenantId: string) {
    const { data, error } = await supabase
      .from('vw_preco_vigente' as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle()
    if (error) throw error
    return data as any
  },

  async getFaturaItens(faturaId: string) {
    const { data, error } = await supabase
      .from('fatura_itens' as any)
      .select('*')
      .eq('fatura_id', faturaId)
      .order('created_at' as any, { ascending: true })
    if (error) throw error
    return data as any[]
  },

  async recalcularFatura(faturaId: string) {
    const { data, error } = await supabase.rpc('fn_recalcular_fatura' as any, {
      p_fatura_id: faturaId,
    })
    if (error) throw error
    return data
  },

  async getAlunosPorFilial(tenantId: string) {
    const { data, error } = await supabase
      .from('vw_alunos_por_filial' as any)
      .select('*')
      .eq('tenant_id', tenantId)
    if (error) throw error
    return data as any[]
  },

  async getModulosDisponiveis() {
    const { data, error } = await supabase
      .from('modulos' as any)
      .select('*')
      .order('nome')
    if (error) throw error
    return data as any[]
  },
}
