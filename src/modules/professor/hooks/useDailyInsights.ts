import { useMemo } from 'react';
import type { DailyInsight, InsightType } from '../components/SmartAssistant';
import { useNavigate } from 'react-router-dom';
import { useAgendaDiaria, usePendenciasProfessor, useAlertasProfessor } from '@/modules/professor/hooks';

/**
 * Hook que fornece insights 100% reais para o Smart Assistant.
 * Utiliza dados das views do Supabase: vw_professor_agenda_hoje, vw_professor_pendencias e vw_alertas_professor.
 */
export function useDailyInsights() {
  const navigate = useNavigate();
  const { data: agenda, isLoading: isLoadingAgenda } = useAgendaDiaria();
  const { data: pendencias, isLoading: isLoadingPendencias } = usePendenciasProfessor();
  const { data: alertas, isLoading: isLoadingAlertas } = useAlertasProfessor();

  const isLoading = isLoadingAgenda || isLoadingPendencias || isLoadingAlertas;

  const insights = useMemo(() => {
    const list: DailyInsight[] = [];

    // 1. Processar Pendências Críticas (Prioridade Máxima)
    if (pendencias && pendencias.length > 0) {
      pendencias.forEach((p: any, index) => {
        // Limitar a quantidade se houver muitas pendências
        if (index > 2) return;
        
        list.push({
          id: `pend-${p.grade_id}-${p.data_referencia}-${index}`,
          type: 'urgent',
          title: `Pendência: ${p.tipo_pendencia === 'conteúdo' ? 'Plano de Aula' : 'Frequência'}`,
          description: `O registro de ${p.tipo_pendencia} da turma ${p.turma_nome} (${p.disciplina_nome || ''}) referente ao dia ${p.data_referencia} está pendente.`,
          actionLabel: 'Regularizar Agora',
          actionCallback: () => navigate(p.tipo_pendencia === 'conteúdo' ? '/professores/planos' : '/professores/frequencia')
        });
      });
    }

    // 2. Processar Alertas Genuínos do Banco (Alertas Pedagógicos ou de Sistema)
    if (alertas && alertas.length > 0) {
      alertas.forEach((alerta: any) => {
        let insightType: InsightType = 'update';
        if (alerta.gravidade === 'critica' || alerta.gravidade === 'alta') insightType = 'pedagogic-alert';
        else if (alerta.gravidade === 'baixa') insightType = 'positive';

        list.push({
          id: `alerta-${alerta.id}`,
          type: insightType,
          title: alerta.titulo || 'Alerta Pedagógico',
          description: alerta.descricao,
          actionLabel: alerta.aluno_id ? 'Ver Aluno' : 'Mais Detalhes',
          messageTemplate: alerta.gravidade === 'critica' || alerta.gravidade === 'alta' ? 'alerta' : 'elogio',
          alunoId: alerta.aluno_id,
          actionCallback: () => {
            if (alerta.aluno_id) navigate(`/alunos/${alerta.aluno_id}`);
          }
        });
      });
    }

    // 3. Processar Agenda (Dicas de BNCC e Aulas Diárias)
    if (agenda && agenda.length > 0) {
      const pendingHoje = agenda.filter((a: any) => !a.chamada_realizada || !a.conteudo_registrado);
      const doneHoje = agenda.filter((a: any) => a.chamada_realizada && a.conteudo_registrado);
      
      if (pendingHoje.length > 0) {
        list.push({
          id: `agenda-lembrete`,
          type: 'update',
          title: `Suas Aulas Hoje: ${pendingHoje.length} Turmas`,
          description: `Você tem ${pendingHoje.length} turmas com registros (frequência ou diário) pendentes na agenda de hoje.`,
          actionLabel: 'Ver Agenda',
          actionCallback: () => navigate('/professores/agenda')
        });
      }

      if (doneHoje.length > 0 && pendingHoje.length === 0) {
        list.push({
          id: `agenda-success`,
          type: 'positive',
          title: 'Dia Organizado!',
          description: 'A matriz de registros das suas aulas de hoje já está 100% concluída. Excelente trabalho, professor!',
        });
      }
    }

    // Fallback de positividade se não houver NENHUM insight ativo
    if (list.length === 0) {
      list.push({
        id: 'no-issues',
        type: 'positive',
        title: 'Tudo verde!',
        description: 'Não há pendências de diário de classe ou alertas pedagógicos críticos identificados no sistema hoje.'
      });
    }

    return list;
  }, [agenda, pendencias, alertas, navigate]);

  return { insights, isLoading };
}
