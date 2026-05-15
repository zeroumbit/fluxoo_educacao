import type { FilialInsert,FilialUpdate } from '@/lib/database.types'
import { useAuth } from '@/modules/auth/AuthContext'
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'
import { filialService } from './service'

export function useFiliais() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['filiais', authUser?.tenantId],
    queryFn: () => filialService.listar(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useCriarFilial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (filial: FilialInsert) => filialService.criar(filial),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filiais'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'config-escola'] })
    },
  })
}

export function useAtualizarFilial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, filial }: { id: string; filial: FilialUpdate }) =>
      filialService.atualizar(id, filial),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filiais'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'config-escola'] })
    },
  })
}

export function useExcluirFilial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => filialService.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filiais'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'config-escola'] })
    },
  })
}
