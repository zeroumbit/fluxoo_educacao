import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { dashboardService } from './dashboard.service'

export function useDashboard() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['dashboard', authUser?.tenantId, authUser?.isProfessor ? authUser.funcionarioId : 'all'],
    queryFn: () => dashboardService.buscarDados(
      authUser!.tenantId,
      authUser?.isProfessor ? authUser.funcionarioId : undefined
    ),
    enabled: !!authUser?.tenantId && authUser?.tenantId !== '' && authUser?.tenantId !== 'PENDING_TENANT',
    // Se estiver pendente, verifica a cada 60 segundos para não sobrecarregar
    refetchInterval: (query) => {
      const status = query.state.data?.statusAssinatura
      return (status && status !== 'ativa') ? 60000 : false
    },
    staleTime: 30000, // Aumentado para 30s
  })
}
export function useRadarCompleto() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['radar-completo', authUser?.tenantId, authUser?.isProfessor ? authUser.funcionarioId : 'all'],
    queryFn: () => dashboardService.buscarRadarCompleto(
      authUser!.tenantId,
      authUser?.isProfessor ? authUser.funcionarioId : undefined
    ),
    enabled: !!authUser?.tenantId,
    staleTime: 60000,
  })
}

/**
 * Hook para alertas do dia-a-dia do professor
 * Retorna apenas alunos com faltas das turmas do professor (sem dados financeiros)
 */
export function useAlertasProfessor() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['alertas-professor', authUser?.tenantId, authUser?.funcionarioId],
    queryFn: () => dashboardService.buscarAlertasProfessor(
      authUser!.tenantId,
      authUser!.funcionarioId!
    ),
    enabled: !!authUser?.tenantId && !!authUser?.isProfessor && !!authUser?.funcionarioId,
    staleTime: 60000,
  })
}
