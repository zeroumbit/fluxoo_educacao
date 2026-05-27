import type { ConfigRecadosInsert, ConfigRecadosUpdate } from '@/lib/database.types'
import { useAuth } from '@/modules/auth/AuthContext'
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'
import { agendaService, type EventoPayload } from './service'

export function useEventos() {
  const { authUser } = useAuth()
  return useQuery({ queryKey: ['eventos', authUser?.tenantId], queryFn: () => agendaService.listarEventos(authUser!.tenantId), enabled: !!authUser?.tenantId })
}
export function useCriarEvento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: EventoPayload) => agendaService.salvarEvento(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventos'] })
      qc.invalidateQueries({ queryKey: ['portal', 'eventos'] })
    }
  })
}
export function useExcluirEvento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => agendaService.excluirEvento(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventos'] })
      qc.invalidateQueries({ queryKey: ['portal', 'eventos'] })
    }
  })
}
export function useConfigRecados() {
  const { authUser } = useAuth()
  return useQuery({ queryKey: ['config_recados', authUser?.tenantId], queryFn: () => agendaService.getConfigRecados(authUser!.tenantId), enabled: !!authUser?.tenantId })
}
export function useUpsertConfigRecados() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: ConfigRecadosInsert | ConfigRecadosUpdate) => agendaService.upsertConfigRecados(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['config_recados'] })
      qc.invalidateQueries({ queryKey: ['portal', 'config-recados'] })
    }
  })
}
