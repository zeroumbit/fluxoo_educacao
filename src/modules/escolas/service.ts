import { supabase } from '@/lib/supabase'
import type { EscolaInsert, EscolaUpdate } from '@/lib/database.types'

export const escolaService = {
  async listar() {
    const { data, error } = await supabase
      .from('escolas')
      .select('*, planos(nome, valor_por_aluno)')
      .order('razao_social')
    if (error) throw error
    return data
  },

  async buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('escolas')
      .select('*, planos(nome, valor_por_aluno), filiais(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async criar(escola: EscolaInsert) {
    const { data, error } = await supabase
      .from('escolas')
      .insert(escola as any)
      .select()
      .single()
    if (error) throw error
    return data as any
  },

  async atualizar(id: string, escola: EscolaUpdate) {
    const { data, error } = await supabase
      .from('escolas')
      .update(escola as any)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async listarPlanos() {
    const { data, error } = await supabase
      .from('planos' as any)
      .select('*, modulos:plano_modulo(modulo:modulos(id, nome, codigo))')
      .eq('status', true)
      .order('valor_por_aluno')
    if (error) throw error
    return data as any[]
  },

  async getConfiguracaoRecebimento() {
    const { data, error } = await supabase
      .from('configuracao_recebimento' as any)
      .select('*')
      .limit(1)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data as any
  },

  async criarAssinatura(assinatura: {
    tenant_id: string
    plano_id: string
    valor_por_aluno_contratado: number
    limite_alunos_contratado: number
    valor_total_contratado: number
    dia_vencimento: number
    status: string
    data_inicio: string
  }) {
    const { data, error } = await supabase
      .from('assinaturas' as any)
      .insert(assinatura as any)
      .select()
      .single()
    if (error) throw error
    return data as any
  },

  async criarFaturaInicial(fatura: {
    tenant_id: string
    assinatura_id: string
    competencia: string
    valor: number
    data_vencimento: string
    status: string
    forma_pagamento: string
    comprovante_url?: string
  }) {
    const { data, error } = await supabase
      .from('faturas' as any)
      .insert(fatura as any)
      .select()
      .single()
    if (error) throw error
    return data as any
  },

  async getNotificationCounts(tenantId: string) {
    const [evasaoRes, documentosRes] = await Promise.all([
      (supabase.from('vw_radar_evasao' as any) as any)
        .select('aluno_id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
      (supabase.from('document_solicitations' as any) as any)
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'pendente')
    ])

    const notifications = []
    if (evasaoRes.count && evasaoRes.count > 0) {
      notifications.push({ 
        id: 'evasao', 
        label: `${evasaoRes.count} Perigo de evasão`, 
        href: '/dashboard',
        category: 'ESCOLAS'
      })
    }
    if (documentosRes.count && documentosRes.count > 0) {
      notifications.push({ 
        id: 'documentos', 
        label: `${documentosRes.count} Pedidos de documentação`, 
        href: '/documentos',
        category: 'ESCOLAS'
      })
    }

    return {
      total: (evasaoRes.count || 0) + (documentosRes.count || 0),
      items: notifications
    }
  },
}
