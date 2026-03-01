import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { turmaService } from './service'
import type { TurmaInsert, TurmaUpdate } from '@/lib/database.types'

export function useTurmas() {
  const { authUser } = useAuth()
  const query = useQuery({
    queryKey: ['turmas', authUser?.tenantId],
    queryFn: () => {
      console.log('🔍 [useTurmas] queryFn executou, tenantId:', authUser?.tenantId)
      return turmaService.listar(authUser!.tenantId)
    },
    enabled: !!authUser?.tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
  console.log('🔍 [useTurmas] query result:', { 
    data: query.data, 
    isLoading: query.isLoading, 
    error: query.error,
    dataUpdatedAt: new Date(query.dataUpdatedAt).toISOString()
  })
  return query
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
    mutationFn: (turma: TurmaInsert) => {
      console.log('🔍 [useCriarTurma] mutationFn:', turma)
      return turmaService.criar(turma)
    },
    onSuccess: (data) => {
      console.log('🔍 [useCriarTurma] onSuccess, turma criada:', data)
      queryClient.invalidateQueries({ queryKey: ['turmas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.refetchQueries({ queryKey: ['turmas'] })
    },
    onError: (error) => {
      console.error('🔍 [useCriarTurma] onError:', error)
    },
  })
}

export function useAtualizarTurma() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, turma }: { id: string; turma: TurmaUpdate }) => {
      console.log('🔍 [useAtualizarTurma] mutationFn:', { id, turma })
      return turmaService.atualizar(id, turma)
    },
    onSuccess: (data) => {
      console.log('🔍 [useAtualizarTurma] onSuccess, turma atualizada:', data)
      queryClient.invalidateQueries({ queryKey: ['turmas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.refetchQueries({ queryKey: ['turmas'] })
    },
    onError: (error) => {
      console.error('🔍 [useAtualizarTurma] onError:', error)
    },
  })
}

export function useExcluirTurma() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => {
      console.log('🔍 [useExcluirTurma] mutationFn, id:', id)
      return turmaService.excluir(id)
    },
    onSuccess: (data, id) => {
      console.log('🔍 [useExcluirTurma] onSuccess, id excluído:', id)
      queryClient.invalidateQueries({ queryKey: ['turmas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.refetchQueries({ queryKey: ['turmas'] })
    },
    onError: (error) => {
      console.error('🔍 [useExcluirTurma] onError:', error)
    },
  })
}
