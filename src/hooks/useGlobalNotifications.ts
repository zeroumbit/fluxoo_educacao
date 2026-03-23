import { useQuery } from '@tanstack/react-query';
import { superAdminService } from '@/modules/super-admin/service';
import { escolaService } from '@/modules/escolas/service';
import { portalService } from '@/modules/portal/service';
import { useAuth } from '@/modules/auth/AuthContext';
import { usePortalContext } from '@/modules/portal/context';

export function useAdminNotifications() {
  return useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: () => superAdminService.getNotificationCounts(),
    refetchInterval: 1000 * 60 * 5, // 5 min
  });
}

export function useEscolaNotifications(tenantId?: string) {
  return useQuery({
    queryKey: ['escola', 'notifications', tenantId],
    queryFn: () => escolaService.getNotificationCounts(tenantId!),
    enabled: !!tenantId,
    refetchInterval: 1000 * 60 * 5, // 5 min
  });
}

export function usePortalNotifications(responsavelId?: string) {
  return useQuery({
    queryKey: ['portal', 'notifications', responsavelId],
    queryFn: () => portalService.getNotificationCounts(responsavelId!),
    enabled: !!responsavelId,
    refetchInterval: 1000 * 60 * 5, // 5 min
  });
}
