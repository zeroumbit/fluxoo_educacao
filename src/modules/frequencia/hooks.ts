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
    },
  })
}
