import { supabase } from '@/lib/supabase'
import type { CobrancaInsert } from '@/lib/database.types'
import { logger } from '@/lib/logger'
import { validarPermissao } from '@/lib/rbac-validation'

export const financeiroService = {
  /**
   * REPARO AUTOMÁTICO: Atualiza cobranças 'a_vencer' para 'atrasado' se a data passou.
   * Isso garante que a listagem e os filtros reflitam a realidade sem depender de cron jobs.
   */
  async repararStatusAtrasados(tenantId: string) {
    // 0. Busca configuração de carência via Motor de Configurações Tenant
    const { data: config } = await (supabase.from('configuracoes_escola' as any) as any)
      .select('config_financeira')
      .eq('tenant_id', tenantId)
      .is('vigencia_fim', null)
      .maybeSingle()

    const carencia = config?.config_financeira?.dias_carencia || 0
    const hoje = new Date()
    
    // Data limite: vencimento < (hoje - carencia) => atrasado
    const dataLimite = new Date(hoje)
    dataLimite.setDate(hoje.getDate() - carencia)
    const dataLimiteIso = dataLimite.toISOString().split('T')[0]
    
    // 1. Marcar como atrasado o que venceu ALÉM da carência
    await supabase
      .from('cobrancas')
      .update({ status: 'atrasado' })
      .eq('tenant_id', tenantId)
      .eq('status', 'a_vencer')
      .lt('data_vencimento', dataLimiteIso)

    // 2. Voltar para 'a_vencer' se a data foi prorrogada OU está dentro da carência (segurança)
    await supabase
      .from('cobrancas')
      .update({ status: 'a_vencer' })
      .eq('tenant_id', tenantId)
      .eq('status', 'atrasado')
      .gte('data_vencimento', dataLimiteIso)
  },

  async listar(tenantId: string, filtroStatus?: string) {
    // Garante integridade antes de listar
    await this.repararStatusAtrasados(tenantId)

    let query = supabase
      .from('cobrancas')
      .select('id, aluno_id, tenant_id, descricao, valor, status, data_vencimento, tipo_cobranca, turma_id, ano_letivo, created_at, alunos(nome_completo)')
      .eq('tenant_id', tenantId)
      .order('data_vencimento', { ascending: false })

    if (filtroStatus && filtroStatus !== 'todos') {
      query = query.eq('status', filtroStatus)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async criar(cobranca: CobrancaInsert, userId?: string) {
    // Validação RBAC: financeiro.cobrancas.create
    if (userId && cobranca.tenant_id) {
      await validarPermissao(userId, cobranca.tenant_id, 'financeiro.cobrancas.create')
    }

    const { data, error } = await supabase
      .from('cobrancas')
      .insert(cobranca)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async atualizar(id: string, cobranca: Partial<CobrancaInsert>, userId?: string, tenantId?: string) {
    // Validação RBAC: financeiro.cobrancas.update
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'financeiro.cobrancas.update')
    }

    const { data, error } = await supabase
      .from('cobrancas')
      .update(cobranca)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async marcarComoPago(id: string, userId?: string, tenantId?: string) {
    // Validação RBAC: financeiro.cobrancas.pay
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'financeiro.cobrancas.pay')
    }

    const { error } = await supabase
      .from('cobrancas')
      .update({ status: 'pago' })
      .eq('id', id)

    if (error) throw error
  },

  async contarAbertas(tenantId: string) {
    await this.repararStatusAtrasados(tenantId)

    const { count, error } = await supabase
      .from('cobrancas')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('status', ['a_vencer', 'atrasado'])

    if (error) throw error
    return count || 0
  },

  async listarPorAluno(alunoId: string, tenantId: string) {
    await this.repararStatusAtrasados(tenantId)

    const { data, error } = await supabase
      .from('cobrancas')
      .select('id, aluno_id, tenant_id, descricao, valor, status, data_vencimento, tipo_cobranca, turma_id, ano_letivo, created_at')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .order('data_vencimento', { ascending: false })

    if (error) throw error
    return data
  },

  async excluir(id: string, userId?: string, tenantId?: string) {
    // Validação RBAC: financeiro.cobrancas.delete
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'financeiro.cobrancas.delete')
    }

    const { error } = await supabase
      .from('cobrancas')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async desfazerPagamento(id: string, userId?: string, tenantId?: string) {
    // Validação RBAC: financeiro.cobrancas.pay (reverter pagamento)
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'financeiro.cobrancas.pay')
    }

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
    unidade?: string,
    turma_id?: string | null,
    ano_letivo?: number | null
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

    // Buscamos a configuração via Motor de Configurações Tenant para verificar se deve cobrar matrícula
    const { data: config } = await (supabase.from('configuracoes_escola' as any) as any)
      .select('config_financeira')
      .eq('tenant_id', tenant_id)
      .is('vigencia_fim', null)
      .maybeSingle()

    const deveCobrarMatricula = config?.config_financeira?.cobrar_matricula !== false // Default true se não existir

    // 1. Gerar Cobrança da MATRÍCULA (Taxa Única)
    if (deveCobrarMatricula && valor_matricula && Number(valor_matricula) > 0) {
      const descricaoMatricula = `Matrícula - ${unidade || 'Taxa de Matrícula'}`
      logger.debug('[gerarCobrancasIniciaisGenerico] Criando cobrança de matrícula:', {
        descricao: descricaoMatricula,
        valor: Number(valor_matricula),
        data_vencimento: data_inicio,
        aluno_id,
        tenant_id
      })
      
      await this.criar({
        tenant_id,
        aluno_id,
        descricao: descricaoMatricula,
        valor: Number(valor_matricula),
        data_vencimento: data_inicio,
        status: 'a_vencer',
        tipo_cobranca: 'mensalidade',
        turma_id: params.turma_id || null,
        ano_letivo: params.ano_letivo || null
      })
    }

    // 2. Gerar PRIMEIRA MENSALIDADE Proporcional
    if (valor_mensalidade && Number(valor_mensalidade) > 0) {
      const diaVencimento = config?.config_financeira?.dia_vencimento_padrao || 10
      const dataInicioObj = new Date(data_inicio + 'T12:00:00')
      
      const ultimoDiaMes = new Date(dataInicioObj.getFullYear(), dataInicioObj.getMonth() + 1, 0).getDate()
      const diaInicio = dataInicioObj.getDate()
      const diasRestantes = ultimoDiaMes - diaInicio + 1
      
      let valorMensalidadeComDesconto = Number(valor_mensalidade)
      
      // 2.1 Buscar desconto individual do aluno
      const { data: aluno } = await supabase
        .from('alunos')
        .select('desconto_valor, desconto_tipo, desconto_inicio, desconto_fim')
        .eq('id', aluno_id)
        .single()

      if (aluno?.desconto_valor) {
        const hoje = new Date().toISOString().split('T')[0]
        const inicioValido = !aluno.desconto_inicio || aluno.desconto_inicio <= hoje
        const fimValido = !aluno.desconto_fim || aluno.desconto_fim >= hoje

        if (inicioValido && fimValido) {
          if (aluno.desconto_tipo === 'porcentagem') {
            valorMensalidadeComDesconto = valorMensalidadeComDesconto * (1 - (aluno.desconto_valor / 100))
          } else {
            valorMensalidadeComDesconto = Math.max(0, valorMensalidadeComDesconto - aluno.desconto_valor)
          }
        }
      }

      // 2.2 Buscar desconto de irmãos (Regra de Negócio via Motor de Configurações Tenant)
      const descontoIrmaosPerc = config?.config_financeira?.desconto_irmaos_perc || 0
      if (descontoIrmaosPerc > 0) {
        // Busca responsáveis deste aluno
        const { data: meusResponsaveis } = await (supabase.from('aluno_responsavel' as any) as any)
          .select('responsavel_id')
          .eq('aluno_id', aluno_id)
        
        if (meusResponsaveis && meusResponsaveis.length > 0) {
          const respIds = meusResponsaveis.map((r: any) => r.responsavel_id)
          // Verifica se algum desses responsáveis tem outro aluno vinculado (irmão)
          const { data: irmaos } = await (supabase.from('aluno_responsavel' as any) as any)
            .select('aluno_id')
            .in('responsavel_id', respIds)
            .neq('aluno_id', aluno_id)
            .limit(1)

          if (irmaos && irmaos.length > 0) {
            // Aplicar desconto de irmão configurado na escola (cumulativo com individual)
            valorMensalidadeComDesconto = valorMensalidadeComDesconto * (1 - (descontoIrmaosPerc / 100))
          }
        }
      }

      const valorProporcional = (valorMensalidadeComDesconto / ultimoDiaMes) * diasRestantes
      const valorFormatado = Number(valorProporcional.toFixed(2))

      // ============================================================
      // NOVA REGRA: Gerar todas as mensalidades automáticas
      // ============================================================
      // Busca quantidade de mensalidades para gerar (padrão: 12)
      const qtdMensalidades = config?.config_financeira?.qtd_mensalidades_automaticas || 12
      const diaVencimentoPadrao = config?.config_financeira?.dia_vencimento_padrao || 10

      // 1. Gerar PRIMEIRA mensalidade proporcional (dias restantes do mês)
      // Vence no dia padrão do mês seguinte
      const dataVencimentoProporcional = new Date(dataInicioObj.getFullYear(), dataInicioObj.getMonth() + 1, diaVencimentoPadrao)

      if (valorFormatado > 0) {
        await this.criar({
          tenant_id,
          aluno_id,
          descricao: `1ª Mensalidade Proporcional (${diasRestantes} dias)${sufixo}`,
          valor: valorFormatado,
          data_vencimento: dataVencimentoProporcional.toISOString().split('T')[0],
          status: 'a_vencer',
          tipo_cobranca: 'mensalidade',
          turma_id: params.turma_id || null,
          ano_letivo: params.ano_letivo || null
        })
      }

      // 2. Gerar mensalidades CHEIAS restantes (uma por mês)
      // A proporcional cobre o primeiro mês parcial e vence no mês seguinte (mês+1).
      // As mensalidades cheias começam no mês SEGUINTE ao da proporcional (mês+2).
      // Total gerado: 1 proporcional + (qtdMensalidades - 1) mensalidades cheias.
      for (let i = 2; i <= qtdMensalidades; i++) {
        const dataVencimentoMensalidade = new Date(dataInicioObj.getFullYear(), dataInicioObj.getMonth() + i, diaVencimentoPadrao)
        
        // Ajusta para o último dia do mês se o dia de vencimento for maior
        const ultimoDiaDoMesVencimento = new Date(dataVencimentoMensalidade.getFullYear(), dataVencimentoMensalidade.getMonth() + 1, 0).getDate()
        if (diaVencimentoPadrao > ultimoDiaDoMesVencimento) {
          dataVencimentoMensalidade.setDate(ultimoDiaDoMesVencimento)
        }

        const mesReferencia = dataVencimentoMensalidade.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

        await this.criar({
          tenant_id,
          aluno_id,
          descricao: `Mensalidade ${mesReferencia.charAt(0).toUpperCase() + mesReferencia.slice(1)}${sufixo}`,
          valor: Number(valorMensalidadeComDesconto.toFixed(2)),
          data_vencimento: dataVencimentoMensalidade.toISOString().split('T')[0],
          status: 'a_vencer',
          tipo_cobranca: 'mensalidade',
          turma_id: params.turma_id || null,
          ano_letivo: params.ano_letivo || null
        })
      }
      // ============================================================
    }
  },

  async gerarCobrancasIniciaisMatricula(matricula: any) {
    // Tenta pegar o valor da mensalidade da turma
    const { data: turma } = await (supabase.from('turmas' as any) as any)
      .select('valor_mensalidade')
      .eq('tenant_id', matricula.tenant_id)
      .eq('id', matricula.turma_id)
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
      unidade: matricula.serie_ano,
      turma_id: matricula.turma_id,
      ano_letivo: Number(matricula.ano_letivo)
    })
  },

  async sincronizarCobrancasMatricula(matricula: any) {
    // Busca cobranças pendentes do aluno que sejam de mensalidade/matrícula
    const { data: cobrancas, error } = await supabase
      .from('cobrancas')
      .select('*')
      .eq('aluno_id', matricula.aluno_id)
      .eq('tenant_id', matricula.tenant_id)
      .eq('tipo_cobranca', 'mensalidade') // Sincroniza apenas o que é mensalidade/matrícula base
      .in('status', ['a_vencer', 'atrasado'])

    if (error || !cobrancas) return

    for (const cobranca of cobrancas) {
      const desc = cobranca.descricao.toLowerCase()
      const isMatricula = desc.includes('matrícula') || desc.includes('matricula')
      const isMensalidade = desc.includes('mensalidade')

      // Sincroniza valor da taxa de matrícula
      if (isMatricula && !isMensalidade) {
        if (Number(cobranca.valor) !== Number(matricula.valor_matricula)) {
          await this.atualizar(cobranca.id, { valor: Number(matricula.valor_matricula) })
        }
      }
      
      // Sincroniza valores de mensalidades pendentes (opcional, dependendo da regra, mas solicitado pelo usuário)
      // Se a turma tiver valor de mensalidade, usamos ela como base
      if (isMensalidade) {
         // Buscamos o valor da turma se necessário ou usamos o valor da matrícula como referência
          const { data: turma } = await (supabase.from('turmas' as any) as any)
            .select('valor_mensalidade')
            .eq('tenant_id', matricula.tenant_id)
            .eq('id', matricula.turma_id)
            .maybeSingle()
          
          const novoValor = turma?.valor_mensalidade || matricula.valor_matricula || cobranca.valor
          
          if (Number(cobranca.valor) !== Number(novoValor)) {
            await this.atualizar(cobranca.id, { valor: Number(novoValor) })
          }
      }
    }
  },

  // ==========================================
  // CONTAS A PAGAR (DESPESAS)
  // ==========================================
  async listarContasPagar(tenantId: string) {
    const { data, error } = await supabase
      .from('contas_pagar')
      .select('id, tenant_id, descricao, valor, status, data_vencimento, fornecedor, categoria, created_at, updated_at')
      .eq('tenant_id', tenantId)
      .order('data_vencimento', { ascending: true })

    if (error) throw error
    return data
  },

  async criarContaPagar(conta: any, userId?: string) {
    // Validação RBAC: financeiro.contas_pagar.create
    if (userId && conta.tenant_id) {
      await validarPermissao(userId, conta.tenant_id, 'financeiro.contas_pagar.create')
    }

    const { data, error } = await supabase
      .from('contas_pagar')
      .insert({
        ...conta,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async atualizarContaPagar(id: string, updates: any, userId?: string, tenantId?: string) {
    // Validação RBAC: financeiro.contas_pagar.update
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'financeiro.contas_pagar.update')
    }

    const { data, error } = await supabase
      .from('contas_pagar')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async excluirContaPagar(id: string, userId?: string, tenantId?: string) {
    // Validação RBAC: financeiro.contas_pagar.delete
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'financeiro.contas_pagar.delete')
    }

    const { error } = await supabase
      .from('contas_pagar')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async marcarContaComoPaga(id: string, userId?: string, tenantId?: string) {
    // Validação RBAC: financeiro.contas_pagar.pay
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'financeiro.contas_pagar.pay')
    }

    const { error } = await supabase
      .from('contas_pagar')
      .update({
        status: 'pago',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
  },

  // ==========================================
  // COBRANCAS V2 (Com Encargos)
  // ==========================================
  
  /**
   * Lista as cobranças utilizando a VIEW otimizada que calcula os encargos no banco
   */
  async listarComEncargos(tenantId: string, filtroStatus?: string) {
    let query = (supabase.from('vw_cobrancas_com_encargos' as any) as any)
      .select('*, alunos(nome_completo, foto_url, status), turmas(nome)', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('data_vencimento', { ascending: false })

    if (filtroStatus && filtroStatus !== 'todos') {
      query = query.eq('status', filtroStatus)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  /**
   * Lista as cobranças com encargos para um aluno específico
   */
  async listarComEncargosPorAluno(alunoId: string, tenantId: string) {
    const { data, error } = await (supabase.from('vw_cobrancas_com_encargos' as any) as any)
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .order('data_vencimento', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Registra um pagamento (manual) usando a nova RPC com cálculo de juros/multa automático
   */
  async registrarPagamentoManual(cobrancaId: string, formaPagamento?: string, comprovanteUrl?: string, userId?: string, tenantId?: string) {
     if (userId && tenantId) {
       await validarPermissao(userId, tenantId, 'financeiro.cobrancas.pay')
     }

     const { data, error } = await (supabase.rpc('registrar_pagamento_cobranca', {
        p_cobranca_id: cobrancaId,
        p_forma_pagamento: formaPagamento || null,
        p_comprovante_url: comprovanteUrl || null,
        p_usuario_id: userId || null
     }) as any)

     if (error) {
       logger.error('Erro na RPC registrar_pagamento_cobranca:', error)
       throw error
     }
     
     if (!data?.success) {
       throw new Error(data?.error || 'Erro desconhecido ao registrar pagamento')
     }

     return data
  },
}
