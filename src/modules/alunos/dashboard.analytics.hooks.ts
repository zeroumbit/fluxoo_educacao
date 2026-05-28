import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { dashboardAnalyticsService } from './dashboard.analytics.service'

export function useDashboardAnalytics() {
  const { authUser } = useAuth()

  return useQuery({
    queryKey: ['dashboard-analytics', authUser?.tenantId],
    queryFn: () => dashboardAnalyticsService.buscarAnalytics(
      authUser!.tenantId,
      authUser?.isProfessor ? authUser.funcionarioId : undefined,
    ),
    enabled: !!authUser?.tenantId && authUser?.tenantId !== '' && authUser?.tenantId !== 'PENDING_TENANT' && !authUser?.isProfessor,
    staleTime: 60000,
    retry: 1,
  })
}
