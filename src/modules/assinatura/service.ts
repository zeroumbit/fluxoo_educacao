import { supabase } from '@/lib/supabase'

export const assinaturaService = {
  async buscarEscola(tenantId: string) {
    const { data, error } = await supabase
      .from('escolas')
      .select('*, planos(*)')
      .eq('id', tenantId)
      .single()

    if (error) throw error
    return data
  },

  async buscarLimiteAlunos(tenantId: string) {
    const { data, error } = await supabase
      .from('escolas')
      .select('limite_alunos')
      .eq('id', tenantId)
      .single()

    if (error) throw error
    return data?.limite_alunos || 0
  },
}
