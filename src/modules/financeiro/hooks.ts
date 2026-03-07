import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { financeiroService } from './service'
import type { CobrancaInsert } from '@/lib/database.types'

export function useCobrancas(filtroStatus?: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['cobrancas', authUser?.tenantId, filtroStatus],
    queryFn: () => financeiroService.listar(authUser!.tenantId, filtroStatus),
    enabled: !!authUser?.tenantId,
  })
}

export function useCobrancasAbertas() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['cobrancas', 'abertas', authUser?.tenantId],
    queryFn: () => financeiroService.contarAbertas(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useCobrancasPorAluno(alunoId: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['cobrancas', 'aluno', alunoId, authUser?.tenantId],
    queryFn: () => financeiroService.listarPorAluno(alunoId, authUser!.tenantId),
    enabled: !!authUser?.tenantId && !!alunoId,
  })
}

export function useCriarCobranca() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cobranca: CobrancaInsert) => financeiroService.criar(cobranca),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useMarcarComoPago() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => financeiroService.marcarComoPago(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
export function useExcluirCobranca() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => financeiroService.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
export function useDesfazerPagamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => financeiroService.desfazerPagamento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
