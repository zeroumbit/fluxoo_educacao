import { supabase } from '@/lib/supabase'
import type { Banner } from '@/types/shared'

export const bannersService = {
  async getActiveBanners(cidade: string): Promise<Banner[]> {
    if (!cidade) return []
    
    // Adiciona folga de 5 minutos no início para contornar discrepâncias de relógio cliente/servidor
    const now = new Date()
    const checkStart = new Date(now.getTime() + 5 * 60 * 1000).toISOString()
    const checkEnd = now.toISOString()

    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('status', 'ativo')
      .ilike('cidade', cidade)
      .lte('data_inicio', checkStart)
      .gte('data_fim', checkEnd)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) throw error
    return data || []
  }
}
