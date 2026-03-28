import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { muralService } from './service'
import type { MuralAvisoInsert } from '@/lib/database.types'

export function useAvisos() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['mural', authUser?.tenantId, authUser?.isProfessor ? authUser.funcionarioId : 'all'],
    queryFn: () => muralService.listar(
      authUser!.tenantId,
      authUser?.isProfessor ? authUser.funcionarioId : undefined
    ),
    enabled: !!authUser?.tenantId,
  })
}

export function useAvisosPorTurma(turmaId: string | null) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['mural', 'turma', turmaId, authUser?.tenantId],
    queryFn: () => muralService.listarPorTurma(turmaId, authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useAvisosRecentes(limite?: number) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['mural', 'recentes', authUser?.tenantId, authUser?.isProfessor ? authUser.funcionarioId : 'all'],
    queryFn: () => muralService.listarAtivos(
      authUser!.tenantId,
      limite,
      authUser?.isProfessor ? authUser.funcionarioId : undefined
    ),
    enabled: !!authUser?.tenantId,
  })
}

export function useCriarAviso() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (aviso: MuralAvisoInsert) => muralService.criar(aviso),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mural'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'avisos'] })
    },
  })
}

export function useExcluirAviso() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => muralService.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mural'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'avisos'] })
    },
  })
}

export function useEditarAviso() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MuralAvisoInsert> }) =>
      muralService.editar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mural'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'avisos'] })
    },
  })
}
