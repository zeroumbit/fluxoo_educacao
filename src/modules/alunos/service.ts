import { supabase } from '@/lib/supabase'
import type { AlunoInsert, AlunoUpdate } from '@/lib/database.types'

export const alunoService = {
  async listar(tenantId: string) {
    const { data, error } = await supabase
      .from('alunos')
      .select('*, turmas(nome, turno), responsaveis(nome, telefone, email)')
      .eq('tenant_id', tenantId)
      .order('nome')

    if (error) throw error
    return data
  },

  async buscarPorId(id: string, tenantId: string) {
    const { data, error } = await supabase
      .from('alunos')
      .select('*, turmas(nome, turno), responsaveis(nome, telefone, email, cpf, parentesco)')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) throw error
    return data
  },

  async contarAtivos(tenantId: string) {
    const { count, error } = await supabase
      .from('alunos')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'ativo')

    if (error) throw error
    return count || 0
  },

  async criar(aluno: AlunoInsert) {
    const { data, error } = await supabase
      .from('alunos')
      .insert(aluno)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async atualizar(id: string, aluno: AlunoUpdate) {
    const { data, error } = await supabase
      .from('alunos')
      .update(aluno)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async listarPorTurma(turmaId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('turma_id', turmaId)
      .eq('tenant_id', tenantId)
      .eq('status', 'ativo')
      .order('nome')

    if (error) throw error
    return data
  },

  async listarPorResponsavel(responsavelId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('alunos')
      .select('*, turmas(nome, turno)')
      .eq('responsavel_id', responsavelId)
      .eq('tenant_id', tenantId)
      .order('nome')

    if (error) throw error
    return data
  },
}
