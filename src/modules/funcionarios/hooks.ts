import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { funcionariosService } from './service'

export function useFuncionarios() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['funcionarios', authUser?.tenantId],
    queryFn: () => funcionariosService.listar(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useCriarFuncionario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => funcionariosService.criar(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funcionarios'] }),
  })
}

export function useAtualizarFuncionario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => funcionariosService.atualizar(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funcionarios'] }),
  })
}

export function useExcluirFuncionario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => funcionariosService.excluir(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funcionarios'] }),
  })
}

export function useCriarUsuarioEscola() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ funcionarioId, email, senha, areasAcesso }: { funcionarioId: string; email: string; senha: string; areasAcesso: string[] }) =>
      funcionariosService.criarUsuarioEscola(funcionarioId, email, senha, areasAcesso),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funcionarios'] }),
  })
}

/**
 * Hook para buscar funcionário logado atualmente
 * Usa o user_id do contexto de auth
 */
export function useFuncionarioLogado() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['funcionario-logado', authUser?.user.id],
    queryFn: () => funcionariosService.buscarPorUserId(authUser!.user.id!),
    enabled: !!authUser?.user.id,
  })
}

/**
 * Hook para verificar se funcionário tem acesso a uma área específica
 * @param area - Área a verificar (ex: 'Financeiro', 'Pedagógico')
 */
export function useVerificarAcessoFuncionario(area: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['funcionario-acesso', area, authUser?.user.id],
    queryFn: async () => {
      if (!authUser?.user.id) return false
      return funcionariosService.verificarAcesso(authUser.user.id, area)
    },
    enabled: !!authUser?.user.id,
  })
}
