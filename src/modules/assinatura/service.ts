import { supabase } from '@/lib/supabase'
import type { SolicitacaoUpgradeInsert } from '@/lib/database.types'

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
      .from('escolas' as any)
      .select('limite_alunos_contratado')
      .eq('id', tenantId)
      .single()

    if (error) throw error
    return (data as any)?.limite_alunos_contratado || 0
  },

  async buscarSolicitacoes(tenantId: string) {
    const { data, error } = await supabase
      .from('solicitacoes_upgrade' as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as any[]
  },

  async criarSolicitacao(solicitacao: SolicitacaoUpgradeInsert) {
    const { data, error } = await supabase
      .from('solicitacoes_upgrade' as any)
      .insert(solicitacao as any)
      .select()
      .single()

    if (error) throw error
    return data as any
  }
}
