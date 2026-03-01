import { supabase } from '@/lib/supabase'

export const portalService = {
  // ==========================================
  // AUTENTICAÇÃO POR CPF
  // ==========================================
  async loginPorCpf(cpf: string, senha: string) {
    // Busca responsável pelo CPF (nunca revelar se CPF existe ou não)
    const cpfLimpo = cpf.replace(/\D/g, '')
    const { data: responsavel, error } = await supabase.from('responsaveis')
      .select('id, cpf, nome, email, telefone, user_id, primeiro_acesso, termos_aceitos, status')
      .or(`cpf.eq.${cpfLimpo},cpf.eq.${cpf}`)
      .maybeSingle()

    if (error || !responsavel) {
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
      .select('id, cpf, nome, email, telefone')
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
        id, responsavel_id, aluno_id, is_financeiro, is_academico, status,
        aluno:alunos(
          id, 
          nome_completo, 
          nome_social, 
          data_nascimento, 
          status, 
          tenant_id, 
          filial_id, 
          turma_id,
          turma:turmas(id, nome, turno),
          filial:filiais(nome_unidade)
        )
      `)
      .eq('responsavel_id', responsavelId)

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
  async buscarDashboardAluno(alunoId: string, tenantId: string) {
    const [frequenciaRes, cobrancasRes, avisosRes] = await Promise.all([
      // Frequência recente (últimos 30 dias)
      (supabase.from('frequencias' as any) as any)
        .select('status')
        .eq('aluno_id', alunoId)
        .eq('tenant_id', tenantId)
        .gte('data_aula', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      ,
      // Cobranças pendentes
      (supabase.from('cobrancas' as any) as any)
        .select('id, valor, status, data_vencimento')
        .eq('aluno_id', alunoId)
        .eq('tenant_id', tenantId)
        .in('status', ['a_vencer', 'atrasado'])
      ,
      // Avisos recentes (3 últimos)
      (supabase.from('mural_avisos' as any) as any)
        .select('id, titulo, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(3)
      ,
    ])

    const frequencias = (frequenciaRes.data as any[]) || []
    const totalPresencas = frequencias.filter((f: any) => f.status === 'presente').length
    const totalFaltas = frequencias.filter((f: any) => f.status === 'falta').length
    const totalJustificadas = frequencias.filter((f: any) => f.status === 'justificada').length
    const percentualFrequencia = frequencias.length > 0
      ? Math.round((totalPresencas / frequencias.length) * 100) : 100

    const cobrancas = (cobrancasRes.data as any[]) || []
    const totalPendente = cobrancas.reduce((acc: number, c: any) => acc + Number(c.valor || 0), 0)
    const totalAtrasadas = cobrancas.filter((c: any) => c.status === 'atrasado').length

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
      },
      avisosRecentes: (avisosRes.data as any[]) || [],
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
    let query = (supabase.from('mural_avisos' as any) as any)
      .select('*, turma:turmas(nome)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (turmaId) {
      query = query.or(`turma_id.is.null,turma_id.eq.${turmaId}`)
    }

    const { data, error } = await query.limit(50)
    if (error) throw error
    return (data as any[]) || []
  },

  // ==========================================
  // COBRANÇAS
  // ==========================================
  async buscarCobrancasPorAluno(alunoId: string, tenantId: string) {
    const { data, error } = await (supabase.from('cobrancas' as any) as any)
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .order('data_vencimento', { ascending: false })

    if (error) throw error
    return (data as any[]) || []
  },

  async buscarConfigPixEscola(tenantId: string) {
    // Busca a config de PIX específica da escola (tenant)
    const { data, error } = await (supabase.from('config_financeira' as any) as any)
      .select('pix_habilitado, chave_pix, nome_favorecido, instrucoes_responsavel, pix_qr_code_url')
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (error) throw error
    
    // Converte para o formato esperado pelo componente se necessário
    return data ? {
      pix_manual_ativo: data.pix_habilitado,
      chave_pix: data.chave_pix,
      favorecido: data.nome_favorecido,
      instrucoes_extras: data.instrucoes_responsavel,
      qr_code_url: data.pix_qr_code_url
    } : null
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
  // BOLETIM
  // ==========================================
  async buscarBoletins(alunoId: string, tenantId: string) {
    const { data, error } = await (supabase.from('boletins' as any) as any)
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .order('ano_letivo', { ascending: false })
      .order('bimestre', { ascending: false })

    if (error) throw error
    return (data as any[]) || []
  },
}
