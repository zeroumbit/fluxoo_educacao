import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { professorService } from './service'
import type { AlertaProfessor } from './types'

/** Agenda de aulas de hoje. StaleTime: 5 minutos. */
export function useAgendaDiaria() {
  const { authUser } = useAuth()
  const professorId = authUser?.funcionarioId
  const tenantId = authUser?.tenantId

  return useQuery({
    queryKey: ['agenda_hoje', professorId, tenantId],
    queryFn: () => professorService.buscarAgendaHoje(professorId!, tenantId!),
    enabled: !!professorId && !!tenantId,
    staleTime: 5 * 60 * 1000,
  })
}

/** Pendências críticas dos últimos 15 dias. StaleTime: 15 minutos. */
export function usePendenciasProfessor() {
  const { authUser } = useAuth()
  const professorId = authUser?.funcionarioId
  const tenantId = authUser?.tenantId

  return useQuery({
    queryKey: ['pendencias', professorId, tenantId],
    queryFn: () => professorService.buscarPendencias(professorId!, tenantId!),
    enabled: !!professorId && !!tenantId,
    staleTime: 15 * 60 * 1000,
  })
}

/** Saúde das turmas (frequência e notas). StaleTime: 1 hora. */
export function useSaudeTurmas() {
  const { authUser } = useAuth()
  const professorId = authUser?.funcionarioId
  const tenantId = authUser?.tenantId

  return useQuery({
    queryKey: ['saude_turmas', professorId, tenantId],
    queryFn: () => professorService.buscarSaudeTurmas(professorId!, tenantId!),
    enabled: !!professorId && !!tenantId,
    staleTime: 60 * 60 * 1000,
  })
}

/**
 * Hook para buscar alertas consolidados do professor.
 * Inclui pedagógicos, saúde, frequência e operacionais.
 * Dados 100% reais do Supabase via vw_alertas_professor com RLS.
 */
export function useAlertasProfessor() {
  const { authUser } = useAuth()
  const professorId = authUser?.user?.id || authUser?.funcionarioId
  const tenantId = authUser?.tenantId

  return useQuery({
    queryKey: ['professor_alertas', professorId, tenantId],
    queryFn: () => professorService.buscarAlertas(professorId!, tenantId!),
    enabled: !!professorId && !!tenantId,
    staleTime: 2 * 60 * 1000, // 2 minutos de cache para alertas mais dinâmicos
    refetchInterval: 30 * 1000, // Re-polling a cada 30s para dados em tempo real
  })
}

/**
 * Hook para concluir um alerta através da RPC com registro de auditoria.
 */
export function useConcluirAlerta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ alertaId, observacao }: { alertaId: string, observacao?: string }) =>
      professorService.concluirAlerta(alertaId, observacao),
    onSuccess: () => {
      // Invalida cache para atualizar contador no dashboard
      queryClient.invalidateQueries({ queryKey: ['professor_alertas'] })
    }
  })
}

/**
 * Hook para buscar todos os alunos das turmas vinculadas ao professor.
 */
export function useAlunosProfessor() {
  const { authUser } = useAuth()
  const professorId = authUser?.funcionarioId || authUser?.user?.id
  const tenantId = authUser?.tenantId

  return useQuery({
    queryKey: ['professor_alunos', professorId, tenantId],
    queryFn: () => professorService.buscarAlunosDoProfessor(professorId!, tenantId!),
    enabled: !!professorId && !!tenantId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook para buscar detalhes de uma turma específica do professor.
 */
export function useDetalhesTurma(turmaId: string | undefined) {
  const { authUser } = useAuth()
  const professorId = authUser?.funcionarioId || authUser?.user?.id
  const tenantId = authUser?.tenantId

  return useQuery({
    queryKey: ['professor_turma_detalhes', turmaId, professorId],
    queryFn: () => professorService.buscarDetalhesTurma(turmaId!, professorId!, tenantId!),
    enabled: !!turmaId && !!professorId && !!tenantId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook para buscar detalhes de um aluno para o professor.
 */
export function useDetalhesAluno(alunoId: string | undefined) {
  const { authUser } = useAuth()
  const professorId = authUser?.funcionarioId || authUser?.user?.id
  const tenantId = authUser?.tenantId

  return useQuery({
    queryKey: ['professor_aluno_detalhes', alunoId, professorId],
    queryFn: () => professorService.buscarDetalhesAluno(alunoId!, professorId!, tenantId!),
    enabled: !!alunoId && !!professorId && !!tenantId,
    staleTime: 5 * 60 * 1000,
  })
}

// Re-export de notificações
export {
  useProfessorNotifications,
  useProfessorNotificacoesActions
} from './hooks/useProfessorNotifications'
