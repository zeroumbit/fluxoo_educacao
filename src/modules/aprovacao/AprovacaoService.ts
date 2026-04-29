/**
 * Serviço de Workflow de Aprovações
 * 
 * Centraliza interações com a tabela aprovacoes_pendentes.
 */
import { supabase } from '@/lib/supabase'

export interface AprovacaoPendente {
  id: string
  created_at: string
  tipo_acao: string
  titulo: string
  descricao: string
  justificativa: string
  solicitante_id: string
  solicitante_role: string
  status: 'pendente' | 'aprovada' | 'rejeitada' | 'cancelada' | 'expirada'
  expires_at: string
  tenant_id: string
}

export const AprovacaoService = {
  /** Lista todas as aprovações pendentes do tenant atual */
  listarPendentes: async (): Promise<AprovacaoPendente[]> => {
    const { data, error } = await supabase
      .from('vw_aprovacoes_pendentes' as any)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as AprovacaoPendente[]
  },

  /** Aprovar ou Rejeitar uma solicitação (Apenas Gestor/Diretor do tenant) */
  decidir: async (aprovacaoId: string, decisao: 'aprovada' | 'rejeitada', motivo?: string): Promise<void> => {
    const { error } = await supabase.rpc('fn_decidir_aprovacao' as any, {
      p_aprovacao_id: aprovacaoId,
      p_decisao: decisao,
      p_motivo: motivo || null,
    } as any)

    if (error) throw new Error(error.message)
  }
}
