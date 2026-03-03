import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { assinaturaService } from './service'
import type { SolicitacaoUpgradeInsert } from '@/lib/database.types'

export function useEscola() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['escola', authUser?.tenantId],
    queryFn: () => assinaturaService.buscarEscola(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useAssinaturaAtiva() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['assinatura-ativa', authUser?.tenantId],
    queryFn: () => assinaturaService.buscarAssinaturaAtiva(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useLimiteAlunos() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['escola', 'limite', authUser?.tenantId],
    queryFn: () => assinaturaService.buscarLimiteAlunos(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useSolicitacoesUpgrade() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['solicitacoes-upgrade', authUser?.tenantId],
    queryFn: () => assinaturaService.buscarSolicitacoes(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useCriarSolicitacaoUpgrade() {
  const queryClient = useQueryClient()
  const { authUser } = useAuth()
  return useMutation({
    mutationFn: (solicitacao: SolicitacaoUpgradeInsert) => 
      assinaturaService.criarSolicitacao(solicitacao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-upgrade', authUser?.tenantId] })
    },
  })
}
