import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { turmaService } from './service'
import type { TurmaInsert, TurmaUpdate } from '@/lib/database.types'

import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { z } from 'zod'

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
export function useTurmaDoAluno(alunoId: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['turmas_aluno', alunoId, authUser?.tenantId],
    queryFn: () => turmaService.buscarPorAluno(alunoId, authUser!.tenantId),
    enabled: !!authUser?.tenantId && !!alunoId,
  })
}

// Validação conforme Regra 2.4
const updateMensalidadeSchema = z.object({
  turmaId: z.string().uuid(),
  tenantId: z.string().uuid(),
  valor: z.number().positive("O valor deve ser maior que zero"),
})

/**
 * Hook para gerir a atualização de mensalidades por turma
 * Segue Regras 2.3 (Invalidar Cache) e 4.1 (Toast Feedback)
 */
export const useTurmaBilling = () => {
  const queryClient = useQueryClient()

  const updateMensalidadeTurma = useMutation({
    mutationFn: async ({ turmaId, tenantId, valor }: z.infer<typeof updateMensalidadeSchema>) => {
      // Chama a RPC do banco que processa a atualização em massa (Regra 1.5)
      // @ts-ignore - RPC a ser adicionada no schema de tipos
      const { error } = await supabase.rpc('rpc_atualizar_mensalidade_turma_em_lote', {
        p_tenant_id: tenantId,
        p_turma_id: turmaId,
        p_novo_valor_cheio: valor
      })

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      // Invalida o cache para que a UI reflicta o novo valor (Regra 2.3)
      queryClient.invalidateQueries({ queryKey: ['turmas', variables.tenantId] })
      queryClient.invalidateQueries({ queryKey: ['alunos', variables.turmaId] })
      
      toast.success('Mensalidade da turma atualizada com sucesso!')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar mensalidade: ' + error.message)
    }
  })

  return {
    updateMensalidadeTurma,
    isUpdating: updateMensalidadeTurma.isPending
  }
}
