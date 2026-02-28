import { supabase } from '@/lib/supabase'

export const portalService = {
  async buscarResponsavelPorUserId(userId: string) {
    const { data, error } = await supabase
      .from('responsaveis')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  },

  async buscarAlunosPorResponsavel(responsavelId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('alunos')
      .select('*, turmas(nome, turno)')
      .eq('responsavel_id', responsavelId)
      .eq('tenant_id', tenantId)
      .order('nome')

    if (error) throw error
    return data
  },

  async buscarFrequenciaPorAluno(alunoId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('frequencias')
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .order('data', { ascending: false })
      .limit(30)

    if (error) throw error
    return data
  },

  async buscarAvisosPorTurma(turmaId: string | null, tenantId: string) {
    let query = supabase
      .from('mural_avisos')
      .select('*, turmas(nome)')
      .eq('tenant_id', tenantId)
      .order('criado_em', { ascending: false })

    if (turmaId) {
      query = query.or(`turma_id.is.null,turma_id.eq.${turmaId}`)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async buscarCobrancasPorAluno(alunoId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('cobrancas')
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .order('vencimento', { ascending: false })

    if (error) throw error
    return data
  },
}
