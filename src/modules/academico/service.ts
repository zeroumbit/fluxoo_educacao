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
      .select('*, turma:turmas(nome)')
      .eq('tenant_id', tenantId).order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },
  async criarAtividade(atividade: any) {
    const { data, error } = await (supabase.from('atividades' as any) as any).insert(atividade).select().single()
    if (error) throw error
    return data
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
