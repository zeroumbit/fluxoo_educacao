import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { turmaService } from './service'
import type { TurmaInsert, TurmaUpdate } from '@/lib/database.types'

export function useTurmas() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['turmas', authUser?.tenantId],
    queryFn: () => turmaService.listar(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useTurma(id: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['turmas', id, authUser?.tenantId],
    queryFn: () => turmaService.buscarPorId(id, authUser!.tenantId),
    enabled: !!authUser?.tenantId && !!id,
  })
}

export function useCriarTurma() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (turma: TurmaInsert) => turmaService.criar(turma),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useAtualizarTurma() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, turma }: { id: string; turma: TurmaUpdate }) =>
      turmaService.atualizar(id, turma),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useExcluirTurma() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => turmaService.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
