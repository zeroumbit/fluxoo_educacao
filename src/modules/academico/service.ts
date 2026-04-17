import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { validarPermissao } from '@/lib/rbac-validation'

export const academicoService = {
  // MATRÍCULAS
  async listarMatriculas(tenantId: string, professorId?: string) {
    let query = supabase.from('matriculas' as any)
      .select('*, aluno:alunos(nome_completo, cpf)')
      .eq('tenant_id', tenantId)

    if (professorId) {
      const { data: vincs } = await (supabase.from('turma_professores' as any) as any)
        .select('turma_id')
        .eq('professor_id', professorId)
      const idsT = vincs?.map((v: any) => v.turma_id) || []
      if (idsT.length === 0) return []
      query = query.in('turma_id', idsT)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },
  async criarMatricula(matricula: any, userId?: string) {
    // Validação RBAC: academico.matriculas.create
    if (userId && matricula.tenant_id) {
      await validarPermissao(userId, matricula.tenant_id, 'academico.matriculas.create')
    }

    // Limpeza rigorosa: Enviar apenas o que o banco espera (baseado em database.types.ts)
    const payload = {
      tenant_id: matricula.tenant_id,
      aluno_id: matricula.aluno_id,
      ano_letivo: Number(matricula.ano_letivo),
      serie_ano: matricula.serie_ano,
      turma_id: matricula.turma_id || null,
      turno: matricula.turno,
      valor_matricula: Number(matricula.valor_matricula),
      status: matricula.status || 'ativa',
      data_matricula: matricula.data_matricula || new Date().toISOString().split('T')[0]
    }

    if (!payload.tenant_id || !payload.aluno_id) {
      const errorMsg = 'Dados obrigatórios ausentes: tenant_id ou aluno_id.';
      logger.error('❌ [academicoService.criarMatricula]', errorMsg, payload);
      throw new Error(errorMsg);
    }

    // --- NOVA VALIDAÇÃO DE CAPACIDADE ---
    if (payload.turma_id) {
      const { data: turma, error: tErr } = await (supabase.from('turmas' as any) as any)
        .select('nome, capacidade_maxima, alunos_ids')
        .eq('id', payload.turma_id)
        .single()
      
      if (!tErr && turma) {
        const matriculados = (turma.alunos_ids || []).length
        if (turma.capacidade_maxima && matriculados >= turma.capacidade_maxima) {
          throw new Error(`Turma cheia! A turma "${turma.nome}" possui capacidade para ${turma.capacidade_maxima} alunos e já tem ${matriculados} matriculados.`)
        }
      }
    }
    // ------------------------------------

    // Tenta primeiro com plural (padrão do sistema)
    const { data: insertedData, error } = await (supabase.from('matriculas' as any) as any)
      .insert(payload)
      .select()
      .single()

    if (error) {
      if (error.code === '42P01') {
         throw new Error(`Erro de Banco de Dados: Uma regra de automação (Trigger) está tentando acessar uma tabela inexistente (${error.message}). Por favor, execute a migration 058 no SQL Editor.`);
      }
      throw error
    }
    
    if (!insertedData) {
      throw new Error('Matrícula inserida, mas nenhum dado retornado pelo banco.')
    }

    const data = insertedData

    logger.info('✅ [academicoService.criarMatricula] Matrícula criada:', data.id)
    
    // Tenta gerar cobranças iniciais (proporcional, etc)
    try {
      const { financeiroService } = await import('@/modules/financeiro/service')
      await financeiroService.gerarCobrancasIniciaisMatricula(data)
    } catch (finError: any) {
      logger.error('⚠️ [academicoService.criarMatricula] Erro ao gerar cobranças automáticas:', finError)
      if (finError.message?.includes('violates foreign key') || finError.code === '23503') {
        throw new Error('Erro de integridade ao gerar cobranças. Verifique as configurações da turma.')
      }
    }

    // Tenta sincronizar o valor da mensalidade no cadastro do aluno para reflexão no portal/listagem
    try {
      const { data: turma } = await (supabase.from('turmas' as any) as any)
        .select('valor_mensalidade')
        .eq('id', data.turma_id)
        .maybeSingle()

      await (supabase.from('alunos' as any) as any)
        .update({ 
          valor_mensalidade_atual: turma?.valor_mensalidade || data.valor_matricula,
          status: 'ativo'
        })
        .eq('id', data.aluno_id)
    } catch (syncError) {
      logger.error('⚠️ [academicoService.criarMatricula] Erro ao sincronizar valor no aluno:', syncError)
    }

    // Tenta disparar o informativo de boas-vindas e transparência financeira
    try {
      const { welcomeService } = await import('@/modules/comunicacao/welcome.service')
      await welcomeService.sendWelcomeRelease(data.id)
    } catch (welcomeError) {
      logger.error('⚠️ [academicoService.criarMatricula] Erro ao disparar Welcome Release:', welcomeError)
    }

    return data
  },
  async atualizarMatricula(id: string, tenantId: string, matricula: any, userId?: string) {
    // Validação RBAC: academico.matriculas.update
    if (userId) {
      await validarPermissao(userId, tenantId, 'academico.matriculas.update')
    }

    // --- NOVA VALIDAÇÃO DE CAPACIDADE NO UPDATE ---
    if (matricula.turma_id) {
      const { data: currentMatricula } = await (supabase.from('matriculas' as any) as any)
        .select('turma_id, aluno_id')
        .eq('id', id)
        .single();
      
      // Se estiver mudando de turma, ou se a turma_id está sendo atribuída agora (anteriormente null)
      if (matricula.turma_id !== currentMatricula?.turma_id) {
         const { data: turma, error: tErr } = await (supabase.from('turmas' as any) as any)
          .select('nome, capacidade_maxima, alunos_ids')
          .eq('id', matricula.turma_id)
          .single()
        
        if (!tErr && turma) {
          const matriculados = (turma.alunos_ids || []).length
          const AlunoJaNaTurma = (turma.alunos_ids || []).includes(currentMatricula?.aluno_id);

          if (!AlunoJaNaTurma && turma.capacidade_maxima && matriculados >= turma.capacidade_maxima) {
            throw new Error(`Turma cheia! A turma "${turma.nome}" possui capacidade para ${turma.capacidade_maxima} alunos e já tem ${matriculados} matriculados.`);
          }
        }
      }
    }
    // ----------------------------------------------

    // 1. Atualizar a matrícula
    const { data: updatedList, error } = await (supabase.from('matriculas' as any) as any)
      .update(matricula)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
    
    if (error) throw error
    if (!updatedList || updatedList.length === 0) throw new Error('Matrícula não encontrada.')
    
    const updatedMatricula = updatedList[0]

    // 2. Sincronizar com Aluno (Reflexão no cadastro e portal)
    try {
      await (supabase.from('alunos' as any) as any)
        .update({ 
          valor_mensalidade_atual: updatedMatricula.valor_matricula,
          status: updatedMatricula.status === 'ativa' ? 'ativo' : 'inativo'
        })
        .eq('id', updatedMatricula.aluno_id)
        .eq('tenant_id', tenantId)
    } catch (alunoError) {
      console.error('⚠️ Erro ao sincronizar dados do aluno:', alunoError)
    }

    // 3. Sincronizar Financeiro (Reflexão nas cobranças)
    try {
      const { financeiroService } = await import('@/modules/financeiro/service')
      await financeiroService.sincronizarCobrancasMatricula(updatedMatricula)
    } catch (finError) {
      console.error('⚠️ Erro ao sincronizar cobranças financeiras:', finError)
    }

    return updatedMatricula
  },
  async excluirMatricula(id: string, tenantId: string, userId?: string) {
    // Validação RBAC: academico.matriculas.delete
    if (userId) {
      await validarPermissao(userId, tenantId, 'academico.matriculas.delete')
    }

    const { error } = await (supabase.from('matriculas' as any) as any)
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) throw error
  },
  async verificarMatriculaAtiva(alunoId: string, tenantId: string) {
    if (!tenantId || !alunoId) return false
    try {
      const { data } = await (supabase.from('matriculas' as any) as any)
        .select('id')
        .eq('aluno_id', alunoId)
        .eq('tenant_id', tenantId)
        .eq('status', 'ativa')
        .maybeSingle()
      return data !== null
    } catch {
      return false
    }
  },
  async buscarMatriculaAtiva(alunoId: string, tenantId: string) {
    if (!tenantId || !alunoId) return null
    try {
      const { data, error } = await (supabase.from('matriculas' as any) as any)
        .select('id, ano_letivo, serie_ano, turno, valor_matricula, status, data_matricula')
        .eq('aluno_id', alunoId)
        .eq('tenant_id', tenantId)
        .eq('status', 'ativa')
        .maybeSingle()
      if (error) throw error
      return data
    } catch (e) {
      console.error('❌ Erro em buscarMatriculaAtiva:', e)
      return null
    }
  },
  async listarMatriculasAtivasPorAluno(tenantId: string, professorId?: string) {
    let query = supabase.from('matriculas' as any)
      .select('aluno_id, id, status, ano_letivo, serie_ano, turno')
      .eq('tenant_id', tenantId)
      .eq('status', 'ativa')

    if (professorId) {
      const { data: vincs } = await (supabase.from('turma_professores' as any) as any)
        .select('turma_id')
        .eq('professor_id', professorId)
      const idsT = vincs?.map((v: any) => v.turma_id) || []
      if (idsT.length === 0) return []
      query = query.in('turma_id', idsT)
    }

    const { data, error } = await query
    if (error) throw error
    return (data as any[]) || []
  },

  async listarMatriculasAtivasPorTurma(tenantId: string, turmaId: string) {
    const { data, error } = await supabase.from('matriculas' as any)
      .select('aluno_id, id, status, ano_letivo, serie_ano, turno, turma_id')
      .eq('tenant_id', tenantId)
      .eq('turma_id', turmaId)
      .eq('status', 'ativa')

    if (error) throw error
    return (data as any[]) || []
  },

  // PLANOS DE AULA
  async listarPlanosAula(tenantId: string, professorId?: string) {
    // Select explícito para garantir que professor_id seja retornado
    let query = supabase.from('planos_aula' as any)
      .select('id, tenant_id, filial_id, disciplina, data_aula, conteudo_previsto, conteudo_realizado, observacoes, professor_id, created_at, updated_at, planos_aula_turmas(*, turma:turmas(nome))')
      .eq('tenant_id', tenantId)

    if (professorId) {
       // Filtra planos via tabela de relacionamento com turmas autorizadas
       const { data: vincs } = await (supabase.from('turma_professores' as any) as any)
        .select('turma_id')
        .eq('professor_id', professorId)
       const idsT = vincs?.map((v: any) => v.turma_id) || []

       if (idsT.length === 0) return []

       const { data: planosIds } = await (supabase.from('planos_aula_turmas' as any) as any)
         .select('plano_aula_id')
         .in('turma_id', idsT)

       const idsP = planosIds?.map((p: any) => p.plano_aula_id) || []
       if (idsP.length === 0) return []
       query = query.in('id', idsP)
    }

    const { data, error } = await query.order('data_aula', { ascending: false })
    if (error) throw error
    
    return (data as any[]) || []
  },
  async criarPlanoAula(planoComTurmas: any, userId?: string, professorId?: string) {
    // Validação RBAC: academico.planos_aula.create
    if (userId && planoComTurmas.tenant_id) {
      await validarPermissao(userId, planoComTurmas.tenant_id, 'academico.planos_aula.create')
    }

    const { turmas: turmasToBatch, ...planoData } = planoComTurmas

    // Adiciona professor_id se for professor
    if (professorId) {
      planoData.professor_id = professorId
    }

    // 1. Criar o plano de aula
    const { data: plano, error: planoError } = await (supabase.from('planos_aula' as any) as any)
      .insert(planoData)
      .select()
      .single()
    if (planoError) throw planoError

    // 2. Criar os vínculos com turmas se houver
    if (turmasToBatch && turmasToBatch.length > 0) {
      const records = turmasToBatch.map((t: any) => ({
        plano_aula_id: plano.id,
        turma_id: t.turma_id,
        turno: t.turno,
        horario: t.horario || null,
        tenant_id: planoData.tenant_id
      }))
      const { error: batchError } = await (supabase.from('planos_aula_turmas' as any) as any)
        .insert(records)

      if (batchError) {
        console.error('❌ [academicoService] Erro ao vincular turmas:', batchError)
        // Opcionalmente: deletar o plano de aula se falhar no vínculo?
        // Por enquanto vamos apenas logar, o plano ainda foi criado.
      }
    }

    return plano
  },
  async atualizarPlanoAula(id: string, tenantId: string, planoComTurmas: any, userId?: string, professorId?: string) {
    // Validação RBAC: academico.planos_aula.update
    if (userId) {
      await validarPermissao(userId, tenantId, 'academico.planos_aula.update')
    }

    // Nota: A validação de propriedade (professor só edita seus próprios planos)
    // é feita via RLS no banco de dados e na UI

    const { turmas: turmasToBatch, ...planoData } = planoComTurmas

    // 1. Atualizar o plano de aula
    const { data: plano, error: planoError } = await (supabase.from('planos_aula' as any) as any)
      .update(planoData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (planoError) throw planoError

    // 2. Atualizar os vínculos com turmas (limpar antigos e inserir novos)
    const { error: deleteError } = await (supabase.from('planos_aula_turmas' as any) as any)
      .delete()
      .eq('plano_aula_id', id)
    if (deleteError) throw deleteError

    if (turmasToBatch && turmasToBatch.length > 0) {
      const records = turmasToBatch.map((t: any) => ({
        plano_aula_id: id,
        turma_id: t.turma_id,
        turno: t.turno,
        horario: t.horario || null,
        tenant_id: tenantId
      }))
      const { error: batchError } = await (supabase.from('planos_aula_turmas' as any) as any)
        .insert(records)
      if (batchError) throw batchError
    }

    return plano
  },
  async excluirPlanoAula(id: string, tenantId: string, userId?: string, professorId?: string) {
    // Validação RBAC: academico.planos_aula.delete
    if (userId) {
      await validarPermissao(userId, tenantId, 'academico.planos_aula.delete')
    }

    // Nota: A validação de propriedade (professor só exclui seus próprios planos) 
    // é feita via RLS no banco de dados e na UI
    
    const { error } = await (supabase.from('planos_aula' as any) as any)
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) throw error
  },

  // ATIVIDADES
  async listarAtividades(tenantId: string, professorId?: string) {
    let query = supabase.from('atividades' as any)
      .select('*, atividades_turmas(*, turma:turmas(nome))')
      .eq('tenant_id', tenantId)

    if (professorId) {
       const { data: vincs } = await (supabase.from('turma_professores' as any) as any)
        .select('turma_id')
        .eq('professor_id', professorId)
       const idsT = vincs?.map((v: any) => v.turma_id) || []
       
       if (idsT.length === 0) return []
       
       const { data: ativIds } = await (supabase.from('atividades_turmas' as any) as any)
         .select('atividade_id')
         .in('turma_id', idsT)
       
       const idsA = ativIds?.map((a: any) => a.atividade_id) || []
       if (idsA.length === 0) return []
       query = query.in('id', idsA)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },
  async criarAtividade(atividadeComTurmas: any, userId?: string) {
    // Validação RBAC: academico.atividades.create
    if (userId && atividadeComTurmas.tenant_id) {
      await validarPermissao(userId, atividadeComTurmas.tenant_id, 'academico.atividades.create')
    }

    const { turmas: turmasToBatch, ...atividadeData } = atividadeComTurmas

    // 1. Criar a atividade
    const { data: atividade, error: atividadeError } = await (supabase.from('atividades' as any) as any)
      .insert(atividadeData)
      .select()
      .single()
    if (atividadeError) throw atividadeError

    // 2. Criar os vínculos com turmas se houver
    if (turmasToBatch && turmasToBatch.length > 0) {
      const records = turmasToBatch.map((t: any) => ({
        atividade_id: atividade.id,
        turma_id: t.turma_id,
        turno: t.turno || null,
        horario: t.horario || null,
        tenant_id: atividadeData.tenant_id
      }))
      const { error: batchError } = await (supabase.from('atividades_turmas' as any) as any)
        .insert(records)

      if (batchError) {
        console.error('❌ [academicoService] Erro ao vincular turmas na atividade:', batchError)
      }
    }

    return atividade
  },
  async atualizarAtividade(id: string, tenantId: string, atividadeComTurmas: any, userId?: string) {
    // Validação RBAC: academico.atividades.update
    if (userId) {
      await validarPermissao(userId, tenantId, 'academico.atividades.update')
    }

    const { turmas: turmasToBatch, ...atividadeData } = atividadeComTurmas

    // 1. Atualizar a atividade
    const { data: atividade, error: atividadeError } = await (supabase.from('atividades' as any) as any)
      .update(atividadeData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (atividadeError) throw atividadeError

    // 2. Atualizar os vínculos com turmas (limpar antigos e inserir novos)
    const { error: deleteError } = await (supabase.from('atividades_turmas' as any) as any)
      .delete()
      .eq('atividade_id', id)
    if (deleteError) throw deleteError

    if (turmasToBatch && turmasToBatch.length > 0) {
      const records = turmasToBatch.map((t: any) => ({
        atividade_id: id,
        turma_id: t.turma_id,
        turno: t.turno || null,
        horario: t.horario || null,
        tenant_id: tenantId
      }))
      const { error: batchError } = await (supabase.from('atividades_turmas' as any) as any)
        .insert(records)
      if (batchError) throw batchError
    }

    return atividade
  },
  async excluirAtividade(id: string, tenantId: string, userId?: string) {
    // Validação RBAC: academico.atividades.delete
    if (userId) {
      await validarPermissao(userId, tenantId, 'academico.atividades.delete')
    }

    const { error } = await (supabase.from('atividades' as any) as any)
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) throw error
  },

  // BOLETIM / NOTAS
  async listarBoletinsPorTurma(tenantId: string, turmaId: string, anoLetivo: number, bimestre: number) {
    const { data, error } = await (supabase.from('boletins' as any) as any)
      .select('*, aluno:alunos(nome_completo)')
      .eq('tenant_id', tenantId)
      .eq('turma_id', turmaId)
      .eq('ano_letivo', anoLetivo)
      .eq('bimestre', bimestre)

    if (error) throw error
    return (data as any[]) || []
  },

  async salvarBoletim(boletim: any, userId?: string) {
    // Validação RBAC: academico.boletim.create ou update
    if (userId && boletim.tenant_id) {
      const permission = boletim.id ? 'academico.boletim.update' : 'academico.boletim.create'
      await validarPermissao(userId, boletim.tenant_id, permission)
    }

    const { id, ...data } = boletim

    if (id) {
      const { error } = await (supabase.from('boletins' as any) as any)
        .update(data)
        .eq('id', id)
        .eq('tenant_id', data.tenant_id)
      if (error) throw error
      return true
    } else {
      const { data: novo, error } = await (supabase.from('boletins' as any) as any)
        .insert(data)
        .select()
        .single()
      if (error) throw error
      return novo
    }
  },

  async excluirBoletim(id: string, tenantId: string) {
    const { error } = await (supabase.from('boletins' as any) as any)
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) throw error
  },

  async upsertNota(boletimBase: any, disciplinaNome: string, nota: number, faltas: number, observacoes?: string) {
    // Busca se já existe boletim para este aluno/turma/bimestre
    const { data: existente, error: fetchError } = await (supabase.from('boletins' as any) as any)
      .select('*')
      .eq('tenant_id', boletimBase.tenant_id)
      .eq('aluno_id', boletimBase.aluno_id)
      .eq('turma_id', boletimBase.turma_id)
      .eq('ano_letivo', boletimBase.ano_letivo)
      .eq('bimestre', boletimBase.bimestre)
      .maybeSingle()

    if (fetchError) throw fetchError

    let disciplinas = existente ? (existente.disciplinas as any[]) : []
    const index = disciplinas.findIndex((d: any) => d.disciplina === disciplinaNome)

    if (index >= 0) {
      disciplinas[index] = { ...disciplinas[index], nota, faltas, observacoes }
    } else {
      disciplinas.push({ disciplina: disciplinaNome, nota, faltas, observacoes })
    }

    if (existente) {
      const { error } = await (supabase.from('boletins' as any) as any)
        .update({ disciplinas, updated_at: new Date().toISOString() })
        .eq('id', existente.id)
        .eq('tenant_id', existente.tenant_id)
      if (error) throw error
      return true
    } else {
      const { data: novo, error } = await (supabase.from('boletins' as any) as any)
        .insert({
          tenant_id: boletimBase.tenant_id,
          aluno_id: boletimBase.aluno_id,
          turma_id: boletimBase.turma_id,
          ano_letivo: boletimBase.ano_letivo,
          bimestre: boletimBase.bimestre,
          disciplinas
        })
        .select()
        .single()
      if (error) throw error
      return novo
    }
  },

  async listarHistoricoNotasAluno(tenantId: string, alunoId: string) {
    const { data, error } = await (supabase.from('boletins' as any) as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('aluno_id', alunoId)
      .order('ano_letivo', { ascending: false })
      .order('bimestre', { ascending: true })

    if (error) throw error
    return (data as any[]) || []
  },

  // SELOS
  async listarSelos(tenantId: string, professorId?: string) {
    let query = supabase.from('selos' as any)
      .select('*, aluno:alunos(nome_completo)')
      .eq('tenant_id', tenantId)

    if (professorId) {
       const { data: vincs } = await (supabase.from('turma_professores' as any) as any)
         .select('turma_id')
         .eq('professor_id', professorId)
       const idsT = vincs?.map((v: any) => v.turma_id) || []
       if (idsT.length === 0) return []

       const { data: matrs } = await (supabase.from('matriculas' as any) as any)
         .select('aluno_id')
         .in('turma_id', idsT)
         .eq('status', 'ativa')
       const idsAlunos = matrs?.map((m: any) => m.aluno_id) || []
       if (idsAlunos.length === 0) return []
       query = query.in('aluno_id', idsAlunos)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },
  async atribuirSelo(selo: any) {
    if (!selo.tenant_id) throw new Error('ID do tenant é obrigatório.')
    const { data, error } = await (supabase.from('selos' as any) as any).insert(selo).select().single()
    if (error) throw error
    return data
  },
}
