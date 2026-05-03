import { supabase } from '@/lib/supabase'
import type { PortalConfigPix } from '@/lib/database.types'
import { precheckLogin } from '@/lib/auth-rate-limit'

const COMPROVANTE_MAX_BYTES = 5 * 1024 * 1024
const COMPROVANTE_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
])

function validateComprovanteFile(file: File) {
  if (file.size > COMPROVANTE_MAX_BYTES) {
    throw new Error('Arquivo muito grande. Maximo 5MB.')
  }

  if (!COMPROVANTE_MIME_TYPES.has(file.type)) {
    throw new Error('Formato invalido. Envie PDF, PNG, JPG ou WebP.')
  }
}

function safeFileExtension(file: File): string {
  const byMime: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  }

  return byMime[file.type] || 'bin'
}

export const portalService = {
  // ==========================================
  // AUTENTICAÇÃO POR CPF
  // ==========================================
  async loginPorCpf(cpf: string, senha: string) {
    const cpfLimpo = cpf.replace(/\D/g, '')
    const precheck = await precheckLogin(cpfLimpo)

    if (!precheck.allowed) {
      throw new Error(precheck.reason || 'Muitas tentativas falhas. Tente novamente mais tarde.')
    }

    if (precheck.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, precheck.delayMs))
    }
    const { data: profiles, error: rpcError } = await (supabase.rpc('get_portal_login_info', {
      cpf_input: cpfLimpo
    }) as any)

    if (rpcError || !profiles || profiles.length === 0) {
      console.error('Erro ao buscar responsável:', rpcError)
      throw new Error('CPF não cadastrado ou sem acesso ao portal.')
    }

    // Tenta encontrar um perfil ativo
    const activeProfiles = (profiles as any[]).filter(p => p.status === 'ativo')
    if (activeProfiles.length === 0) {
      throw new Error('Este cadastro está inativo. Entre em contato com a escola.')
    }

    // Autentica via Supabase Auth usando o email do primeiro perfil ativo
    const profile = activeProfiles[0]
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: senha,
    })

    if (authError) {
      await portalService.registrarAuditoria({
        tipo: 'login_falha',
        responsavel_id: profile.id,
        detalhes: { cpf: cpfLimpo, error_message: authError.message },
      })

      if (authError.message.includes('Invalid login credentials')) {
        throw new Error('CPF ou senha inválidos.')
      }
      throw new Error(`Erro na autenticação: ${authError.message}`)
    }

    await portalService.registrarAuditoria({
      tipo: 'login_sucesso',
      responsavel_id: profile.id,
      detalhes: { cpf: cpfLimpo },
    })

    return {
      session: authData.session,
      user: authData.user,
      responsavel: profile,
      responsaveis: profiles
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

    if (error) throw error
    return data || []
  },

  // ==========================================
  // VÍNCULO ALUNOS (Multi-aluno, Multi-escola)
  // ==========================================
  async buscarVinculosAtivos(responsavelId: string | string[]) {
    const ids = Array.isArray(responsavelId) ? responsavelId : [responsavelId]
    const { data, error } = await supabase.from('aluno_responsavel')
      .select(`
        id,
        responsavel_id,
        aluno_id,
        is_financeiro,
        is_academico,
        status,
        grau_parentesco,
        aluno:alunos(
          id,
          nome_completo,
          nome_social,
          data_nascimento,
          status,
          tenant_id,
          foto_url,
          codigo_transferencia
        )
      `)
      .in('responsavel_id', ids)
      .eq('status', 'ativo')

    if (error) {
      console.error('DEBUG: Erro ao buscar vínculos ativos:', error)
      throw error
    }

    const vinculos = (data as any[]) || []

    // Enriquecer cada aluno com dados de turma via matriculas (a relação alunos->turmas é via matriculas)
    if (vinculos.length > 0) {
      const alunoIds = vinculos.map(v => v.aluno?.id).filter(Boolean)
      
      if (alunoIds.length > 0) {
        const { data: matriculas } = await (supabase.from('matriculas' as any) as any)
          .select('aluno_id, turma_id, turmas(id, nome, turno)')
          .in('aluno_id', alunoIds)
          .eq('status', 'ativa')
        
        if (matriculas && matriculas.length > 0) {
          for (const vinculo of vinculos) {
            if (vinculo.aluno) {
              const matricula = matriculas.find((m: any) => m.aluno_id === vinculo.aluno.id)
              if (matricula) {
                const turmaRaw = matricula.turmas
                vinculo.aluno.turma = Array.isArray(turmaRaw) ? turmaRaw[0] : turmaRaw
              }
            }
          }
        }
      }
    }

    return vinculos
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
    if (!alunoId || !tenantId) return null
    const { data: matricula } = await (supabase.from('matriculas' as any) as any)
      .select('data_matricula')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .in('status', ['ativa' as any, 'pendente' as any, 'pre_matricula' as any])
      .order('data_matricula', { ascending: true })
      .limit(1)
      .maybeSingle()

    const dataMatricula = matricula?.data_matricula ? new Date(matricula.data_matricula + 'T12:00:00') : null
    if (dataMatricula) {
      dataMatricula.setDate(1) // Normaliza para o primeiro dia do mês de matrícula
      dataMatricula.setHours(0, 0, 0, 0)
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
      (supabase.from('mural_avisos' as any) as any)
        .select(`
          id,
          titulo,
          conteudo,
          created_at,
          turma_id,
          publico_alvo,
          data_fim,
          data_inicio,
          turma:turmas(nome)
        `)
        .eq('tenant_id', tenantId)
        .or(`data_inicio.is.null,data_inicio.lte.${new Date().toISOString().split('T')[0]}`)
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

    let cobrancas = (cobrancasRes.data as any[]) || []

    // APLICAR REGRA DE OURO: Filtrar cobranças por data de matrícula
    if (dataMatricula) {
      cobrancas = cobrancas.filter((c: any) => {
        const dataVenc = new Date(c.data_vencimento + 'T12:00:00')
        dataVenc.setDate(1)
        dataVenc.setHours(0, 0, 0, 0)
        return dataVenc.getTime() >= dataMatricula.getTime()
      })
    }

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
      
      // 2. Filtro por data: só mostra se DENTRO DO PERÍODO VÁLIDO
      if (a.data_inicio && a.data_inicio > hoje) return false
      if (a.data_fim && a.data_fim < hoje) return false
      
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
        piorPendencia: cobrancas
          .filter((c: any) => c.status === 'atrasado')
          .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())[0] || null,
        cobrancasMatricula,
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
    // 1. Busca a configuração para saber se habilitamos multa/juros automática
    const { data: globalConfig } = await (supabase.from('configuracoes_escola' as any) as any)
      .select('config_financeira')
      .eq('tenant_id', tenantId)
      .is('vigencia_fim', null)
      .maybeSingle();

    const config = globalConfig?.config_financeira;
    const usarViewEncargos = config?.multa_juros_habilitado !== false; 

    // 2. Decide qual view/tabela usar
    const target = usarViewEncargos ? 'vw_cobrancas_com_encargos' : 'cobrancas';

    const { data, error } = await (supabase.from(target as any) as any)
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .order('data_vencimento', { ascending: true })

    if (error) throw error
    
    let res = (data as any[]) || []
    // Se o job diário não rodou, cobranças ficam como 'a_vencer' mesmo vencidas.
    // Esta normalização garante consistência independente do job agendado.
    const diasCarencia = config?.dias_carencia || 0
    const agora = new Date()
    agora.setHours(23, 59, 59, 999) // Final do dia de hoje

    res = res.map((c: any) => {
      if (c.status === 'pago' || c.status === 'cancelado') return c

      const dataVenc = new Date(c.data_vencimento + 'T12:00:00')
      const diasAtraso = Math.floor((agora.getTime() - dataVenc.getTime()) / (1000 * 60 * 60 * 24))

      if (diasAtraso > diasCarencia) {
        return { ...c, status: 'atrasado' }
      } else if (diasAtraso <= 0) {
        return { ...c, status: 'a_vencer' }
      }
      return c
    })

    return res
  },

  async buscarConfigPixEscola(tenantId: string): Promise<PortalConfigPix | null> {
    if (!tenantId) return null

    try {
      // Busca a configuração mais recente para o tenant sem restrição excessiva de contexto
      const { data, error } = await (supabase.from('configuracoes_escola' as any) as any)
        .select('config_financeira')
        .eq('tenant_id', tenantId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      const config = data?.config_financeira
      
      if (!config) {
        console.warn('Nenhuma configuração financeira encontrada para o tenant:', tenantId)
        return null
      }
      
      // Mapeamento ultra-permissivo para garantir que nada falhe por nome de campo
      const mapped: PortalConfigPix = {
        pix_manual_ativo: config.pix_manual !== false,
        chave_pix: config.chave_pix || config.pix_chave || config.chave || '',
        pix_chave: config.pix_chave || undefined,
        favorecido: config.nome_favorecido || config.favorecido || config.favorecido_nome || '',
        qr_code_url: config.pix_qr_code_url || config.qr_code_url || config.qrcode_url || '',
        instrucoes_pix: config.instrucoes_pix || config.instrucoes || config.pix_instrucoes || '',
        qr_code_auto: config.pix_auto === true,
        dias_carencia: Number(config.dias_carencia || 0),
        multa_atraso_percentual: Number(config.multa_atraso_perc || config.multa_atraso_percentual || 2),
        juros_mora_mensal: Number(config.juros_mora_mensal_perc || config.juros_mora_mensal_percentual || 1),
        multa_juros_habilitado: config.multa_juros_habilitado !== false,
      }

      // Verifica se as chaves existem de fato para PIX Manual ser considerado configurado ativo (UX check)
      const isPixConfigured = !!(mapped.chave_pix || mapped.qr_code_url || mapped.qr_code_auto);

      if (!isPixConfigured) {
        console.warn('PIX não configurado adequadamente na config_financeira:', config)
      }

      return isPixConfigured ? mapped : null;
    } catch (err) {
      console.error('Erro buscarConfigPixEscola:', err)
      return null
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
  // CONFIRMAÇÃO DE PAGAMENTO COM COMPROVANTE
  // ==========================================
  async uploadComprovante(file: File, tenantId: string, filename: string) {
    validateComprovanteFile(file)

    const fileExt = safeFileExtension(file)
    const filePath = `${tenantId}/${filename}_${crypto.randomUUID()}.${fileExt}`

    // O bucket correto é 'publico' conforme padrão do sistema
    const { data, error } = await supabase.storage
      .from('publico' as any)
      .upload(filePath, file, { 
        upsert: false,
        cacheControl: '3600'
      })

    if (error) {
      // Fallback para bucket de comprovantes se existir
      const { data: dataAlt, error: errorAlt } = await supabase.storage
        .from('comprovantes' as any)
        .upload(filePath, file, {
          upsert: false,
          cacheControl: '3600'
        })
      
      if (errorAlt) throw errorAlt
      const { data: urlData } = supabase.storage.from('comprovantes' as any).getPublicUrl(filePath)
      return urlData.publicUrl
    }

    const { data: urlData } = supabase.storage.from('publico' as any).getPublicUrl(filePath)
    return urlData.publicUrl
  },

  async registrarPagamentoComComprovante(cobrancaIds: string | string[], comprovanteUrl: string, responsavelId: string) {
    const isArray = Array.isArray(cobrancaIds)
    
    let query = supabase.from('cobrancas').update({
      comprovante_url: comprovanteUrl,
      updated_at: new Date().toISOString()
    })

    if (isArray) {
      query = query.in('id', cobrancaIds)
    } else {
      query = query.eq('id', cobrancaIds)
    }

    const { error } = await query

    if (error) throw error

    // 1. Notifica a escola sobre o novo comprovante para baixa manual
    try {
      const ids = isArray ? cobrancaIds : [cobrancaIds]
      // Busca dados das faturas e alunos para compor a mensagem
      const { data: cobData } = await supabase
        .from('cobrancas')
        .select(`
          valor, 
          aluno_id, 
          tenant_id, 
          descricao,
          tipo_cobranca,
          alunos:aluno_id (
            nome_completo,
            matriculas (
              status,
              turma:turma_id (nome)
            )
          )
        `)
        .in('id', ids)

      if (cobData && cobData.length > 0) {
        const tenantId = cobData[0].tenant_id
        const totalValor = cobData.reduce((acc, c) => acc + Number(c.valor || 0), 0)
        
        // Coleta dados dos alunos e turmas
        const alunosTurmasInfo = cobData.map(c => {
          const aluno = c.alunos as any
          const matriculaAtiva = aluno?.matriculas?.find((m: any) => m.status === 'ativa')
          return {
            nome: aluno?.nome_completo,
            turma: matriculaAtiva?.turma?.nome || 'Sem Turma'
          }
        })

        const alunosNomes = [...new Set(alunosTurmasInfo.map(a => a.nome))].join(', ')
        const turmasNomes = [...new Set(alunosTurmasInfo.map(a => a.turma))].join(', ')
        
        // Extrai meses e tipo das descrições
        const meses = [...new Set(cobData.map(c => c.descricao))].join('; ')
        const tipos = [...new Set(cobData.map(c => c.tipo_cobranca))].map(t => t === 'mensalidade' ? 'Mensalidade' : 'Outro').join(', ')

        // Busca nome do responsável que enviou
        const { data: respData } = await supabase
          .from('responsaveis')
          .select('nome')
          .eq('id', responsavelId)
          .maybeSingle()

        const responsavelNome = respData?.nome || 'Um responsável'

        // Cria a notificação para a gestão escolar/financeira
        await supabase.from('notificacoes').insert({
          tenant_id: tenantId ?? 'sistema',
          user_id: null,
          tipo: 'PAGAMENTO_PIX_MANUAL',
          titulo: 'Novo Comprovante PIX',
          mensagem: `${responsavelNome} enviou comprovante de R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para ${alunosNomes} (${turmasNomes}). Referente a: ${meses}. Por favor, valide se o pagamento foi mesmo feito e verifique o WhatsApp.`,
          href: '/financeiro/cobrancas',
          categoria: 'FINANCEIRO',
          prioridade: 2,
          metadata: { 
            cobranca_ids: ids, 
            responsavel_id: responsavelId,
            responsavel_nome: responsavelNome,
            aluno_nome: alunosNomes,
            turma_nome: turmasNomes,
            valor_total: totalValor,
            meses_referencia: meses,
            tipo_cobranca: tipos,
            perfis_permitidos: ['gestor', 'administrativo', 'financeiro'],
            perfis_excluidos: ['contador']
          },
          lida: false,
          resolvida: false
        } as any)
      }
    } catch (notifyError) {
      console.warn('Falha silenciosa ao gerar notificação para a escola:', notifyError)
    }

    // 2. Registra auditoria técnica
    await portalService.registrarAuditoria({
      tipo: isArray ? 'pagamento_multiplo_comprovante_enviado' : 'pagamento_comprovante_enviado',
      responsavel_id: responsavelId,
      detalhes: { 
        cobranca_ids: isArray ? cobrancaIds : [cobrancaIds], 
        url: comprovanteUrl 
      },
    })
  },

  // ==========================================
  // FILA VIRTUAL
  // ==========================================
  async entrarNaFila(dados: { tenant_id: string; aluno_id: string; responsavel_id: string }) {
    // Verifica se já está na fila aguardando
    const { data: existente } = await supabase.from('fila_virtual')
      .select('id')
      .eq('aluno_id', dados.aluno_id)
      .eq('responsavel_id', dados.responsavel_id)
      .eq('status', 'aguardando')
      .maybeSingle()

    if (existente) throw new Error('Você já está na fila de espera.')

    const { data, error } = await supabase.from('fila_virtual')
      .insert({
        ...dados,
        status: 'aguardando',
      })
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
    const { data, error } = await supabase.from('fila_virtual')
      .select('*, aluno:alunos(nome_completo)')
      .eq('responsavel_id', responsavelId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error
    return (data as any[]) || []
  },

   async cancelarFila(filaId: string) {
    const { error } = await supabase.from('fila_virtual')
      .update({ status: 'cancelado', updated_at: new Date().toISOString() })
      .eq('id', filaId)

    if (error) throw error
  },

  // ==========================================
  // AUDITORIA
  // ==========================================
  async registrarAuditoria(log: { tipo: string; responsavel_id: string; detalhes?: any }) {
    try {
      await supabase.from('portal_audit_log').insert({
        tipo: log.tipo,
        responsavel_id: log.responsavel_id,
        detalhes: log.detalhes || {},
        ip: null, // Preenchido por RLS/trigger no futuro
      })
    } catch (error) {
      // Não bloquear fluxo por falha de auditoria
      console.error('Falha ao registrar auditoria:', log.tipo, error)
    }
  },

  // ==========================================
  // BOLETIM (V2 com fallback legado)
  // ==========================================
  async buscarBoletins(alunoId: string, tenantId: string) {
    // 1. Tenta a view V2 (novo modelo relacional)
    try {
      const { data: v2Data, error: v2Error } = await supabase.from('vw_boletim_completo')
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
    } catch (error) {
      // Silencia erros mas loga para depuração (view pode não existir em ambientes antigos)
      console.error('PortalService: Erro ao buscar boletins V2:', error)
    }

    // 2. Fallback: modelo legado JSONB
    const { data, error } = await supabase.from('boletins')
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
    let query = supabase.from('eventos')
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
    const { data, error } = await supabase.from('document_solicitations')
      .insert({
        ...dados,
        status: 'pendente',
      })
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
    const { data, error } = await supabase.from('document_solicitations')
      .select(`
        *,
        aluno:alunos(*),
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
  // NOTIFICAÇÕES DA FAMÍLIA (Welcome, Financeiro, etc.)
  // ==========================================
  async buscarNotificacoesFamilia(responsavelId: string, alunoId?: string) {
    let query = supabase
      .from('notificacoes_familia' as any)
      .select('*')
      .eq('responsavel_id', responsavelId)
      .order('created_at', { ascending: false })

    if (alunoId) {
      query = query.eq('aluno_id', alunoId)
    }

    const { data, error } = await query
    if (error) throw error
    return (data as any[]) || []
  },

  async marcarNotificacaoFamiliaLida(notificacaoId: string) {
    const { error } = await supabase
      .from('notificacoes_familia' as any)
      .update({ 
        lida: true, 
        lida_em: new Date().toISOString() 
      } as any)
      .eq('id', notificacaoId)
    
    if (error) throw error
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
        disciplina: item.disciplina,
        created_at: item.created_at
      }
    }))
  },

  async getNotificationCounts(responsavelId: string) {
    if (!responsavelId) return { total: 0, items: [] }

    // 1. Busca vínculos ativos para obter IDs de alunos e turmas
    const vinculos = await portalService.buscarVinculosAtivos(responsavelId)
    const alunoIds = vinculos.map(v => v.aluno_id)
    const tenantIds = [...new Set(vinculos.map(v => v.aluno.tenant_id))]

    if (alunoIds.length === 0) return { total: 0, items: [] }

    // 2. Busca IDs de turmas e data de matrícula
    const { data: matriculas } = await supabase.from('matriculas')
      .select('aluno_id, turma_id, data_matricula')
      .in('aluno_id', alunoIds)
      .in('status', ['ativa' as any, 'pendente' as any, 'pre_matricula' as any])

    const turmaIds = [...new Set((matriculas || []).map(m => m.turma_id).filter(Boolean))]
    
    // Mapeia data de matrícula por aluno para filtro preciso
    const matriculasMap = (matriculas || []).reduce((acc: any, m: any) => {
      if (m.data_matricula) {
        const d = new Date(m.data_matricula + 'T12:00:00')
        d.setDate(1)
        d.setHours(0,0,0,0)
        acc[m.aluno_id] = d.getTime()
      }
      return acc
    }, {})

    // 3. Busca contagens em paralelo
    const [cobrancasFin, avisosRes, atividadesRes, boletinsRes, faltasRes] = await Promise.all([
      (supabase.from('cobrancas' as any) as any)
        .select('status, data_vencimento')
        .in('aluno_id', alunoIds)
        .in('status', ['a_vencer', 'atrasado']),
      (supabase.from('mural_avisos' as any) as any)
        .select('id', { count: 'exact', head: true })
        .in('tenant_id', tenantIds)
        .or(`data_inicio.is.null,data_inicio.lte.${new Date().toISOString().split('T')[0]}`)
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
        .gte('updated_at', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()),
      (supabase.from('frequencias' as any) as any)
        .select('id', { count: 'exact', head: true })
        .in('aluno_id', alunoIds)
        .eq('status', 'falta')
        .gte('data_aula', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    ])

    const notifications: any[] = []
    
    // Processamento do Financeiro (Com Regras de Matrícula PER-ALUNO e Limite de Exibição)
    let cobrancasFiltradas = (cobrancasFin.data as any[]) || []
    
    cobrancasFiltradas = cobrancasFiltradas.filter((c: any) => {
      const dataMatriculaLimiar = matriculasMap[c.aluno_id]
      if (!dataMatriculaLimiar) return true // Se não tem data de matrícula, mantém (regra de segurança)
      
      const dV = new Date(c.data_vencimento + 'T12:00:00')
      dV.setDate(1)
      dV.setHours(0,0,0,0)
      return dV.getTime() >= dataMatriculaLimiar
    })

    const atrasadasCount = cobrancasFiltradas.filter((c: any) => c.status === 'atrasado').length
    const futurasCount = cobrancasFiltradas.filter((c: any) => c.status === 'a_vencer').length
    
    const financeiroDisplayCount = atrasadasCount > 0 ? atrasadasCount : (futurasCount > 0 ? 1 : 0)

    if (financeiroDisplayCount > 0) {
      notifications.push({ 
        id: 'cobrancas', 
        label: atrasadasCount > 0 
          ? `${atrasadasCount} ${atrasadasCount === 1 ? 'Nova cobrança atrasada' : 'Cobranças atrasadas'}` 
          : '1 Nova cobrança mensal', 
        href: '/portal/financeiro',
        category: 'FINANCEIRO'
      })
    }

    if (faltasRes.count && faltasRes.count > 0) {
      notifications.push({ 
        id: 'frequencia_faltas', 
        label: `${faltasRes.count} ${faltasRes.count === 1 ? 'Nova falta registrada' : 'Novas faltas registradas'}`, 
        href: '/portal/frequencia',
        category: 'ACADÊMICO'
      })
    }

    if (avisosRes.count && avisosRes.count > 0) {
      notifications.push({ 
        id: 'avisos', 
        label: `${avisosRes.count} ${avisosRes.count === 1 ? 'Novo aviso' : 'Novas avisos'} no mural`, 
        href: '/portal/avisos',
        category: 'COMUNICADOS'
      })
    }

    if (atividadesRes.count && atividadesRes.count > 0) {
      notifications.push({ 
        id: 'atividades', 
        label: `${atividadesRes.count} ${atividadesRes.count === 1 ? 'Nova atividade' : 'Novas atividades'} postadas`, 
        href: '/portal/agenda',
        category: 'ACADÊMICO'
      })
    }

    if (boletinsRes.count && boletinsRes.count > 0) {
      notifications.push({ 
        id: 'boletins', 
        label: `${boletinsRes.count} ${boletinsRes.count === 1 ? 'Nota atualizada' : 'Notas atualizadas'} no boletim`, 
        href: '/portal/boletim',
        category: 'ACADÊMICO'
      })
    }

    const total = financeiroDisplayCount + (avisosRes.count || 0) + (atividadesRes.count || 0) + (boletinsRes.count || 0) + (faltasRes.count || 0)

    return {
      total,
      items: notifications
    }
  },
}
