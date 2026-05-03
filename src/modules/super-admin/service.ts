import { supabase } from '@/lib/supabase'

export const superAdminService = {
  // ==========================================
  // DASHBOARD
  // ==========================================
  async getDashboardStats() {
    // Função auxiliar para tratar valores monetários
    const parseCurrency = (val: any) => {
      if (typeof val === 'number') return val
      if (typeof val === 'string') {
        // Remove tudo exceto dígitos, ponto e vírgula
        const cleaned = val.replace(/[^\d.,]/g, '')
        // Substituir vírgula por ponto (formato brasileiro)
        const normalized = cleaned.replace(',', '.')
        return Number(normalized) || 0
      }
      return 0
    }

    const { count: totalEscolas } = await (supabase.from('escolas' as any) as any).select('*', { count: 'exact', head: true })

    const { count: assinaturasAtivas } = await (supabase.from('assinaturas' as any) as any).select('*', { count: 'exact', head: true })
      .eq('status', 'ativa')

    const { count: totalAlunos } = await (supabase.from('alunos' as any) as any).select('*', { count: 'exact', head: true })

    const { count: faturasPendentes } = await (supabase.from('faturas' as any) as any).select('*', { count: 'exact', head: true })
      .eq('status', 'pendente_confirmacao')

    const { data: escolasRecentes } = await (supabase.from('escolas' as any) as any)
      .select('id, razao_social, created_at, status_assinatura')
      .order('created_at', { ascending: false })
      .limit(5)

    // Saúde Financeira Global (Todos os Tenantes)
    const [cobrancasRes, contasPagarRes, salariosRes] = await Promise.all([
      (supabase.from('cobrancas' as any) as any).select('valor').in('status', ['a_vencer', 'atrasado']),
      (supabase.from('contas_pagar' as any) as any).select('valor').neq('status', 'pago'),
      (supabase.from('funcionarios' as any) as any).select('salario_bruto').eq('status', 'ativo').gt('salario_bruto', 0)
    ])

    const totalReceber = (cobrancasRes.data as any[])?.reduce((acc, c) => acc + (Number(c.valor) || 0), 0) || 0
    const totalDespesas = (contasPagarRes.data as any[])?.reduce((acc, c) => acc + (Number(c.valor) || 0), 0) || 0
    const totalSalarios = (salariosRes.data as any[])?.reduce((acc, c) => acc + (Number(c.salario_bruto) || 0), 0) || 0

    const saudeFinanceiraGlobal = totalReceber - (totalDespesas + totalSalarios)

    const { count: faturasPixPendentes } = await (supabase.from('faturas' as any) as any).select('*', { count: 'exact', head: true })
      .eq('status', 'pendente_confirmacao')
      .eq('forma_pagamento', 'pix_manual')

    const { count: faturasAtrasadas } = await (supabase.from('faturas' as any) as any).select('*', { count: 'exact', head: true })
      .eq('status', 'atrasado')

    // Buscar assinaturas usando a função existente que já traz os dados corretamente
    let assinaturasData: any[] = []
    try {
      assinaturasData = await this.getAssinaturas()
    } catch (err) {
      console.error('Erro ao buscar assinaturas via getAssinaturas:', err)
    }

    // Log para debug (ver no console do navegador)
    console.log('[DEBUG] Assinaturas via getAssinaturas:', assinaturasData)

    const faturamentoTotal = (assinaturasData as any[])?.reduce((acc, assinatura) => {
      // Tratar plano (pode ser array ou objeto)
      let plano = assinatura.plano as any
      if (Array.isArray(plano)) {
        plano = plano.length > 0 ? plano[0] : null
      }
      
      if (!plano) return acc
      
      // O plano retornado por getAssinaturas() tem 'nome', precisamos do valor_por_aluno
      // Vamos buscar o valor do plano diretamente da tabela planos
      const valorPorAluno = parseCurrency(plano.valor_por_aluno)
      const limiteAlunos = Number(assinatura.limite_alunos_contratado) || 0
      
      if (valorPorAluno > 0 && limiteAlunos > 0) {
        return acc + (valorPorAluno * limiteAlunos)
      }
      return acc
    }, 0) || 0

    return {
      totalEscolas: totalEscolas || 0,
      assinaturasAtivas: assinaturasAtivas || 0,
      totalAlunos: totalAlunos || 0,
      faturasPendentes: faturasPendentes || 0,
      faturasPixPendentes: faturasPixPendentes || 0,
      faturasAtrasadas: faturasAtrasadas || 0,
      escolasRecentes: (escolasRecentes as any[]) || [],
      saudeFinanceiraGlobal,
      faturamentoTotal
    }
  },

  // ==========================================
  // PLANOS
  // ==========================================
  async getPlanos() {
    const { data, error } = await (supabase.from('planos' as any) as any).select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data as any[]
  },

  async upsertPlano(plano: any) {
    // Regra de negócio: Apenas 1 plano ativo por combinação (tipo_empresa + tipo_pagamento)
    if (plano.status === true) {
      const { data: planosConflitantes } = await (supabase.from('planos' as any) as any)
        .select('id, nome')
        .eq('tipo_empresa', plano.tipo_empresa)
        .eq('tipo_pagamento', plano.tipo_pagamento)
        .eq('status', true)
        .neq('id', plano.id || '') // Exclui o próprio plano se for edição
        
      if (planosConflitantes && planosConflitantes.length > 0) {
        throw new Error(
          `Já existe um plano ativo para "${plano.tipo_empresa}" com pagamento "${plano.tipo_pagamento}". ` +
          `Plano existente: ${planosConflitantes[0].nome}. ` +
          `Desative-o antes de criar um novo.`
        )
      }
    }

    const { data, error } = await (supabase.from('planos' as any) as any)
      .upsert({ ...plano, updated_at: new Date().toISOString() })
      .select().maybeSingle()
    if (error) throw error
    if (!data) throw new Error('Não foi possível salvar o plano.')
    return data
  },

  async deletePlano(id: string) {
    const { error } = await (supabase.from('planos' as any) as any)
      .update({ status: false, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
    if (error) throw error
  },

  // ==========================================
  // MÓDULOS
  // ==========================================
  async getModulos() {
    const { data, error } = await (supabase.from('modulos' as any) as any).select('*').order('nome')
    if (error) throw error
    return data as any[]
  },

  async upsertModulo(modulo: any) {
    const { data, error } = await (supabase.from('modulos' as any) as any).upsert(modulo).select().maybeSingle()
    if (error) throw error
    if (!data) throw new Error('Não foi possível salvar o módulo.')
    return data
  },

  async deleteModulo(id: string) {
    const { error } = await (supabase.from('modulos' as any) as any).delete().eq('id', id)
    if (error) throw error
  },

  // ==========================================
  // PLANO_MODULO (vínculo)
  // ==========================================
  async getPlanoModulos(planoId: string) {
    const { data, error } = await (supabase.from('plano_modulo' as any) as any).select('*, modulo:modulos(*)').eq('plano_id', planoId)
    if (error) throw error
    return data as any[]
  },

  async setPlanoModulos(planoId: string, moduloIds: string[]) {
    // Remove vínculos atuais
    await (supabase.from('plano_modulo' as any) as any).delete().eq('plano_id', planoId)
    // Insere novos
    if (moduloIds.length > 0) {
      const rows = moduloIds.map(mid => ({ plano_id: planoId, modulo_id: mid }))
      const { error } = await (supabase.from('plano_modulo' as any) as any).insert(rows as any)
      if (error) throw error
    }
  },

  // ==========================================
  // ESCOLAS (TENANTS)
  // ==========================================
  async getEscolas() {
    const { data, error } = await (supabase.from('escolas' as any) as any)
      .select('*, plano:planos(nome, valor_por_aluno)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },

async updateEscolaStatus(id: string, status: string) {
    // Super Admin pode ativar/desativar apenas via funções específicas
    if (status === 'ativa') {
      return this.aprovarEscola(id)
    } else if (status === 'suspensa') {
      return this.suspenderEscola(id, 'Suspensa pelo Super Admin')
    }
    throw new Error('Use aprovarEscola ou suspenderEscola')
  },

  async aprovarEscola(id: string) {
    const { data, error } = await supabase.rpc('fn_aprovar_escola' as any, {
      p_escola_id: id,
      p_motivo: 'Aprovada pelo Super Admin via gestão'
    })

    if (error) {
      console.error('Erro ao aprovar escola:', error)
      throw new Error(error.message)
    }
    return { id, status_assinatura: 'ativa' }
  },

  async suspenderEscola(id: string, motivo: string) {
    const { data, error } = await supabase.rpc('fn_suspender_escola' as any, {
      p_escola_id: id,
      p_motivo: motivo
    })

    if (error) {
      console.error('Erro ao suspender escola:', error)
      throw new Error(error.message)
    }
    return { id, status_assinatura: 'suspensa' }
  },

  async reativarEscola(id: string) {
    const { data, error } = await supabase.rpc('fn_reativar_escola' as any, {
      p_escola_id: id
    })

    if (error) {
      console.error('Erro ao reativar escola:', error)
      throw new Error(error.message)
    }
    return { id, status_assinatura: 'ativa' }
  },

  async reprovarEscola(id: string, motivo: string) {
    // Reprovação é mesma lógica de suspensão
    const { data, error } = await supabase.rpc('fn_suspender_escola' as any, {
      p_escola_id: id,
      p_motivo: motivo
    })

    if (error) {
      console.error('Erro ao reprovar escola:', error)
      throw new Error(error.message)
    }
    return { id, status_assinatura: 'suspensa' }
  },

  async getEscolasPendentes() {
    const { data, error } = await (supabase.from('vw_escolas_pendentes_aprovacao' as any) as any)
      .select('*')
    
    if (error) {
      console.error('Erro ao buscar escolas pendentes:', error)
      return []
    }
    return (data as any[]) || []
  },

  async getEscolaDetalhes(id: string) {
    const { data, error } = await (supabase.from('escolas' as any) as any)
      .select(`
        *,
        plano:planos(nome, valor_por_aluno),
        assinatura:assinaturas(*),
        filiais:filiais(*)
      `)
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data
  },

  // ==========================================
  // ASSINATURAS
  // ==========================================
  async getAssinaturas() {
    const { data, error } = await (supabase.from('assinaturas' as any) as any)
      .select('*, escola:escolas(razao_social, cnpj), plano:planos(nome, valor_por_aluno)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },

  async createAssinatura(assinatura: any) {
    const { data, error } = await (supabase.from('assinaturas' as any) as any).insert(assinatura as any).select().maybeSingle()
    if (error) throw error
    if (!data) throw new Error('Não foi possível criar a assinatura.')
    return data
  },

  async updateAssinatura(id: string, updates: any) {
    const { data, error } = await (supabase.from('assinaturas' as any) as any)
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id).select().maybeSingle()
    if (error) throw error
    if (!data) throw new Error('Não foi possível atualizar a assinatura.')
    return data
  },

  async deleteAssinatura(id: string) {
    const { error } = await (supabase.from('assinaturas' as any) as any).delete().eq('id', id)
    if (error) throw error
  },

  // ==========================================
  // FATURAS
  // ==========================================
  async getFaturas(filters?: { status?: string; tenant_id?: string }) {
    let query = (supabase.from('faturas' as any) as any)
      .select('*, escola:escolas(razao_social), assinatura:assinaturas(plano_id)')
      .order('created_at', { ascending: false })
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id)
    const { data, error } = await query
    if (error) throw error
    return (data as any[]) || []
  },

  async createFatura(fatura: any) {
    const { data, error } = await (supabase.from('faturas' as any) as any)
      .insert({
        ...fatura,
        created_at: new Date().toISOString(),
        status: fatura.status || 'pendente'
      } as any)
      .select().maybeSingle()
    
    if (error) throw error
 
    // Se for PIX Manual, envia notificação para a escola (tenant_id)
    if (fatura.forma_pagamento === 'pix_manual') {
      try {
        await (supabase.from('notificacoes' as any) as any).insert({
          tenant_id: fatura.tenant_id,
          tipo: 'FINANCEIRO',
          titulo: 'Nova Fatura Disponível (PIX)',
          mensagem: `Uma fatura de R$ ${Number(fatura.valor).toFixed(2)} referente a ${fatura.competencia} foi gerada. Pague via PIX e envie o comprovante.`,
          href: '/admin/financeiro',
          categoria: 'PLATAFORMA',
          prioridade: 1,
          lida: false,
          resolvida: false,
          created_at: new Date().toISOString()
        } as any)
      } catch (err) {
        console.error('Erro ao gerar notificação de fatura:', err)
      }
    }

    return data
  },

  async deleteFatura(id: string) {
    const { error } = await (supabase.from('faturas' as any) as any).delete().eq('id', id)
    if (error) throw error
  },

  async confirmarFatura(id: string, adminId: string) {
    // 1. Atualiza a fatura para paga
    const { data: fatura, error: faturaError } = await (supabase.from('faturas' as any) as any)
      .update({
        status: 'pago',
        confirmado_por: adminId,
        data_confirmacao: new Date().toISOString(),
        data_pagamento: new Date().toISOString().split('T')[0],
      } as any)
      .eq('id', id).select('*, escola:escolas(*)').maybeSingle()

    if (faturaError) throw faturaError
    if (!fatura) throw new Error('Não foi possível confirmar a fatura. Verifique se o registro ainda existe.')

    // 2. Se a escola estiver pendente, ativa ela automaticamente (fluxo de onboarding)
    const escola = (fatura as any).escola
    if (escola && (escola.status_assinatura === 'pendente' || escola.status_assinatura === 'aguardando_pagamento')) {
      await (supabase.from('escolas' as any) as any)
        .update({
          status_assinatura: 'ativa',
          data_inicio: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', escola.id)
    }

    return fatura
  },

  // ==========================================
  // SOLICITAÇÕES DE UPGRADE
  // ==========================================
  async getSolicitacoesUpgrade() {
    const { data, error } = await (supabase.from('solicitacoes_upgrade' as any) as any)
      .select('*, escola:escolas(razao_social)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },

  async aprovarUpgrade(id: string, tenantId: string, novoLimite: number, novoValor: number) {
    // 1. Aprovar solicitação
    await (supabase.from('solicitacoes_upgrade' as any) as any)
      .update({ status: 'aprovado' } as any).eq('id', id)

    // 2. Atualizar assinatura ativa
    const { data: assinatura } = await (supabase.from('assinaturas' as any) as any)
      .select('*').eq('tenant_id', tenantId).eq('status', 'ativa').single()

    if (assinatura) {
      // 3. Salvar snapshot no histórico (imutável)
      await (supabase.from('historico_assinatura' as any) as any).insert({
        tenant_id: tenantId,
        plano_id: (assinatura as any).plano_id,
        valor_por_aluno_contratado: (assinatura as any).valor_por_aluno_contratado,
        limite_alunos_contratado: (assinatura as any).limite_alunos_contratado,
        valor_total_contratado: (assinatura as any).valor_total_contratado,
        data_inicio: (assinatura as any).data_inicio,
        data_fim: new Date().toISOString().split('T')[0],
      } as any)

      // 4. Atualizar assinatura com novos valores
      await (supabase.from('assinaturas' as any) as any)
        .update({
          limite_alunos_contratado: novoLimite,
          valor_total_contratado: novoValor,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', (assinatura as any).id)

      // 5. Sincronizar limite na tabela principal da escola (usado no dashboard)
      await (supabase.from('escolas' as any) as any)
        .update({
          limite_alunos_contratado: novoLimite,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', tenantId)
    }
  },

  async recusarUpgrade(id: string) {
    const { error } = await (supabase.from('solicitacoes_upgrade' as any) as any)
      .update({ status: 'recusado' } as any).eq('id', id)
    if (error) throw error
  },

  // ==========================================
  // INTELIGÊNCIA E INSIGHTS (ZERO COST)
  // ==========================================
  async getTenantHealthScores() {
    const { data, error } = await (supabase.from('vw_tenant_health_score' as any) as any)
      .select('*')
      .order('health_score', { ascending: true }) // Mostra os piores primeiro para ação rápida
    if (error) throw error
    return (data as any[]) || []
  },

  async getRadarEvasaoGeral() {
    // Visão consolidada para o Super Admin ver alertas em todas as escolas
    const { data, error } = await (supabase.from('vw_radar_evasao' as any) as any)
      .select('*, escolas:tenant_id(razao_social)')
    if (error) throw error
    return (data as any[]) || []
  },

  async getNotificationCounts() {
    const [pendentesRes, faturasAtrasadasRes] = await Promise.all([
      (supabase.from('escolas' as any) as any).select('id', { count: 'exact', head: true }).eq('status_assinatura', 'pendente'),
      (supabase.from('faturas' as any) as any).select('id', { count: 'exact', head: true }).eq('status', 'atrasado')
    ])

    const notifications = []
    if (pendentesRes.count && pendentesRes.count > 0) {
      notifications.push({ 
        id: 'pendentes', 
        label: `${pendentesRes.count} Aprovações pendentes`, 
        href: '/admin/escolas',
        category: 'SUPER ADMIN'
      })
    }
    if (faturasAtrasadasRes.count && faturasAtrasadasRes.count > 0) {
      notifications.push({ 
        id: 'faturas', 
        label: `${faturasAtrasadasRes.count} Escolas com pagamentos em atraso`, 
        href: '/admin/faturas',
        category: 'SUPER ADMIN'
      })
    }

    return {
      total: (pendentesRes.count || 0) + (faturasAtrasadasRes.count || 0),
      items: notifications
    }
  },

  // ==========================================
  // GATEWAYS DE PAGAMENTO (Super Admin)
  // ==========================================
  async getGatewayConfig() {
    const { data, error } = await (supabase.from('gateway_config' as any) as any)
      .select('*')
      .order('ordem_exibicao', { ascending: true })
    if (error) throw error
    return data as any[]
  },

  async toggleGatewayGlobal(gateway: string, ativo: boolean) {
    const { data, error } = await (supabase.from('gateway_config' as any) as any)
      .update({ ativo_global: ativo, updated_at: new Date().toISOString() })
      .eq('gateway', gateway)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateGatewayCamposConfig(gateway: string, camposConfig: any[]) {
    const { data, error } = await (supabase.from('gateway_config' as any) as any)
      .update({ campos_config: camposConfig, updated_at: new Date().toISOString() })
      .eq('gateway', gateway)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ==========================================
  // CONFIGURAÇÕES DE RECEBIMENTO (global)
  // ==========================================
  async getConfiguracaoRecebimento() {
    const { data, error } = await (supabase.from('configuracao_recebimento' as any) as any)
      .select('*')
      .maybeSingle()
    if (error) throw error
    return data
  },

  async updateConfiguracaoRecebimento(config: any) {
    const { data: existing } = await (supabase.from('configuracao_recebimento' as any) as any)
      .select('id')
      .limit(1)
      .maybeSingle()

    if (existing) {
      const { data, error } = await (supabase.from('configuracao_recebimento' as any) as any)
        .update({ ...config, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await (supabase.from('configuracao_recebimento' as any) as any)
        .insert({ ...config, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .select()
        .single()
      if (error) throw error
      return data
    }
  },

  // ==========================================
  // ESCOLAS DEVEDORAS (PAGAMENTOS EM ATRASO)
  // ==========================================
  async getEscolasDevedoras() {
    // Buscar faturas com status 'atrasado' ou 'pendente_confirmacao' (sem pagamento após vencimento)
    const { data: faturasAtrasadas, error: errorAtrasadas } = await (supabase.from('faturas' as any) as any)
      .select('*, escola:escolas(id, razao_social, cnpj, nome_gestor, email_gestor, metodo_pagamento, plano:planos(nome))')
      .in('status', ['atrasado', 'pendente_confirmacao'])
      .order('data_vencimento', { ascending: true })

    if (errorAtrasadas) throw errorAtrasadas

    // Agrupar por escola (uma escola pode ter múltiplas faturas inadimplentes)
    const escolasMap = new Map()
    
    for (const fatura of (faturasAtrasadas as any[])) {
      const escolaId = fatura.tenant_id
      if (!escolasMap.has(escolaId)) {
        escolasMap.set(escolaId, {
          escola: fatura.escola,
          faturas: [],
          totalDevido: 0,
          faturasAtrasadas: 0,
          dataVencimentoMaisAntiga: fatura.data_vencimento
        })
      }
      const entry = escolasMap.get(escolaId)
      entry.faturas.push(fatura)
      entry.totalDevido += Number(fatura.valor) || 0
      entry.faturasAtrasadas += 1
      if (fatura.data_vencimento < entry.dataVencimentoMaisAntiga) {
        entry.dataVencimentoMaisAntiga = fatura.data_vencimento
      }
    }

    return Array.from(escolasMap.values())
  },

  async confirmarPagamentoEscola(tenantId: string, adminId: string) {
    // Busca faturas pendentes/atrasadas da escola
    const { data: faturas, error } = await (supabase.from('faturas' as any) as any)
      .select('id')
      .eq('tenant_id', tenantId)
      .in('status', ['atrasado', 'pendente_confirmacao'])

    if (error) throw error

    // Confirma cada fatura
    for (const fatura of (faturas as any[])) {
      try {
        await this.confirmarFatura(fatura.id, adminId)
      } catch (err) {
        console.error(`Erro ao confirmar fatura ${fatura.id}:`, err)
      }
    }
  },

  async enviarCobranca(tenantId: string, mensagem?: string) {
    const { data: escola, error } = await (supabase.from('escolas' as any) as any)
      .select('*, plano:planos(nome)')
      .eq('id', tenantId)
      .maybeSingle()

    if (error) throw error
    if (!escola) throw new Error('Escola não encontrada')

    // Criar notificação de cobrança
    await (supabase.from('notificacoes' as any) as any).insert({
      tenant_id: tenantId,
      tipo: 'FINANCEIRO',
      titulo: 'Cobrança Pendente',
      mensagem: mensagem || `Prezados, verificamos que há faturas pendentes de pagamento referente ao plano ${escola.plano?.nome || 'ativo'}. Por favor, regularize a situação para manter o acesso ao sistema.`,
      href: '/admin/financeiro',
      categoria: 'PLATAFORMA',
      prioridade: 1,
      lida: false,
      resolvida: false,
      created_at: new Date().toISOString()
    } as any)

    // Buscar faturas pendentes para incluir na notificação
    const { data: faturas } = await (supabase.from('faturas' as any) as any)
      .select('valor, data_vencimento, competencia')
      .eq('tenant_id', tenantId)
      .in('status', ['atrasado', 'pendente_confirmacao'])

    return {
      escola,
      faturasPendentes: faturas,
      notificacaoEnviada: true
    }
  },

  async cancelarAcessoEscola(tenantId: string, motivo: string) {
    // Atualiza status da escola para suspensa
    await (supabase.from('escolas' as any) as any)
      .update({
        status_assinatura: 'suspensa',
        motivo_suspensao: motivo,
        data_suspensao: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', tenantId)

    // Criar log de auditoria
    await (supabase.from('audit_logs_v2' as any) as any).insert({
      tenant_id: tenantId,
      acao: 'CANCELAMENTO_ACESSO_SUPER_ADMIN',
      detalhes: { motivo },
      created_at: new Date().toISOString()
    } as any)
  },
}
