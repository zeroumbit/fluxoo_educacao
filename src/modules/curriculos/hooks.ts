import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { curriculosService } from './service'
import type { CurriculoInsert, Curriculo } from '@/lib/database.types'
import type { CurriculoLista } from './types'

/**
 * Hook para listar currículos públicos disponíveis
 */
export function useCurriculosPublicos(filtros?: { areas?: string[]; search?: string }) {
  const { authUser } = useAuth()
  return useQuery<CurriculoLista[]>({
    queryKey: ['curriculos-publicos', authUser?.tenantId, filtros],
    queryFn: () => curriculosService.listarPublicos(authUser!.tenantId, filtros),
    enabled: !!authUser?.tenantId,
  })
}

/**
 * Hook para buscar currículo detalhado por ID
 */
export function useCurriculo(id: string) {
  return useQuery<CurriculoLista | null>({
    queryKey: ['curriculo', id],
    queryFn: () => curriculosService.buscarPorId(id),
    enabled: !!id,
  })
}

/**
 * Hook para buscar currículo do usuário logado
 */
export function useMeuCurriculo() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['meu-curriculo', authUser?.user?.id],
    queryFn: () => curriculosService.buscarPorUserId(authUser!.user!.id!),
    enabled: !!authUser?.user?.id,
  })
}

/**
 * Hook para salvar currículo (criar ou atualizar)
 */
export function useSalvarCurriculo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CurriculoInsert) => curriculosService.salvar(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['curriculos-publicos'] })
      qc.invalidateQueries({ queryKey: ['meu-curriculo'] })
    },
  })
}

/**
 * Hook para atualizar currículo
 */
export function useAtualizarCurriculo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CurriculoInsert> }) => 
      curriculosService.atualizar(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['curriculos-publicos'] })
      qc.invalidateQueries({ queryKey: ['meu-curriculo'] })
    },
  })
}

/**
 * Hook para atualizar visibilidade do currículo
 */
export function useAtualizarVisibilidade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isPublico }: { id: string; isPublico: boolean }) =>
      curriculosService.atualizarVisibilidade(id, isPublico),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['curriculos-publicos'] })
      qc.invalidateQueries({ queryKey: ['meu-curriculo'] })
    },
  })
}

/**
 * Hook para atualizar status do currículo (ativo/inativo)
 */
export function useAtualizarStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isAtivo }: { id: string; isAtivo: boolean }) =>
      curriculosService.atualizarStatus(id, isAtivo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['curriculos-publicos'] })
      qc.invalidateQueries({ queryKey: ['meu-curriculo'] })
    },
  })
}
