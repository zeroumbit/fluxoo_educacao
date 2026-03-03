import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { agendaService } from './service'

export function useEventos() {
  const { authUser } = useAuth()
  return useQuery({ queryKey: ['eventos', authUser?.tenantId], queryFn: () => agendaService.listarEventos(authUser!.tenantId), enabled: !!authUser?.tenantId })
}
export function useCriarEvento() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d: any) => agendaService.criarEvento(d), onSuccess: () => qc.invalidateQueries({ queryKey: ['eventos'] }) })
}
export function useExcluirEvento() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => agendaService.excluirEvento(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['eventos'] }) })
}
export function useConfigRecados() {
  const { authUser } = useAuth()
  return useQuery({ queryKey: ['config_recados', authUser?.tenantId], queryFn: () => agendaService.getConfigRecados(authUser!.tenantId), enabled: !!authUser?.tenantId })
}
export function useUpsertConfigRecados() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d: any) => agendaService.upsertConfigRecados(d), onSuccess: () => qc.invalidateQueries({ queryKey: ['config_recados'] }) })
}
