import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useCobrancas, useCriarCobranca, useMarcarComoPago } from '../hooks'
import { useAlunos } from '@/modules/alunos/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Loader2, CreditCard, Check } from 'lucide-react'
import { isPast } from 'date-fns'
import { DialogFooter, DialogDescription } from '@/components/ui/dialog'

const cobrancaSchema = z.object({
  aluno_id: z.string().min(1, 'Selecione um aluno'),
  descricao: z.string().min(3, 'Descrição é obrigatória'),
  valor: z.coerce.number().min(0.01, 'Valor deve ser maior que 0'),
  data_vencimento: z.string().min(1, 'Data é obrigatória'),
})

type CobrancaFormValues = z.infer<typeof cobrancaSchema>

const statusColors: Record<string, string> = {
  a_vencer: 'bg-blue-100 text-blue-800',
  pago: 'bg-emerald-100 text-emerald-800',
  atrasado: 'bg-red-100 text-red-800',
  cancelado: 'bg-zinc-100 text-zinc-600',
}

const statusLabels: Record<string, string> = {
  a_vencer: 'A Vencer',
  pago: 'Pago',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
}

export function FinanceiroPage() {
  const { authUser } = useAuth()
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const { data: cobrancas, isLoading } = useCobrancas(filtroStatus)
  const { data: alunos } = useAlunos()
  const criarCobranca = useCriarCobranca()
  const marcarComoPago = useMarcarComoPago()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<CobrancaFormValues>({
    resolver: zodResolver(cobrancaSchema),
  })

  const onSubmit = async (data: CobrancaFormValues) => {
    if (!authUser) return
    try {
      await criarCobranca.mutateAsync({
        tenant_id: authUser.tenantId,
        aluno_id: data.aluno_id,
        descricao: data.descricao,
        valor: data.valor,
        data_vencimento: data.data_vencimento,
        status: 'a_vencer',
      })
      toast.success('Cobrança criada!')
      reset()
      setDialogOpen(false)
    } catch {
      toast.error('Erro ao criar')
    }
  }

  const handleMarcarPago = async (id: string) => {
    try {
      await marcarComoPago.mutateAsync(id)
      toast.success('Marcado como pago!')
    } catch {
      toast.error('Erro')
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Gerencie cobranças dos alunos</p>
        </div>
        <div className="flex gap-2">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="a_vencer">A Vencer</SelectItem>
              <SelectItem value="pago">Pagos</SelectItem>
              <SelectItem value="atrasado">Atrasados</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-green-600 shadow-md">
                <Plus className="mr-2 h-4 w-4" /> Nova Cobrança
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Cobrança</DialogTitle>
                <DialogDescription>
                  Preencha as informações para criar uma nova cobrança.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aluno_id">Aluno *</Label>
                  <Select onValueChange={(v) => setValue('aluno_id', v)}>
                    <SelectTrigger id="aluno_id" className="w-full">
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {alunos?.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.nome_completo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.aluno_id && (
                    <p className="text-sm text-destructive">{errors.aluno_id.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Input 
                    id="descricao" 
                    placeholder="Ex: Mensalidade janeiro/2024" 
                    {...register('descricao')} 
                  />
                  {errors.descricao && (
                    <p className="text-sm text-destructive">{errors.descricao.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor (R$) *</Label>
                    <Input 
                      id="valor" 
                      type="number" 
                      step="0.01" 
                      placeholder="0,00" 
                      {...register('valor')} 
                    />
                    {errors.valor && (
                      <p className="text-sm text-destructive">{errors.valor.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_vencimento">Vencimento *</Label>
                    <Input 
                      id="data_vencimento" 
                      type="date" 
                      {...register('data_vencimento')} 
                    />
                    {errors.data_vencimento && (
                      <p className="text-sm text-destructive">{errors.data_vencimento.message}</p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cobrancas?.map((c) => {
                const atrasada = c.status === 'a_vencer' && isPast(new Date(c.data_vencimento))
                const statusFinal = atrasada ? 'atrasado' : c.status
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{(c as Record<string, unknown>).alunos ? ((c as Record<string, unknown>).alunos as { nome_completo: string }).nome_completo : '—'}</TableCell>
                    <TableCell>{c.descricao}</TableCell>
                    <TableCell>R$ {Number(c.valor).toFixed(2)}</TableCell>
                    <TableCell>{c.data_vencimento}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[statusFinal] || statusColors.a_vencer}>
                        {statusLabels[statusFinal] || statusFinal}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.status !== 'pago' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => handleMarcarPago(c.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {(!cobrancas || cobrancas.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p>Nenhuma cobrança encontrada.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
