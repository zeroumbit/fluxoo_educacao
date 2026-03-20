import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { autorizacoesService } from './service'
import { useAuth } from '@/modules/auth/AuthContext'
import { usePortalContext } from '@/modules/portal/context'
import { useResponsavel } from '@/modules/portal/hooks'

// ==========================================
// HOOKS ADMIN (Escola)
// ==========================================

export function useModelosAutorizacao() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['autorizacoes', 'modelos', authUser?.tenantId],
    queryFn: () => autorizacoesService.buscarModelos(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useModelosAutorizacaoAdmin() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['autorizacoes', 'modelos-admin', authUser?.tenantId],
    queryFn: () => autorizacoesService.buscarModelosAdmin(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
    staleTime: 30 * 1000,
  })
}

export function useCriarModeloAutorizacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: autorizacoesService.criarModeloEscola,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autorizacoes'] })
      queryClient.invalidateQueries({ queryKey: ['autorizacoes', 'portal'] })
    },
  })
}

export function useAtualizarModeloAutorizacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      autorizacoesService.atualizarModelo(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autorizacoes'] })
      queryClient.invalidateQueries({ queryKey: ['autorizacoes', 'portal'] })
    },
  })
}

export function useToggleAtivoAutorizacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ativa }: { id: string; ativa: boolean }) =>
      autorizacoesService.toggleAtivo(id, ativa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autorizacoes'] })
    },
  })
}

export function useResumoAutorizacoesPorAluno(alunoId: string | null) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['autorizacoes', 'resumo', alunoId, authUser?.tenantId],
    queryFn: () => autorizacoesService.buscarResumoAutorizacoesPorAluno(alunoId!, authUser!.tenantId),
    enabled: !!alunoId && !!authUser?.tenantId,
    staleTime: 60 * 1000,
  })
}

export function useRespostasPorAluno(alunoId: string | null) {
  return useQuery({
    queryKey: ['autorizacoes', 'respostas-aluno', alunoId],
    queryFn: () => autorizacoesService.buscarRespostasPorAluno(alunoId!),
    enabled: !!alunoId,
  })
}

// ==========================================
// HOOKS PORTAL (Responsável)
// ==========================================

export function useAutorizacoesPortal(alunoId: string | null) {
  const { tenantId } = usePortalContext()
  const { data: responsavel } = useResponsavel()
  return useQuery({
    queryKey: ['autorizacoes', 'portal', responsavel?.id, alunoId, tenantId],
    queryFn: () => autorizacoesService.buscarRespostasResponsavel(responsavel!.id, alunoId!, tenantId!),
    enabled: !!responsavel?.id && !!alunoId && !!tenantId,
    staleTime: 30 * 1000,
  })
}

export function useResponderAutorizacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: {
      tenant_id: string
      modelo_id: string
      aluno_id: string
      responsavel_id: string
      aceita: boolean
      texto_lido: boolean
    }) => autorizacoesService.responderAutorizacao(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autorizacoes'] })
    },
  })
}
