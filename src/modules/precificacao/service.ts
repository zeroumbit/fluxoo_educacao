import type {
  AlunosPorFilial,
  AssinaturaModulo,
  AssinaturaModuloUpdate,
  FaturaItem,
  Modulo,
  Preco,
  PrecoInsert,
  PrecoModulo,
  PrecoModuloInsert,
  PrecoModuloUpdate,
  PrecoModuloVigente,
  PrecoUpdate,
  PrecoVigente,
} from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import type { PostgrestError } from '@supabase/supabase-js'

type QueryResult<T> = { data: T | null; error: PostgrestError | null }

type QueryBuilder<T> = PromiseLike<QueryResult<T[]>> & {
  select(columns: string): QueryBuilder<T>
  eq(column: string, value: unknown): QueryBuilder<T>
  in(column: string, values: unknown[]): QueryBuilder<T>
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T>
  update(values: Partial<T>): QueryBuilder<T>
  insert(values: Partial<T> | Partial<T>[]): QueryBuilder<T>
  maybeSingle(): Promise<QueryResult<T | null>>
  single(): Promise<QueryResult<T>>
}

type PrecificacaoClient = {
  from(table: 'precos'): QueryBuilder<Preco>
  from(table: 'precos_modulos'): QueryBuilder<PrecoModulo & { modulo?: Modulo | null }>
  from(table: 'vw_preco_modulo_vigente'): QueryBuilder<PrecoModuloVigente>
  from(table: 'assinatura_modulos'): QueryBuilder<AssinaturaModulo & { modulo?: Modulo | null }>
  from(table: 'vw_preco_vigente'): QueryBuilder<PrecoVigente>
  from(table: 'fatura_itens'): QueryBuilder<FaturaItem>
  from(table: 'vw_alunos_por_filial'): QueryBuilder<AlunosPorFilial>
  rpc(fn: 'fn_ativar_modulo', args: { p_tenant_id: string; p_modulo_codigo: string }): Promise<QueryResult<string>>
  rpc(fn: 'fn_calcular_fatura', args: { p_tenant_id: string; p_dia_vencimento: number }): Promise<QueryResult<{ tenant_id: string; valor_total: number; itens: unknown }>>
  rpc(fn: 'fn_recalcular_fatura', args: { p_fatura_id: string }): Promise<QueryResult<number>>
}

const precificacaoClient = supabase as unknown as PrecificacaoClient

type ValoresPrecoBase = Pick<Preco, 'valor_matriz' | 'valor_filial'>
type ValoresPrecoModulo = Pick<PrecoModulo, 'valor' | 'trial_dias'>

export const precificacaoService = {
  async getPrecoGlobal() {
    const { data, error } = await precificacaoClient
      .from('precos')
      .select('*')
      .eq('tipo', 'global')
      .eq('ativo', true)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async upsertPrecoGlobal(valores: ValoresPrecoBase) {
    const existente = await this.getPrecoGlobal()
    if (existente) {
      const updatePayload: PrecoUpdate = { ...valores, updated_at: new Date().toISOString() }
      const { data, error } = await precificacaoClient
        .from('precos')
        .update(updatePayload)
        .eq('id', existente.id)
        .select('*')
        .single()
      if (error) throw error
      return data
    }

    const insertPayload: PrecoInsert = { ...valores, tipo: 'global' }
    const { data, error } = await precificacaoClient
      .from('precos')
      .insert(insertPayload)
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async getPrecoCliente(tenantId: string) {
    const { data, error } = await precificacaoClient
      .from('precos')
      .select('*')
      .eq('tipo', 'cliente')
      .eq('tenant_id', tenantId)
      .eq('ativo', true)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async upsertPrecoCliente(tenantId: string, valores: ValoresPrecoBase) {
    const existente = await this.getPrecoCliente(tenantId)
    if (existente) {
      const updatePayload: PrecoUpdate = { ...valores, updated_at: new Date().toISOString() }
      const { data, error } = await precificacaoClient
        .from('precos')
        .update(updatePayload)
        .eq('id', existente.id)
        .select('*')
        .single()
      if (error) throw error
      return data
    }

    const insertPayload: PrecoInsert = { ...valores, tipo: 'cliente', tenant_id: tenantId }
    const { data, error } = await precificacaoClient
      .from('precos')
      .insert(insertPayload)
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async removerPrecoCliente(tenantId: string) {
    const updatePayload: PrecoUpdate = { ativo: false, updated_at: new Date().toISOString() }
    const { error } = await precificacaoClient
      .from('precos')
      .update(updatePayload)
      .eq('tipo', 'cliente')
      .eq('tenant_id', tenantId)
    if (error) throw error
  },

  async getPrecosModulos(tenantId?: string) {
    if (tenantId) {
      const { data, error } = await precificacaoClient
        .from('vw_preco_modulo_vigente')
        .select('*')
        .eq('tenant_id', tenantId)
      if (error) throw error
      return data || []
    }

    const { data, error } = await precificacaoClient
      .from('precos_modulos')
      .select('*, modulo:modulos(*)')
      .eq('tipo', 'global')
      .eq('ativo', true)
    if (error) throw error
    return data || []
  },

  async upsertPrecoModuloGlobal(moduloId: string, valores: ValoresPrecoModulo) {
    const existente = await precificacaoClient
      .from('precos_modulos')
      .select('id')
      .eq('tipo', 'global')
      .eq('modulo_id', moduloId)
      .eq('ativo', true)
      .maybeSingle()

    if (existente.data) {
      const updatePayload: PrecoModuloUpdate = { ...valores, updated_at: new Date().toISOString() }
      const { data, error } = await precificacaoClient
        .from('precos_modulos')
        .update(updatePayload)
        .eq('id', existente.data.id)
        .select('*')
        .single()
      if (error) throw error
      return data
    }

    const insertPayload: PrecoModuloInsert = { ...valores, tipo: 'global', modulo_id: moduloId }
    const { data, error } = await precificacaoClient
      .from('precos_modulos')
      .insert(insertPayload)
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async upsertPrecoModuloCliente(tenantId: string, moduloId: string, valores: ValoresPrecoModulo) {
    const existente = await precificacaoClient
      .from('precos_modulos')
      .select('id')
      .eq('tipo', 'cliente')
      .eq('tenant_id', tenantId)
      .eq('modulo_id', moduloId)
      .eq('ativo', true)
      .maybeSingle()

    if (existente.data) {
      const updatePayload: PrecoModuloUpdate = { ...valores, updated_at: new Date().toISOString() }
      const { data, error } = await precificacaoClient
        .from('precos_modulos')
        .update(updatePayload)
        .eq('id', existente.data.id)
        .select('*')
        .single()
      if (error) throw error
      return data
    }

    const insertPayload: PrecoModuloInsert = { ...valores, tipo: 'cliente', tenant_id: tenantId, modulo_id: moduloId }
    const { data, error } = await precificacaoClient
      .from('precos_modulos')
      .insert(insertPayload)
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async getAssinaturaModulos(tenantId: string) {
    const { data, error } = await precificacaoClient
      .from('assinatura_modulos')
      .select('*, modulo:modulos(*)')
      .eq('tenant_id', tenantId)
      .in('status', ['trial', 'ativo'])
    if (error) throw error
    return data || []
  },

  async ativarModulo(tenantId: string, moduloCodigo: string) {
    const { data, error } = await precificacaoClient.rpc('fn_ativar_modulo', {
      p_tenant_id: tenantId,
      p_modulo_codigo: moduloCodigo,
    })
    if (error) throw error
    return data
  },

  async desativarModulo(assinaturaModuloId: string) {
    const updatePayload: AssinaturaModuloUpdate = {
      status: 'cancelado',
      data_cancelamento: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    }
    const { error } = await precificacaoClient
      .from('assinatura_modulos')
      .update(updatePayload)
      .eq('id', assinaturaModuloId)
    if (error) throw error
  },

  async calcularFatura(tenantId: string, diaVencimento?: number) {
    const { data, error } = await precificacaoClient.rpc('fn_calcular_fatura', {
      p_tenant_id: tenantId,
      p_dia_vencimento: diaVencimento || 5,
    })
    if (error) throw error
    return data
  },

  async getPrecoVigente(tenantId: string) {
    const { data, error } = await precificacaoClient
      .from('vw_preco_vigente')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async getFaturaItens(faturaId: string) {
    const { data, error } = await precificacaoClient
      .from('fatura_itens')
      .select('*')
      .eq('fatura_id', faturaId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  },

  async recalcularFatura(faturaId: string) {
    const { data, error } = await precificacaoClient.rpc('fn_recalcular_fatura', {
      p_fatura_id: faturaId,
    })
    if (error) throw error
    return data
  },

  async getAlunosPorFilial(tenantId: string) {
    const { data, error } = await precificacaoClient
      .from('vw_alunos_por_filial')
      .select('*')
      .eq('tenant_id', tenantId)
    if (error) throw error
    return data || []
  },

  async getModulosDisponiveis() {
    const { data, error } = await supabase
      .from('modulos')
      .select('*')
      .order('nome')
    if (error) throw error
    return data || []
  },
}
