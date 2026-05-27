import type { EscolaInsert,EscolaUpdate } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export const escolaService = {
  async listar() {
    const { data, error } = await supabase
      .from('escolas')
      .select('id, razao_social, cnpj, email_gestor, nome_gestor, telefone, status_assinatura, plano_id, created_at, planos(nome, valor_por_aluno)')
      .order('razao_social')
    if (error) throw error
    return data
  },

  async listarParaTransferencia() {
    const { data, error } = await (supabase.rpc('fn_listar_escolas_para_transferencia' as any) as any)
    if (error) throw error
    return (data as Array<{ id: string; razao_social: string | null }>) || []
  },

  async buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('escolas')
      .select('id, razao_social, cnpj, email_gestor, nome_gestor, cpf_gestor, telefone, cep, logradouro, numero, bairro, cidade, estado, status_assinatura, plano_id, planos(nome, valor_por_aluno), filiais(id, nome_unidade, cidade, estado, is_matriz)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async buscarDadosContratoPortal(id: string) {
    const { data, error } = await supabase
      .from('escolas')
      .select('id, razao_social, cnpj, logradouro, numero, bairro, cidade, estado, email_gestor, telefone')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async buscarResumoVinculadas(ids: string[]) {
    if (ids.length === 0) return []
    const { data, error } = await supabase
      .from('escolas')
      .select('id, razao_social, status_assinatura')
      .in('id', ids)
    if (error) throw error
    return data || []
  },

  async criar(escola: EscolaInsert) {
    const { data, error } = await supabase
      .from('escolas')
      .insert(escola)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async atualizar(id: string, escola: EscolaUpdate) {
    const { data, error } = await supabase
      .from('escolas')
      .update(escola)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async listarPlanos() {
    const { data, error } = await supabase
      .from('planos')
      .select('*, modulos:plano_modulo(modulo:modulos(id, nome, codigo))')
      .eq('status', true)
      .order('valor_por_aluno')
    if (error) throw error
    return data
  },

  async getConfiguracaoRecebimento() {
    const { data, error } = await supabase
      .from('configuracao_recebimento')
      .select('*')
      .limit(1)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
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
      .from('assinaturas')
      .insert(assinatura as any)
      .select()
      .single()
    if (error) throw error
    return data
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
      .from('faturas')
      .insert(fatura as any)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getNotificationCounts(tenantId: string) {
    const [evasaoRes, documentosRes] = await Promise.all([
      supabase.from('vw_radar_evasao')
        .select('aluno_id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
      supabase.from('document_solicitations')
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
