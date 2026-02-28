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
