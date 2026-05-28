import { supabase } from '@/lib/supabase'
import { defineReport } from '@/modules/relatorios/export-registry'
import type { ExportFetchParams } from '@/modules/relatorios/export-registry'
import { dashboardAnalyticsService } from './dashboard.analytics.service'
import { registrarExportacoesFinanceiro } from '@/modules/financeiro/financeiro.export'
import { registrarExportacoesFrequencia } from '@/modules/frequencia/frequencia.export'

function formatCurrency(value: unknown): string {
  const num = Number(value) || 0
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatPercent(value: unknown): string {
  const num = Number(value) || 0
  return `${num}%`
}

export function registrarExportacoesDoDashboard() {
  defineReport({
    key: 'dashboard.novas-matriculas',
    name: 'Novos Alunos',
    description: 'Matrículas realizadas por mês nos últimos 12 meses',
    permissionKey: 'relatorios.export',
    filename: `novos-alunos-${new Date().toISOString().split('T')[0]}.csv`,
    columns: [
      { key: 'rotulo', header: 'Mês' },
      { key: 'valor', header: 'Novos Alunos' },
    ],
    async fetchData(params: ExportFetchParams) {
      const analytics = await dashboardAnalyticsService.buscarAnalytics(
        params.tenantId,
        params.userId && params.userId !== params.tenantId
          ? params.userId
          : undefined,
      )
      return analytics.novasMatriculasPorMes as unknown as Record<string, unknown>[]
    },
  })

  defineReport({
    key: 'dashboard.frequencia',
    name: 'Frequência',
    description: 'Presença média mensal nos últimos 12 meses',
    permissionKey: 'relatorios.export',
    filename: `frequencia-mensal-${new Date().toISOString().split('T')[0]}.csv`,
    columns: [
      { key: 'rotulo', header: 'Mês' },
      {
        key: 'valor',
        header: 'Frequência',
        format: formatPercent,
      },
    ],
    async fetchData(params: ExportFetchParams) {
      const analytics = await dashboardAnalyticsService.buscarAnalytics(
        params.tenantId,
        params.userId && params.userId !== params.tenantId
          ? params.userId
          : undefined,
      )
      return analytics.frequenciaPorMes as unknown as Record<string, unknown>[]
    },
  })

  defineReport({
    key: 'dashboard.receita',
    name: 'Receita',
    description: 'Receita prevista vs. recebida por mês nos últimos 12 meses',
    permissionKey: 'relatorios.export',
    filename: `receita-mensal-${new Date().toISOString().split('T')[0]}.csv`,
    columns: [
      { key: 'rotulo', header: 'Mês' },
      {
        key: 'previsto',
        header: 'Previsto',
        format: formatCurrency,
      },
      {
        key: 'recebido',
        header: 'Recebido',
        format: formatCurrency,
      },
    ],
    async fetchData(params: ExportFetchParams) {
      const analytics = await dashboardAnalyticsService.buscarAnalytics(
        params.tenantId,
        params.userId && params.userId !== params.tenantId
          ? params.userId
          : undefined,
      )
      return analytics.receitaComparada as unknown as Record<string, unknown>[]
    },
  })

  defineReport({
    key: 'dashboard.inadimplencia',
    name: 'Inadimplência',
    description: 'Valores em atraso por mês nos últimos 12 meses',
    permissionKey: 'relatorios.export',
    filename: `inadimplencia-mensal-${new Date().toISOString().split('T')[0]}.csv`,
    columns: [
      { key: 'rotulo', header: 'Mês' },
      {
        key: 'valor',
        header: 'Valor em Atraso',
        format: formatCurrency,
      },
    ],
    async fetchData(params: ExportFetchParams) {
      const analytics = await dashboardAnalyticsService.buscarAnalytics(
        params.tenantId,
        params.userId && params.userId !== params.tenantId
          ? params.userId
          : undefined,
      )
      return analytics.inadimplenciaPorMes as unknown as Record<string, unknown>[]
    },
  })

  defineReport({
    key: 'dashboard.radar-evasao',
    name: 'Radar de Evasão',
    description: 'Alunos em risco de evasão',
    permissionKey: 'relatorios.export',
    filename: `radar-evasao-${new Date().toISOString().split('T')[0]}.csv`,
    columns: [
      { key: 'aluno_id', header: 'ID do Aluno' },
      { key: 'nome_completo', header: 'Nome do Aluno' },
      { key: 'faltas_consecutivas', header: 'Faltas Consecutivas' },
      { key: 'cobrancas_atrasadas', header: 'Cobranças Atrasadas' },
      { key: 'motivo_principal', header: 'Motivo Principal' },
    ],
    async fetchData(params: ExportFetchParams) {
      const { data } = await supabase
        .from('vw_radar_evasao')
        .select('*')
        .eq('tenant_id', params.tenantId)
        .returns<Record<string, unknown>[]>()

      return data || []
    },
  })

  defineReport({
    key: 'dashboard.analytics-completo',
    name: 'Análise Completa',
    description: 'Todos os indicadores de tendência do dashboard (matrículas, frequência, receita, inadimplência)',
    permissionKey: 'relatorios.export',
    filename: `analise-completa-${new Date().toISOString().split('T')[0]}.csv`,
    columns: [
      { key: 'indicador', header: 'Indicador' },
      { key: 'mes', header: 'Mês' },
      { key: 'valor', header: 'Valor' },
      { key: 'detalhe', header: 'Detalhe' },
    ],
    async fetchData(params: ExportFetchParams) {
      const analytics = await dashboardAnalyticsService.buscarAnalytics(
        params.tenantId,
        params.userId && params.userId !== params.tenantId
          ? params.userId
          : undefined,
      )
      const rows: Record<string, unknown>[] = []

      for (const m of analytics.novasMatriculasPorMes) {
        rows.push({ indicador: 'Novos Alunos', mes: m.rotulo, valor: m.valor, detalhe: '' })
      }
      rows.push({ indicador: '', mes: '', valor: '', detalhe: '' })

      for (const m of analytics.frequenciaPorMes) {
        rows.push({ indicador: 'Frequência', mes: m.rotulo, valor: `${m.valor}%`, detalhe: '' })
      }
      rows.push({ indicador: '', mes: '', valor: '', detalhe: '' })

      for (const m of analytics.receitaComparada) {
        rows.push({
          indicador: 'Receita',
          mes: m.rotulo,
          valor: `R$ ${Number(m.recebido).toLocaleString('pt-BR')}`,
          detalhe: `Previsto: R$ ${Number(m.previsto).toLocaleString('pt-BR')}`,
        })
      }
      rows.push({ indicador: '', mes: '', valor: '', detalhe: '' })

      for (const m of analytics.inadimplenciaPorMes) {
        rows.push({
          indicador: 'Inadimplência',
          mes: m.rotulo,
          valor: `R$ ${Number(m.valor).toLocaleString('pt-BR')}`,
          detalhe: '',
        })
      }

      return rows
    },
  })

  defineReport({
    key: 'alunos.lista',
    name: 'Lista de Alunos',
    description: 'Relação completa de alunos cadastrados',
    permissionKey: 'academico.alunos.view',
    filename: `alunos-${new Date().toISOString().split('T')[0]}.csv`,
    columns: [
      { key: 'nome_completo', header: 'Nome Completo' },
      { key: 'cpf', header: 'CPF' },
      { key: 'data_nascimento', header: 'Data de Nascimento' },
      { key: 'status', header: 'Status' },
      { key: 'turma_atual', header: 'Turma Atual' },
      { key: 'data_ingresso', header: 'Data de Ingresso' },
    ],
    async fetchData(params: ExportFetchParams) {
      const { data } = await supabase
        .from('alunos')
        .select('id, nome_completo, cpf, data_nascimento, status, data_ingresso')
        .eq('tenant_id', params.tenantId)
        .order('nome_completo', { ascending: true })
        .returns<Record<string, unknown>[]>()

      if (!data) return []

      const alunosComTurma = await Promise.all(
        data.map(async (aluno: Record<string, unknown>) => {
          const { data: mats } = await supabase
            .from('matriculas')
            .select('turmas!inner(nome)')
            .eq('aluno_id', aluno.id)
            .eq('status', 'ativa')
            .maybeSingle()

          return {
            nome_completo: aluno.nome_completo || '',
            cpf: aluno.cpf || '',
            data_nascimento: aluno.data_nascimento
              ? new Date(String(aluno.data_nascimento)).toLocaleDateString('pt-BR')
              : '',
            status: aluno.status || '',
            turma_atual: (mats as Record<string, unknown> | null)?.turmas
              ? ((mats as Record<string, unknown>).turmas as Record<string, unknown>).nome || ''
              : '',
            data_ingresso: aluno.data_ingresso
              ? new Date(String(aluno.data_ingresso)).toLocaleDateString('pt-BR')
              : '',
          }
        }),
      )

      return alunosComTurma
    },
  })

  registrarExportacoesFinanceiro()
  registrarExportacoesFrequencia()
}
