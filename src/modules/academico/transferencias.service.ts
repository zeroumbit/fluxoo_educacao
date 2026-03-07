import { supabase } from '@/lib/supabase'

export type TransferenciaStatus = 
  | 'pendente_pais'
  | 'pendente_destino'
  | 'pendente_origem'
  | 'recusada'
  | 'cancelada'
  | 'concluida'

export type TipoSolicitante = 'pais' | 'escola_destino' | 'escola_origem'

export interface Transferencia {
  id: string
  aluno_id: string
  origem_tenant_id: string
  destino_tenant_id: string
  solicitante_tipo: TipoSolicitante
  status: TransferenciaStatus
  aprovacao_responsavel: boolean
  aprovacao_escola_destino: boolean
  token_transferencia?: string
  motivo_solicitacao?: string
  observacoes_recusa?: string
  data_solicitacao: string
  data_conclusao?: string
  created_at: string
  updated_at: string
  // Virtual joins
  aluno?: { nome_completo: string; cpf: string }
  escola_origem?: { nome: string }
  escola_destino?: { nome: string }
}

export const transferenciasService = {
  // ESCOLA (Administrativo)
  async solicitar(alunoId: string, origemId: string, destinoId: string, motivo: string) {
    const { data, error } = await (supabase.from('transferencias' as any) as any)
      .insert({
        aluno_id: alunoId,
        origem_tenant_id: origemId,
        destino_tenant_id: destinoId,
        solicitante_tipo: 'escola_destino',
        status: 'pendente_pais',
        motivo_solicitacao: motivo
      })
      .select()
      .single()

    if (error) throw error
    return data as Transferencia
  },

  async listarPorEscola(tenantId: string) {
    const { data, error } = await (supabase.from('vw_notificacoes_transferencia' as any) as any)
      .select('*')
      .or(`origem_id.eq.${tenantId},destino_id.eq.${tenantId}`)
      .order('data_solicitacao', { ascending: false })

    if (error) throw error
    return data as any[]
  },

  // PORTAL (Responsável)
  async listarPorResponsavel(alunoIds: string[]) {
    if (!alunoIds.length) return []
    const { data, error } = await (supabase.from('transferencias' as any) as any)
      .select('*, escola_origem:escolas!origem_tenant_id(razao_social), escola_destino:escolas!destino_tenant_id(razao_social), aluno:alunos(nome_completo)')
      .in('aluno_id', alunoIds)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as any[]
  },

  async responderResponsavel(id: string, aprovado: boolean, motivoRecusa?: string) {
    const updates: any = {
      aprovacao_responsavel: aprovado,
      status: aprovado ? 'pendente_origem' : 'recusada',
      updated_at: new Date().toISOString()
    }
    if (!aprovado) updates.observacoes_recusa = motivoRecusa

    const { data, error } = await (supabase.from('transferencias' as any) as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // COMPLIANCE
  async checkPermissaoEscola(tenantId: string) {
    const { data, error } = await supabase
      .from('escolas')
      .select('permissao_solicitacao_ativa, reputacao_rede')
      .eq('id', tenantId)
      .single()

    if (error) throw error
    return data as unknown as { permissao_solicitacao_ativa: boolean; reputacao_rede: number }
  }
}
