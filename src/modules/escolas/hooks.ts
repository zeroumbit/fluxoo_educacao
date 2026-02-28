import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { escolaService } from './service'
import type { EscolaInsert, EscolaUpdate } from '@/lib/database.types'

export function useEscolas() {
  return useQuery({
    queryKey: ['escolas'],
    queryFn: () => escolaService.listar(),
  })
}

export function useEscola(id: string) {
  return useQuery({
    queryKey: ['escolas', id],
    queryFn: () => escolaService.buscarPorId(id),
    enabled: !!id,
  })
}

export function usePlanos() {
  return useQuery({
    queryKey: ['planos'],
    queryFn: () => escolaService.listarPlanos(),
  })
}

export function useCriarEscola() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (escola: EscolaInsert) => escolaService.criar(escola),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escolas'] })
    },
  })
}

export function useAtualizarEscola() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, escola }: { id: string; escola: EscolaUpdate }) =>
      escolaService.atualizar(id, escola),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escolas'] })
    },
  })
}
