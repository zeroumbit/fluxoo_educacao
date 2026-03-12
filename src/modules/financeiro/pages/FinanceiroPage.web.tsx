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
      {/* Header com Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Banknote className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Gerado</p>
              <p className="text-2xl font-bold text-slate-900">R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </Card>
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ArrowDownCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/50">Total Recebido</p>
              <p className="text-2xl font-bold text-slate-900">R$ {stats.pagos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </Card>
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600/50">A Receber</p>
              <p className="text-2xl font-bold text-slate-900">R$ {stats.a_vencer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </Card>
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center">
              <ArrowUpCircle className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600/50">Em Atraso</p>
              <p className="text-2xl font-bold text-slate-900">R$ {stats.atrasados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por aluno ou descrição..." 
              className="pl-9 h-11 bg-white border-slate-200 rounded-xl"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <Select value={filtroStatus} onValueChange={(v: any) => setFiltroStatus(v)}>
            <SelectTrigger className="w-[180px] h-11 bg-white rounded-xl border-slate-200">
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
            <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 h-11 text-white rounded-xl shadow-md px-6 font-bold gap-2">
              <Plus className="h-5 w-5" /> Nova Cobrança
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
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Aluno</label>
                  <Select 
                    value={alunoIdSelecionado} 
                    onValueChange={(val) => setValue('aluno_id', val)}
                    disabled={!!cobrancaEditando}
                  >
                    <SelectTrigger className="w-full bg-white border-slate-200 h-11 rounded-xl">
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
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Descrição</label>
                  <Input 
                    {...register('descricao')}
                    placeholder="Ex: Mensalidade Julho/2024"
                    className="w-full h-11 border-slate-200 rounded-xl"
                  />
                  {errors.descricao && <p className="text-xs text-rose-500 font-bold">{errors.descricao.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Valor (R$)</label>
                    <Input 
                      type="number"
                      step="0.01"
                      {...register('valor')}
                      className="w-full h-11 border-slate-200 rounded-xl"
                    />
                    {errors.valor && <p className="text-xs text-rose-500 font-bold">{errors.valor.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Vencimento</label>
                    <Input 
                      type="date"
                      {...register('data_vencimento')}
                      className="w-full h-11 border-slate-200 rounded-xl"
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

      <Card className="border border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-slate-500 px-6 h-12 uppercase text-[10px] tracking-widest">Aluno / Responsável</TableHead>
              <TableHead className="font-bold text-slate-500 px-6 h-12 uppercase text-[10px] tracking-widest">Descrição</TableHead>
              <TableHead className="font-bold text-slate-500 px-6 h-12 uppercase text-[10px] tracking-widest">Vencimento</TableHead>
              <TableHead className="font-bold text-slate-500 px-6 h-12 uppercase text-[10px] tracking-widest">Valor</TableHead>
              <TableHead className="font-bold text-slate-500 px-6 h-12 uppercase text-[10px] tracking-widest">Status</TableHead>
              <TableHead className="text-right px-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCobrancas.map((c: any) => (
              <TableRow key={c.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                <TableCell className="px-6 py-4">
                  <p className="font-bold text-slate-900">{c.alunos?.nome_completo}</p>
                  <p className="text-xs text-slate-400 font-medium">{c.alunos?.email_acesso}</p>
                </TableCell>
                <TableCell className="px-6 py-4 text-slate-600 font-medium">{c.descricao}</TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {new Date(c.data_vencimento).toLocaleDateString('pt-BR')}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 font-bold text-indigo-700">
                  R$ {Number(c.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Badge variant="outline" className={cn(
                    "rounded-md px-3 py-1 font-bold border-0",
                    c.status === 'pago' ? "bg-emerald-50 text-emerald-600" :
                    c.status === 'atrasado' ? "bg-rose-50 text-rose-600" :
                    "bg-amber-50 text-amber-500"
                  )}>
                    {c.status === 'pago' ? 'RECEBIDO' : 
                     c.status === 'atrasado' ? 'ATRASADO' : 'EM ABERTO'}
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
