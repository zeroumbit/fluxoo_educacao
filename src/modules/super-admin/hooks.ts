import { useQuery } from '@tanstack/react-query'
import { superAdminService } from './service'

export function useSuperAdminDashboard() {
  return useQuery({
    queryKey: ['super-admin-dashboard'],
    queryKeyHashFn: (queryKey) => JSON.stringify(queryKey),
    queryFn: () => superAdminService.getDashboardStats(),
    staleTime: 60 * 1000, // 1 minuto
  })
}
