import { supabase } from '@/lib/supabase'

export const academicoService = {
  // MATRÍCULAS
  async listarMatriculas(tenantId: string) {
    const { data, error } = await (supabase.from('matriculas' as any) as any)
      .select('*, aluno:alunos(nome_completo, cpf)')
      .eq('tenant_id', tenantId).order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },
  async criarMatricula(matricula: any) {
    const { data, error } = await (supabase.from('matriculas' as any) as any).insert(matricula).select().single()
    if (error) throw error
    return data
  },
  async atualizarMatricula(id: string, matricula: any) {
    const { data, error } = await (supabase.from('matriculas' as any) as any)
      .update(matricula)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
  async excluirMatricula(id: string) {
    const { error } = await (supabase.from('matriculas' as any) as any)
      .delete()
      .eq('id', id)
    if (error) throw error
  },
  async verificarMatriculaAtiva(alunoId: string, tenantId: string) {
    const { data } = await (supabase.from('matriculas' as any) as any)
      .select('id')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .eq('status', 'ativa')
      .maybeSingle()
    return data !== null
  },
  async buscarMatriculaAtiva(alunoId: string, tenantId: string) {
    const { data, error } = await (supabase.from('matriculas' as any) as any)
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .eq('status', 'ativa')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data
  },
  async listarMatriculasAtivasPorAluno(tenantId: string) {
    const { data, error } = await (supabase.from('matriculas' as any) as any)
      .select('aluno_id, id, status, ano_letivo, serie_ano, turno')
      .eq('tenant_id', tenantId)
      .eq('status', 'ativa')
    if (error) throw error
    return (data as any[]) || []
  },

  // PLANOS DE AULA
  async listarPlanosAula(tenantId: string) {
    const { data, error } = await (supabase.from('planos_aula' as any) as any)
      .select('*, planos_aula_turmas(*, turma:turmas(nome))')
      .eq('tenant_id', tenantId).order('data_aula', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },
  async criarPlanoAula(planoComTurmas: any) {
    const { turmas: turmasToBatch, ...planoData } = planoComTurmas
    
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
        horario: t.horario || null
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
  async atualizarPlanoAula(id: string, planoComTurmas: any) {
    const { turmas: turmasToBatch, ...planoData } = planoComTurmas

    // 1. Atualizar o plano de aula
    const { data: plano, error: planoError } = await (supabase.from('planos_aula' as any) as any)
      .update(planoData)
      .eq('id', id)
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
        horario: t.horario || null
      }))
      const { error: batchError } = await (supabase.from('planos_aula_turmas' as any) as any)
        .insert(records)
      if (batchError) throw batchError
    }

    return plano
  },
  async excluirPlanoAula(id: string) {
    const { error } = await (supabase.from('planos_aula' as any) as any)
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  // ATIVIDADES
  async listarAtividades(tenantId: string) {
    const { data, error } = await (supabase.from('atividades' as any) as any)
      .select('*, atividades_turmas(*, turma:turmas(nome))')
      .eq('tenant_id', tenantId).order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },
  async criarAtividade(atividadeComTurmas: any) {
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
        horario: t.horario || null
      }))
      const { error: batchError } = await (supabase.from('atividades_turmas' as any) as any)
        .insert(records)
      
      if (batchError) {
        console.error('❌ [academicoService] Erro ao vincular turmas na atividade:', batchError)
      }
    }

    return atividade
  },
  async atualizarAtividade(id: string, atividadeComTurmas: any) {
    const { turmas: turmasToBatch, ...atividadeData } = atividadeComTurmas

    // 1. Atualizar a atividade
    const { data: atividade, error: atividadeError } = await (supabase.from('atividades' as any) as any)
      .update(atividadeData)
      .eq('id', id)
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
        horario: t.horario || null
      }))
      const { error: batchError } = await (supabase.from('atividades_turmas' as any) as any)
        .insert(records)
      if (batchError) throw batchError
    }

    return atividade
  },
  async excluirAtividade(id: string) {
    const { error } = await (supabase.from('atividades' as any) as any)
      .delete()
      .eq('id', id)
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

  async salvarBoletim(boletim: any) {
    const { id, ...data } = boletim
    
    if (id) {
      const { error } = await (supabase.from('boletins' as any) as any)
        .update(data)
        .eq('id', id)
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

  async excluirBoletim(id: string) {
    const { error } = await (supabase.from('boletins' as any) as any)
      .delete()
      .eq('id', id)
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

  // SELOS
  async listarSelos(tenantId: string) {
    const { data, error } = await (supabase.from('selos' as any) as any)
      .select('*, aluno:alunos(nome_completo)')
      .eq('tenant_id', tenantId).order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },
  async atribuirSelo(selo: any) {
    const { data, error } = await (supabase.from('selos' as any) as any).insert(selo).select().single()
    if (error) throw error
    return data
  },
}
