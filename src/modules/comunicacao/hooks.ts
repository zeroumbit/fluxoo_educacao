import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { muralService } from './service'
import type { MuralAvisoInsert } from '@/lib/database.types'

export function useAvisos() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['avisos', authUser?.tenantId],
    queryFn: () => muralService.listar(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useAvisosPorTurma(turmaId: string | null) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['avisos', 'turma', turmaId, authUser?.tenantId],
    queryFn: () => muralService.listarPorTurma(turmaId, authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useAvisosRecentes(limite?: number) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['avisos', 'recentes', authUser?.tenantId],
    queryFn: () => muralService.listarRecentes(authUser!.tenantId, limite),
    enabled: !!authUser?.tenantId,
  })
}

export function useCriarAviso() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (aviso: MuralAvisoInsert) => muralService.criar(aviso),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avisos'] })
    },
  })
}

export function useExcluirAviso() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => muralService.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avisos'] })
    },
  })
}
