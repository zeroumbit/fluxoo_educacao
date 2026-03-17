import { supabase } from '@/lib/supabase'

export interface MarketplaceCategory {
    id: string
    nome: string
    descricao: string | null
    icone: string
    ativo: boolean
    created_at: string
}

export const marketplaceService = {
    async listarCategorias(): Promise<MarketplaceCategory[]> {
        const { data, error } = await (supabase
            .from('marketplace_categorias' as any) as any)
            .select('*')
            .order('nome', { ascending: true })
        
        if (error) throw error
        return data || []
    },

    async cadastrarCategoria(nome: string, descricao: string, icone: string): Promise<MarketplaceCategory> {
        const { data, error } = await (supabase
            .from('marketplace_categorias' as any) as any)
            .insert([{ nome, descricao, icone }])
            .select()
            .single()
        
        if (error) throw error
        return data
    },

    async atualizarCategoria(id: string, updates: Partial<MarketplaceCategory>): Promise<MarketplaceCategory> {
        const { data, error } = await (supabase
            .from('marketplace_categorias' as any) as any)
            .update(updates)
            .eq('id', id)
            .select()
            .single()
        
        if (error) throw error
        return data
    },

    async removerCategoria(id: string): Promise<void> {
        const { error } = await (supabase
            .from('marketplace_categorias' as any) as any)
            .delete()
            .eq('id', id)
        
        if (error) throw error
    }
}
