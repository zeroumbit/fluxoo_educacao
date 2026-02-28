import { supabase } from '@/lib/supabase'

export interface DashboardData {
  totalAlunosAtivos: number
  limiteAlunos: number
  statusAssinatura: string
  metodoPagamento: string
  totalCobrancasAbertas: number
  avisosRecentes: Array<{
    id: string
    titulo: string
    conteudo: string
    turma_id: string | null
    created_at: string
    turmas: { nome: string } | null
  }>
  onboarding: {
    perfilCompleto: boolean
    possuiFilial: boolean
    possuiTurma: boolean
    possuiAluno: boolean
  }
}

export const dashboardService = {
  async buscarDados(tenantId: string): Promise<DashboardData> {
    const [alunosRes, escolaRes, cobrancasRes, avisosRes, escolaInfoRes, filiaisRes, turmasRes] = await Promise.all([
      supabase.from('alunos').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'ativo'),
      supabase.from('escolas').select('limite_alunos_contratado, status_assinatura, metodo_pagamento').eq('id', tenantId).maybeSingle(),
      supabase.from('cobrancas').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).in('status', ['a_vencer', 'atrasado']),
      supabase.from('mural_avisos').select('*, turmas(nome)').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(5),
      supabase.from('escolas').select('logradouro, cnpj').eq('id', tenantId).maybeSingle(),
      supabase.from('filiais').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('turmas').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    ])

    // Se a consulta principal da escola falhar, podemos ter um problema real
    if (escolaRes.error && escolaRes.error.code !== 'PGRST116') {
      console.error('Erro ao buscar dados da escola:', escolaRes.error)
    }

    return {
      totalAlunosAtivos: alunosRes.count || 0,
      limiteAlunos: (escolaRes.data as any)?.limite_alunos_contratado || 0,
      statusAssinatura: (escolaRes.data as any)?.status_assinatura || 'pendente',
      metodoPagamento: (escolaRes.data as any)?.metodo_pagamento || 'pix',
      totalCobrancasAbertas: cobrancasRes.count || 0,
      avisosRecentes: (avisosRes.data || []) as DashboardData['avisosRecentes'],
      onboarding: {
        perfilCompleto: !!(escolaInfoRes.data as any)?.logradouro,
        possuiFilial: (filiaisRes.count || 0) > 0,
        possuiTurma: (turmasRes.count || 0) > 0,
        possuiAluno: (alunosRes.count || 0) > 0,
      }
    }
  },
}
