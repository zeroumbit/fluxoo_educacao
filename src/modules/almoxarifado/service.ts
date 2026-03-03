import { supabase } from '@/lib/supabase'

export const almoxarifadoService = {
  async listarItens(tenantId: string) {
    const { data, error } = await supabase
      .from('almoxarifado_itens')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nome')
    if (error) {
      console.error('Erro ao listar itens do almoxarifado:', error)
      throw error
    }
    return data || []
  },

  async criarItem(item: any) {
    const { data, error } = await supabase
      .from('almoxarifado_itens')
      .insert({
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) {
      console.error('Erro ao criar item:', error)
      throw error
    }
    return data
  },

  async atualizarItem(id: string, updates: any) {
    const { data, error } = await supabase
      .from('almoxarifado_itens')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('Erro ao atualizar item:', error)
      throw error
    }
    return data
  },

  async deletarItem(id: string) {
    const { error } = await supabase
      .from('almoxarifado_itens')
      .delete()
      .eq('id', id)
    if (error) {
      console.error('Erro ao deletar item:', error)
      throw error
    }
  },

  async listarMovimentacoes(tenantId: string) {
    const { data, error } = await supabase
      .from('almoxarifado_movimentacoes')
      .select('*, item:almoxarifado_itens(nome)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Erro ao listar movimentações:', error)
      throw error
    }
    return data || []
  },

  async criarMovimentacao(mov: any) {
    // 1. Registra movimentação
    const { data, error } = await supabase
      .from('almoxarifado_movimentacoes')
      .insert(mov)
      .select()
      .single()
    if (error) {
      console.error('Erro ao criar movimentação:', error)
      throw error
    }

    // 2. Atualiza estoque
    const { data: item } = await supabase
      .from('almoxarifado_itens')
      .select('quantidade')
      .eq('id', mov.item_id)
      .single()
    
    if (item) {
      const novaQtd = mov.tipo === 'entrada' 
        ? item.quantidade + mov.quantidade 
        : item.quantidade - mov.quantidade
      
      await supabase
        .from('almoxarifado_itens')
        .update({ 
          quantidade: Math.max(0, novaQtd),
          updated_at: new Date().toISOString(),
        })
        .eq('id', mov.item_id)
    }
    return data
  },

  async deletarMovimentacao(id: string) {
    // Nota: Isso não reverte o estoque automaticamente
    // Para uma implementação completa, seria necessário registrar uma movimentação inversa
    const { error } = await supabase
      .from('almoxarifado_movimentacoes')
      .delete()
      .eq('id', id)
    if (error) {
      console.error('Erro ao deletar movimentação:', error)
      throw error
    }
  },
}
