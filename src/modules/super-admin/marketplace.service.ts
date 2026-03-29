import { supabase } from '@/lib/supabase'

export interface MarketplaceCategory {
    id: string
    nome: string
    descricao: string | null
    icone: string
    ativo: boolean
    subcategorias?: string[]
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

    async cadastrarCategoria(nome: string, descricao: string, icone: string, subcategorias: string[] = [], ativo: boolean = true): Promise<MarketplaceCategory> {
        const { data, error } = await (supabase
            .from('marketplace_categorias' as any) as any)
            .insert([{ nome, descricao, icone, subcategorias, ativo }])
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
  },

  async listarLojistas() {
    const { data, error } = await (supabase
      .from('lojistas' as any) as any)
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async listarProfissionais() {
    try {
      const { data, error } = await (supabase
        .from('curriculos' as any) as any)
        .select('*')
        .or('busca_vaga.eq.true,presta_servico.eq.true')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.warn('Erro ao listar profissionais (RLS/403):', error.message)
        return []
      }
      return data || []
    } catch (err) {
      console.warn('Erro na query de profissionais:', err)
      return []
    }
  }
}
