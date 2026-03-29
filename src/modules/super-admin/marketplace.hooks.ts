import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { marketplaceService, type MarketplaceCategory } from './marketplace.service'
import { toast } from 'sonner'

export function useMarketplaceCategorias() {
    return useQuery({
        queryKey: ['marketplace_categorias'],
        queryFn: () => marketplaceService.listarCategorias()
    })
}

export function useCriarCategoria() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: { nome: string; descricao: string; icone: string; subcategorias?: string[]; ativo?: boolean }) => 
            marketplaceService.cadastrarCategoria(data.nome, data.descricao, data.icone, data.subcategorias, data.ativo),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketplace_categorias'] })
            toast.success('Categoria criada com sucesso!')
        },
        onError: (error: any) => {
            toast.error(`Erro ao criar categoria: ${error.message}`)
        }
    })
}

export function useAtualizarCategoria() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<MarketplaceCategory> }) => 
            marketplaceService.atualizarCategoria(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketplace_categorias'] })
            toast.success('Categoria atualizada!')
        },
        onError: (error: any) => {
            toast.error(`Erro ao atualizar: ${error.message}`)
        }
    })
}

export function useExcluirCategoria() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => marketplaceService.removerCategoria(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketplace_categorias'] })
            toast.success('Categoria removida!')
        },
        onError: (error: any) => {
      toast.error(`Erro ao remover: ${error.message}`)
    }
  })
}

export function useLojistas() {
  return useQuery({
    queryKey: ['marketplace_lojistas'],
    queryFn: () => marketplaceService.listarLojistas()
  })
}

export function useProfissionais() {
  return useQuery({
    queryKey: ['marketplace_profissionais'],
    queryFn: () => marketplaceService.listarProfissionais()
  })
}
