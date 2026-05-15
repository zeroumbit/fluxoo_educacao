import {
useAgendaDiaria,
useAlertasProfessor,
usePendenciasProfessor,
useSaudeTurmas,
} from '@/modules/professor/hooks'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AssistantSummary,DailyInsight,InsightType } from '../components/SmartAssistant'

function normalize(value?: string | null) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function formatShortDate(value?: string | null) {
  if (!value) return 'data nao informada'

  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    })
  } catch {
    return value
  }
}

function buildProfessorFrequencyPath(aula: any) {
  const params = new URLSearchParams()
  if (aula?.turma_id) params.set('turma', aula.turma_id)
  if (aula?.data_aula) params.set('data', aula.data_aula)

  const query = params.toString()
  return `/professores/frequencia${query ? `?${query}` : ''}`
}

function getAlertType(alerta: any): InsightType {
  if (alerta.gravidade === 'critica' || alerta.gravidade === 'alta') return 'pedagogic-alert'
  if (alerta.gravidade === 'baixa') return 'positive'
  return 'update'
}

/**
 * Consolida dados reais permitidos ao professor pelas views/RLS atuais.
 * Nao cria privilegios novos nem consulta dados fora do contexto do docente.
 */
export function useDailyInsights() {
  const navigate = useNavigate()
  const { data: agenda = [], isLoading: isLoadingAgenda } = useAgendaDiaria()
  const { data: pendencias = [], isLoading: isLoadingPendencias } = usePendenciasProfessor()
  const { data: alertas = [], isLoading: isLoadingAlertas } = useAlertasProfessor()
  const { data: saudeTurmas = [], isLoading: isLoadingSaude } = useSaudeTurmas()

  const isLoading = isLoadingAgenda || isLoadingPendencias || isLoadingAlertas || isLoadingSaude

  const summary = useMemo<AssistantSummary>(() => {
    const chamadasPendentes = agenda.filter((a: any) => !a.chamada_realizada).length
    const diariosPendentes = agenda.filter((a: any) => !a.conteudo_registrado).length
    const turmasAtencao = saudeTurmas.filter((turma: any) =>
      Number(turma.percentual_presenca || 100) < 75 || Number(turma.media_geral || 10) < 6
    ).length

    const proxima = [...agenda]
      .sort((a: any, b: any) => String(a.hora_inicio || '').localeCompare(String(b.hora_inicio || '')))
      .find((a: any) => !a.chamada_realizada || !a.conteudo_registrado) || agenda[0]

    return {
      aulasHoje: agenda.length,
      chamadasPendentes,
      diariosPendentes,
      alertasAtivos: alertas.length,
      turmasAtencao,
      proximaAula: proxima ? {
        turma: proxima.turma_nome,
        disciplina: proxima.disciplina_nome,
        horario: proxima.hora_inicio?.substring(0, 5),
      } : undefined,
    }
  }, [agenda, alertas.length, saudeTurmas])

  const insights = useMemo(() => {
    const list: DailyInsight[] = []
    const agendaPendente = agenda.filter((a: any) => !a.chamada_realizada || !a.conteudo_registrado)
    const primeiraAulaPendente = agendaPendente[0]

    if (primeiraAulaPendente) {
      const precisaChamada = !primeiraAulaPendente.chamada_realizada
      list.push({
        id: `modo-aula-${primeiraAulaPendente.grade_id || primeiraAulaPendente.turma_id}`,
        type: 'urgent',
        group: 'now',
        title: precisaChamada ? 'Modo aula: chamada pendente' : 'Modo aula: diario pendente',
        description: `${primeiraAulaPendente.disciplina_nome} - ${primeiraAulaPendente.turma_nome}. Complete o registro da aula sem sair do fluxo do professor.`,
        actionLabel: precisaChamada ? 'Fazer chamada' : 'Registrar diario',
        actionCallback: () => navigate(precisaChamada ? buildProfessorFrequencyPath(primeiraAulaPendente) : '/professores/planos-aula'),
        secondaryActionLabel: 'Ver agenda',
        secondaryActionCallback: () => navigate('/professores/agenda'),
      })
    }

    if (pendencias.length > 0) {
      pendencias.slice(0, 4).forEach((p: any, index) => {
        const tipo = normalize(p.tipo_pendencia)
        const isConteudo = tipo.includes('conteudo') || tipo.includes('plano')
        const isNota = tipo.includes('nota')

        list.push({
          id: `pend-${p.grade_id || p.turma_id || index}-${p.data_referencia || index}`,
          type: 'urgent',
          group: 'pending',
          title: isNota ? 'Nota pendente' : isConteudo ? 'Diario pendente' : 'Pendencia operacional',
          description: `${p.turma_nome || p.contexto || 'Turma'}${p.disciplina_nome ? ` - ${p.disciplina_nome}` : ''}. Referencia: ${formatShortDate(p.data_referencia)}.`,
          actionLabel: isNota ? 'Lancar notas' : isConteudo ? 'Abrir planos' : 'Resolver',
          actionCallback: () => navigate(isNota ? '/professores/notas' : isConteudo ? '/professores/planos-aula' : '/professores/agenda'),
        })
      })

      if (pendencias.length > 4) {
        list.push({
          id: 'pendencias-extra',
          type: 'update',
          group: 'pending',
          title: `${pendencias.length - 4} pendencias adicionais`,
          description: 'Existem outras pendencias no painel do professor. Resolva primeiro as mais antigas.',
          actionLabel: 'Ver agenda',
          actionCallback: () => navigate('/professores/agenda'),
        })
      }
    }

    if (alertas.length > 0) {
      alertas.slice(0, 5).forEach((alerta: any) => {
        const insightType = getAlertType(alerta)
        list.push({
          id: `alerta-${alerta.id}`,
          type: insightType,
          group: 'alert',
          title: alerta.titulo || 'Alerta pedagogico',
          description: `${alerta.aluno_nome ? `${alerta.aluno_nome}: ` : ''}${alerta.descricao || 'Alerta ativo para acompanhamento.'}`,
          actionLabel: alerta.aluno_id ? 'Ver aluno' : 'Abrir alerta',
          messageTemplate: alerta.gravidade === 'critica' || alerta.gravidade === 'alta' ? 'alerta' : undefined,
          alunoId: alerta.aluno_id,
          alunoNome: alerta.aluno_nome,
          actionCallback: () => navigate(alerta.aluno_id ? `/professores/alunos/${alerta.aluno_id}` : '/professores/alertas'),
          secondaryActionLabel: 'Central',
          secondaryActionCallback: () => navigate('/professores/alertas'),
        })
      })
    }

    const turmasComAtencao = saudeTurmas
      .filter((turma: any) => Number(turma.percentual_presenca || 100) < 75 || Number(turma.media_geral || 10) < 6)
      .slice(0, 3)

    turmasComAtencao.forEach((turma: any) => {
      const frequencia = Number(turma.percentual_presenca || 0)
      const media = Number(turma.media_geral || 0)
      const baixaFrequencia = frequencia > 0 && frequencia < 75

      list.push({
        id: `saude-${turma.turma_id}`,
        type: 'anomaly',
        group: 'class-health',
        title: baixaFrequencia ? 'Frequencia da turma em atencao' : 'Media da turma em atencao',
        description: `${turma.turma_nome}: ${baixaFrequencia ? `${frequencia.toFixed(0)}% de frequencia` : `media ${media.toFixed(1)}`}. Verifique a turma antes do fechamento.`,
        actionLabel: 'Ver turma',
        actionCallback: () => navigate(`/professores/turmas/${turma.turma_id}`),
      })
    })

    if (agenda.length > 0 && agendaPendente.length === 0 && pendencias.length === 0 && alertas.length === 0) {
      list.push({
        id: 'day-complete',
        type: 'positive',
        group: 'done',
        title: 'Dia organizado',
        description: 'As chamadas e registros previstos para hoje estao em dia no sistema.',
        actionLabel: 'Ver agenda',
        actionCallback: () => navigate('/professores/agenda'),
      })
    }

    if (list.length === 0) {
      list.push({
        id: 'no-issues',
        type: 'positive',
        group: 'done',
        title: 'Tudo verde',
        description: 'Nao ha pendencias de diario, alertas pedagogicos ou acoes imediatas para suas turmas agora.',
      })
    }

    return list
  }, [agenda, pendencias, alertas, saudeTurmas, navigate])

  return { insights, summary, isLoading }
}
