import { supabase } from '@/lib/supabase'
import type { AgendaAula, AlertaProfessor, Pendencia, SaudeTurma } from './types'

export const professorService = {
  /**
   * Retorna a agenda de aulas do professor para hoje.
   * Fonte: vw_professor_agenda_hoje
   */
  async buscarAgendaHoje(professorId: string, tenantId: string): Promise<AgendaAula[]> {
    const { data, error } = await (supabase as any)
      .from('vw_professor_agenda_hoje')
      .select('*')
      .eq('professor_id', professorId)
      .eq('tenant_id', tenantId)
      .order('hora_inicio', { ascending: true })

    if (error) {
      console.error('[professorService] Erro ao buscar agenda:', error)
      return []
    }
    return (data as AgendaAula[]) || []
  },

  /**
   * Retorna pendências críticas (conteúdos e notas) dos últimos 15 dias.
   * Fonte: vw_professor_pendencias
   */
  async buscarPendencias(professorId: string, tenantId: string): Promise<Pendencia[]> {
    const { data, error } = await (supabase as any)
      .from('vw_professor_pendencias')
      .select('*')
      .eq('professor_id', professorId)
      .eq('tenant_id', tenantId)
      .order('data_referencia', { ascending: true }) // mais atrasado primeiro

    if (error) {
      console.error('[professorService] Erro ao buscar pendências:', error)
      return []
    }
    return (data as Pendencia[]) || []
  },

  /**
   * Retorna métricas de frequência e notas das turmas do professor.
   * Fonte: vw_professor_saude_turmas
   */
  async buscarSaudeTurmas(professorId: string, tenantId: string): Promise<SaudeTurma[]> {
    const { data, error } = await (supabase as any)
      .from('vw_professor_saude_turmas')
      .select('*')
      .eq('professor_id', professorId)
      .eq('tenant_id', tenantId)
      .order('turma_nome', { ascending: true })

    if (error) {
      console.error('[professorService] Erro ao buscar saúde das turmas:', error)
      return []
    }
    return (data as SaudeTurma[]) || []
  },

  /**
   * Retorna os alertas específicos para o cockpit do professor.
   * Filtra por alunos do professor + alertas operacionais dele mesmo.
   */
  async buscarAlertas(professorId: string, tenantId: string): Promise<AlertaProfessor[]> {
    const { data, error } = await (supabase as any)
      .from('vw_alertas_professor')
      .select('*')
      .eq('tenant_id', tenantId)
      // O RLS já filtra por professor_id = auth.uid(), mas reforçamos se necessário
      .eq('status', 'ativo')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[professorService] Erro ao buscar alertas:', error)
      return []
    }
    return (data as AlertaProfessor[]) || []
  },

  /**
   * Conclui um alerta específico chamando a RPC que registra auditoria.
   */
  async concluirAlerta(alertaId: string, observacao?: string): Promise<boolean> {
    const { error } = await (supabase as any).rpc('concluir_alerta_professor', {
      p_alerta_id: alertaId,
      p_observacao: observacao
    })

    if (error) {
      console.error('[professorService] Erro ao concluir alerta:', error)
      return false
    }
    return true
  },
}

/* 
  💡 SIMULAÇÃO DE LÓGICA DE GERAÇÃO DE ALERTAS (WORKER/CRON)
  Abaixo, exemplificação de como o backend geraria estes alertas:

  1. Diário Pendente (Operacional):
     - Roda todo dia às 18h.
     - Busca na vw_professor_agenda_hoje onde chamada_realizada IS FALSE.
     - INSERT INTO alertas_alunos (tenant_id, usuario_id, tipo, titulo, descricao, gravidade)
       VALUES (t.id, p.id, 'operacional_prof', 'Diário Pendente', 'Você não realizou a chamada para a turma X', 'alta');

  2. Queda de Rendimento (Pedagógico):
     - Roda após fechamento de bimestre/bimestre ou lançamento de notas.
     - Se média_atual < (media_anterior * 0.8):
     - INSERT INTO alertas_alunos (tenant_id, aluno_id, tipo, titulo, descricao, gravidade)
       VALUES (t.id, a.id, 'pedagogico', 'Queda de Rendimento', 'O aluno X reduziu a média em mais de 20%', 'critica');
*/
