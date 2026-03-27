import { supabase } from '@/lib/supabase'

export const portalService = {
  // ==========================================
  // AUTENTICAÇÃO POR CPF
  // ==========================================
  async loginPorCpf(cpf: string, senha: string) {
    // Busca informações de login via RPC segura (não expõe a tabela via RLS)
    const cpfLimpo = cpf.replace(/\D/g, '')
    const { data: responsavel, error: rpcError } = await (supabase.rpc('get_portal_login_info', {
      cpf_input: cpfLimpo
    }) as any)

    if (rpcError || !responsavel) {
      console.error('Erro ao buscar responsável:', rpcError)
      throw new Error('CPF ou senha inválidos.')
    }

    if (responsavel.status === 'inativo') {
      throw new Error('CPF ou senha inválidos.')
    }

    // Autentica via Supabase Auth usando o email associado
    if (!responsavel.email) {
      throw new Error('CPF ou senha inválidos.')
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: responsavel.email,
      password: senha,
    })

    if (authError) {
      console.error('DEBUG: Erro detalhado do Supabase Auth:', {
        message: authError.message,
        status: authError.status,
        name: authError.name
      })
      
      // Log de tentativa falha na auditoria
      await portalService.registrarAuditoria({
        tipo: 'login_falha',
        responsavel_id: responsavel.id,
        detalhes: { 
          cpf: cpfLimpo, 
          error_message: authError.message,
          error_code: authError.status 
        },
      })

      // Tratamento de erros específicos
      if (authError.message.includes('Email not confirmed')) {
         throw new Error('Sua conta ainda não foi confirmada. Verifique o e-mail de ativação enviado para ' + responsavel.email)
      }

      if (authError.message.includes('Invalid login credentials')) {
        throw new Error('CPF ou senha inválidos.')
      }

      // Se for qualquer outro erro técnico, mostramos o erro real para depuração
      throw new Error(`Erro na autenticação: ${authError.message}`)
    }

    // Log de login bem-sucedido
    await portalService.registrarAuditoria({
      tipo: 'login_sucesso',
      responsavel_id: responsavel.id,
      detalhes: { cpf: cpfLimpo },
    })

    return {
      session: authData.session,
      user: authData.user,
      responsavel,
    }
  },

  // ==========================================
  // ACEITE LGPD / PRIMEIRO ACESSO
  // ==========================================
  async aceitarTermos(responsavelId: string) {
    const { error } = await supabase.from('responsaveis')
      .update({
        termos_aceitos: true,
        data_aceite_termos: new Date().toISOString(),
        primeiro_acesso: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', responsavelId)

    if (error) throw error

    await portalService.registrarAuditoria({
      tipo: 'aceite_termos',
      responsavel_id: responsavelId,
      detalhes: { data: new Date().toISOString() },
    })
  },

  async trocarSenha(novaSenha: string) {
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (error) throw error
  },

  // ==========================================
  // RESPONSÁVEL
  // ==========================================
  async buscarResponsavelPorUserId(userId: string) {
    const { data, error } = await supabase.from('responsaveis')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    return data
  },

  // ==========================================
  // VÍNCULO ALUNOS (Multi-aluno, Multi-escola)
  // ==========================================
  async buscarVinculosAtivos(responsavelId: string) {
    console.log('DEBUG: Buscando vínculos para responsável:', responsavelId)
    const { data, error } = await supabase.from('aluno_responsavel')
      .select(`
        id, responsavel_id, aluno_id, is_financeiro, is_academico, status, grau_parentesco,
        aluno:alunos(
          id, 
          nome_completo, 
          nome_social, 
          data_nascimento, 
          status, 
          tenant_id,
          foto_url
        )
      `)
      .eq('responsavel_id', responsavelId)
      .eq('status', 'ativo')

    if (error) {
      console.error('DEBUG: Erro ao buscar vínculos ativos:', error)
      throw error
    }

    console.log('DEBUG: Vínculos encontrados:', data)
    return (data as any[]) || []
  },

  async buscarEscolasVinculadas(tenantIds: string[]) {
    if (tenantIds.length === 0) return []
    const { data, error } = await supabase.from('escolas')
      .select('id, razao_social, status_assinatura')
      .in('id', tenantIds)

    if (error) throw error
    return data || []
  },

  // ==========================================
  // DASHBOARD
  // ==========================================
  async buscarDashboardAluno(alunoId: string, tenantId: string, turmaId?: string | null) {
    // Garante que o status de atraso esteja correto antes de calcular as estatísticas
    try {
      const { financeiroService } = await import('@/modules/financeiro/service')
      await financeiroService.repararStatusAtrasados(tenantId)
    } catch (e) {
      console.warn('Falha ao reparar atrasos no dashboard:', e)
    }

    const [frequenciaRes, cobrancasRes, avisosRes] = await Promise.all([
      // Frequência recente (últimos 30 dias)
      (supabase.from('frequencias' as any) as any)
        .select('status')
        .eq('aluno_id', alunoId)
        .eq('tenant_id', tenantId)
        .gte('data_aula', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      ,
      // Cobranças pendentes (todas)
      (supabase.from('cobrancas' as any) as any)
        .select('id, valor, status, data_vencimento, descricao')
        .eq('aluno_id', alunoId)
        .eq('tenant_id', tenantId)
        .in('status', ['a_vencer', 'atrasado', 'pago'])
      ,
      // Avisos recentes — APENAS DENTRO DA VIGÊNCIA
      // Filtro no banco: data_fim null OU >= hoje
      (supabase.from('mural_avisos' as any) as any)
        .select(`
          id,
          titulo,
          conteudo,
          created_at,
          turma_id,
          publico_alvo,
          data_fim,
          turma:turmas(nome)
        `)
        .eq('tenant_id', tenantId)
        .or(`data_fim.is.null,data_fim.gte.${new Date().toISOString().split('T')[0]}`)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    const frequencias = (frequenciaRes.data as any[]) || []
    const totalPresencas = frequencias.filter((f: any) => f.status === 'presente').length
    const totalFaltas = frequencias.filter((f: any) => f.status === 'falta').length
    const totalJustificadas = frequencias.filter((f: any) => f.status === 'justificada').length

    // Percentual: Presenças + Justificadas contam para o índice de frequência legal
    const percentualFrequencia = frequencias.length > 0
      ? Math.round(((totalPresencas + totalJustificadas) / frequencias.length) * 100) : 100

    const cobrancas = (cobrancasRes.data as any[]) || []

    // Separa cobranças de matrícula das demais (mensalidades)
    const cobrancasMatricula = cobrancas.filter((c: any) =>
      c.descricao?.toLowerCase().includes('matrícula') || c.descricao?.toLowerCase().includes('matricula')
    )
    const cobrancasMensalidade = cobrancas.filter((c: any) =>
      !c.descricao?.toLowerCase().includes('matrícula') && !c.descricao?.toLowerCase().includes('matricula')
    )

    // Total pendente considera mensalidades E matrícula (se estiver pendente)
    const totalPendenteMensalidades = cobrancasMensalidade
      .filter((c: any) => ['a_vencer', 'atrasado'].includes(c.status))
      .reduce((acc: number, c: any) => acc + Number(c.valor || 0), 0)
    
    const totalPendenteMatricula = cobrancasMatricula
      .filter((c: any) => ['a_vencer', 'atrasado'].includes(c.status))
      .reduce((acc: number, c: any) => acc + Number(c.valor || 0), 0)

    const totalPendente = totalPendenteMensalidades + totalPendenteMatricula
    const totalAtrasadas = cobrancasMensalidade.filter((c: any) => c.status === 'atrasado').length +
                           cobrancasMatricula.filter((c: any) => c.status === 'atrasado').length

    // Filtrar avisos: apenas do aluno/turma e COM DATA VÁLIDA
    let todosAvisos = (avisosRes.data as any[]) || []
    
    const hoje = new Date().toISOString().split('T')[0]
    
    todosAvisos = todosAvisos.filter((a: any) => {
      // 1. Filtro por turma/público
      if (!a.turma_id || a.turma_id === '' || String(a.publico_alvo).toLowerCase() === 'todos') {
        // Aviso global, verifica se está dentro do período válido
      } else if (turmaId && a.turma_id === turmaId) {
        // Aviso da turma específica
      } else {
        return false // Não é para este aluno
      }
      
      // 2. Filtro por data: só mostra se NÃO expirou (data_fim >= hoje OU data_fim inexistente)
      if (a.data_fim && a.data_fim < hoje) {
        return false // Já expirou
      }
      
      return true
    })

    return {
      frequencia: {
        totalPresencas,
        totalFaltas,
        totalJustificadas,
        percentual: percentualFrequencia,
        totalRegistros: frequencias.length,
      },
      financeiro: {
        totalPendente,
        totalAtrasadas,
        totalCobrancas: cobrancas.length,
        proximoVencimento: cobrancas
          .filter((c: any) => c.status === 'a_vencer')
          .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())[0] || null,
        cobrancasMatricula, // Retorna cobranças de matrícula para verificação
      },
      avisosRecentes: todosAvisos.slice(0, 3)
    }
  },

  // ==========================================
  // FREQUÊNCIA
  // ==========================================
  async buscarFrequenciaPorAluno(alunoId: string, tenantId: string, mes?: string) {
    let query = (supabase.from('frequencias' as any) as any)
      .select('*, turma:turmas(nome)')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .order('data_aula', { ascending: false })

    if (mes) {
      query = query.gte('data_aula', `${mes}-01`).lt('data_aula', `${mes}-32`)
    }

    const { data, error } = await query.limit(90)
    if (error) throw error
    return (data as any[]) || []
  },

  // ==========================================
  // AVISOS
  // ==========================================
  async buscarAvisosPorTurma(tenantId: string, turmaId?: string | null) {
    // Retorna TODOS (ativos + expirados) — a página de listagem separa visualmente
    const { data, error } = await (supabase.from('mural_avisos' as any) as any)
      .select('*, turma:turmas(nome)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    const avisos = (data as any[]) || []
    return avisos.filter(a => {
      if (!a.turma_id || a.turma_id === '' || String(a.publico_alvo).toLowerCase() === 'todos') return true
      if (turmaId && a.turma_id === turmaId) return true
      return false
    })
  },

  // ==========================================
  // COBRANÇAS
  // ==========================================
  async buscarCobrancasPorAluno(alunoId: string, tenantId: string) {
    try {
      const { financeiroService } = await import('@/modules/financeiro/service')
      await financeiroService.repararStatusAtrasados(tenantId)
    } catch (e) {
      console.warn('Falha ao reparar atrasos na listagem do portal:', e)
    }

    const { data, error } = await (supabase.from('cobrancas' as any) as any)
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .order('data_vencimento', { ascending: false })

    if (error) throw error
    return (data as any[]) || []
  },

  async buscarConfigPixEscola(tenantId: string) {
    // Busca a config via Motor de Configurações Tenant (Unificado)
    const { data, error } = await (supabase.from('configuracoes_escola' as any) as any)
      .select('config_financeira')
      .eq('tenant_id', tenantId)
      .is('vigencia_fim', null)
      .maybeSingle()
    
    if (error) throw error
    if (!data?.config_financeira) return null
    
    const config = data.config_financeira
    
    return {
      pix_manual_ativo: config.pix_manual,
      chave_pix: config.chave_pix,
      favorecido: config.nome_favorecido,
      qr_code_url: null, // Campo legado ou via API externa
      instrucoes_extras: config.instrucoes_pix,
      qr_code_auto: config.pix_auto,
      dias_carencia: config.dias_carencia || 0,
      // Regras de Multa e Juros dinâmicas
      multa_atraso_percentual: config.multa_atraso_perc || 2,
      multa_atraso_valor_fixo: config.multa_fixa || 0,
      juros_mora_mensal: config.juros_mora_mensal_perc || 1,
      desconto_pontualidade: 0 // Campo legado
    }
  },

  async buscarConfigRecados(tenantId: string) {
    const { data, error } = await supabase.from('escolas')
      .select('telefone, email_gestor')
      .eq('id', tenantId)
      .maybeSingle()

    if (error) throw error
    return {
      whatsapp_contato: data?.telefone || null,
      email_contato: data?.email_gestor || null
    }
  },

  // ==========================================
  // FILA VIRTUAL
  // ==========================================
  async entrarNaFila(dados: { tenant_id: string; aluno_id: string; responsavel_id: string }) {
    // Verifica se já está na fila aguardando
    const { data: existente } = await (supabase.from('fila_virtual' as any) as any)
      .select('id')
      .eq('aluno_id', dados.aluno_id)
      .eq('responsavel_id', dados.responsavel_id)
      .eq('status', 'aguardando')
      .maybeSingle()

    if (existente) throw new Error('Você já está na fila de espera.')

    const { data, error } = await (supabase.from('fila_virtual' as any) as any)
      .insert({
        ...dados,
        status: 'aguardando',
      } as any)
      .select()
      .single()

    if (error) throw error

    await portalService.registrarAuditoria({
      tipo: 'fila_entrada',
      responsavel_id: dados.responsavel_id,
      detalhes: { aluno_id: dados.aluno_id, tenant_id: dados.tenant_id },
    })

    return data
  },

  async buscarStatusFila(responsavelId: string, tenantId: string) {
    const { data, error } = await (supabase.from('fila_virtual' as any) as any)
      .select('*, aluno:alunos(nome_completo)')
      .eq('responsavel_id', responsavelId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error
    return (data as any[]) || []
  },

  async cancelarFila(filaId: string) {
    const { error } = await (supabase.from('fila_virtual' as any) as any)
      .update({ status: 'cancelado', updated_at: new Date().toISOString() } as any)
      .eq('id', filaId)

    if (error) throw error
  },

  // ==========================================
  // AUDITORIA
  // ==========================================
  async registrarAuditoria(log: { tipo: string; responsavel_id: string; detalhes?: any }) {
    try {
      await (supabase.from('portal_audit_log' as any) as any).insert({
        tipo: log.tipo,
        responsavel_id: log.responsavel_id,
        detalhes: log.detalhes || {},
        ip: null, // Preenchido por RLS/trigger no futuro
      } as any)
    } catch {
      // Não bloquear fluxo por falha de auditoria
      console.warn('Falha ao registrar auditoria:', log.tipo)
    }
  },

  // ==========================================
  // BOLETIM (V2 com fallback legado)
  // ==========================================
  async buscarBoletins(alunoId: string, tenantId: string) {
    // 1. Tenta a view V2 (novo modelo relacional)
    try {
      const { data: v2Data, error: v2Error } = await (supabase.from('vw_boletim_completo' as any) as any)
        .select('*')
        .eq('aluno_id', alunoId)
        .eq('tenant_id', tenantId)
        .order('bimestre', { ascending: true })

      if (!v2Error && v2Data && v2Data.length > 0) {
        // Agrupa por bimestre para manter compatibilidade com a UI do portal
        const anoAtual = new Date().getFullYear()
        const porBimestre: Record<number, any> = {}
        ;(v2Data as any[]).forEach((row: any) => {
          const bim = row.bimestre
          if (!porBimestre[bim]) {
            porBimestre[bim] = {
              id: `v2-${alunoId}-${bim}`,
              aluno_id: alunoId,
              tenant_id: tenantId,
              bimestre: bim,
              ano_letivo: anoAtual,
              disciplinas: [],
              _v2: true,
            }
          }
          porBimestre[bim].disciplinas.push({
            disciplina: row.nome_disciplina,
            disciplina_id: row.disciplina_id,
            nota: row.media_final ?? 0,
            media_parcial: row.media_parcial,
            nota_recuperacao: row.nota_recuperacao,
            faltas: row.total_faltas ?? 0,
            total_aulas: row.total_aulas_bimestre ?? 0,
            resultado: row.resultado,
            observacoes: null,
          })
        })
        return Object.values(porBimestre).sort((a: any, b: any) => a.bimestre - b.bimestre)
      }
    } catch {
      // Silencia erros (view pode não existir em ambientes antigos)
    }

    // 2. Fallback: modelo legado JSONB
    const { data, error } = await (supabase.from('boletins' as any) as any)
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .order('ano_letivo', { ascending: false })
      .order('bimestre', { ascending: false })

    if (error) throw error
    return (data as any[]) || []
  },

  // ==========================================
  // EVENTOS / AGENDA
  // ==========================================
  async buscarEventos(tenantId: string, inicio?: string, fim?: string) {
    let query = (supabase.from('eventos' as any) as any)
      .select('*')
      .eq('tenant_id', tenantId)

    if (inicio && fim) {
      query = query.gte('data_inicio', inicio).lte('data_inicio', fim)
    } else {
      query = query.gte('data_inicio', new Date().toISOString())
    }

    const { data, error } = await query.order('data_inicio', { ascending: true })

    if (error) throw error
    return (data as any[]) || []
  },

  // ==========================================
  // SOLICITAÇÃO DE DOCUMENTOS
  // ==========================================
  async criarSolicitacaoDocumento(dados: {
    tenant_id: string
    aluno_id: string
    responsavel_id: string
    documento_tipo: string
    observacoes?: string
  }) {
    const { data, error } = await (supabase.from('document_solicitations' as any) as any)
      .insert({
        ...dados,
        status: 'pendente',
      } as any)
      .select()
      .single()

    if (error) throw error

    await portalService.registrarAuditoria({
      tipo: 'solicitacao_documento',
      responsavel_id: dados.responsavel_id,
      detalhes: { aluno_id: dados.aluno_id, documento_tipo: dados.documento_tipo },
    })

    return data
  },

  async buscarSolicitacoesDocumento(responsavelId: string, tenantId: string) {
    const { data, error } = await (supabase.from('document_solicitations' as any) as any)
      .select(`
        *,
        aluno:alunos(nome_completo, nome_social),
        documento_emitido:documentos_emitidos(id, titulo, created_at)
      `)
      .eq('responsavel_id', responsavelId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as any[]) || []
  },

  async buscarTemplatesDocumento(tenantId: string) {
    const { data, error } = await (supabase.from('documento_templates' as any) as any)
      .select('id, titulo, tipo')
      .eq('tenant_id', tenantId)
      .order('titulo', { ascending: true })

    if (error) throw error
    return (data as any[]) || []
  },

  async atualizarPerfil(responsavelId: string, dados: any) {
    const { error } = await supabase.from('responsaveis')
      .update(dados)
      .eq('id', responsavelId)
    
    if (error) throw error

    await portalService.registrarAuditoria({
      tipo: 'perfil_atualizado',
      responsavel_id: responsavelId,
      detalhes: { campos: Object.keys(dados) },
    })
  },

  async atualizarParentesco(vinculoId: string, grauParentesco: string) {
    const { error } = await supabase.from('aluno_responsavel')
      .update({ grau_parentesco: grauParentesco })
      .eq('id', vinculoId)
    
    if (error) throw error
  },

  async buscarAlunoCompleto(alunoId: string, tenantId: string) {
    const { data, error } = await supabase.from('alunos')
      .select('*')
      .eq('id', alunoId)
      .eq('tenant_id', tenantId)
      .single()
    if (error) throw error
    return data
  },

  async atualizarAluno(alunoId: string, responsavelId: string, dados: any) {
    const { error } = await supabase.from('alunos')
      .update(dados)
      .eq('id', alunoId)
    
    if (error) throw error

    await portalService.registrarAuditoria({
      tipo: 'aluno_perfil_atualizado',
      responsavel_id: responsavelId,
      detalhes: { aluno_id: alunoId, campos: Object.keys(dados) },
    })
  },

  // ==========================================
  // SELOS / CONQUISTAS
  // ==========================================
  async buscarSelos(alunoId: string, tenantId: string) {
    const { data, error } = await supabase.from('selos')
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // ==========================================
  // PLANOS DE AULA
  // ==========================================
  async buscarPlanosAula(alunoId: string, tenantId: string) {
    // 1. Busca a turma atual do aluno para filtrar os planos
    const { data: matricula } = await supabase.from('matriculas')
      .select('turma_id')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .eq('status', 'ativa')
      .maybeSingle()

    if (!matricula?.turma_id) return []

    // 2. Busca planos vinculados à turma (sem join, pois a FK não está definida no schema)
    const { data: planosTurmas, error } = await supabase.from('planos_aula_turmas')
      .select('plano_aula_id, horario, turno')
      .eq('turma_id', matricula.turma_id)
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!planosTurmas || planosTurmas.length === 0) return []

    // 3. Busca os detalhes dos planos de aula
    const planoIds = planosTurmas.map(pt => pt.plano_aula_id)
    const { data: planos, error: planosError } = await supabase.from('planos_aula')
      .select('id, disciplina, data_aula, conteudo_previsto, conteudo_realizado, observacoes')
      .in('id', planoIds)

    if (planosError) throw planosError

    // 4. Combina os dados
    return planosTurmas.map(pt => ({
      horario: pt.horario,
      turno: pt.turno,
      plano: planos?.find(p => p.id === pt.plano_aula_id)
    }))
  },

  // ==========================================
  // ATIVIDADES
  // ==========================================
  async buscarAtividades(alunoId: string, tenantId: string) {
    // 1. Busca a turma atual do aluno
    const { data: matricula } = await supabase.from('matriculas')
      .select('turma_id')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .eq('status', 'ativa')
      .maybeSingle()

    if (!matricula?.turma_id) return []

    // 2. Busca atividades vinculadas à turma
    // 2. Busca atividades vinculadas à turma do aluno
    const { data, error } = await (supabase.from('atividades' as any) as any)
      .select(`
        id,
        titulo,
        descricao,
        tipo_material,
        anexo_url,
        disciplina,
        created_at,
        atividades_turmas!inner(
          turma_id,
          horario,
          turno
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('atividades_turmas.turma_id', matricula.turma_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erro ao buscar atividades no portal:', error)
      throw error
    }
    
    return (data as any[] || []).map(item => ({
      horario: item.atividades_turmas?.[0]?.horario,
      turno: item.atividades_turmas?.[0]?.turno,
      atividade: {
        id: item.id,
        titulo: item.titulo,
        descricao: item.descricao,
        tipo: item.tipo_material,
        anexo_url: item.anexo_url,
        disciplina: item.disciplina,
        created_at: item.created_at
      }
    }))
  },

  async getNotificationCounts(responsavelId: string) {
    // 1. Busca vínculos ativos para obter IDs de alunos e turmas
    const vinculos = await portalService.buscarVinculosAtivos(responsavelId)
    const alunoIds = vinculos.map(v => v.aluno_id)
    const tenantIds = [...new Set(vinculos.map(v => v.aluno.tenant_id))]

    if (alunoIds.length === 0) return { total: 0, items: [] }

    // 2. Busca IDs de turmas para atividades e provas
    const { data: matriculas } = await supabase.from('matriculas')
      .select('turma_id')
      .in('aluno_id', alunoIds)
      .eq('status', 'ativa')

    const turmaIds = [...new Set((matriculas || []).map(m => m.turma_id).filter(Boolean))]

    // 3. Busca contagens em paralelo
    const [cobrancasRes, avisosRes, atividadesRes, boletinsRes] = await Promise.all([
      (supabase.from('cobrancas' as any) as any)
        .select('id', { count: 'exact', head: true })
        .in('aluno_id', alunoIds)
        .in('status', ['a_vencer', 'atrasado']),
      (supabase.from('mural_avisos' as any) as any)
        .select('id', { count: 'exact', head: true })
        .in('tenant_id', tenantIds)
        .or(`data_fim.is.null,data_fim.gte.${new Date().toISOString().split('T')[0]}`)
        .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()),
      turmaIds.length > 0 ? (supabase.from('atividades' as any) as any)
        .select('id, atividades_turmas!inner(turma_id)', { count: 'exact', head: true })
        .in('atividades_turmas.turma_id', turmaIds)
        .gte('created_at', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString())
        : { count: 0 },
      (supabase.from('boletins' as any) as any)
        .select('id', { count: 'exact', head: true })
        .in('aluno_id', alunoIds)
        .gte('updated_at', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString())
    ])

    const notifications = []
    
    // Financeiro
    if (cobrancasRes.count && cobrancasRes.count > 0) {
      notifications.push({ 
        id: 'cobrancas', 
        label: `${cobrancasRes.count} ${cobrancasRes.count === 1 ? 'Nova cobrança' : 'Novas cobranças'}`, 
        href: '/portal/financeiro',
        category: 'FINANCEIRO'
      })
    }

    // Mural
    if (avisosRes.count && avisosRes.count > 0) {
      notifications.push({ 
        id: 'avisos', 
        label: `${avisosRes.count} ${avisosRes.count === 1 ? 'Novo aviso' : 'Novos avisos'} no mural`, 
        href: '/portal/avisos',
        category: 'COMUNICADOS'
      })
    }

    // Atividades
    if (atividadesRes.count && atividadesRes.count > 0) {
      notifications.push({ 
        id: 'atividades', 
        label: `${atividadesRes.count} ${atividadesRes.count === 1 ? 'Nova atividade' : 'Novas atividades'} postadas`, 
        href: '/portal/agenda',
        category: 'ACADÊMICO'
      })
    }

    // Notas / Boletim
    if (boletinsRes.count && boletinsRes.count > 0) {
      notifications.push({ 
        id: 'boletins', 
        label: `${boletinsRes.count} ${boletinsRes.count === 1 ? 'Nota atualizada' : 'Notas atualizadas'} no boletim`, 
        href: '/portal/boletim',
        category: 'ACADÊMICO'
      })
    }

    const total = (cobrancasRes.count || 0) + (avisosRes.count || 0) + (atividadesRes.count || 0) + (boletinsRes.count || 0)

    return {
      total,
      items: notifications
    }
  },
}
