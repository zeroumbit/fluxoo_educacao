import { supabase } from '@/lib/supabase'
import type { AgendaAula, Pendencia, SaudeTurma } from './types'

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
}
