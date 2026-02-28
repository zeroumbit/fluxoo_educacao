import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useContasPagar, useCriarContaPagar } from '../hooks-avancado'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Loader2, Wallet } from 'lucide-react'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  favorecido: z.string().optional(),
  data_vencimento: z.string().min(1),
  valor: z.coerce.number().min(0.01),
  recorrente: z.boolean().optional(),
})

export function ContasPagarPage() {
  const { authUser } = useAuth()
  const { data: contas, isLoading } = useContasPagar()
  const criar = useCriarContaPagar()
  const [open, setOpen] = useState(false)
  const [recorrente, setRecorrente] = useState(false)
  const form = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data: any) => {
    if (!authUser) return
    try {
      await criar.mutateAsync({ ...data, recorrente, tenant_id: authUser.tenantId })
      toast.success('Conta registrada!')
      form.reset(); setOpen(false)
    } catch { toast.error('Erro ao registrar') }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">Contas a Pagar</h1><p className="text-muted-foreground">Controle despesas e fornecedores</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-to-r from-red-600 to-rose-600 shadow-md"><Plus className="mr-2 h-4 w-4" />Nova Despesa</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Conta a Pagar</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2"><Label>Nome da Conta *</Label><Input placeholder="Ex: Conta de Luz" {...form.register('nome')} />{form.formState.errors.nome && <p className="text-sm text-destructive">{form.formState.errors.nome.message}</p>}</div>
              <div className="space-y-2"><Label>Favorecido / Fornecedor</Label><Input placeholder="Nome do fornecedor" {...form.register('favorecido')} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Data de Vencimento *</Label><Input type="date" {...form.register('data_vencimento')} /></div>
                <div className="space-y-2"><Label>Valor (R$) *</Label><Input type="number" step="0.01" {...form.register('valor')} /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={recorrente} onCheckedChange={setRecorrente} /><Label>Cobrança Recorrente</Label></div>
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar'}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="border-0 shadow-md"><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Conta</TableHead><TableHead>Favorecido</TableHead><TableHead>Vencimento</TableHead><TableHead>Valor</TableHead><TableHead>Recorrente</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {contas?.map((c: any) => (
              <TableRow key={c.id}><TableCell className="font-bold">{c.nome}</TableCell><TableCell>{c.favorecido || '—'}</TableCell><TableCell>{c.data_vencimento}</TableCell><TableCell>R$ {Number(c.valor).toFixed(2)}</TableCell><TableCell>{c.recorrente ? <Badge className="bg-blue-100 text-blue-800">Sim</Badge> : 'Não'}</TableCell><TableCell><Badge className={c.status === 'pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>{c.status}</Badge></TableCell></TableRow>
            ))}
            {(!contas || contas.length === 0) && <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground"><Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />Nenhuma despesa registrada.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  )
}
