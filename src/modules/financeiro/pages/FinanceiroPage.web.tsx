import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useCobrancas, useCriarCobranca, useMarcarComoPago, useExcluirCobranca, useDesfazerPagamento } from '../hooks'
import { useAlunos } from '@/modules/alunos/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Loader2, 
  Search, 
  MoreHorizontal, 
  CheckCircle2, 
  Trash2, 
  Undo2, 
  Calendar,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle,
  Banknote,
  FileDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

const cobrancaSchema = z.object({
  aluno_id: z.string().min(1, 'Selecione o aluno'),
  descricao: z.string().min(3, 'Descrição obrigatória'),
  valor: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  data_vencimento: z.string().min(1, 'Data de vencimento obrigatória'),
})

type CobrancaFormValues = z.infer<typeof cobrancaSchema>

export function FinanceiroPageWeb() {
  const { authUser } = useAuth()
  const { data: cobrancas, isLoading, refetch } = useCobrancas()
  const { data: alunos } = useAlunos()
  const criarCobranca = useCriarCobranca()
  const baixarCobranca = useMarcarComoPago()
  const excluirCobranca = useExcluirCobranca()
  const estornarCobranca = useDesfazerPagamento()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [cobrancaEditando, setCobrancaEditando] = useState<any>(null)
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'a_vencer' | 'pago' | 'atrasado'>('todos')
  const [busca, setBusca] = useState('')

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<CobrancaFormValues>({
    resolver: zodResolver(cobrancaSchema),
  })

  const alunoIdSelecionado = watch('aluno_id')

  const onSubmit = async (data: CobrancaFormValues) => {
    if (!authUser) return
    try {
      await criarCobranca.mutateAsync({
        ...data,
        tenant_id: authUser.tenantId,
        status: 'a_vencer'
      })
      toast.success('Cobrança criada com sucesso!')
      setDialogOpen(false)
      reset()
      refetch()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar cobrança')
    }
  }

  const handleBaixar = async (id: string) => {
    if (!confirm('Deseja marcar esta cobrança como paga?')) return
    try {
      await baixarCobranca.mutateAsync(id)
      toast.success('Cobrança baixada!')
    } catch {
      toast.error('Erro ao baixar.')
    }
  }

  const handleEstornar = async (id: string) => {
    if (!confirm('Deseja estornar este pagamento? O status voltará para "A Vencer".')) return
    try {
      await estornarCobranca.mutateAsync(id)
      toast.success('Pagamento estornado!')
    } catch {
      toast.error('Erro ao estornar.')
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Deseja excluir esta cobrança permanentemente?')) return
    try {
      await excluirCobranca.mutateAsync(id)
      toast.success('Cobrança excluída!')
    } catch {
      toast.error('Erro ao excluir.')
    }
  }

  const filteredCobrancas = useMemo(() => {
    if (!cobrancas) return []
    return (cobrancas as any[]).filter(c => {
      const matchStatus = filtroStatus === 'todos' || c.status === filtroStatus
      const matchBusca = c.alunos?.nome_completo?.toLowerCase().includes(busca.toLowerCase()) || 
                         c.descricao.toLowerCase().includes(busca.toLowerCase())
      return matchStatus && matchBusca
    })
  }, [cobrancas, filtroStatus, busca])

  const stats = useMemo(() => {
    if (!cobrancas) return { total: 0, pagos: 0, a_vencer: 0, atrasados: 0 }
    const list = cobrancas as any[]
    return {
      total: list.reduce((acc, c) => acc + (c.valor || 0), 0),
      pagos: list.filter(c => c.status === 'pago').reduce((acc, c) => acc + (c.valor || 0), 0),
      a_vencer: list.filter(c => c.status === 'a_vencer').reduce((acc, c) => acc + (c.valor || 0), 0),
      atrasados: list.filter(c => c.status === 'atrasado').reduce((acc, c) => acc + (c.valor || 0), 0),
    }
  }, [cobrancas])

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Header com Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-indigo-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-600">Total Gerado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-indigo-900">R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-emerald-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-600">Total Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-emerald-900">R$ {stats.pagos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-600">A Receber</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-amber-900">R$ {stats.a_vencer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-rose-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-rose-600">Em Atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-rose-900">R$ {stats.atrasados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por aluno ou descrição..." 
              className="pl-9 bg-slate-50 border-0 rounded-xl"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <Select value={filtroStatus} onValueChange={(v: any) => setFiltroStatus(v)}>
            <SelectTrigger className="w-[180px] bg-white rounded-xl border-zinc-200">
              <Filter className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="a_vencer">Em Aberto</SelectItem>
              <SelectItem value="pago">Pagos</SelectItem>
              <SelectItem value="atrasado">Em Atraso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(val) => { setDialogOpen(val); if(!val) reset(); }}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100 px-6 font-bold">
              <Plus className="mr-2 h-5 w-5" /> Nova Cobrança
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Cobrança</DialogTitle>
              <DialogDescription>Gere um título financeiro para um aluno.</DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Aluno</Label>
                  <Select 
                    value={alunoIdSelecionado} 
                    onValueChange={(val) => setValue('aluno_id', val)}
                    disabled={!!cobrancaEditando}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {alunos?.map((aluno) => (
                        <SelectItem key={aluno.id} value={aluno.id}>
                          {aluno.nome_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.aluno_id && <p className="text-xs text-rose-500 font-bold">{errors.aluno_id.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Descrição</Label>
                  <Input 
                    {...register('descricao')}
                    placeholder="Ex: Mensalidade Julho/2024"
                    className="w-full"
                  />
                  {errors.descricao && <p className="text-xs text-rose-500 font-bold">{errors.descricao.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Valor (R$)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      {...register('valor')}
                      className="w-full"
                    />
                    {errors.valor && <p className="text-xs text-rose-500 font-bold">{errors.valor.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Vencimento</Label>
                    <Input 
                      type="date"
                      {...register('data_vencimento')}
                      className="w-full"
                    />
                    {errors.data_vencimento && <p className="text-xs text-rose-500 font-bold">{errors.data_vencimento.message}</p>}
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirmar Cobrança'}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden rounded-2xl border border-slate-100">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-slate-600">Aluno / Responsável</TableHead>
              <TableHead className="font-bold text-slate-600">Descrição</TableHead>
              <TableHead className="font-bold text-slate-600">Vencimento</TableHead>
              <TableHead className="font-bold text-slate-600">Valor</TableHead>
              <TableHead className="font-bold text-slate-600">Status</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCobrancas.map((c: any) => (
              <TableRow key={c.id} className="hover:bg-slate-50 transition-colors">
                <TableCell>
                  <p className="font-bold text-slate-900">{c.alunos?.nome_completo}</p>
                  <p className="text-xs text-slate-500">{c.alunos?.email_acesso}</p>
                </TableCell>
                <TableCell className="text-slate-600 font-medium">{c.descricao}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {new Date(c.data_vencimento).toLocaleDateString('pt-BR')}
                  </div>
                </TableCell>
                <TableCell className="font-bold text-indigo-600">
                  R$ {Number(c.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    "rounded-full px-3 py-1 font-bold",
                    c.status === 'pago' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                    c.status === 'atrasado' ? "bg-rose-50 text-rose-600 border-rose-100" :
                    "bg-amber-50 text-amber-600 border-amber-100"
                  )}>
                    {c.status === 'pago' ? 'Recebido' : 
                     c.status === 'atrasado' ? 'Em Atraso' : 'Em Aberto'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl p-2 border-slate-100">
                      {c.status !== 'pago' ? (
                        <DropdownMenuItem onClick={() => handleBaixar(c.id)} className="text-emerald-600 font-bold focus:bg-emerald-50 rounded-lg">
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Marcar como Pago
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleEstornar(c.id)} className="text-amber-600 font-bold focus:bg-amber-50 rounded-lg">
                          <Undo2 className="mr-2 h-4 w-4" /> Estornar Pagamento
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleExcluir(c.id)} className="text-rose-600 font-bold focus:bg-rose-50 rounded-lg">
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir Cobrança
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredCobrancas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-slate-400 italic bg-white">
                  Nenhuma cobrança encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
