import { supabase } from '@/lib/supabase'

export interface DashboardData {
  totalAlunosAtivos: number
  limiteAlunos: number
  totalCobrancasAbertas: number
  avisosRecentes: Array<{
    id: string
    titulo: string
    conteudo: string
    turma_id: string | null
    created_at: string
    turmas: { nome: string } | null
  }>
}

export const dashboardService = {
  async buscarDados(tenantId: string): Promise<DashboardData> {
    const [alunosRes, escolaRes, cobrancasRes, avisosRes] = await Promise.all([
      supabase
        .from('alunos')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'ativo'),
      supabase
        .from('escolas')
        .select('limite_alunos_contratado')
        .eq('id', tenantId)
        .single(),
      supabase
        .from('cobrancas')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('status', ['a_vencer', 'atrasado']),
      supabase
        .from('mural_avisos')
        .select('*, turmas(nome)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    return {
      totalAlunosAtivos: alunosRes.count || 0,
      limiteAlunos: escolaRes.data?.limite_alunos_contratado || 0,
      totalCobrancasAbertas: cobrancasRes.count || 0,
      avisosRecentes: (avisosRes.data || []) as DashboardData['avisosRecentes'],
    }
  },
}
