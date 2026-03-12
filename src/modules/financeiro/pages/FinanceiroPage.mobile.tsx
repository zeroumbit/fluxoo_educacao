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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { NativeCard } from '@/components/mobile/NativeCard'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  IndianRupee,
  ChevronRight,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle,
  LayoutGrid,
  User,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const cobrancaSchema = z.object({
  aluno_id: z.string().min(1, 'Selecione o aluno'),
  descricao: z.string().min(3, 'Descrição obrigatória'),
  valor: z.any().transform(v => typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v).pipe(z.number().min(0.01, 'Valor deve ser superior a zero')),
  data_vencimento: z.string().min(1, 'Vencimento obrigatório'),
  status: z.enum(['a_vencer', 'pago', 'atrasado']).default('a_vencer')
})

type CobrancaFormValues = z.infer<typeof cobrancaSchema>

export function FinanceiroPageMobile() {
  const { authUser } = useAuth()
  const { data: cobrancas, isLoading, refetch } = useCobrancas()
  const { data: alunos } = useAlunos()
  const criarCobranca = useCriarCobranca()
  const baixarCobranca = useMarcarComoPago()
  const excluirCobranca = useExcluirCobranca()
  const estornarCobranca = useDesfazerPagamento()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedCobranca, setSelectedCobranca] = useState<any>(null)
  const [filtroTab, setFiltroTab] = useState<'todos' | 'a_vencer' | 'pago' | 'atrasado'>('todos')
  const [busca, setBusca] = useState('')

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<CobrancaFormValues>({
    resolver: zodResolver(cobrancaSchema),
    defaultValues: { status: 'a_vencer' }
  })

  const formAlunoId = watch('aluno_id')

  const onSubmit = async (data: CobrancaFormValues) => {
    if (!authUser) return
    try {
      await criarCobranca.mutateAsync({
        ...data,
        tenant_id: authUser.tenantId,
        aluno_id: data.aluno_id === 'avulso' ? null : data.aluno_id
      })
      toast.success('Lançamento realizado!')
      setSheetOpen(false)
      reset()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar')
    }
  }

  const handleBaixar = async (id: string) => {
    try {
      await baixarCobranca.mutateAsync(id)
      toast.success('Pagamento baixado!')
      setDetailOpen(false)
    } catch {
      toast.error('Erro na baixa')
    }
  }

  const handleEstornar = async (id: string) => {
    try {
      await estornarCobranca.mutateAsync(id)
      toast.success('Estorno realizado!')
      setDetailOpen(false)
    } catch {
      toast.error('Erro no estorno')
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Deseja excluir este registro?')) return
    try {
      await excluirCobranca.mutateAsync(id)
      toast.success('Removido com sucesso')
      setDetailOpen(false)
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const filteredList = useMemo(() => {
    if (!cobrancas) return []
    return (cobrancas as any[]).filter(c => {
      const matchTab = filtroTab === 'todos' || c.status === filtroTab
      const matchSearch = c.descricao.toLowerCase().includes(busca.toLowerCase()) || 
                          c.alunos?.nome_completo?.toLowerCase().includes(busca.toLowerCase())
      return matchTab && matchSearch
    })
  }, [cobrancas, filtroTab, busca])

  const totals = useMemo(() => {
    if (!cobrancas) return { pagos: 0, pendentes: 0 }
    const list = cobrancas as any[]
    return {
      pagos: list.filter(c => c.status === 'pago').reduce((acc, c) => acc + (c.valor || 0), 0),
      pendentes: list.filter(c => c.status !== 'pago').reduce((acc, c) => acc + (c.valor || 0), 0)
    }
  }, [cobrancas])

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
  }

  return (
    <PullToRefresh onRefresh={async () => { await refetch() }}>
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-32">
        <div className="mx-auto w-full max-w-[640px] px-4 pt-6 space-y-6">
          {/* Header de Saldo */}
          {/* Header de Saldo */}
          <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-200/50 dark:shadow-none relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <Wallet size={120} />
            </div>
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Saldo Recebido</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold opacity-60">R$</span>
              <h2 className="text-3xl font-bold">{totals.pagos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
            </div>
            
            <div className="mt-8 flex items-center justify-between gap-4">
              <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center gap-3 border border-white/10">
                <div className="h-8 w-8 rounded-lg bg-emerald-400/20 flex items-center justify-center">
                  <ArrowDownCircle size={16} className="text-emerald-300" />
                </div>
                <div>
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-tighter">Recebido</p>
                  <p className="font-bold text-sm">R$ {totals.pagos.toFixed(0)}</p>
                </div>
              </div>
              <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center gap-3 border border-white/10">
                <div className="h-8 w-8 rounded-lg bg-amber-400/20 flex items-center justify-center">
                   <AlertCircle size={16} className="text-amber-300" />
                </div>
                <div>
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-tighter">Pendente</p>
                  <p className="font-bold text-sm">R$ {totals.pendentes.toFixed(0)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Busca e Filtros */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar cobrança..." 
                className="h-12 rounded-xl bg-white dark:bg-slate-900 border-none shadow-sm pl-12 text-base w-full"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            <Tabs value={filtroTab} onValueChange={(v: any) => setFiltroTab(v)} className="w-full">
              <TabsList className="bg-transparent h-10 w-full justify-start p-0 overflow-x-auto no-scrollbar gap-2">
                <TabsTrigger value="todos" className="rounded-full px-5 font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Todos</TabsTrigger>
                <TabsTrigger value="a_vencer" className="rounded-full px-5 font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white">A Vencer</TabsTrigger>
                <TabsTrigger value="pago" className="rounded-full px-5 font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Pagos</TabsTrigger>
                <TabsTrigger value="atrasado" className="rounded-full px-5 font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Atrasados</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Lista de Cobranças */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredList.map((c: any, idx) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.25 }}
                >
                  <NativeCard 
                    onClick={() => { setSelectedCobranca(c); setDetailOpen(true); }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center",
                          c.status === 'pago' ? "bg-emerald-50 text-emerald-600" : 
                          c.status === 'atrasado' ? "bg-rose-50 text-rose-600" : "bg-zinc-50 text-slate-400"
                        )}>
                          {c.status === 'pago' ? <CheckCircle2 size={24} /> : <Calendar size={24} />}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{c.descricao}</h3>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-0.5">
                            <span className="capitalize">{c.alunos?.nome_completo || 'Avulso'}</span>
                            <span className="opacity-30">•</span>
                            <span>{new Date(c.data_vencimento).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-indigo-600">R$ {Number(c.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <div className={cn(
                          "text-[9px] font-bold uppercase tracking-widest mt-0.5",
                          c.status === 'pago' ? "text-emerald-500" : 
                          c.status === 'atrasado' ? "text-rose-500" : "text-amber-500"
                        )}>
                          {c.status === 'pago' ? 'Recebido' : c.status === 'atrasado' ? 'Atrasado' : 'Pendente'}
                        </div>
                      </div>
                    </div>
                  </NativeCard>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredList.length === 0 && (
              <div className="text-center py-10 opacity-30 italic font-medium">Nenhum registro encontrado</div>
            )}
          </div>
        </div>

        {/* FAB */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setSheetOpen(true)}
          className="fixed bottom-24 right-5 h-14 w-14 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-200/60 dark:shadow-none flex items-center justify-center text-white z-40 ring-4 ring-white dark:ring-slate-950"
        >
          <Plus className="h-6 w-6" />
        </motion.button>

        {/* BottomSheet: Nova Cobrança */}
        <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} title="Nova Cobrança">
          <form id="new-charge-mobile" onSubmit={handleSubmit(onSubmit)} className="px-1 pb-12 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vincular a</Label>
              <Select value={formAlunoId} onValueChange={(v) => setValue('aluno_id', v)}>
                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-base px-5">
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-[300px]">
                  <SelectItem value="avulso" className="font-bold py-3">Cobrança Avulsa (Sem Aluno)</SelectItem>
                  {(alunos as any[] || [])?.map(aluno => (
                    <SelectItem key={aluno.id} value={aluno.id} className="font-medium py-3">
                      {aluno.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.aluno_id && <p className="text-[10px] text-rose-500 font-bold ml-2">{errors.aluno_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Título/Descrição</Label>
              <Input 
                {...register('descricao')}
                className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-5 text-base font-bold w-full"
                placeholder="Ex: Mensalidade Março"
              />
              {errors.descricao && <p className="text-[10px] text-rose-500 font-bold ml-2">{errors.descricao.message}</p>}
            </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Valor (R$)</Label>
                  <Input 
                    {...register('valor')}
                    className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800 border-none px-5 text-base font-bold text-indigo-600 w-full"
                    placeholder="0,00"
                  />
                  {errors.valor && <p className="text-[10px] text-rose-500 font-bold ml-2">{errors.valor.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Vencimento</Label>
                  <Input 
                    {...register('data_vencimento')}
                    type="date"
                    className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800 border-none px-5 text-base font-bold w-full"
                  />
                </div>
              </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Status Inicial</Label>
              <Select value={watch('status')} onValueChange={(v: any) => setValue('status', v)}>
                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-base px-5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="a_vencer" className="font-bold py-3 text-slate-600 italic">Em Aberto</SelectItem>
                  <SelectItem value="pago" className="font-bold py-3 text-emerald-600">Já Recebido (Baixa Imediata)</SelectItem>
                  <SelectItem value="atrasado" className="font-bold py-3 text-rose-600">Considerar Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-base shadow-lg shadow-indigo-200/50"
            >
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'LANÇAR COBRANÇA'}
            </Button>
          </form>
        </BottomSheet>

        {/* BottomSheet: Detalhes da Cobrança */}
        <BottomSheet isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalhes da Cobrança">
          {selectedCobranca && (
            <div className="px-1 pb-12 space-y-8">
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 rounded-[2rem] space-y-2">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Valor da Cobrança</p>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                  R$ {Number(selectedCobranca.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h2>
                <div className={cn(
                  "px-4 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest mt-2",
                  selectedCobranca.status === 'pago' ? "bg-emerald-50 text-emerald-600" : 
                  selectedCobranca.status === 'atrasado' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                )}>
                  {selectedCobranca.status === 'pago' ? 'RECEBIDO' : selectedCobranca.status === 'atrasado' ? 'VENCIDO' : 'EM ABERTO'}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <LayoutGrid size={18} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-500">Descrição</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedCobranca.descricao}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-500">Vencimento</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{new Date(selectedCobranca.data_vencimento).toLocaleDateString('pt-BR')}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-500">Aluno</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedCobranca.alunos?.nome_completo || '—'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {selectedCobranca.status !== 'pago' ? (
                  <Button 
                    onClick={() => handleBaixar(selectedCobranca.id)}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-base shadow-lg shadow-emerald-100 dark:shadow-none"
                  >
                    MARCAR COMO PAGO
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleEstornar(selectedCobranca.id)}
                    className="w-full h-14 rounded-2xl bg-amber-500 text-white font-bold text-base shadow-lg shadow-amber-100 dark:shadow-none"
                  >
                    ESTORNAR PAGAMENTO
                  </Button>
                )}
                
                <Button 
                  onClick={() => handleExcluir(selectedCobranca.id)}
                  variant="ghost"
                  className="w-full h-12 text-rose-500 font-bold"
                >
                  EXCLUIR REGISTRO
                </Button>
              </div>
            </div>
          )}
        </BottomSheet>
      </div>
    </PullToRefresh>
  )
}
