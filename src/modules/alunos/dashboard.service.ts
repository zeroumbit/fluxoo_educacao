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
    configFinanceira: boolean
    autorizacoes: boolean
  }
  radarEvasao: RadarAluno[]
  alunosSemMatricula: number
}

export const dashboardService = {
  async buscarDados(tenantId: string, professorId?: string): Promise<DashboardData> {
    if (!tenantId) throw new Error('Tenant ID não fornecido.')

    // IDs autorizados para o professor
    let idsTurmasProfessor: string[] = []
    let idsAlunosProfessor: string[] = []

    if (professorId) {
      const { data: vincProp } = await (supabase.from('turma_professores' as any) as any)
        .select('turma_id')
        .eq('professor_id', professorId)
      idsTurmasProfessor = vincProp?.map((t: any) => t.turma_id) || []

      if (idsTurmasProfessor.length > 0) {
        const { data: mats } = await (supabase.from('matriculas' as any) as any)
          .select('aluno_id')
          .in('turma_id', idsTurmasProfessor)
          .eq('status', 'ativa')
        idsAlunosProfessor = Array.from(new Set(mats?.map((m: any) => m.aluno_id) || []))
      }
    }

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
      (() => {
        // Se professor não tem alunos vinculados, retorna count 0 sem fazer query (evita erro 400)
        if (professorId && idsAlunosProfessor.length === 0) {
          return { count: 0, data: null, error: null }
        }
        return supabase.from('alunos').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'ativo')
      })(),
      supabase.from('escolas').select('limite_alunos_contratado, status_assinatura, metodo_pagamento').eq('id', tenantId).maybeSingle(),
      (professorId ? Promise.resolve({ data: [] }) : supabase.from('cobrancas').select('valor').eq('tenant_id', tenantId).in('status', ['a_vencer', 'atrasado'])) as any,
      (async () => {
         // Filtra mural: Global OU das turmas do professor
         // Se professor não tem turmas, retorna apenas avisos globais
         if (professorId && idsTurmasProfessor.length === 0) {
            const { data, error } = await supabase.from('mural_avisos' as any)
              .select('*, turmas(nome)')
              .eq('tenant_id', tenantId)
              .is('turma_id', null)
              .order('created_at' as any, { ascending: false } as any)
              .limit(6)
            return { data: data as any[], error }
         }

         // Faz duas queries separadas e combina os resultados (global + turmas do professor)
         const [globais, dasTurmas] = await Promise.all([
           supabase.from('mural_avisos' as any)
             .select('*, turmas(nome)')
             .eq('tenant_id', tenantId)
             .is('turma_id', null)
             .limit(6),
           idsTurmasProfessor.length > 0
             ? supabase.from('mural_avisos' as any)
                 .select('*, turmas(nome)')
                 .eq('tenant_id', tenantId)
                 .in('turma_id', idsTurmasProfessor)
                 .limit(6)
             : Promise.resolve({ data: [] })
         ])

         // Combina e ordena os resultados
         const combined = [...(globais.data as any[] || []), ...(dasTurmas.data as any[] || [])]
         combined.sort((a, b) => new Date((b as any).created_at).getTime() - new Date((a as any).created_at).getTime())

         return { data: combined.slice(0, 6) as any[], error: (globais as any).error || (dasTurmas as any).error }
      })(),
      supabase.from('escolas').select('logradouro, cnpj').eq('id', tenantId).maybeSingle(),
      supabase.from('filiais').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      (() => {
        // Se professor não tem turmas vinculadas, retorna count 0 sem fazer query (evita erro 400)
        if (professorId && idsTurmasProfessor.length === 0) {
          return { count: 0, data: null, error: null }
        }
        return supabase.from('turmas').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)
      })(),
      (async () => {
        try {
          // Se professor não tem alunos vinculados, retorna array vazio sem fazer query (evita erro 400)
          if (professorId && idsAlunosProfessor.length === 0) return { data: [] }
          let q = (supabase.from('vw_radar_evasao' as any) as any).select('*').eq('tenant_id', tenantId).limit(10).order('cobrancas_atrasadas', { ascending: false })
          if (professorId) q = q.in('aluno_id', idsAlunosProfessor)
          return await q
        } catch { return { data: [] } }
      })(),
      (professorId ? Promise.resolve({ data: [] }) : (supabase.from('contas_pagar' as any) as any).select('valor, categoria, data_vencimento').eq('tenant_id', tenantId).neq('status', 'pago')) as any,
      (professorId ? Promise.resolve({ data: [] }) : supabase.from('funcionarios').select('salario_bruto').eq('tenant_id', tenantId).eq('status', 'ativo').gt('salario_bruto', 0)),
      (() => {
        // Se professor não tem alunos vinculados, retorna count 0 sem fazer query (evita erro 400)
        if (professorId && idsAlunosProfessor.length === 0) {
          return { count: 0, data: null, error: null }
        }
        return supabase.from('matriculas').select('aluno_id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'ativa')
      })(),
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
    
    const hoje = new Date()
    const prefixoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
    const temFolhaGerada = contasPagarList.some(c => 
      c.categoria === 'Folha de Pagamento' && 
      (c.data_vencimento as string)?.startsWith(prefixoMes)
    )

    let totalPagar = totalContasPagar
    if (!temFolhaGerada) {
      const somaSalarios = (salariosRes.data as any[])?.reduce((acc, f) => acc + (Number(f.salario_bruto) || 0), 0) || 0
      totalPagar += somaSalarios
    }

    // Se for professor, zeramos os campos financeiros para garantir que nada apareça na UI
    const financeiroRestrito = professorId ? 0 : 0

    const radarData: RadarAluno[] = ((radarRes as any)?.data || []).sort(
      (a: RadarAluno, b: RadarAluno) =>
        (b.cobrancas_atrasadas + b.faltas_consecutivas) -
        (a.cobrancas_atrasadas + a.faltas_consecutivas)
    )

    // Buscar configurações financeiras e de autorizações
    const configFinanceiraRes = await supabase
      .from('config_financeira')
      .select('id')
      .eq('tenant_id', tenantId)
      .maybeSingle()

    const autorizacoesRes = await supabase
      .from('autorizacoes_modelos')
      .select('id')
      .eq('tenant_id', tenantId)
      .maybeSingle()

    return {
      totalAlunosAtivos: alunosRes.count || 0,
      limiteAlunos: professorId ? (alunosRes.count || 0) : escola.limite_alunos_contratado || 0,
      statusAssinatura: escola.status_assinatura || 'pendente',
      metodoPagamento: escola.metodo_pagamento || 'pix',
      totalReceber: professorId ? 0 : totalReceber,
      totalPagar: professorId ? 0 : totalPagar,
      avisosRecentes: (avisosRes.data || []) as unknown as AvisoRecente[],
      onboarding: {
        perfilCompleto: professorId ? true : !!(escolaInfoRes.data as any)?.logradouro,
        possuiFilial: professorId ? true : (filiaisRes.count || 0) > 0,
        possuiTurma: professorId ? true : (turmasRes.count || 0) > 0,
        possuiAluno: professorId ? true : (alunosRes.count || 0) > 0,
        configFinanceira: professorId ? true : !!(configFinanceiraRes.data),
        autorizacoes: professorId ? true : !!(autorizacoesRes.data),
      },
      radarEvasao: radarData,
      alunosSemMatricula: (alunosRes.count || 0) - (matriculasRes.count || 0),
    }
  },
}
