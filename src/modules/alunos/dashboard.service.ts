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
  totalReceber: number
  totalPagar: number
  avisosRecentes: AvisoRecente[]
  onboarding: {
    perfilCompleto: boolean
    possuiFilial: boolean
    possuiTurma: boolean
    possuiAluno: boolean
  }
  radarEvasao: RadarAluno[]
  alunosSemMatricula: number
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
      salariosRes,
      matriculasRes,
    ] = await Promise.all([
      supabase.from('alunos').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'ativo'),
      supabase.from('escolas').select('limite_alunos_contratado, status_assinatura, metodo_pagamento').eq('id', tenantId).maybeSingle(),
      supabase.from('cobrancas').select('valor').eq('tenant_id', tenantId).in('status', ['a_vencer', 'atrasado']),
      muralService.listarAtivos(tenantId, 6),
      supabase.from('escolas').select('logradouro, cnpj').eq('id', tenantId).maybeSingle(),
      supabase.from('filiais').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('turmas').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      (supabase.from('vw_radar_evasao' as any) as any).select('*').eq('tenant_id', tenantId).limit(10).order('cobrancas_atrasadas', { ascending: false }),
      (supabase.from('contas_pagar' as any) as any).select('valor, categoria, data_vencimento').eq('tenant_id', tenantId).neq('status', 'pago'),
      supabase.from('funcionarios').select('salario_bruto').eq('tenant_id', tenantId).eq('status', 'ativo').gt('salario_bruto', 0),
      supabase.from('matriculas').select('aluno_id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'ativa'),
    ])

    if (!escolaRes.data) {
      if (escolaRes.error) throw escolaRes.error
      throw new Error('Perfil da escola não encontrado.')
    }

    const escola = (escolaRes as any).data
    const totalReceber = (cobrancasRes.data as any[])?.reduce((acc, c) => acc + (Number(c.valor) || 0), 0) || 0
    
    // Lógica Financeira: Contas a Pagar + Folha Projetada
    const contasPagarList = (contasPagarRes.data as any[]) || []
    const totalContasPagar = contasPagarList.reduce((acc, c) => acc + (Number(c.valor) || 0), 0) || 0
    
    // Verifica se já existe folha para o mês atual nos registros de Contas a Pagar
    const hoje = new Date()
    const prefixoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
    const temFolhaGerada = contasPagarList.some(c => 
      c.categoria === 'Folha de Pagamento' && 
      (c.data_vencimento as string)?.startsWith(prefixoMes)
    )

    let totalPagar = totalContasPagar
    if (!temFolhaGerada) {
      // Se não há folha física, somamos o custo dos salários ativos para a dashboard refletir a realidade
      const somaSalarios = (salariosRes.data as any[])?.reduce((acc, f) => acc + (Number(f.salario_bruto) || 0), 0) || 0
      totalPagar += somaSalarios
    }

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
      totalReceber,
      totalPagar,
      avisosRecentes: (avisosRes || []) as unknown as AvisoRecente[],
      onboarding: {
        perfilCompleto: !!(escolaInfoRes.data as any)?.logradouro,
        possuiFilial: (filiaisRes.count || 0) > 0,
        possuiTurma: (turmasRes.count || 0) > 0,
        possuiAluno: (alunosRes.count || 0) > 0,
      },
      radarEvasao: radarData,
      alunosSemMatricula: (alunosRes.count || 0) - (matriculasRes.count || 0),
    }
  },
}
