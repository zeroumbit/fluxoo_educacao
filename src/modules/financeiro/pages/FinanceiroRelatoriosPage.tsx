import { useFechamentoMensal } from '../hooks-avancado'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, TrendingUp, AlertCircle } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export function FinanceiroRelatoriosPage() {
  const { data: fechamento, isLoading } = useFechamentoMensal()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground font-semibold" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Relatórios Financeiros</h1>
        <p className="text-muted-foreground font-medium">Visão consolidada do fluxo de caixa previsto vs recebido.</p>
      </div>

      <Card className="border border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Fechamento Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-500 px-6 h-12 uppercase text-[10px] tracking-widest">Mês (Competência)</TableHead>
                <TableHead className="font-bold text-slate-500 px-6 h-12 uppercase text-[10px] tracking-widest">Valor Previsto Total</TableHead>
                <TableHead className="font-bold text-slate-500 px-6 h-12 uppercase text-[10px] tracking-widest">Valor Recebido (Pago)</TableHead>
                <TableHead className="font-bold text-slate-500 px-6 h-12 uppercase text-[10px] tracking-widest">Total em Aberto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fechamento && fechamento.length > 0 ? (
                fechamento.map((item: any, idx: number) => {
                  /* Como o mês pode vir no formato 2026-03-01T00:00:00Z */
                  const mesData = new Date(item.mes)
                  const labelMes = mesData.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()
                  
                  return (
                    <TableRow key={idx} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                      <TableCell className="px-6 py-4 font-bold text-slate-900">{labelMes}</TableCell>
                      <TableCell className="px-6 py-4 font-medium text-slate-600">R$ {Number(item.total_previsto).toFixed(2)}</TableCell>
                      <TableCell className="px-6 py-4 text-emerald-600 font-bold">R$ {Number(item.total_recebido).toFixed(2)}</TableCell>
                      <TableCell className={cn("px-6 py-4 font-bold", Number(item.total_em_aberto) > 0 ? 'text-rose-600' : 'text-slate-600')}>
                        R$ {Number(item.total_em_aberto).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <AlertCircle className="h-6 w-6 mb-2 text-zinc-300" />
                      <p>Nenhum dado de fechamento disponível ainda.</p>
                      <p className="text-xs mt-1">(Os dados podem constar no próximo fechamento da Materialized View)</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
