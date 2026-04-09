import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { notificacoesService } from '@/modules/notificacoes/notificacoes.service'

/**
 * Hook para notificações do Professor
 * Busca notificações do Supabase relacionadas ao tenant e ao professor
 * Polling a cada 30s para manter sincronizado
 */
export function useProfessorNotifications() {
  const { authUser } = useAuth()

  return useQuery({
    queryKey: ['notifications', 'professor', authUser?.tenantId],
    queryFn: async () => {
      const tenantId = authUser?.tenantId
      const userId = authUser?.user?.id

      if (!tenantId) {
        return { total: 0, items: [], notificacoes: [] }
      }

      const result = await notificacoesService.buscarNotificacoesAgrupadas(tenantId, userId)
      return {
        total: result.total,
        items: result.items.map(item => ({
          id: item.id,
          label: item.label,
          href: item.href,
          category: item.category
        })),
        notificacoes: result.notificacoes
      }
    },
    enabled: !!authUser?.tenantId,
    refetchInterval: 30000, // Polling a cada 30s
    staleTime: 15000,
  })
}

/**
 * Hook para ações de notificação do professor (marcar como lida/resolvida)
 */
export function useProfessorNotificacoesActions() {
  const queryClient = useQueryClient()

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications', 'professor'] })
  }

  return {
    marcarComoLida: async (notificacaoId: string) => {
      await notificacoesService.marcarComoLida(notificacaoId)
      invalidateNotifications()
    },
    marcarComoResolvida: async (notificacaoId: string) => {
      await notificacoesService.marcarComoResolvida(notificacaoId)
      invalidateNotifications()
    },
    marcarMultiplasComoLidas: async (notificacaoIds: string[]) => {
      await notificacoesService.marcarMultiplasComoLidas(notificacaoIds)
      invalidateNotifications()
    }
  }
}
