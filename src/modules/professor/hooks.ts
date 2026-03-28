import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { professorService } from './service'

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
