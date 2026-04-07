import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { frequenciaService } from './service'
import type { FrequenciaInsert } from '@/lib/database.types'

export function useFrequenciasPorTurmaData(turmaId: string, data: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['frequencias', turmaId, data, authUser?.tenantId],
    queryFn: () => frequenciaService.listarPorTurmaData(turmaId, data, authUser!.tenantId),
    enabled: !!authUser?.tenantId && !!turmaId && !!data,
  })
}

export function useFrequenciasPorAluno(alunoId: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['frequencias', 'aluno', alunoId, authUser?.tenantId],
    queryFn: () => frequenciaService.listarPorAluno(alunoId, authUser!.tenantId),
    enabled: !!authUser?.tenantId && !!alunoId,
  })
}

export function useHistoricoFrequencia(turmaId: string, mes?: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['frequencias', 'historico', turmaId, mes, authUser?.tenantId],
    queryFn: () => frequenciaService.listarHistoricoPorTurma(turmaId, authUser!.tenantId, mes),
    enabled: !!authUser?.tenantId && !!turmaId,
  })
}

export function useSalvarFrequencias() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (frequencias: FrequenciaInsert[]) =>
      frequenciaService.salvarFrequencias(frequencias),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frequencias'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'frequencia'] })
      // Invalida alertas_status para recalcular gravidade do radar
      // (faltas consecutivas afetam o nível de risco de evasão)
      queryClient.invalidateQueries({ queryKey: ['alertas_status'] })
      queryClient.invalidateQueries({ queryKey: ['radar_evasao'] })
    },
  })
}

export function useResumoFaltasPorPeriodo(alunoId: string, dataInicio: string, dataFim: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['frequencias', 'resumo', alunoId, dataInicio, dataFim, authUser?.tenantId],
    queryFn: () => frequenciaService.buscarResumoFaltasPorPeriodo(alunoId, authUser!.tenantId, dataInicio, dataFim),
    enabled: !!authUser?.tenantId && !!alunoId && !!dataInicio && !!dataFim,
  })
}

export function useRelatorioMensalFrequencia(turmaId: string, mes: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['frequencias', 'relatorio_mensal', turmaId, mes, authUser?.tenantId],
    queryFn: () => frequenciaService.listarHistoricoPorTurma(turmaId, authUser!.tenantId, mes),
    enabled: !!authUser?.tenantId && !!turmaId && !!mes,
  })
}

export function useFaltasTurmaPorPeriodo(turmaId: string, dataInicio: string, dataFim: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['frequencias', 'resumo_turma', turmaId, dataInicio, dataFim, authUser?.tenantId],
    queryFn: () => frequenciaService.buscarFaltasTurmaPeriodo(turmaId, authUser!.tenantId, dataInicio, dataFim),
    enabled: !!authUser?.tenantId && !!turmaId && !!dataInicio && !!dataFim,
  })
}

export function useAlunosDaTurma(turmaId: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['frequencias', 'alunos_turma', turmaId, authUser?.tenantId],
    queryFn: () => frequenciaService.listarAlunosDaTurma(turmaId, authUser!.tenantId),
    enabled: !!authUser?.tenantId && !!turmaId,
  })
}

/**
 * Hook para Chamada em Tempo Real com Optimistic Updates
 */
export function useFrequenciaOptimistic(turmaId: string, dataAula: string) {
  const { authUser } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = ['frequencias', turmaId, dataAula, authUser?.tenantId]

  const mutation = useMutation({
    mutationFn: (frequencias: FrequenciaInsert[]) => 
      frequenciaService.salvarFrequencias(frequencias),
    
    // ⚡ Optimistic Update: Altera UI instantaneamente
    onMutate: async (newFrequencias) => {
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData(queryKey)
      
      // Atualiza o cache local imediatamente
      queryClient.setQueryData(queryKey, newFrequencias)

      return { previousData }
    },

    // 🔄 Rollback em caso de erro
    onError: (err, newFrequencias, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
    },

    // 🏁 Sincronização final
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })

  return {
    ...mutation,
    salvarLote: mutation.mutate,
    isSaving: mutation.isPending
  }
}
