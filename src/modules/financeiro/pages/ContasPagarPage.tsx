import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useContasPagar, useCriarContaPagar, useAtualizarContaPagar, useDeletarContaPagar } from '../hooks-avancado'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePermissions } from '@/providers/RBACProvider'
import { Plus, Loader2, Wallet, Edit2, Trash2, AlertTriangle, Check } from 'lucide-react'

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
  const atualizar = useAtualizarContaPagar()
  const deletar = useDeletarContaPagar()
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [contaParaEditar, setContaParaEditar] = useState<any | null>(null)
  const [contaParaDeletar, setContaParaDeletar] = useState<any | null>(null)
  const [contaParaPagar, setContaParaPagar] = useState<any | null>(null)
  const [recorrente, setRecorrente] = useState(false)
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) as any })

  // Permissões
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission('financeiro.contas_pagar.create')
  const canEdit = hasPermission('financeiro.contas_pagar.edit')
  const canPay = hasPermission('financeiro.contas_pagar.pay')

  const onSubmit = async (data: any) => {
    if (!authUser) return
    try {
      if (contaParaEditar) {
        await atualizar.mutateAsync({ id: contaParaEditar.id, updates: { ...data, recorrente } })
        toast.success('Conta atualizada!')
      } else {
        await criar.mutateAsync({ ...data, recorrente, tenant_id: authUser.tenantId })
        toast.success('Conta registrada!')
      }
      form.reset(); setOpen(false); setEditOpen(false); setContaParaEditar(null)
    } catch { toast.error('Erro ao salvar') }
  }

  const handleEditar = (conta: any) => {
    setContaParaEditar(conta)
    form.setValue('nome', conta.nome)
    form.setValue('favorecido', conta.favorecido || '')
    form.setValue('data_vencimento', conta.data_vencimento)
    form.setValue('valor', conta.valor)
    setRecorrente(!!conta.recorrente)
    setEditOpen(true)
  }

  const handleDeletar = (conta: any) => {
    setContaParaDeletar(conta)
    setDeleteOpen(true)
  }

  const confirmarExclusao = async () => {
    if (!contaParaDeletar) return
    try {
      await deletar.mutateAsync(contaParaDeletar.id)
      toast.success('Conta excluída!')
      setDeleteOpen(false)
      setContaParaDeletar(null)
    } catch { toast.error('Erro ao excluir') }
  }

  const confirmarPagamento = async () => {
    if (!contaParaPagar) return
    try {
      await atualizar.mutateAsync({ 
        id: contaParaPagar.id, 
        updates: { status: 'pago' } 
      })
      toast.success('Pagamento registrado com sucesso!')
      setPayOpen(false)
      setContaParaPagar(null)
    } catch { toast.error('Erro ao registrar pagamento') }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">Contas a Pagar</h1><p className="text-muted-foreground">Controle despesas e fornecedores</p></div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-gradient-to-r from-red-600 to-rose-600 shadow-md"><Plus className="mr-2 h-4 w-4" />Nova Despesa</Button></DialogTrigger>
            <DialogContent className="max-w-[800px]">
              <DialogHeader><DialogTitle>Nova Conta a Pagar</DialogTitle></DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2"><Label>Nome da Conta *</Label><Input placeholder="Ex: Conta de Luz" {...form.register('nome')} />{form.formState.errors.nome && <p className="text-sm text-destructive">{form.formState.errors.nome.message as React.ReactNode}</p>}</div>
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
        )}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-[800px]">
          <DialogHeader><DialogTitle>Editar Conta a Pagar</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2"><Label>Nome da Conta *</Label><Input placeholder="Ex: Conta de Luz" {...form.register('nome')} />{form.formState.errors.nome && <p className="text-sm text-destructive">{String(form.formState.errors.nome.message)}</p>}</div>
            <div className="space-y-2"><Label>Favorecido / Fornecedor</Label><Input placeholder="Nome do fornecedor" {...form.register('favorecido')} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Data de Vencimento *</Label><Input type="date" {...form.register('data_vencimento')} /></div>
              <div className="space-y-2"><Label>Valor (R$) *</Label><Input type="number" step="0.01" {...form.register('valor')} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={recorrente} onCheckedChange={setRecorrente} /><Label>Cobrança Recorrente</Label></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar alterações'}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Pagamento */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Check className="h-5 w-5" />
              Confirmar Pagamento
            </DialogTitle>
            <DialogDescription>
              Você confirma que o pagamento da conta <strong>{contaParaPagar?.nome}</strong> foi realizado?
              Esta ação atualizará o status para pago e impactará o saldo da dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={confirmarPagamento}>Confirmar Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. A conta será permanentemente removida.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarExclusao}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Card className="border-0 shadow-md"><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead className="pl-8">Conta</TableHead><TableHead className="pl-4">Favorecido</TableHead><TableHead className="pl-4">Vencimento</TableHead><TableHead className="pl-4">Valor</TableHead><TableHead className="pl-4">Recorrente</TableHead><TableHead className="pl-4">Status</TableHead><TableHead className="w-[100px] text-right pr-8">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {contas?.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="pl-8 font-bold">{c.nome}</TableCell>
                <TableCell className="pl-4">{c.favorecido || '—'}</TableCell>
                <TableCell className="pl-4">{c.data_vencimento}</TableCell>
                <TableCell className="pl-4">R$ {Number(c.valor).toFixed(2)}</TableCell>
                <TableCell className="pl-4">{c.recorrente ? <Badge className="bg-blue-100 text-blue-800">Sim</Badge> : 'Não'}</TableCell>
                <TableCell className="pl-4"><Badge className={c.status === 'pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>{c.status}</Badge></TableCell>
                <TableCell className="pr-8">
                  <div className="flex gap-1">
                    {canPay && c.status !== 'pago' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" 
                        onClick={() => { setContaParaPagar(c); setPayOpen(true) }}
                        title="Marcar como Pago"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {canEdit && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleEditar(c)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    {canEdit && ( // Usando canEdit para deletar também simplificadamente ou criar canDelete se necessário no RBAC
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeletar(c)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {!canPay && !canEdit && <span className="text-[10px] text-muted-foreground italic px-2">Read-only</span>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!contas || contas.length === 0) && <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground"><Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />Nenhuma despesa registrada.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  )
}
