import { supabase } from '@/lib/supabase'
import type { CobrancaInsert } from '@/lib/database.types'

export const financeiroService = {
  async listar(tenantId: string, filtroStatus?: string) {
    let query = supabase
      .from('cobrancas')
      .select('*, alunos(nome_completo)')
      .eq('tenant_id', tenantId)
      .order('data_vencimento', { ascending: false })

    if (filtroStatus && filtroStatus !== 'todos') {
      query = query.eq('status', filtroStatus)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async criar(cobranca: CobrancaInsert) {
    const { data, error } = await supabase
      .from('cobrancas')
      .insert(cobranca)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async marcarComoPago(id: string) {
    const { error } = await supabase
      .from('cobrancas')
      .update({ status: 'pago' })
      .eq('id', id)

    if (error) throw error
  },

  async contarAbertas(tenantId: string) {
    const { count, error } = await supabase
      .from('cobrancas')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('status', ['a_vencer', 'atrasado'])

    if (error) throw error
    return count || 0
  },

  async listarPorAluno(alunoId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('cobrancas')
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .order('data_vencimento', { ascending: false })

    if (error) throw error
    return data
  },

  async excluir(id: string) {
    const { error } = await supabase
      .from('cobrancas')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async desfazerPagamento(id: string) {
    const { error } = await supabase
      .from('cobrancas')
      .update({ status: 'a_vencer' })
      .eq('id', id)

    if (error) throw error
  },

  async gerarCobrancasIniciaisGenerico(params: {
    aluno_id: string,
    tenant_id: string,
    data_inicio: string,
    valor_mensalidade: number,
    valor_matricula?: number,
    unidade?: string
  }) {
    const { 
      aluno_id, 
      tenant_id, 
      data_inicio, 
      valor_mensalidade, 
      valor_matricula,
      unidade
    } = params

    const sufixo = unidade ? ` - ${unidade}` : ''

    // 1. Gerar Cobrança da MATRÍCULA (Taxa Única)
    if (valor_matricula && Number(valor_matricula) > 0) {
      await this.criar({
        tenant_id,
        aluno_id,
        descricao: `Taxa de Matrícula${sufixo}`,
        valor: Number(valor_matricula),
        data_vencimento: data_inicio, 
        status: 'a_vencer'
      })
    }

    // 2. Gerar PRIMEIRA MENSALIDADE Proporcional
    if (valor_mensalidade && Number(valor_mensalidade) > 0) {
      // Buscamos a configuração para saber o dia de vencimento
      const { data: config } = await (supabase.from('config_financeira' as any) as any)
        .select('dia_vencimento_padrao')
        .eq('tenant_id', tenant_id)
        .maybeSingle()

      const diaVencimento = config?.dia_vencimento_padrao || 10
      const dataInicioObj = new Date(data_inicio + 'T12:00:00')
      
      const ultimoDiaMes = new Date(dataInicioObj.getFullYear(), dataInicioObj.getMonth() + 1, 0).getDate()
      const diaInicio = dataInicioObj.getDate()
      const diasRestantes = ultimoDiaMes - diaInicio + 1
      
      const valorProporcional = (Number(valor_mensalidade) / ultimoDiaMes) * diasRestantes
      
      // Data de vencimento - Baseada no dia padrão da escola
      let dataVencimento = new Date(dataInicioObj.getFullYear(), dataInicioObj.getMonth(), diaVencimento)
      // Se a data de início (matrícula) já passou do dia de vencimento do mês atual, joga para o próximo mês
      if (dataInicioObj.getDate() > diaVencimento) {
        dataVencimento.setMonth(dataVencimento.getMonth() + 1)
      }

      const valorFormatado = Number(valorProporcional.toFixed(2))
      
      // Só cria se o valor for realmente maior que zero
      if (valorFormatado > 0) {
        await this.criar({
          tenant_id,
          aluno_id,
          descricao: `1ª Mensalidade Proporcional (${diasRestantes} dias)${sufixo}`,
          valor: valorFormatado,
          data_vencimento: dataVencimento.toISOString().split('T')[0],
          status: 'a_vencer'
        })
      }
    }
  },

  async gerarCobrancasIniciaisMatricula(matricula: any) {
    // Tenta pegar o valor da mensalidade da turma
    const { data: turma } = await (supabase.from('turmas' as any) as any)
      .select('valor_mensalidade')
      .eq('tenant_id', matricula.tenant_id)
      .eq('nome', matricula.serie_ano)
      .maybeSingle()

    // Lógica inteligente: se a turma tiver valor, usa ele. 
    // Se não, usa o valor_matricula da própria matrícula como base para mensalidade (fallback comum no sistema)
    const valorMensalidadeBase = turma?.valor_mensalidade || matricula.valor_matricula || 0

    await this.gerarCobrancasIniciaisGenerico({
      aluno_id: matricula.aluno_id,
      tenant_id: matricula.tenant_id,
      data_inicio: matricula.data_matricula,
      valor_mensalidade: Number(valorMensalidadeBase),
      valor_matricula: Number(matricula.valor_matricula),
      unidade: matricula.serie_ano
    })
  }
}
