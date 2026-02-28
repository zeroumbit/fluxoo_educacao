import { supabase } from '@/lib/supabase'

export const almoxarifadoService = {
  async listarItens(tenantId: string) {
    const { data, error } = await (supabase.from('almoxarifado_itens' as any) as any)
      .select('*').eq('tenant_id', tenantId).order('nome')
    if (error) throw error
    return (data as any[]) || []
  },
  async criarItem(item: any) {
    const { data, error } = await (supabase.from('almoxarifado_itens' as any) as any).insert(item).select().single()
    if (error) throw error
    return data
  },
  async listarMovimentacoes(tenantId: string) {
    const { data, error } = await (supabase.from('almoxarifado_movimentacoes' as any) as any)
      .select('*, item:almoxarifado_itens(nome)')
      .eq('tenant_id', tenantId).order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },
  async criarMovimentacao(mov: any) {
    // 1. Registra movimentação
    const { data, error } = await (supabase.from('almoxarifado_movimentacoes' as any) as any).insert(mov).select().single()
    if (error) throw error
    // 2. Atualiza estoque
    const { data: item } = await (supabase.from('almoxarifado_itens' as any) as any).select('quantidade').eq('id', mov.item_id).single()
    if (item) {
      const novaQtd = mov.tipo === 'entrada' ? (item as any).quantidade + mov.quantidade : (item as any).quantidade - mov.quantidade
      await (supabase.from('almoxarifado_itens' as any) as any).update({ quantidade: Math.max(0, novaQtd), updated_at: new Date().toISOString() }).eq('id', mov.item_id)
    }
    return data
  },
}
