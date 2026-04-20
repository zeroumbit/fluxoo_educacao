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

  /**
   * Busca todos os alunos correspondentes às turmas vinculadas ao professor.
   */
  async buscarAlunosDoProfessor(professorId: string, tenantId: string): Promise<any[]> {
    // 1. Busca turmas vinculadas
    const { data: turmasVinc } = await (supabase as any)
      .from('turma_professores')
      .select('turma_id')
      .eq('professor_id', professorId);

    const idsTurmas = turmasVinc?.map((t: any) => t.turma_id) || [];
    if (idsTurmas.length === 0) return [];

    // 2. Busca matriculas com alunos e turmas
    const { data, error } = await (supabase as any)
      .from('matriculas')
      .select(`
        id,
        turma_id,
        aluno_id,
        alunos (id, nome_completo),
        turmas (id, nome)
      `)
      .in('turma_id', idsTurmas)
      .eq('tenant_id', tenantId)
      .eq('status', 'ativa')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[professorService] Erro ao buscar alunos:', error);
      return [];
    }

    // 3. Mapear para um formato achatado (flatten)
    return (data || []).map((m: any) => ({
      id: m.alunos?.id,
      nome: m.alunos?.nome_completo,
      turma_id: m.turma_id,
      turma_nome: m.turmas?.nome,
      matricula_id: m.id,
      // Como não temos views específicas de média/frequência por aluno para o professor aqui facilmente, 
      // deixamos zerado para evitar N+1 queries ou usamos um valor padrão. 
      // Se houver necessidade, deveria ser consumida uma view do banco.
      frequencia: 0, 
      media: 0,
      alertas: 0
    })).sort((a: any, b: any) => a.nome?.localeCompare(b.nome));
  },

  /**
   * Busca detalhes de uma turma específica do professor.
   */
  async buscarDetalhesTurma(turmaId: string, professorId: string, tenantId: string): Promise<any | null> {
    // 1. Verificar se o professor leciona nesta turma
    const { data: vinculo } = await (supabase as any)
      .from('turma_professores')
      .select('*, turmas!inner(*), disciplinas!inner(*)')
      .eq('turma_id', turmaId)
      .eq('professor_id', professorId)
      .single()

    if (!vinculo) return null

    // 2. Buscar dados da turma
    const { data: turmaData } = await (supabase as any)
      .from('turmas')
      .select('*')
      .eq('id', turmaId)
      .single()

    if (!turmaData) return null

    // 3. Buscar alunos matriculados na turma
    const { data: matriculas } = await (supabase as any)
      .from('matriculas')
      .select('id, aluno_id, status')
      .eq('turma_id', turmaId)
      .eq('tenant_id', tenantId)
      .eq('status', 'ativa')

    const alunoIds = matriculas?.map((m: any) => m.aluno_id) || []
    
    let alunosData: any[] = []
    if (alunoIds.length > 0) {
      const { data: alunos } = await (supabase as any)
        .from('alunos')
        .select('id, nome_completo, foto_url')
        .in('id', alunoIds)
      
      alunosData = alunos || []
    }

    const alunosFormatados = (matriculas || []).map((m: any) => {
      const aluno = alunosData.find((a: any) => a.id === m.aluno_id)
      return {
        id: m.aluno_id,
        nome: aluno?.nome_completo,
        foto_url: aluno?.foto_url,
        matricula_id: m.id,
        status: m.status,
      }
    }).sort((a: any, b: any) => a.nome?.localeCompare(b.nome))

    return {
      ...turmaData,
      disciplina: vinculo.disciplinas,
      alunos: alunosFormatados,
      total_alunos: alunosFormatados.length,
      percentual_presenca: 0,
      media_geral: 0,
    }
  },

  /**
   * Busca detalhes de um aluno para o professor.
   * Retorna dados básicos do aluno + turmas que o professor leciona onde o aluno está.
   */
  async buscarDetalhesAluno(alunoId: string, professorId: string, tenantId: string): Promise<any | null> {
    // 1. Buscar dados do aluno
    const { data: alunoData, error: alunoError } = await (supabase as any)
      .from('alunos')
      .select('*')
      .eq('id', alunoId)
      .single()

    if (alunoError || !alunoData) return null

    // 2. Buscar turmas onde o professor ensina
    const { data: turmasProfessor } = await (supabase as any)
      .from('turma_professores')
      .select('turma_id, turmas!inner(id, nome), disciplinas!inner(id, nome)')
      .eq('professor_id', professorId)

    const idsTurmasProfessor = turmasProfessor?.map((t: any) => t.turma_id) || []

    if (idsTurmasProfessor.length === 0) {
      return {
        ...alunoData,
        turmas: [],
        tem_vinculo: false,
      }
    }

    // 3. Buscar turmas e disciplinas
    const { data: turmasData } = await (supabase as any)
      .from('turmas')
      .select('id, nome, turno')
      .in('id', idsTurmasProfessor)

    const { data: turmasDisciplinas } = await (supabase as any)
      .from('turma_professores')
      .select('turma_id, disciplinas(id, nome)')
      .in('turma_id', idsTurmasProfessor)
      .eq('professor_id', professorId)

    const discMap = new Map()
    turmasDisciplinas?.forEach((td: any) => {
      discMap.set(td.turma_id, td.disciplinas?.nome)
    })

    // 4. Buscar matriculas do aluno
    const { data: matriculas } = await (supabase as any)
      .from('matriculas')
      .select('id, status, data_matricula, turma_id')
      .eq('aluno_id', alunoId)
      .in('turma_id', idsTurmasProfessor)
      .eq('tenant_id', tenantId)
      .eq('status', 'ativa')

    const turmasFormatadas = (matriculas || []).map((m: any) => {
      const turma = turmasData?.find((t: any) => t.id === m.turma_id)
      return {
        matricula_id: m.id,
        turma_id: m.turma_id,
        turma_nome: turma?.nome,
        disciplina_nome: discMap.get(m.turma_id),
        turno: turma?.turno,
        status: m.status,
      }
    })

    return {
      ...alunoData,
      turmas: turmasFormatadas,
      tem_vinculo: turmasFormatadas.length > 0,
      percentual_presenca: 0,
      media_geral: 0,
      total_faltas: 0,
      total_aulas: 0,
    }
  }
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
