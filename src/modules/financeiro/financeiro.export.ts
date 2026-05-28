import { supabase } from '@/lib/supabase'
import { defineReport } from '@/modules/relatorios/export-registry'
import type { ExportFetchParams } from '@/modules/relatorios/export-registry'

function formatCurrency(value: unknown): string {
  const num = Number(value) || 0
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(value: unknown): string {
  if (!value) return ''
  const d = new Date(String(value))
  return d.toLocaleDateString('pt-BR')
}

const statusLabels: Record<string, string> = {
  a_vencer: 'A vencer',
  pago: 'Pago',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
  pendente: 'Pendente',
}

export function registrarExportacoesFinanceiro() {
  defineReport({
    key: 'financeiro.cobrancas',
    name: 'Cobranças',
    description: 'Lista de cobranças com encargos',
    permissionKey: 'financeiro.relatorios.export',
    filename: `cobrancas-${new Date().toISOString().split('T')[0]}.csv`,
    columns: [
      { key: 'aluno', header: 'Aluno' },
      { key: 'descricao', header: 'Descrição' },
      { key: 'valor_original', header: 'Valor Original', format: formatCurrency },
      { key: 'valor_total', header: 'Valor Total', format: formatCurrency },
      { key: 'data_vencimento', header: 'Vencimento', format: formatDate },
      { key: 'status', header: 'Status' },
      { key: 'tipo_cobranca', header: 'Tipo' },
      { key: 'turma', header: 'Turma' },
    ],
    async fetchData(params: ExportFetchParams) {
      const { data } = await supabase
        .from('vw_cobrancas_com_encargos')
        .select('*, alunos!inner(nome_completo), turmas!left(nome)')
        .eq('tenant_id', params.tenantId)
        .order('data_vencimento', { ascending: false })
        .returns<Record<string, unknown>[]>()

      if (!data) return []

      return data.map((row: Record<string, unknown>) => ({
        aluno: (row.alunos as Record<string, unknown> | null)?.nome_completo || '',
        descricao: row.descricao || '',
        valor_original: row.valor_original || 0,
        valor_total: row.valor_total_projetado || row.valor || 0,
        data_vencimento: row.data_vencimento || '',
        status: statusLabels[String(row.status || '')] || row.status || '',
        tipo_cobranca: row.tipo_cobranca || '',
        turma: (row.turmas as Record<string, unknown> | null)?.nome || '',
      }))
    },
  })

  defineReport({
    key: 'financeiro.contas-pagar',
    name: 'Contas a Pagar',
    description: 'Lista de contas a pagar',
    permissionKey: 'financeiro.relatorios.export',
    filename: `contas-pagar-${new Date().toISOString().split('T')[0]}.csv`,
    columns: [
      { key: 'descricao', header: 'Descrição' },
      { key: 'valor', header: 'Valor', format: formatCurrency },
      { key: 'data_vencimento', header: 'Vencimento', format: formatDate },
      { key: 'categoria', header: 'Categoria' },
      { key: 'status', header: 'Status' },
      { key: 'fornecedor', header: 'Fornecedor' },
    ],
    async fetchData(params: ExportFetchParams) {
      const { data } = await supabase
        .from('contas_pagar')
        .select('descricao, valor, data_vencimento, categoria, status, fornecedor')
        .eq('tenant_id', params.tenantId)
        .order('data_vencimento', { ascending: false })
        .returns<Record<string, unknown>[]>()

      if (!data) return []

      return data.map((row: Record<string, unknown>) => ({
        ...row,
        status: statusLabels[String(row.status || '')] || row.status || '',
      }))
    },
  })

  defineReport({
    key: 'financeiro.fechamento-mensal',
    name: 'Fechamento Mensal',
    description: 'Relatório consolidado de receitas e despesas por mês',
    permissionKey: 'financeiro.relatorios.export',
    filename: `fechamento-mensal-${new Date().toISOString().split('T')[0]}.csv`,
    columns: [
      { key: 'mes', header: 'Mês' },
      { key: 'receitas_previsto', header: 'Receitas (Previsto)', format: formatCurrency },
      { key: 'receitas_recebido', header: 'Receitas (Recebido)', format: formatCurrency },
      { key: 'receitas_aberto', header: 'Receitas (Em Aberto)', format: formatCurrency },
      { key: 'despesas_previsto', header: 'Despesas (Previsto)', format: formatCurrency },
      { key: 'despesas_pago', header: 'Despesas (Pago)', format: formatCurrency },
      { key: 'despesas_aberto', header: 'Despesas (Em Aberto)', format: formatCurrency },
      { key: 'saldo', header: 'Saldo Real', format: formatCurrency },
      { key: 'saldo_previsto', header: 'Saldo Previsto', format: formatCurrency },
    ],
    async fetchData(params: ExportFetchParams) {
      const { data } = await supabase
        .from('mv_fechamento_mensal')
        .select('*')
        .eq('tenant_id', params.tenantId)
        .order('mes', { ascending: false })
        .returns<Record<string, unknown>[]>()

      if (!data) return []

      return data.map((row: Record<string, unknown>) => ({
        mes: row.mes || '',
        receitas_previsto: row.total_receitas_previsto || row.total_receitas || 0,
        receitas_recebido: row.total_receitas_recebido || 0,
        receitas_aberto: row.total_receitas_aberto || 0,
        despesas_previsto: row.total_despesas_previsto || row.total_despesas || 0,
        despesas_pago: row.total_despesas_pago || 0,
        despesas_aberto: row.total_despesas_aberto || 0,
        saldo: row.saldo || 0,
        saldo_previsto: row.saldo_previsto || 0,
      }))
    },
  })
}
