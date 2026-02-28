import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { financeirService } from './service'
import type { CobrancaInsert } from '@/lib/database.types'

export function useCobrancas(filtroStatus?: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['cobrancas', authUser?.tenantId, filtroStatus],
    queryFn: () => financeirService.listar(authUser!.tenantId, filtroStatus),
    enabled: !!authUser?.tenantId,
  })
}

export function useCobrancasAbertas() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['cobrancas', 'abertas', authUser?.tenantId],
    queryFn: () => financeirService.contarAbertas(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useCobrancasPorAluno(alunoId: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['cobrancas', 'aluno', alunoId, authUser?.tenantId],
    queryFn: () => financeirService.listarPorAluno(alunoId, authUser!.tenantId),
    enabled: !!authUser?.tenantId && !!alunoId,
  })
}

export function useCriarCobranca() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cobranca: CobrancaInsert) => financeirService.criar(cobranca),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] })
    },
  })
}

export function useMarcarComoPago() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => financeirService.marcarComoPago(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] })
    },
  })
}
