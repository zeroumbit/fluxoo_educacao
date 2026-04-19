import { supabase } from '@/lib/supabase'
import type { AlertasTratamentoInsert, AlertasHistoricoInsert } from '@/lib/database.types'

export interface AlertaStatusUpdate {
  aluno_id: string
  novo_status: 'ativo' | 'tratado' | 'arquivado'
  observacao?: string
}

/**
 * Service para gerenciar status de alertas no banco de dados.
 * Substitui o localStorage por persistência server-side.
 */
export const alertasService = {
  /**
   * Busca todos os status de alerta de um tenant
   */
  async getAlertasStatus(tenantId: string): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from('alertas_tratamento')
      .select('aluno_id, status')
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('Erro ao buscar alertas:', error)
      return {}
    }

    // Converte array para Record<aluno_id, status>
    return data.reduce<Record<string, string>>((acc, item) => {
      acc[item.aluno_id] = item.status
      return acc
    }, {})
  },

  /**
   * Atualiza o status de um alerta
   */
  async updateAlertaStatus(
    tenantId: string,
    usuarioId: string,
    usuarioNome: string,
    update: AlertaStatusUpdate
  ): Promise<void> {
    // 1. Busca status anterior para o histórico
    const { data: existente } = await supabase
      .from('alertas_tratamento')
      .select('status')
      .eq('tenant_id', tenantId)
      .eq('aluno_id', update.aluno_id)
      .eq('usuario_id', usuarioId)
      .maybeSingle()

    const statusAnterior = existente?.status || null

    // 2. Upsert do status atual
    const { error: upsertError } = await supabase
      .from('alertas_tratamento')
      .upsert({
        tenant_id: tenantId,
        aluno_id: update.aluno_id,
        usuario_id: usuarioId,
        status: update.novo_status,
        observacao: update.observacao || null,
      }, {
        onConflict: 'tenant_id,aluno_id,usuario_id'
      })

    if (upsertError) {
      console.error('Erro ao atualizar alerta:', upsertError)
      throw upsertError
    }

    // 3. Registra no histórico
    const historicoInsert: Omit<AlertasHistoricoInsert, 'id' | 'data_acao'> = {
      tenant_id: tenantId,
      alerta_id: update.aluno_id,
      aluno_nome: update.aluno_id.substring(0, 8), // Será preenchido pelo contexto
      status_anterior: statusAnterior,
      status_novo: update.novo_status,
      observacao: update.observacao || null,
      usuario_id: usuarioId,
      usuario_nome: usuarioNome,
    }

    const { error: histError } = await supabase
      .from('alertas_historico')
      .insert(historicoInsert as any)

    if (histError) {
      console.error('Erro ao registrar histórico:', histError)
      // Não lança erro para não quebrar o fluxo principal
    }
  },

  /**
   * Busca o histórico de ações de um tenant
   */
  async getHistorico(tenantId: string, limit = 50) {
    const { data, error } = await supabase
      .from('alertas_historico')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('data_acao', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Erro ao buscar histórico:', error)
      return []
    }

    return data || []
  },

  /**
   * Migra dados do localStorage para o banco (executar uma vez)
   */
  async migrarLocalStorageParaDB(
    tenantId: string,
    statusLocal: Record<string, string>,
    historicoLocal: any[],
    usuarioId: string,
    _usuarioNome: string
  ): Promise<void> {
    // Migra status
    const inserts: AlertasTratamentoInsert[] = Object.entries(statusLocal).map(([alunoId, status]) => ({
      tenant_id: tenantId,
      aluno_id: alunoId,
      usuario_id: usuarioId,
      status: status as any,
    }))

    if (inserts.length > 0) {
      const { error } = await supabase
        .from('alertas_tratamento')
        .insert(inserts as any)

      if (error) {
        console.error('Erro na migração de status:', error)
      }
    }

    // Migra histórico
    const histInserts: AlertasHistoricoInsert[] = historicoLocal.map((item: any) => ({
      tenant_id: tenantId,
      alerta_id: item.alertaId,
      aluno_nome: item.alunoNome,
      status_anterior: null,
      status_novo: item.acao,
      usuario_id: usuarioId,
      usuario_nome: item.usuario,
      data_acao: item.data,
    }))

    if (histInserts.length > 0) {
      const { error } = await supabase
        .from('alertas_historico')
        .insert(histInserts as any)

      if (error) {
        console.error('Erro na migração de histórico:', error)
      }
    }
  }
}
