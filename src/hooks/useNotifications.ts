import { useQuery } from '@tanstack/react-query'
import { superAdminService } from '@/modules/super-admin/service'
import { escolaService } from '@/modules/escolas/service'
import { portalService } from '@/modules/portal/service'

export function useSuperAdminNotifications() {
  return useQuery({
    queryKey: ['notifications', 'super-admin'],
    queryFn: () => superAdminService.getNotificationCounts(),
    refetchInterval: 30000, // Sync real-time every 30s
  })
}

export function useEscolaNotifications(tenantId?: string) {
  return useQuery({
    queryKey: ['notifications', 'escola', tenantId],
    queryFn: () => tenantId ? escolaService.getNotificationCounts(tenantId) : null,
    enabled: !!tenantId,
    refetchInterval: 30000,
  })
}

export function usePortalNotifications(responsavelId?: string) {
  return useQuery({
    queryKey: ['notifications', 'portal', responsavelId],
    queryFn: () => responsavelId ? portalService.getNotificationCounts(responsavelId) : null,
    enabled: !!responsavelId,
    refetchInterval: 30000,
  })
}
