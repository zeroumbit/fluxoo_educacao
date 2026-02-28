import { supabase } from '@/lib/supabase'

export const superAdminService = {
  async getDashboardStats() {
    // Busca contagem total de escolas
    const { count: totalEscolas } = await supabase
      .from('escolas')
      .select('*', { count: 'exact', head: true })

    // Busca contagem de assinaturas ativas
    const { count: assinaturasAtivas } = await supabase
      .from('escolas')
      .select('*', { count: 'exact', head: true })
      .eq('status_assinatura', 'ativa')

    // Busca contagem total de alunos na plataforma (em todas as escolas)
    const { count: totalAlunos } = await supabase
      .from('alunos')
      .select('*', { count: 'exact', head: true })

    // Busca as 5 escolas cadastradas mais recentemente
    const { data: escolasRecentes } = await supabase
      .from('escolas')
      .select('id, razao_social, created_at, status_assinatura')
      .order('created_at', { ascending: false })
      .limit(5)

    return {
      totalEscolas: totalEscolas || 0,
      assinaturasAtivas: assinaturasAtivas || 0,
      totalAlunos: totalAlunos || 0,
      escolasRecentes: escolasRecentes || [],
    }
  }
}
