import { supabase } from '@/lib/supabase'
import { muralService } from '@/modules/comunicacao/service'

export interface RadarAluno {
  aluno_id: string
  nome_completo: string
  faltas_consecutivas: number
  cobrancas_atrasadas: number
  motivo_principal?: string
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
  /** Mensalidades com vencimento no mês corrente (exclui taxas/materiais) */
  totalMensalidadesMes: number
  /** Total de todas as cobranças pendentes/atrasadas (qualquer tipo) */
  totalReceber: number
  /** Projeção de recebimento para os próximos 12 meses (mensalidades) */
  totalReceber12Meses: number
  totalPagar: number
  /** Total de salários da folha (ativos) */
  totalSalarios: number
  /** Quantidade total de itens em estoque no almoxarifado */
  totalEstoque: number
  avisosRecentes: AvisoRecente[]
  onboarding: {
    perfilCompleto: boolean
    possuiFilial: boolean
    possuiTurma: boolean
    possuiAluno: boolean
    possuiFuncionario: boolean
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
      almoxarifadoRes,
    ] = await Promise.all([
      (() => {
        // Se professor não tem alunos vinculados, retorna count 0 sem fazer query (evita erro 400)
        if (professorId && idsAlunosProfessor.length === 0) {
          return { count: 0, data: null, error: null }
        }
        return supabase.from('alunos').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'ativo')
      })(),
      supabase.from('escolas').select('limite_alunos_contratado, status_assinatura, metodo_pagamento').eq('id', tenantId).maybeSingle(),
      // Busca TODAS as cobranças pendentes/atrasadas com descrição e data de vencimento
      (professorId ? Promise.resolve({ data: [] }) : supabase.from('cobrancas').select('valor, descricao, data_vencimento, status').eq('tenant_id', tenantId).in('status', ['a_vencer', 'atrasado'])) as any,
      (async () => {
         // Data atual para filtro de vigência (YYYY-MM-DD)
         const hoje = new Date()
         hoje.setHours(0, 0, 0, 0)
         const hojeStr = hoje.toISOString().split('T')[0]

         // Filtra mural: Global OU das turmas do professor
         // Apenas avisos ATIVOS: dentro do período de vigência (data_inicio <= hoje <= data_fim)
         // Se professor não tem turmas, retorna apenas avisos globais
         if (professorId && idsTurmasProfessor.length === 0) {
            const { data, error } = await supabase.from('mural_avisos' as any)
              .select('*, turmas(nome)')
              .eq('tenant_id', tenantId)
              .is('turma_id', null)
              // Vigência: data_inicio <= hoje (ou null) E (data_fim >= hoje OU data_fim é null)
              .or(`data_inicio.is.null,data_inicio.lte.${hojeStr}`)
              .or(`data_fim.is.null,data_fim.gte.${hojeStr}`)
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
             // Vigência: data_inicio <= hoje (ou null) E (data_fim >= hoje OU data_fim é null)
             .or(`data_inicio.is.null,data_inicio.lte.${hojeStr}`)
             .or(`data_fim.is.null,data_fim.gte.${hojeStr}`)
             .limit(6),
           idsTurmasProfessor.length > 0
             ? supabase.from('mural_avisos' as any)
                 .select('*, turmas(nome)')
                 .eq('tenant_id', tenantId)
                 .in('turma_id', idsTurmasProfessor)
                 // Vigência: data_inicio <= hoje (ou null) E (data_fim >= hoje OU data_fim é null)
                 .or(`data_inicio.is.null,data_inicio.lte.${hojeStr}`)
                 .or(`data_fim.is.null,data_fim.gte.${hojeStr}`)
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
      // Total de valor em estoque no almoxarifado (quantidade × custo_unitario)
      (professorId ? Promise.resolve({ data: [] }) : supabase.from('almoxarifado_itens').select('quantidade, custo_unitario').eq('tenant_id', tenantId)) as any,
    ])

    if (!escolaRes.data) {
      if (escolaRes.error) throw escolaRes.error
      throw new Error('Perfil da escola não encontrado.')
    }

    const escola = (escolaRes as any).data

    // ---- FINANCEIRO ----
    const cobrancasList = (cobrancasRes.data as any[]) || []
    const hoje = new Date()
    const mesAtual = hoje.getMonth()
    const anoAtual = hoje.getFullYear()

    // Mensalidades do mês corrente: filtra por data_vencimento no mês atual,
    // exclui taxas de matrícula e materiais
    const isMensalidade = (c: any) => {
      const desc = (c.descricao || '').toLowerCase()
      const isTaxa = desc.includes('matrícula') || desc.includes('matricula') || desc.includes('taxa') || desc.includes('material') || desc.includes('item')
      return !isTaxa
    }

    const cobrancasMesAtual = cobrancasList.filter(c => {
      if (!c.data_vencimento) return false
      const dataVenc = new Date(c.data_vencimento + 'T12:00:00')
      return dataVenc.getMonth() === mesAtual && dataVenc.getFullYear() === anoAtual
    })

    const totalMensalidadesMes = cobrancasMesAtual
      .filter(isMensalidade)
      .reduce((acc, c) => acc + (Number(c.valor) || 0), 0) || 0

    // Projeção 12 meses: média mensal das mensalidades pendentes × 12
    // Se não há dados suficientes, usa as mensalidades do mês × 12
    const mensalidadesPendentes = cobrancasList.filter(isMensalidade)
    const mediaMensal = mensalidadesPendentes.length > 0
      ? mensalidadesPendentes.reduce((acc, c) => acc + (Number(c.valor) || 0), 0)
      : totalMensalidadesMes

    const totalReceber12Meses = totalMensalidadesMes > 0
      ? totalMensalidadesMes * 12
      : (mediaMensal > 0 ? mediaMensal * 12 : 0)

    // Total geral de cobranças pendentes (todas, qualquer tipo)
    const totalReceber = cobrancasList?.reduce((acc, c) => acc + (Number(c.valor) || 0), 0) || 0

    // Contas a pagar + folha
    const contasPagarList = (contasPagarRes.data as any[]) || []
    const totalContasPagar = contasPagarList.reduce((acc, c) => acc + (Number(c.valor) || 0), 0) || 0

    const prefixoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
    const temFolhaGerada = contasPagarList.some(c =>
      c.categoria === 'Folha de Pagamento' &&
      (c.data_vencimento as string)?.startsWith(prefixoMes)
    )

    const somaSalarios = (salariosRes.data as any[])?.reduce((acc, f) => acc + (Number(f.salario_bruto) || 0), 0) || 0
    const totalSalarios = professorId ? 0 : somaSalarios

    let totalPagar = professorId ? 0 : totalContasPagar
    if (!temFolhaGerada && !professorId) {
      totalPagar += somaSalarios
    }

    // Almoxarifado: soma de (quantidade × custo_unitario) de todos os itens
    const almoxarifadoList = (almoxarifadoRes.data as any[]) || []
    const totalEstoque = almoxarifadoList.reduce((acc, item) => {
      const qtd = Number(item.quantidade) || 0
      const custo = Number(item.custo_unitario) || 0
      return acc + (qtd * custo)
    }, 0)

    const radarData: RadarAluno[] = ((radarRes as any)?.data || []).sort(
      (a: RadarAluno, b: RadarAluno) =>
        (b.cobrancas_atrasadas + b.faltas_consecutivas) -
        (a.cobrancas_atrasadas + a.faltas_consecutivas)
    )

    // Buscar configurações financeiras e de autorizações (usando count para evitar erro de multiple rows no maybeSingle)
    const [configFinanceiraRes, funcionariosRes, autorizacoesRes] = await Promise.all([
      supabase.from('config_financeira').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('funcionarios').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('autorizacoes_modelos').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    ])

    return {
      totalAlunosAtivos: alunosRes.count || 0,
      limiteAlunos: professorId ? (alunosRes.count || 0) : escola.limite_alunos_contratado || 0,
      statusAssinatura: escola.status_assinatura || 'pendente',
      metodoPagamento: escola.metodo_pagamento || 'pix',
      totalMensalidadesMes: professorId ? 0 : totalMensalidadesMes,
      totalReceber: professorId ? 0 : totalReceber,
      totalReceber12Meses: professorId ? 0 : totalReceber12Meses,
      totalPagar,
      totalSalarios,
      totalEstoque,
      avisosRecentes: (avisosRes.data || []) as unknown as AvisoRecente[],
      onboarding: {
        perfilCompleto: professorId ? true : !!(escolaInfoRes.data as any)?.logradouro,
        possuiFilial: professorId ? true : (filiaisRes.count || 0) > 0,
        possuiTurma: professorId ? true : (turmasRes.count || 0) > 0,
        possuiAluno: professorId ? true : (alunosRes.count || 0) > 0,
        possuiFuncionario: professorId ? true : (funcionariosRes.count || 0) > 0,
        configFinanceira: professorId ? true : (configFinanceiraRes.count || 0) > 0,
        autorizacoes: professorId ? true : (autorizacoesRes.count || 0) > 0,
      },
      radarEvasao: radarData,
      alunosSemMatricula: (alunosRes.count || 0) - (matriculasRes.count || 0),
    }
  },

  async buscarRadarCompleto(tenantId: string, professorId?: string): Promise<RadarAluno[]> {
    if (!tenantId) throw new Error('Tenant ID não fornecido.')

    // IDs autorizados para o professor
    let idsAlunosProfessor: string[] = []

    if (professorId) {
      const { data: vincProp } = await (supabase.from('turma_professores' as any) as any)
        .select('turma_id')
        .eq('professor_id', professorId)
      const idsTurmasProfessor = vincProp?.map((t: any) => t.turma_id) || []

      if (idsTurmasProfessor.length > 0) {
        const { data: mats } = await (supabase.from('matriculas' as any) as any)
          .select('aluno_id')
          .in('turma_id', idsTurmasProfessor)
          .eq('status', 'ativa')
        idsAlunosProfessor = Array.from(new Set(mats?.map((m: any) => m.aluno_id) || []))
      }

      // Se professor não tem alunos vinculados, retorna array vazio
      if (idsAlunosProfessor.length === 0) return []
    }

    let q = (supabase.from('vw_radar_evasao' as any) as any)
      .select('*')
      .eq('tenant_id', tenantId)

    // Filtra por alunos do professor se for o caso
    if (professorId) {
      q = q.in('aluno_id', idsAlunosProfessor)
    }

    const { data } = await q.order('cobrancas_atrasadas', { ascending: false })
    return data || []
  },

  /**
   * Busca alertas do dia-a-dia para professores
   * Retorna apenas alunos com faltas consecutivas (sem dados financeiros)
   */
  async buscarAlertasProfessor(tenantId: string, professorId: string): Promise<RadarAluno[]> {
    if (!tenantId || !professorId) return []

    // Busca turmas do professor
    const { data: vincProp } = await (supabase.from('turma_professores' as any) as any)
      .select('turma_id')
      .eq('professor_id', professorId)
    const idsTurmasProfessor = vincProp?.map((t: any) => t.turma_id) || []

    if (idsTurmasProfessor.length === 0) return []

    // Busca alunos dessas turmas
    const { data: mats } = await (supabase.from('matriculas' as any) as any)
      .select('aluno_id')
      .in('turma_id', idsTurmasProfessor)
      .eq('status', 'ativa')
    const idsAlunosProfessor = Array.from(new Set(mats?.map((m: any) => m.aluno_id) || []))

    if (idsAlunosProfessor.length === 0) return []

    // Busca apenas alunos com faltas (ignora cobranças para professores)
    const { data } = await (supabase.from('vw_radar_evasao' as any) as any)
      .select('aluno_id, nome_completo, faltas_consecutivas, motivo_principal')
      .eq('tenant_id', tenantId)
      .in('aluno_id', idsAlunosProfessor)
      .gt('faltas_consecutivas', 0)
      .order('faltas_consecutivas', { ascending: false })

    // Retorna com cobrancas_atrasadas = 0 (não expor dados financeiros)
    return (data || []).map((aluno: any) => ({
      ...aluno,
      cobrancas_atrasadas: 0,
    }))
  },
}
