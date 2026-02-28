import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '@/modules/auth/AuthContext'
import { useCobrancas, useCriarCobranca, useMarcarComoPago } from '../hooks'
import { useAlunos } from '@/modules/alunos/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2, CreditCard, CheckCircle } from 'lucide-react'

const cobrancaSchema = z.object({
  aluno_id: z.string().min(1, 'Selecione um aluno'),
  descricao: z.string().min(3, 'Descrição é obrigatória'),
  valor: z.coerce.number().positive('Valor deve ser positivo'),
  vencimento: z.string().min(1, 'Vencimento é obrigatório'),
})

type CobrancaFormValues = z.infer<typeof cobrancaSchema>

export function FinanceiroPage() {
  const { authUser } = useAuth()
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const { data: cobrancas, isLoading } = useCobrancas(filtroStatus)
  const { data: alunos } = useAlunos()
  const criarCobranca = useCriarCobranca()
  const marcarComoPago = useMarcarComoPago()
  const [dialogOpen, setDialogOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CobrancaFormValues>({
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
        vencimento: data.vencimento,
        status: 'pendente',
      })
      toast.success('Cobrança criada!')
      reset()
      setDialogOpen(false)
    } catch {
      toast.error('Erro ao criar cobrança')
    }
  }

  const handleMarcarPago = async (id: string) => {
    try {
      await marcarComoPago.mutateAsync(id)
      toast.success('Cobrança marcada como paga!')
    } catch {
      toast.error('Erro ao atualizar cobrança')
    }
  }

  const statusBadge = (status: string, vencimento: string) => {
    // Marcar como atrasado automaticamente
    const isAtrasado = status === 'pendente' && new Date(vencimento) < new Date()
    const displayStatus = isAtrasado ? 'atrasado' : status

    const styles: Record<string, string> = {
      pendente: 'bg-amber-100 text-amber-800',
      pago: 'bg-emerald-100 text-emerald-800',
      atrasado: 'bg-red-100 text-red-800',
      cancelado: 'bg-zinc-100 text-zinc-600',
    }

    return (
      <Badge className={styles[displayStatus] || ''}>
        {displayStatus}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Gerencie as cobranças e mensalidades</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              Nova Cobrança
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Cobrança</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Aluno *</Label>
                <Select onValueChange={(v) => setValue('aluno_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {alunos
                      ?.filter((a) => a.status === 'ativo')
                      .map((aluno) => (
                        <SelectItem key={aluno.id} value={aluno.id}>
                          {aluno.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.aluno_id && (
                  <p className="text-sm text-destructive">{errors.aluno_id.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input id="descricao" placeholder="Ex: Mensalidade Março/2026" {...register('descricao')} />
                {errors.descricao && (
                  <p className="text-sm text-destructive">{errors.descricao.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$) *</Label>
                  <Input id="valor" type="number" step="0.01" {...register('valor')} />
                  {errors.valor && (
                    <p className="text-sm text-destructive">{errors.valor.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vencimento">Vencimento *</Label>
                  <Input id="vencimento" type="date" {...register('vencimento')} />
                  {errors.vencimento && (
                    <p className="text-sm text-destructive">{errors.vencimento.message}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Label className="shrink-0">Filtrar por:</Label>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
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
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cobrancas?.map((cobranca) => (
                <TableRow key={cobranca.id}>
                  <TableCell className="font-medium">
                    {(cobranca as Record<string, unknown>).alunos
                      ? ((cobranca as Record<string, unknown>).alunos as { nome: string }).nome
                      : '—'}
                  </TableCell>
                  <TableCell>{cobranca.descricao}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(cobranca.valor)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(cobranca.vencimento + 'T12:00:00'), 'dd/MM/yyyy', {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>{statusBadge(cobranca.status, cobranca.vencimento)}</TableCell>
                  <TableCell>
                    {cobranca.status !== 'pago' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleMarcarPago(cobranca.id)}
                        disabled={marcarComoPago.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Pago
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
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
