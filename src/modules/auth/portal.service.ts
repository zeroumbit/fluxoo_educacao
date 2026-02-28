import { supabase } from '@/lib/supabase'

export const portalService = {
  async buscarResponsavelPorCpf(cpf: string) {
    const { data, error } = await supabase
      .from('responsaveis')
      .select('*')
      .eq('cpf', cpf)
      .single()

    if (error) throw error
    return data
  },

  async buscarAlunosPorResponsavel(responsavelId: string) {
    const { data, error } = await supabase
      .from('aluno_responsavel')
      .select('*, alunos(*, filiais(nome_unidade))')
      .eq('responsavel_id', responsavelId)

    if (error) throw error
    return data
  },

  async buscarFrequenciaPorAluno(alunoId: string) {
    const { data, error } = await supabase
      .from('frequencias')
      .select('*, turmas(nome)')
      .eq('aluno_id', alunoId)
      .order('data_aula', { ascending: false })
      .limit(30)

    if (error) throw error
    return data
  },

  async buscarAvisosPorTenantId(tenantId: string, turmaId?: string | null) {
    let query = supabase
      .from('mural_avisos')
      .select('*, turmas(nome)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (turmaId) {
      query = query.or(`turma_id.is.null,turma_id.eq.${turmaId}`)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async buscarCobrancasPorAluno(alunoId: string) {
    const { data, error } = await supabase
      .from('cobrancas')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('data_vencimento', { ascending: false })

    if (error) throw error
    return data
  },
}
