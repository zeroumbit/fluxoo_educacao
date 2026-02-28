import { supabase } from '@/lib/supabase'
import type { AlunoInsert, AlunoUpdate, AlunoResponsavelInsert, ResponsavelInsert } from '@/lib/database.types'

export const alunoService = {
  async listar(tenantId: string) {
    const { data, error } = await supabase
      .from('alunos')
      .select('*, filiais(nome_unidade)')
      .eq('tenant_id', tenantId)
      .order('nome_completo')

    if (error) throw error
    return data
  },

  async buscarPorId(id: string, tenantId: string) {
    const { data, error } = await supabase
      .from('alunos')
      .select('*, filiais(nome_unidade), aluno_responsavel(*, responsaveis(*))')
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

  async criarComResponsavel(
    responsavel: ResponsavelInsert,
    alunoDados: AlunoInsert,
    grauParentesco: string | null
  ) {
    // 1. Criar ou buscar responsável
    const { data: respData, error: respError } = await supabase
      .from('responsaveis')
      .insert(responsavel)
      .select()
      .single()

    if (respError) throw respError

    // 2. Criar aluno
    const { data: alunoData, error: alunoError } = await supabase
      .from('alunos')
      .insert(alunoDados)
      .select()
      .single()

    if (alunoError) throw alunoError

    // 3. Vincular via aluno_responsavel (N:N)
    const vinculo: AlunoResponsavelInsert = {
      aluno_id: alunoData.id,
      responsavel_id: respData.id,
      grau_parentesco: grauParentesco,
    }
    const { error: vincError } = await supabase
      .from('aluno_responsavel')
      .insert(vinculo)

    if (vincError) throw vincError

    return alunoData
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
}
