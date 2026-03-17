import { useFechamentoMensal } from '../hooks-avancado'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, TrendingUp, AlertCircle, Wallet, DollarSign, CreditCard, PiggyBank } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn, formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useMemo } from 'react'
import { useRBACInit, useHasPermission } from '@/hooks/usePermissions'

interface FechamentoMensal {
  mes: string
  tenant_id: string
  // Receitas
  total_receitas_previsto: number
  total_receitas_recebido: number
  total_receitas_aberto: number
  // Despesas
  total_despesas_previsto: number
  total_despesas_pago: number
  total_despesas_aberto: number
  // Legacy (retrocompatibilidade)
  total_previsto: number
  total_recebido: number
  total_em_aberto: number
  // Saldos
  saldo: number
  saldo_previsto: number
}

export function FinanceiroRelatoriosPage() {
  const { data: fechamento, isLoading } = useFechamentoMensal()
  const canExport = useHasPermission('financeiro.relatorios.export')

  // Calcular totais consolidados (últimos 12 meses)
  const totaisGerais = useMemo(() => {
    if (!fechamento || fechamento.length === 0) {
      return {
        receitasPrevisto: 0,
        receitasRecebido: 0,
        receitasAberto: 0,
        despesasPrevisto: 0,
        despesasPago: 0,
        despesasAberto: 0,
        saldo: 0,
        saldoPrevisto: 0,
      }
    }

    return fechamento.reduce((acc, item) => ({
      receitasPrevisto: acc.receitasPrevisto + (item.total_receitas_previsto || 0),
      receitasRecebido: acc.receitasRecebido + (item.total_receitas_recebido || 0),
      receitasAberto: acc.receitasAberto + (item.total_receitas_aberto || 0),
      despesasPrevisto: acc.despesasPrevisto + (item.total_despesas_previsto || 0),
      despesasPago: acc.despesasPago + (item.total_despesas_pago || 0),
      despesasAberto: acc.despesasAberto + (item.total_despesas_aberto || 0),
      saldo: acc.saldo + (item.saldo || 0),
      saldoPrevisto: acc.saldoPrevisto + (item.saldo_previsto || 0),
    }), {
      receitasPrevisto: 0,
      receitasRecebido: 0,
      receitasAberto: 0,
      despesasPrevisto: 0,
      despesasPago: 0,
      despesasAberto: 0,
      saldo: 0,
      saldoPrevisto: 0,
    })
  }, [fechamento])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground font-semibold" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Relatórios Financeiros</h1>
          <p className="text-muted-foreground font-medium">Visão consolidada do fluxo de caixa: receitas, despesas e saldo.</p>
        </div>
        {canExport && (
          <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
            <TrendingUp className="mr-2 h-4 w-4" /> Exportar Relatório (CSV)
          </Button>
        )}
      </div>

      {/* Cards de Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Receitas */}
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Receitas (Recebido)</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totaisGerais.receitasRecebido)}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Previsto: {formatCurrency(totaisGerais.receitasPrevisto)}</p>
            </div>
          </div>
        </Card>

        {/* Total Despesas */}
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Despesas (Pago)</p>
              <p className="text-2xl font-bold text-rose-600">{formatCurrency(totaisGerais.despesasPago)}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Previsto: {formatCurrency(totaisGerais.despesasPrevisto)}</p>
            </div>
          </div>
        </Card>

        {/* Saldo Atual */}
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center",
              totaisGerais.saldo >= 0 ? "bg-blue-50" : "bg-orange-50"
            )}>
              <Wallet className={cn(
                "h-6 w-6",
                totaisGerais.saldo >= 0 ? "text-blue-600" : "text-orange-600"
              )} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Saldo Atual</p>
              <p className={cn(
                "text-2xl font-bold",
                totaisGerais.saldo >= 0 ? "text-blue-600" : "text-orange-600"
              )}>
                {formatCurrency(totaisGerais.saldo)}
              </p>
              <p className="text-xs text-slate-400 font-medium mt-1">Recebido - Pago</p>
            </div>
          </div>
        </Card>

        {/* Saldo Previsto */}
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center",
              totaisGerais.saldoPrevisto >= 0 ? "bg-indigo-50" : "bg-amber-50"
            )}>
              <PiggyBank className={cn(
                "h-6 w-6",
                totaisGerais.saldoPrevisto >= 0 ? "text-indigo-600" : "text-amber-600"
              )} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Saldo Previsto</p>
              <p className={cn(
                "text-2xl font-bold",
                totaisGerais.saldoPrevisto >= 0 ? "text-indigo-600" : "text-amber-600"
              )}>
                {formatCurrency(totaisGerais.saldoPrevisto)}
              </p>
              <p className="text-xs text-slate-400 font-medium mt-1">Receitas - Despesas</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabela Detalhada por Mês */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Fechamento Mensal Detalhado
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-500 pl-8 h-12 uppercase text-[10px] tracking-widest" rowSpan={2}>Mês</TableHead>
                <TableHead colSpan={3} className="font-bold text-emerald-600 px-6 h-12 uppercase text-[10px] tracking-widest text-center border-b-2 border-emerald-200">
                  RECEITAS
                </TableHead>
                <TableHead colSpan={3} className="font-bold text-rose-600 px-6 h-12 uppercase text-[10px] tracking-widest text-center border-b-2 border-rose-200">
                  DESPESAS
                </TableHead>
                <TableHead colSpan={2} className="font-bold text-indigo-600 px-6 h-12 uppercase text-[10px] tracking-widest text-center border-b-2 border-indigo-200">
                  SALDO
                </TableHead>
              </TableRow>
              <TableRow>
                {/* Receitas */}
                <TableHead className="font-semibold text-emerald-600/70 px-4 h-10 uppercase text-[9px]">Previsto</TableHead>
                <TableHead className="font-semibold text-emerald-600/70 px-4 h-10 uppercase text-[9px]">Recebido</TableHead>
                <TableHead className="font-semibold text-emerald-600/70 px-4 h-10 uppercase text-[9px]">Em Aberto</TableHead>
                {/* Despesas */}
                <TableHead className="font-semibold text-rose-600/70 px-4 h-10 uppercase text-[9px]">Previsto</TableHead>
                <TableHead className="font-semibold text-rose-600/70 px-4 h-10 uppercase text-[9px]">Pago</TableHead>
                <TableHead className="font-semibold text-rose-600/70 px-4 h-10 uppercase text-[9px]">Em Aberto</TableHead>
                {/* Saldo */}
                <TableHead className="font-semibold text-indigo-600/70 px-4 h-10 uppercase text-[9px]">Atual</TableHead>
                <TableHead className="font-semibold text-indigo-600/70 px-4 h-10 uppercase text-[9px] pr-8 text-right">Previsto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fechamento && fechamento.length > 0 ? (
                fechamento.map((item: FechamentoMensal, idx: number) => {
                  const mesData = new Date(item.mes)
                  const labelMes = mesData.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()
                  
                  const saldoPositivo = item.saldo >= 0
                  const saldoPrevistoPositivo = item.saldo_previsto >= 0

                  return (
                    <TableRow key={idx} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                      <TableCell className="pl-8 py-4 font-bold text-slate-900">{labelMes}</TableCell>
                      
                      {/* Receitas */}
                      <TableCell className="px-4 py-4 text-right font-medium text-emerald-700">
                        {formatCurrency(item.total_receitas_previsto || 0)}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right font-bold text-emerald-600">
                        {formatCurrency(item.total_receitas_recebido || 0)}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right font-medium text-emerald-600/70">
                        {formatCurrency(item.total_receitas_aberto || 0)}
                      </TableCell>
                      
                      {/* Despesas */}
                      <TableCell className="px-4 py-4 text-right font-medium text-rose-700">
                        {formatCurrency(item.total_despesas_previsto || 0)}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right font-bold text-rose-600">
                        {formatCurrency(item.total_despesas_pago || 0)}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right font-medium text-rose-600/70">
                        {formatCurrency(item.total_despesas_aberto || 0)}
                      </TableCell>
                      
                      {/* Saldo */}
                      <TableCell className={cn(
                        "px-4 py-4 text-right font-bold",
                        saldoPositivo ? "text-blue-600" : "text-orange-600"
                      )}>
                        {formatCurrency(item.saldo || 0)}
                      </TableCell>
                      <TableCell className={cn(
                        "pr-8 py-4 text-right font-bold",
                        saldoPrevistoPositivo ? "text-indigo-600" : "text-amber-600"
                      )}>
                        {formatCurrency(item.saldo_previsto || 0)}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <AlertCircle className="h-6 w-6 mb-2 text-zinc-300" />
                      <p>Nenhum dado de fechamento disponível ainda.</p>
                      <p className="text-xs mt-1">(Os dados são atualizados automaticamente)</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Legenda */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Legenda</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 font-semibold">Receitas</Badge>
              <span className="text-slate-600">Valores recebidos dos alunos (mensalidades, taxas, etc.)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-rose-50 text-rose-600 border-rose-200 font-semibold">Despesas</Badge>
              <span className="text-slate-600">Pagamentos da escola (salários, fornecedores, etc.)</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-50 text-blue-600 border-blue-200 font-semibold">Saldo Atual</Badge>
              <span className="text-slate-600">Receitas recebidas - Despesas pagas (realizado)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-50 text-indigo-600 border-indigo-200 font-semibold">Saldo Previsto</Badge>
              <span className="text-slate-600">Receitas previstas - Despesas previstas (projeção)</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
