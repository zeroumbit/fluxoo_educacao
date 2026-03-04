import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { livrosService } from './service'
import { useAuth } from '@/modules/auth/AuthContext'
import type { Livro } from './types'

export function useDisciplinas() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['disciplinas', authUser?.tenantId],
    queryFn: () => livrosService.listarDisciplinas(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useLivros() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['livros', authUser?.tenantId],
    queryFn: () => livrosService.listarLivros(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useCriarLivro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ livro, turmasIds }: { livro: Omit<Livro, 'id' | 'created_at' | 'updated_at' | 'disciplina' | 'turmas'>; turmasIds: string[] }) =>
      livrosService.criarLivro(livro, turmasIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livros'] })
    },
  })
}

export function useEditarLivro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, livro, turmasIds }: { id: string; livro: Partial<Livro>; turmasIds: string[] }) =>
      livrosService.editarLivro(id, livro, turmasIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livros'] })
    },
  })
}

export function useExcluirLivro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => livrosService.excluirLivro(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livros'] })
    },
  })
}

export function useCriarDisciplina() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tenantId, nome }: { tenantId: string; nome: string }) => livrosService.criarDisciplina(tenantId, nome),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplinas'] })
    },
  })
}
