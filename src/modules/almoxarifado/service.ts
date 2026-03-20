import { supabase } from '@/lib/supabase'
import { validarPermissao } from '@/lib/rbac-validation'

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

  async criarItem(item: any, userId?: string) {
    // Validação RBAC: almoxarifado.itens.create
    if (userId && item.tenant_id) {
      await validarPermissao(userId, item.tenant_id, 'almoxarifado.itens.create')
    }

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

  async atualizarItem(id: string, updates: any, userId?: string, tenantId?: string) {
    // Validação RBAC: almoxarifado.itens.update
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'almoxarifado.itens.update')
    }

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

  async deletarItem(id: string, userId?: string, tenantId?: string) {
    // Validação RBAC: almoxarifado.itens.delete
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'almoxarifado.itens.delete')
    }

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

  async criarMovimentacao(mov: any, userId?: string) {
    // Validação RBAC: almoxarifado.movimentacoes.create
    if (userId && mov.tenant_id) {
      await validarPermissao(userId, mov.tenant_id, 'almoxarifado.movimentacoes.create')
    }

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

    // 3. Integração Financeira (Contas a Pagar)
    if (mov.tipo === 'entrada' && mov.gerar_financeiro && mov.valor_total > 0) {
      try {
        const { financeiroService } = await import('@/modules/financeiro/service')
        
        // Busca nome do item para a descrição
        const { data: itemInfo } = await supabase
          .from('almoxarifado_itens')
          .select('nome')
          .eq('id', mov.item_id)
          .single()

        const conta = await (financeiroService as any).criarContaPagar({
          tenant_id: mov.tenant_id,
          nome: `Compra de Material: ${itemInfo?.nome || 'Item do Almoxarifado'}`,
          favorecido: mov.fornecedor || 'Fornecedor não informado',
          valor: mov.valor_total,
          data_vencimento: mov.vencimento_financeiro || new Date().toISOString().split('T')[0],
          status: 'ativo',
          categoria: 'Almoxarifado'
        })

        // Vincula o ID do financeiro na movimentação
        if (conta?.id) {
          await supabase
            .from('almoxarifado_movimentacoes')
            .update({ financeiro_id: (conta as any).id })
            .eq('id', data.id)
        }
      } catch (finError) {
        console.error('⚠️ Erro ao gerar integração financeira do almoxarifado:', finError)
      }
    }

    return data
  },

  async deletarMovimentacao(id: string, userId?: string, tenantId?: string) {
    // Validação RBAC: almoxarifado.movimentacoes.delete
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'almoxarifado.movimentacoes.delete')
    }

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
