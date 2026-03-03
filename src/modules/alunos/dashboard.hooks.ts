import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { dashboardService } from './dashboard.service'

export function useDashboard() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['dashboard', authUser?.tenantId],
    queryFn: () => dashboardService.buscarDados(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
    // Se estiver pendente, verifica a cada 10 segundos para liberar o acesso assim que o admin aprovar
    refetchInterval: (query) => {
      const status = query.state.data?.statusAssinatura
      return (status && status !== 'ativa') ? 10000 : false
    },
    staleTime: 5000, // Diminuímos o staleTime para garantir dados sempre frescos
  })
}
