import type { SolicitacaoUpgradeInsert } from '@/lib/database.types'
import { precificacaoService } from '@/modules/precificacao/service'
import { useAuth } from '@/modules/auth/AuthContext'
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'
import { assinaturaService } from './service'

export function useEscola() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['escola', authUser?.tenantId],
    queryFn: () => assinaturaService.buscarEscola(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function usePlanos() {
  return useQuery({
    queryKey: ['planos-disponiveis'],
    queryFn: () => assinaturaService.buscarPlanos(),
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

// ========== PRECIFICAÇÃO (ESCOLA) ==========
export function usePrecoVigente() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['preco-vigente', authUser?.tenantId],
    queryFn: () => precificacaoService.getPrecoVigente(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useAssinaturaModulos() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['assinatura-modulos', authUser?.tenantId],
    queryFn: () => precificacaoService.getAssinaturaModulos(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useAtivarModulo() {
  const queryClient = useQueryClient()
  const { authUser } = useAuth()
  return useMutation({
    mutationFn: (moduloCodigo: string) =>
      precificacaoService.ativarModulo(authUser!.tenantId, moduloCodigo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assinatura-modulos', authUser?.tenantId] })
    },
  })
}

export function useAlunosPorFilial() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['alunos-por-filial', authUser?.tenantId],
    queryFn: () => precificacaoService.getAlunosPorFilial(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function usePrecosModulos() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['precos-modulos-vigente', authUser?.tenantId],
    queryFn: () => precificacaoService.getPrecosModulos(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}
