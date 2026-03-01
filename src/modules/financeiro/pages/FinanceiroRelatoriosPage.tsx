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
        <h1 className="text-2xl font-bold tracking-tight">Relatórios Financeiros</h1>
        <p className="text-muted-foreground">Visão consolidada do fluxo de caixa previsto vs recebido.</p>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Fechamento Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês (Competência)</TableHead>
                <TableHead>Valor Previsto Total</TableHead>
                <TableHead>Valor Recebido (Pago)</TableHead>
                <TableHead>Total em Aberto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fechamento && fechamento.length > 0 ? (
                fechamento.map((item: any, idx: number) => {
                  /* Como o mês pode vir no formato 2026-03-01T00:00:00Z */
                  const mesData = new Date(item.mes)
                  const labelMes = mesData.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()
                  
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold text-zinc-900">{labelMes}</TableCell>
                      <TableCell>R$ {Number(item.total_previsto).toFixed(2)}</TableCell>
                      <TableCell className="text-emerald-600 font-medium">R$ {Number(item.total_recebido).toFixed(2)}</TableCell>
                      <TableCell className={Number(item.total_em_aberto) > 0 ? 'text-red-600' : 'text-zinc-600'}>
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
