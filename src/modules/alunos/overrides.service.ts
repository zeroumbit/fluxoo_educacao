import { supabase } from '@/lib/supabase'
import type { OverrideFinanceiroInsert, OverrideFinanceiroUpdate } from '@/lib/database.types'

export const overrideService = {
  async listarAtivosPorAluno(alunoId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('overrides_financeiros')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('aluno_id', alunoId)
      .eq('status', 'ativo')
      .order('created_at', { ascending: false })
      .maybeSingle()

    if (error) throw error
    return data
  },

  async criar(override: OverrideFinanceiroInsert) {
    // 1. Revoga os overrides ativos existentes para não haver conflito (se houver)
    const { error: revogaError } = await supabase
      .from('overrides_financeiros')
      .update({ status: 'revogado' })
      .eq('aluno_id', override.aluno_id)
      .eq('status', 'ativo')
    if (revogaError) throw revogaError

    // 2. Insere o novo
    const { data, error } = await supabase
      .from('overrides_financeiros')
      .insert(override)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async revogarTodosPorAluno(alunoId: string) {
    const { error } = await supabase
      .from('overrides_financeiros')
      .update({ status: 'revogado' })
      .eq('aluno_id', alunoId)
      .eq('status', 'ativo')

    if (error) throw error
  }
}
