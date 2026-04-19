import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { logger } from '@/lib/logger'
import { validarPermissao } from '@/lib/rbac-validation'

type AlunoInsert = Database['public']['Tables']['alunos']['Insert']
type AlunoUpdate = Database['public']['Tables']['alunos']['Update']
type ResponsavelInsert = Database['public']['Tables']['responsaveis']['Insert']
type AlunoResponsavelInsert = Database['public']['Tables']['aluno_responsavel']['Insert']

export const alunoService = {
  async listar(tenantId: string, professorId?: string) {
    let query = supabase
      .from('alunos')
      .select('*, filiais(*), aluno_responsavel(*, responsaveis(*))')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    // Se for professor, filtrar alunos que estão em turmas onde ele leciona
    if (professorId) {
       // Buscar turmas deste professor
       const { data: turmasIds } = await (supabase.from('turma_professores' as any) as any)
         .select('turma_id')
         .eq('professor_id', professorId)
       
       const idsT = turmasIds?.map((t: any) => t.turma_id) || []
       
       if (idsT.length === 0) return []

       // Buscar alunos vinculados a essas turmas via matriculas ativas
       const { data: matriculasAlunos } = await (supabase.from('matriculas' as any) as any)
         .select('aluno_id')
         .in('turma_id', idsT)
         .eq('status', 'ativa')
       
       const idsA = matriculasAlunos?.map((m: any) => m.aluno_id) || []
       
       if (idsA.length === 0) return []
       
       query = query.in('id', idsA)
    }

    const { data, error } = await query.order('nome_completo')

    if (error) throw error

    // Buscar matrículas ativas e turmas para cada aluno
    const ids = (data as any[])?.map(a => a.id) || []
    if (ids.length === 0) return (data as any[]) || []

    const { data: matriculas } = await (supabase.from('matriculas' as any) as any)
      .select(`
        aluno_id,
        status,
        data_matricula,
        turmas(id, nome, valor_mensalidade)
      `)
      .in('aluno_id', ids)
      .eq('status', 'ativa')

    // Extrair valor da mensalidade e data de ingresso da turma atual para cada aluno
    return (data as any[])?.map(aluno => {
      const matriculaAtiva = matriculas?.find((m: any) => m.aluno_id === aluno.id && m.status === 'ativa')
      if (matriculaAtiva && matriculaAtiva.turmas) {
        // REGRA DE NEGÓCIO: Professores NÃO podem ver valor de mensalidade
        if (!professorId) {
          aluno.valor_mensalidade_atual = matriculaAtiva.turmas.valor_mensalidade
        }
        aluno.turma_atual = matriculaAtiva.turmas
        aluno.data_ingresso = matriculaAtiva.data_matricula
      }
      return aluno
    }) || []
  },

  async buscarPorId(id: string, tenantId: string, isProfessor: boolean = false) {
    const { data: aluno, error: alunoError } = await supabase
      .from('alunos')
      .select(`
        *,
        filiais(*),
        aluno_responsavel(*, responsaveis(*))
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single()

    if (alunoError) throw alunoError

    // Buscar matrícula ativa do aluno
    if (aluno) {
      const { data: matricula, error: _matError } = await (supabase.from('matriculas' as any) as any)
        .select(`
          id,
          status,
          ano_letivo,
          serie_ano,
          turno,
          data_matricula,
          turma_id
        `)
        .eq('aluno_id', id)
        .eq('status', 'ativa')
        .maybeSingle()

      // Buscar turma separadamente
      if (matricula && matricula.turma_id) {
        const { data: turma, error: turmaError } = await supabase
          .from('turmas')
          .select('id, nome, valor_mensalidade')
          .eq('id', matricula.turma_id)
          .maybeSingle()

        if (turma && !turmaError) {
          const turmaData = turma as any
          // REGRA DE NEGÓCIO: Professores NÃO podem ver valor de mensalidade
          if (!isProfessor) {
            ;(aluno as any).valor_mensalidade_atual = turmaData.valor_mensalidade
          }
          ;(aluno as any).turma_atual = turmaData
          ;(aluno as any).data_ingresso = matricula.data_matricula
          ;(aluno as any).serie_ano = matricula.serie_ano
          ;(aluno as any).turma_nome = turmaData.nome
          ;(aluno as any).ano_letivo = matricula.ano_letivo
        }
      }
    }

    return aluno
  },

  async contarAtivos(tenantId: string, professorId?: string) {
    let query = supabase
      .from('alunos')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'ativo')
      .is('deleted_at', null)

    if (professorId) {
       const { data: turmasIds } = await (supabase.from('turma_professores' as any) as any)
         .select('turma_id')
         .eq('professor_id', professorId)
       
       const idsT = turmasIds?.map((t: any) => t.turma_id) || []
       
       if (idsT.length === 0) return 0

       const { data: matriculasAlunos } = await (supabase.from('matriculas' as any) as any)
         .select('aluno_id')
         .in('turma_id', idsT)
         .eq('status', 'ativa')
       
       const idsA = matriculasAlunos?.map((m: any) => m.aluno_id) || []
       
       if (idsA.length === 0) return 0
       
       query = query.in('id', idsA)
    }

    const { count, error } = await query

    if (error) throw error
    return count || 0
  },

  async criar(aluno: AlunoInsert, userId?: string, isProfessor?: boolean) {
    // REGRA DE NEGÓCIO: Professores NÃO podem adicionar alunos
    if (isProfessor) {
      throw new Error('Professores não têm permissão para adicionar alunos.')
    }

    // Validação RBAC: alunos.create
    if (userId && aluno.tenant_id) {
      await validarPermissao(userId, aluno.tenant_id, 'alunos.create')
    }

    const { data, error } = await supabase
      .from('alunos')
      .insert(aluno)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async criarComResponsavel(
    responsavel: ResponsavelInsert,
    alunoDados: AlunoInsert,
    grauParentesco: string | null,
    isFinanceiro: boolean = true,
    userId?: string,
    isProfessor?: boolean
  ) {
    // REGRA DE NEGÓCIO: Professores NÃO podem adicionar alunos
    if (isProfessor) {
      throw new Error('Professores não têm permissão para adicionar alunos.')
    }

    // Validação RBAC: alunos.create
    if (userId && alunoDados.tenant_id) {
      await validarPermissao(userId, alunoDados.tenant_id, 'alunos.create')
    }

    // 0. Preparar dados (limpar CPF)
    const cpfLimpo = responsavel.cpf.replace(/\D/g, '')
    const _alunoCpfLimpo = alunoDados.cpf ? alunoDados.cpf.replace(/\D/g, '') : null

    // 1. Verificar se responsável já existe pelo CPF (sempre buscar pelo limpo)
    const { data: respExistente, error: respCheckError } = await supabase
      .from('responsaveis')
      .select('id, cpf, user_id, email')
      .or(`cpf.eq.${cpfLimpo},cpf.eq.${responsavel.cpf}`)
      .maybeSingle()

    let respData: { id: string; cpf: string; user_id?: string | null } | null = null

    if (respCheckError) throw respCheckError

    let authUserId = respExistente?.user_id || null

    // 2. Criar ou Vincular usuário no Auth (se tiver email e senha e não tiver user_id)
    if (!authUserId && responsavel.email && (responsavel as any).senha_hash) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const authClient = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY,
          { auth: { persistSession: false } }
        )

        const { data: authData, error: authError } = await authClient.auth.signUp({
          email: responsavel.email,
          password: (responsavel as any).senha_hash,
          options: {
            data: {
              role: 'responsavel',
              nome: responsavel.nome,
            }
          }
        })

        if (authError) {
          // Se o erro for que o usuário já existe, não paramos o fluxo, mas logamos
          if (authError.message.includes('already registered')) {
            logger.warn('Usuário já existe no Auth, seguindo para vínculo manual se possível.')
            // Idealmente buscaríamos o ID do usuário existente, mas o signUp por anon não permite.
            // O ideal para esses casos é o dashboard do Supabase ter o "Confirm Email" desativado.
          } else {
            logger.error('Erro ao criar usuário auth para responsável:', authError)
          }
        } else {
          authUserId = authData.user?.id || null
        }
      } catch (authErr) {
        logger.error('Falha crítica no SignUp do responsável:', authErr)
      }
    }

    if (respExistente) {
      // 3. Responsável já existe, atualiza o user_id se ele foi gerado agora e estava nulo
      if (authUserId && !respExistente.user_id) {
        try {
          const { error: updateError } = await supabase.from('responsaveis')
            .update({ user_id: authUserId })
            .eq('id', respExistente.id)
          
          if (updateError) {
            // Se falhar por RLS, logamos mas não travamos — o responsável já existe
            if (updateError.code === '42501') {
              logger.warn('⚠️ RLS impediu update do user_id no responsável existente. Continuando sem vincular auth.', {
                responsavelId: respExistente.id,
                authUserId,
                hint: 'Execute a migration 150_fix_responsaveis_rls_definitivo.sql'
              })
            } else {
              logger.error('Erro ao atualizar user_id do responsável:', updateError)
            }
          }
        } catch (err) {
          logger.error('Falha no update do responsável existente:', err)
        }
      }
      respData = { id: respExistente.id, cpf: respExistente.cpf, user_id: authUserId }
    } else {
      // 4. Criar novo responsável
      const insertPayload = {
        ...responsavel,
        cpf: cpfLimpo, // Garante CPF limpo no banco
        user_id: authUserId
      }

      // Remove senha_hash do payload se veio como campo virtual (não é coluna real no insert direto)
      const cleanPayload = { ...insertPayload }
      delete (cleanPayload as any).senha // Remove campo virtual se existir

      const { data: novaResp, error: respError } = await supabase.from('responsaveis')
        .insert(cleanPayload)
        .select('id, cpf, user_id')
        .single()

      if (respError) {
        // Tratamento específico para erro de RLS (42501)
        if (respError.code === '42501') {
          logger.error('❌ Erro RLS ao inserir responsável. Payload:', {
            cpf: cpfLimpo,
            nome: responsavel.nome,
            email: responsavel.email,
            user_id: authUserId,
            errorCode: respError.code,
            errorMessage: respError.message,
            hint: 'Execute a migration 150_fix_responsaveis_rls_definitivo.sql no Supabase'
          })
          throw new Error(
            'Erro de permissão ao cadastrar responsável. ' +
            'A política de segurança do banco precisa ser atualizada. ' +
            'Contate o administrador do sistema (Migration 150 pendente).'
          )
        }
        throw respError
      }
      respData = novaResp
    }

    // 3. Criar aluno
    const { data: alunoData, error: alunoError } = await supabase.from('alunos')
      .insert(alunoDados)
      .select()
      .single()

    if (alunoError) throw alunoError

    // 4. Vincular via aluno_responsavel (N:N)
    const vinculo: AlunoResponsavelInsert = {
      aluno_id: alunoData.id,
      responsavel_id: respData!.id,
      grau_parentesco: grauParentesco,
      is_financeiro: isFinanceiro,
      is_academico: true,
      status: 'ativo'
    }
    const { error: vincError } = await supabase
      .from('aluno_responsavel')
      .insert(vinculo)

    if (vincError) throw vincError

    // REGRA DE NEGÓCIO ATUALIZADA (Março/2026): 
    // O financeiro (cobranças) agora é gerado apenas no momento da MATRÍCULA (academicoService),
    // respeitando o fluxo de que o aluno pode ser cadastrado antes de ser matriculado em uma turma.

    return alunoData
  },

  async atualizar(id: string, aluno: AlunoUpdate, userId?: string, tenantId?: string, isProfessor?: boolean) {
    // REGRA DE NEGÓCIO: Professores NÃO podem editar alunos
    if (isProfessor) {
      throw new Error('Professores não têm permissão para editar alunos.')
    }

    // Validação RBAC: alunos.update
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'alunos.update')
    }

    const { data, error } = await supabase
      .from('alunos')
      .update(aluno)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async excluir(id: string, userId?: string, tenantId?: string, isProfessor?: boolean) {
    if (isProfessor) {
      throw new Error('Professores não têm permissão para excluir alunos.')
    }
    
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'alunos.delete')
    }

    // 1. O financeiro é crítico: Evita a exclusão do aluno caso existam dívidas / faturas pendentes
    const { data: pendencias, error: pendenciaError } = await supabase
      .from('cobrancas')
      .select('id')
      .eq('aluno_id', id)
      .in('status', ['a_vencer', 'atrasado'])
    
    if (pendenciaError) throw pendenciaError
    if (pendencias && pendencias.length > 0) {
      throw new Error(`Exclusão bloqueada: existem ${pendencias.length} cobranças pendentes.`)
    }

    // 2. Snaphot dos IDs dos responsáveis ANTES de deletar para lidar com os órfãos depois
    const { data: vinculosPre } = await supabase
      .from('aluno_responsavel')
      .select('responsavel_id')
      .eq('aluno_id', id)
    const responsaveisIds = vinculosPre?.map(v => v.responsavel_id).filter(Boolean) as string[] || []

    try {
      // 3. Exclusão Otimizada - O Postgres tratará faturas, diários de classe, autorizações e faltas nativamente e numa única transaction interna.
      const { error } = await supabase.from('alunos').delete().eq('id', id)

      if (error) {
        if (error.code === '23503') throw new Error('Não é possível excluir o aluno. Dívidas ou pendências órfãs bloquearam o CASCADE.')
        throw error
      }

      // 4. Limpar acesso ao Portal dos pais que ficaram sem NENHUM filho após esta deleção
      for (const respId of responsaveisIds) {
        const { count } = await supabase
          .from('aluno_responsavel')
          .select('*', { count: 'exact', head: true })
          .eq('responsavel_id', respId)

        if (count === 0) {
          await supabase
            .from('responsaveis')
            .update({ user_id: null, senha_hash: '', status: 'inativo', primeiro_acesso: false })
            .eq('id', respId)
        }
      }
    } catch (err) {
      logger.error('Erro na exclusão de aluno: ', err)
      throw err
    }
  },

  async listarPorFilial(filialId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('filial_id', filialId)
      .eq('tenant_id', tenantId)
      .eq('status', 'ativo')
      .order('nome_completo')

    if (error) throw error
    return data
  },

  async ativarAcessoPortal(responsavelId: string, senha: string, userId?: string, tenantId?: string) {
    // Validação RBAC: alunos.manage_responsaveis
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'alunos.manage_responsaveis')
    }

    // 1. Buscar dados do responsável
    const { data: resp, error: respError } = await supabase
      .from('responsaveis')
      .select('nome, email, cpf, user_id')
      .eq('id', responsavelId)
      .single()

    if (respError) throw respError
    if (!resp.email) throw new Error('O responsável precisa ter um e-mail cadastrado.')

    // 2. Criar usuário no Auth usando cliente temporário
    const { createClient } = await import('@supabase/supabase-js')
    const authClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      { auth: { persistSession: false } }
    )

    const { data: authData, error: authError } = await authClient.auth.signUp({
      email: resp.email,
      password: senha,
      options: {
        data: {
          role: 'responsavel',
          nome: resp.nome,
        }
      }
    })

    if (authError) throw authError

    // 3. Atualizar o user_id no banco
    const { error: updateError } = await supabase
      .from('responsaveis')
      .update({ 
        user_id: authData.user?.id,
        cpf: resp.cpf.replace(/\D/g, ''), // Aproveita para limpar CPF no banco se estiver sujo
        primeiro_acesso: true,
        termos_aceitos: false,
        status: 'ativo'
      })
      .eq('id', responsavelId)

    if (updateError) throw updateError

    return authData.user
  },

  async alternarResponsavelFinanceiro(vinculoId: string, isFinanceiro: boolean, alunoId?: string, userId?: string, tenantId?: string) {
    // Validação RBAC: alunos.manage_responsaveis
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'alunos.manage_responsaveis')
    }

    if (isFinanceiro && alunoId) {
      // REGRA: Somente UM pode ser o pagador. Remove flag de todos os outros deste aluno.
      await supabase
        .from('aluno_responsavel')
        .update({ is_financeiro: false })
        .eq('aluno_id', alunoId)
    }

    const { error } = await supabase
      .from('aluno_responsavel')
      .update({ is_financeiro: isFinanceiro })
      .eq('id', vinculoId)

    if (error) throw error
  },

  async atualizarResponsavel(id: string, responsavel: Partial<ResponsavelInsert>, userId?: string, tenantId?: string) {
    // Validação RBAC: alunos.manage_responsaveis
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'alunos.manage_responsaveis')
    }

    // Se tiver CPF, garante que está limpo
    const payload = { ...responsavel }
    if (payload.cpf) payload.cpf = payload.cpf.replace(/\D/g, '')

    const { data, error } = await supabase
      .from('responsaveis')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async vincularExistente(alunoId: string, responsavelId: string, grauParentesco: string, userId?: string, tenantId?: string) {
    // Validação RBAC: alunos.manage_responsaveis
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'alunos.manage_responsaveis')
    }

    const { error } = await supabase
      .from('aluno_responsavel')
      .insert({
        aluno_id: alunoId,
        responsavel_id: responsavelId,
        grau_parentesco: grauParentesco,
        is_financeiro: false,
        is_academico: true,
        status: 'ativo'
      })
    if (error) throw error
  },

  async criarResponsavelAndVincular(alunoId: string, responsavel: Partial<ResponsavelInsert>, grauParentesco: string, userId?: string, tenantId?: string) {
    // Validação RBAC: alunos.manage_responsaveis
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'alunos.manage_responsaveis')
    }

    // 1. Criar responsável
    const { data: novoResp, error: respError } = await supabase
      .from('responsaveis')
      .insert({
        ...responsavel,
        cpf: responsavel.cpf?.replace(/\D/g, '')
      } as any)
      .select()
      .single()

    if (respError) throw respError

    // 2. Vincular
    await this.vincularExistente(alunoId, novoResp.id, grauParentesco)
    
    return novoResp
  },

  async desvincularResponsavel(vinculoId: string, userId?: string, tenantId?: string) {
    // Validação RBAC: alunos.manage_responsaveis
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'alunos.manage_responsaveis')
    }

    const { error } = await supabase
      .from('aluno_responsavel')
      .delete()
      .eq('id', vinculoId)

    if (error) throw error
  },

  async contarImportacoesPendentes(tenantId: string) {
    const { count, error } = await supabase
      .from('importacoes_staging')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'pendente')
    if (error) throw error
    return count || 0
  },

  async deletarLoteImportacao(tenantId: string, loteId?: string) {
    const query = supabase
      .from('importacoes_staging')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('status', 'pendente')
    
    if (loteId) {
      query.eq('lote_id', loteId)
    }

    const { error } = await query
    if (error) throw error
  }
}

