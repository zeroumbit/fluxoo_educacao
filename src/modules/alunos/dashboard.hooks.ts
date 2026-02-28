import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { dashboardService } from './dashboard.service'

export function useDashboard() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['dashboard', authUser?.tenantId],
    queryFn: () => dashboardService.buscarDados(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}
