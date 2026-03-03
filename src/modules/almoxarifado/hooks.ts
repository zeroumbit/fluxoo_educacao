import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { almoxarifadoService } from './service'

export function useItensAlmoxarifado() {
  const { authUser } = useAuth()
  return useQuery({ queryKey: ['almoxarifado_itens', authUser?.tenantId], queryFn: () => almoxarifadoService.listarItens(authUser!.tenantId), enabled: !!authUser?.tenantId })
}

export function useCriarItemAlmoxarifado() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d: any) => almoxarifadoService.criarItem(d), onSuccess: () => qc.invalidateQueries({ queryKey: ['almoxarifado_itens'] }) })
}

export function useAtualizarItemAlmoxarifado() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: any }) => almoxarifadoService.atualizarItem(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['almoxarifado_itens'] }) })
}

export function useDeletarItemAlmoxarifado() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => almoxarifadoService.deletarItem(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['almoxarifado_itens'] }) })
}

export function useMovimentacoes() {
  const { authUser } = useAuth()
  return useQuery({ queryKey: ['almoxarifado_mov', authUser?.tenantId], queryFn: () => almoxarifadoService.listarMovimentacoes(authUser!.tenantId), enabled: !!authUser?.tenantId })
}

export function useCriarMovimentacao() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d: any) => almoxarifadoService.criarMovimentacao(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['almoxarifado_itens'] }); qc.invalidateQueries({ queryKey: ['almoxarifado_mov'] }) } })
}

export function useDeletarMovimentacao() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => almoxarifadoService.deletarMovimentacao(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['almoxarifado_mov'] }) })
}
