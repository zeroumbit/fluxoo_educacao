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

// ==========================================
// COBRANCAS V2 (Com Encargos)
// ==========================================

export function useCobrancasComEncargos(filtroStatus?: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['cobrancas_com_encargos', authUser?.tenantId, filtroStatus],
    queryFn: () => financeiroService.listarComEncargos(authUser!.tenantId, filtroStatus),
    enabled: !!authUser?.tenantId,
  })
}

export function useCobrancasComEncargosPorAluno(alunoId: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['cobrancas_com_encargos', 'aluno', alunoId, authUser?.tenantId],
    queryFn: () => financeiroService.listarComEncargosPorAluno(alunoId, authUser!.tenantId),
    enabled: !!authUser?.tenantId && !!alunoId,
  })
}

export function useRegistrarPagamentoManual() {
  const queryClient = useQueryClient()
  const { authUser } = useAuth()
  return useMutation({
    mutationFn: ({ id, formaPagamento, comprovanteUrl }: { id: string, formaPagamento?: string, comprovanteUrl?: string }) =>
      financeiroService.registrarPagamentoManual(id, formaPagamento, comprovanteUrl, authUser?.user?.id, authUser?.tenantId),
    // Optimistic update: atualiza cache imediatamente
    onMutate: async ({ id }) => {
      // Cancela queries em andamento para evitar sobrescrever
      await queryClient.cancelQueries({ queryKey: ['cobrancas'] })
      await queryClient.cancelQueries({ queryKey: ['cobrancas_com_encargos'] })
      await queryClient.cancelQueries({ queryKey: ['dashboard'] })

      // Snapshot do estado anterior para rollback em caso de erro
      const previousCobrancas = queryClient.getQueryData(['cobrancas', authUser?.tenantId])
      const previousCobrancasEncargos = queryClient.getQueryData(['cobrancas_com_encargos', authUser?.tenantId])
      const previousDashboard = queryClient.getQueryData(['dashboard'])

      // Atualiza cache otimista (marca cobrança como paga)
      queryClient.setQueryData(['cobrancas', authUser?.tenantId], (old: any) => {
        if (!old) return old
        return old.map((c: any) => c.id === id ? { ...c, status: 'pago' } : c)
      })

      queryClient.setQueryData(['cobrancas_com_encargos', authUser?.tenantId], (old: any) => {
        if (!old) return old
        return old.map((c: any) => c.cobranca_id === id ? { ...c, status: 'pago' } : c)
      })

      return { previousCobrancas, previousCobrancasEncargos, previousDashboard }
    },
    // Em caso de erro, faz rollback do cache
    onError: (_err, _vars, context: any) => {
      if (context?.previousCobrancas) {
        queryClient.setQueryData(['cobrancas', authUser?.tenantId], context.previousCobrancas)
      }
      if (context?.previousCobrancasEncargos) {
        queryClient.setQueryData(['cobrancas_com_encargos', authUser?.tenantId], context.previousCobrancasEncargos)
      }
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard'], context.previousDashboard)
      }
    },
    // Refetch para garantir consistência
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] })
      queryClient.invalidateQueries({ queryKey: ['cobrancas_com_encargos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'cobrancas'] })
    },
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
      queryClient.invalidateQueries({ queryKey: ['portal', 'cobrancas'] })
    },
  })
}

export function useAtualizarCobranca() {
  const queryClient = useQueryClient()
  const { authUser } = useAuth()
  return useMutation({
    mutationFn: ({ id, cobranca }: { id: string, cobranca: Partial<CobrancaInsert> }) => 
      financeiroService.atualizar(id, cobranca, authUser?.user?.id, authUser?.tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ 'cobrancas' ] })
      queryClient.invalidateQueries({ queryKey: [ 'dashboard' ] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'cobrancas'] })
    },
  })
}

export function useMarcarComoPago() {
  const queryClient = useQueryClient()
  const { authUser } = useAuth()
  return useMutation({
    mutationFn: (id: string) => financeiroService.marcarComoPago(id, authUser?.user?.id, authUser?.tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'cobrancas'] })
    },
  })
}
export function useExcluirCobranca() {
  const queryClient = useQueryClient()
  const { authUser } = useAuth()
  return useMutation({
    mutationFn: (id: string) => financeiroService.excluir(id, authUser?.user?.id, authUser?.tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'cobrancas'] })
    },
  })
}
export function useDesfazerPagamento() {
  const queryClient = useQueryClient()
  const { authUser } = useAuth()
  return useMutation({
    mutationFn: (id: string) => financeiroService.desfazerPagamento(id, authUser?.user?.id, authUser?.tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'cobrancas'] })
    },
  })
}
