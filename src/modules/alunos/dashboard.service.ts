import { supabase } from '@/lib/supabase'
import { muralService } from '@/modules/comunicacao/service'

export interface RadarAluno {
  aluno_id: string
  nome_completo: string
  faltas_consecutivas: number
  cobrancas_atrasadas: number
}

export interface AvisoRecente {
  id: string
  titulo: string
  conteudo: string
  turma_id: string | null
  created_at: string
  turmas: { nome: string } | null
}

export interface DashboardData {
  totalAlunosAtivos: number
  limiteAlunos: number
  statusAssinatura: string
  metodoPagamento: string
  totalCobrancasAbertas: number
  totalContasPagarAbertas: number
  avisosRecentes: AvisoRecente[]
  onboarding: {
    perfilCompleto: boolean
    possuiFilial: boolean
    possuiTurma: boolean
    possuiAluno: boolean
  }
  radarEvasao: RadarAluno[]
}

export const dashboardService = {
  async buscarDados(tenantId: string): Promise<DashboardData> {
    const [
      alunosRes,
      escolaRes,
      cobrancasRes,
      avisosRes,
      escolaInfoRes,
      filiaisRes,
      turmasRes,
      radarRes,
      contasPagarRes,
    ] = await Promise.all([
      // Alunos ativos
      supabase
        .from('alunos')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'ativo'),

      // Dados do plano/assinatura
      supabase
        .from('escolas')
        .select('limite_alunos_contratado, status_assinatura, metodo_pagamento')
        .eq('id', tenantId)
        .maybeSingle(),

      // Cobranças abertas (a_vencer + atrasado)
      supabase
        .from('cobrancas')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('status', ['a_vencer', 'atrasado']),

      // Somente avisos dentro da vigência (data_fim nula ou >= hoje)
      muralService.listarAtivos(tenantId, 6),

      // Onboarding: perfil e filiais
      supabase
        .from('escolas')
        .select('logradouro, cnpj')
        .eq('id', tenantId)
        .maybeSingle(),

      supabase
        .from('filiais')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),

      supabase
        .from('turmas')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),

      // Radar de evasão (view com security_invoker)
      (supabase.from('vw_radar_evasao' as any) as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .limit(10)
        .order('cobrancas_atrasadas', { ascending: false }),

      // Contas a pagar em aberto
      supabase
        .from('contas_pagar' as any)
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .neq('status', 'pago'),
    ])

    if (!escolaRes.data) {
      if (escolaRes.error) throw escolaRes.error
      throw new Error('Perfil da escola não encontrado. Verifique se o cadastro foi concluído.')
    }

    const escola = escolaRes.data as any

    // Ordena radar: mais críticos primeiro (faltas + cobranças)
    const radarData: RadarAluno[] = ((radarRes as any)?.data || []).sort(
      (a: RadarAluno, b: RadarAluno) =>
        (b.cobrancas_atrasadas + b.faltas_consecutivas) -
        (a.cobrancas_atrasadas + a.faltas_consecutivas)
    )

    return {
      totalAlunosAtivos: alunosRes.count || 0,
      limiteAlunos: escola.limite_alunos_contratado || 0,
      statusAssinatura: escola.status_assinatura || 'pendente',
      metodoPagamento: escola.metodo_pagamento || 'pix',
      totalCobrancasAbertas: cobrancasRes.count || 0,
      totalContasPagarAbertas: contasPagarRes.count || 0,
      avisosRecentes: (avisosRes || []) as unknown as AvisoRecente[],
      onboarding: {
        perfilCompleto: !!(escolaInfoRes.data as any)?.logradouro,
        possuiFilial: (filiaisRes.count || 0) > 0,
        possuiTurma: (turmasRes.count || 0) > 0,
        possuiAluno: (alunosRes.count || 0) > 0,
      },
      radarEvasao: radarData,
    }
  },
}
