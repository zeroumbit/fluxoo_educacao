import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type AlunoInsert = Database['public']['Tables']['alunos']['Insert']
type AlunoUpdate = Database['public']['Tables']['alunos']['Update']
type ResponsavelInsert = Database['public']['Tables']['responsaveis']['Insert']
type AlunoResponsavelInsert = Database['public']['Tables']['aluno_responsavel']['Insert']

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
    // 1. Verificar se responsável já existe pelo CPF
    const { data: respExistente, error: respCheckError } = await supabase
      .from('responsaveis')
      .select('id, cpf')
      .eq('cpf', responsavel.cpf)
      .maybeSingle()

    let respData: { id: string; cpf: string } | null = null

    if (respCheckError) throw respCheckError

    if (respExistente) {
      // Responsável já existe, usa o ID existente
      respData = { id: respExistente.id, cpf: respExistente.cpf }
    } else {
      // 2. Criar novo responsável
      const { data: novaResp, error: respError } = await supabase
        .from('responsaveis')
        .insert(responsavel)
        .select('id, cpf')
        .single()

      if (respError) throw respError
      respData = novaResp
    }

    // 3. Criar aluno
    const { data: alunoData, error: alunoError } = await supabase
      .from('alunos')
      .insert(alunoDados)
      .select()
      .single()

    if (alunoError) throw alunoError

    // 4. Vincular via aluno_responsavel (N:N)
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
