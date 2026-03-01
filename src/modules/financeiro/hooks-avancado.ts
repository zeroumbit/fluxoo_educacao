import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { financeiroAvancadoService } from './service-avancado'

export function useConfigFinanceira() {
  const { authUser } = useAuth()
  return useQuery({ queryKey: ['config_financeira', authUser?.tenantId], queryFn: () => financeiroAvancadoService.getConfig(authUser!.tenantId), enabled: !!authUser?.tenantId })
}
export function useUpsertConfigFinanceira() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d: any) => financeiroAvancadoService.upsertConfig(d), onSuccess: () => qc.invalidateQueries({ queryKey: ['config_financeira'] }) })
}
export function useContasPagar() {
  const { authUser } = useAuth()
  return useQuery({ queryKey: ['contas_pagar', authUser?.tenantId], queryFn: () => financeiroAvancadoService.listarContasPagar(authUser!.tenantId), enabled: !!authUser?.tenantId })
}
export function useCriarContaPagar() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d: any) => financeiroAvancadoService.criarContaPagar(d), onSuccess: () => qc.invalidateQueries({ queryKey: ['contas_pagar'] }) })
}
export function useAtualizarContaPagar() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, updates }: { id: string; updates: any }) => financeiroAvancadoService.atualizarContaPagar(id, updates), onSuccess: () => qc.invalidateQueries({ queryKey: ['contas_pagar'] }) })
}
export function useDeletarContaPagar() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => financeiroAvancadoService.deletarContaPagar(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['contas_pagar'] }) })
}
export function useRegistrarPagamento() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, pagamento }: { id: string; pagamento: any }) => financeiroAvancadoService.registrarPagamento(id, pagamento), onSuccess: () => qc.invalidateQueries({ queryKey: ['cobrancas'] }) })
}
export function useFechamentoMensal() {
  const { authUser } = useAuth()
  return useQuery({ 
    queryKey: ['fechamento_mensal', authUser?.tenantId], 
    queryFn: () => financeiroAvancadoService.getFechamentoMensal(authUser!.tenantId), 
    enabled: !!authUser?.tenantId 
  })
}
