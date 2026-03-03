import { useSolicitacoesUpgrade, useAprovarUpgrade, useRecusarUpgrade } from '../hooks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { CheckCircle2, XCircle, MoreHorizontal, ArrowUpCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function UpgradesPage() {
  const { data: upgrades, isLoading } = useSolicitacoesUpgrade()
  const aprovar = useAprovarUpgrade()
  const recusar = useRecusarUpgrade()

  const handleAprovar = async (item: any) => {
    try {
      await aprovar.mutateAsync({
        id: item.id,
        tenantId: item.tenant_id,
        novoLimite: item.limite_solicitado,
        novoValor: item.valor_proposto,
      })
      toast.success('Upgrade aprovado e assinatura atualizada!')
    } catch {
      toast.error('Erro ao aprovar upgrade.')
    }
  }

  const handleRecusar = async (id: string) => {
    try {
      await recusar.mutateAsync(id)
      toast.success('Solicitação recusada.')
    } catch {
      toast.error('Erro ao recusar.')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado': return <Badge className="bg-emerald-500">Aprovado</Badge>
      case 'pendente': return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Pendente</Badge>
      case 'recusado': return <Badge variant="destructive">Recusado</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return <div className="p-8 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Solicitações de Upgrade</h1>
        <p className="text-muted-foreground mt-1">Gerencie pedidos de expansão de cota de alunos das escolas.</p>
      </div>

      <Card className="border-0 shadow-xl overflow-hidden bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ArrowUpCircle className="h-5 w-5 text-indigo-600" /> Fila de Upgrades</CardTitle>
          <CardDescription>Ao aprovar, a assinatura atual é atualizada e o histórico anterior é arquivado.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead className="pl-6">Escola</TableHead>
                <TableHead>Limite Atual</TableHead>
                <TableHead>Limite Solicitado</TableHead>
                <TableHead>Valor Atual</TableHead>
                <TableHead>Valor Proposto</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upgrades?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Nenhuma solicitação encontrada.</TableCell>
                </TableRow>
              )}
              {upgrades?.map((u: any) => (
                <TableRow key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                  <TableCell className="pl-6 font-bold text-zinc-900">{u.escola?.razao_social || '—'}</TableCell>
                  <TableCell className="text-sm">{u.limite_atual} alunos</TableCell>
                  <TableCell className="text-sm font-bold text-indigo-700">{u.limite_solicitado} alunos</TableCell>
                  <TableCell className="text-sm">R$ {Number(u.valor_atual).toFixed(2)}</TableCell>
                  <TableCell className="text-sm font-bold text-emerald-700">R$ {Number(u.valor_proposto).toFixed(2)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{getStatusBadge(u.status)}</TableCell>
                  <TableCell className="text-right pr-6">
                    {u.status === 'pendente' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAprovar(u)} className="text-emerald-600 font-bold">
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Aprovar Upgrade
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRecusar(u.id)} className="text-destructive">
                            <XCircle className="mr-2 h-4 w-4" /> Recusar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
