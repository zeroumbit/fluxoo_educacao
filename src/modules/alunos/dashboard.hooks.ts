import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { dashboardService } from './dashboard.service'

export function useDashboard() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['dashboard', authUser?.tenantId],
    queryFn: () => dashboardService.buscarDados(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
    // Se estiver pendente, verifica a cada 60 segundos para não sobrecarregar
    refetchInterval: (query) => {
      const status = query.state.data?.statusAssinatura
      return (status && status !== 'ativa') ? 60000 : false
    },
    staleTime: 30000, // Aumentado para 30s
  })
}
