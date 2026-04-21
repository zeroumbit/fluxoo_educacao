import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { superAdminService } from '@/modules/super-admin/service'
import { escolaService } from '@/modules/escolas/service'
import { portalService } from '@/modules/portal/service'
import { notificacoesService } from '@/modules/notificacoes/notificacoes.service'
import { useAuth } from '@/modules/auth/AuthContext'

/**
 * Hook para notificações do Super Admin
 * Sincronizado com banco de dados - polling a cada 10s
 */
export function useSuperAdminNotifications() {
  return useQuery({
    queryKey: ['notifications', 'super-admin'],
    queryFn: () => superAdminService.getNotificationCounts(),
    refetchInterval: 10000, // Sync real-time every 10s
    staleTime: 5000,
  })
}

/**
 * Hook para notificações da Escola (Gestor/Funcionário)
 * Sincronizado com banco de dados - polling a cada 10s
 */
export function useEscolaNotifications(tenantId?: string) {
  const { authUser } = useAuth()
  
  return useQuery({
    queryKey: ['notifications', 'escola', tenantId],
    queryFn: async () => {
      if (!tenantId) return null
      
      // Usa o serviço centralizado de notificações
      const userId = authUser?.funcionarioId || authUser?.responsavelId || authUser?.user?.id
      const result = await notificacoesService.buscarNotificacoesAgrupadas(tenantId, userId)
      
      let notificacoes = result.notificacoes
      let items = result.items
      let total = result.total

      // REGRA DE NEGÓCIO: Contador não visualiza notificações de recebimento PIX Manual (baixa manual)
      const isContador = authUser?.perfilNome?.toLowerCase().includes('contador')
      if (isContador) {
        notificacoes = notificacoes.filter(n => n.tipo !== 'PAGAMENTO_PIX_MANUAL')
        items = items.filter(i => i.id !== 'PAGAMENTO_PIX_MANUAL')
        total = notificacoes.length
      }

      return {
        total,
        items: items.map(item => ({
          id: item.id,
          label: item.label,
          href: item.href,
          category: item.category
        })),
        notificacoes
      }
    },
    enabled: !!tenantId,
    refetchInterval: 10000, // Sync real-time every 10s
    staleTime: 5000,
  })
}

/**
 * Hook para notificações do Portal (Responsáveis)
 * Sincronizado com banco de dados - polling a cada 10s
 */
export function usePortalNotifications(responsavelId?: string) {
  return useQuery({
    queryKey: ['notifications', 'portal', responsavelId],
    queryFn: () => responsavelId ? portalService.getNotificationCounts(responsavelId) : null,
    enabled: !!responsavelId,
    refetchInterval: 10000, // Sync real-time every 10s
    staleTime: 5000,
  })
}

/**
 * Hook para gerenciar ações de notificações (marcar como lida/resolvida)
 */
export function useNotificacoesActions() {
  const queryClient = useQueryClient()
  const { authUser } = useAuth()

  const mutationOptions = {
    onSuccess: () => {
      // Invalida e refaz query de notificações para sincronizar web/mobile
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  }

  // Marcar como lida
  const marcarComoLida = useMutation({
    mutationFn: (notificacaoId: string) => notificacoesService.marcarComoLida(notificacaoId),
    ...mutationOptions,
  })

  // Marcar como resolvida (remove do sino)
  const marcarComoResolvida = useMutation({
    mutationFn: (notificacaoId: string) => notificacoesService.marcarComoResolvida(notificacaoId),
    ...mutationOptions,
  })

  // Marcar múltiplas como lidas
  const marcarMultiplasComoLidas = useMutation({
    mutationFn: (notificacaoIds: string[]) => notificacoesService.marcarMultiplasComoLidas(notificacaoIds),
    ...mutationOptions,
  })

  return {
    marcarComoLida,
    marcarComoResolvida,
    marcarMultiplasComoLidas,
    tenantId: authUser?.tenantId
  }
}

/**
 * Hook para buscar detalhes de uma notificação específica
 */
export function useNotificacaoDetail(notificacaoId?: string) {
  return useQuery({
    queryKey: ['notification', notificacaoId],
    queryFn: async () => {
      if (!notificacaoId) return null
      // Implementar busca de notificação única se necessário
      return null
    },
    enabled: !!notificacaoId,
    staleTime: 5000,
  })
}
