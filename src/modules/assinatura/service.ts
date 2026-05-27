import type { SolicitacaoUpgradeInsert } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export const assinaturaService = {
  async buscarEscola(tenantId: string) {
    const { data, error } = await supabase
      .from('escolas')
      .select('*, plano:planos(id, nome, valor_por_aluno, descricao_curta)')
      .eq('id', tenantId)
      .single()

    if (error) throw error
    return data
  },

  async buscarPlanos() {
    const { data, error } = await supabase
      .from('planos')
      .select('*')
      .order('valor_por_aluno', { ascending: true })

    if (error) throw error
    return data
  },

  async buscarAssinaturaAtiva(tenantId: string) {
    const { data, error } = await supabase
      .from('assinaturas')
      .select('*, plano:planos(*)')
      .eq('tenant_id', tenantId)
      .eq('status', 'ativa')
      .maybeSingle()

    if (error) throw error
    return data
  },

  async buscarLimiteAlunos(tenantId: string) {
    const { data, error } = await supabase
      .from('escolas')
      .select('limite_alunos_contratado')
      .eq('id', tenantId)
      .single()

    if (error) throw error
    return data?.limite_alunos_contratado || 0
  },

  async buscarSolicitacoes(tenantId: string) {
    const { data, error } = await supabase
      .from('solicitacoes_upgrade')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async criarSolicitacao(solicitacao: SolicitacaoUpgradeInsert) {
    const { data, error } = await supabase
      .from('solicitacoes_upgrade')
      .insert(solicitacao)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
