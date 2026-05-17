import { BottomSheet } from '@/components/mobile/BottomSheet'
import { NativeCard } from '@/components/mobile/NativeCard'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Accordion,AccordionContent,AccordionItem,AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useAlunos } from '@/modules/alunos/hooks'
import { useAuth } from '@/modules/auth/AuthContext'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence,motion } from 'framer-motion'
import {
AlertCircle,
ArrowDownCircle,
ArrowLeft,
Calendar,
CheckCircle2,
History,
LayoutGrid,
Loader2,
Plus,
Search,
User,
Wallet
} from 'lucide-react'
import { useMemo,useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { useCobrancasComEncargos,useCriarCobranca,useDesfazerPagamento,useExcluirCobranca,useRegistrarPagamentoManual } from '../hooks'
import {
detectarTipoCobranca,
extrairDiasProporcionais,
getLabelTipoCobranca,
getValorExibicao,
isTaxaMatricula
} from '../utils/cobranca-utils'

const cobrancaSchema = z.object({
  aluno_id: z.string().min(1, 'Selecione o aluno'),
  descricao: z.string().min(3, 'Descrição obrigatória'),
  valor: z.any().transform(v => typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v).pipe(z.number().min(0.01, 'Valor deve ser superior a zero')),
  data_vencimento: z.string().min(1, 'Vencimento obrigatório'),
  status: z.enum(['a_vencer', 'pago', 'atrasado']).default('a_vencer')
})

type CobrancaFormValues = z.infer<typeof cobrancaSchema>

export function FinanceiroPageMobile() {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const { data: cobrancas, isLoading, refetch } = useCobrancasComEncargos()
  const { data: alunos } = useAlunos()
  const criarCobranca = useCriarCobranca()
  const baixarCobranca = useRegistrarPagamentoManual()
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
        aluno_id: data.aluno_id === 'avulso' ? null : data.aluno_id,
        tipo_cobranca: 'avulso',
        subtipo_cobranca: 'avulso',
        origem_cobranca: 'manual'
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
      await baixarCobranca.mutateAsync({ id })
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
    // Buscar o aluno da cobrança para validar a regra
    const cobranca = cobrancas?.find((c: any) => c.id === id)
    const aluno = alunos?.find((a: any) => a.id === cobranca?.aluno_id)
    
    // Regra: Alunos matriculados não podem ter cobranças deletadas
    if (aluno?.turma_atual) {
      toast.error('Não permitido!', {
        description: 'Alunos matriculados não podem ter cobranças deletadas.'
      })
      return
    }

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
    const hoje = new Date(); hoje.setHours(12, 0, 0, 0)
    const isAtrasada = (c: any) =>
      c.status === 'atrasado' || (c.status === 'a_vencer' && new Date(c.data_vencimento + 'T12:00:00') < hoje)

    return (cobrancas as any[]).filter(c => {
      let matchTab = filtroTab === 'todos'
      if (filtroTab === 'atrasado') matchTab = isAtrasada(c)
      else if (filtroTab === 'a_vencer') matchTab = c.status === 'a_vencer' && !isAtrasada(c)
      else if (filtroTab === 'pago')    matchTab = c.status === 'pago'
      const matchSearch = (c.descricao || '').toLowerCase().includes(busca.toLowerCase()) ||
                          (c.alunos?.nome_completo || '').toLowerCase().includes(busca.toLowerCase())
      return matchTab && matchSearch
    })
  }, [cobrancas, filtroTab, busca])

  const groupedList = useMemo(() => {
    const groups: Record<string, any[]> = {}
    filteredList.forEach((c: any) => {
      const data = new Date(c.data_vencimento + 'T12:00:00')
      const key = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
      if (!groups[key]) groups[key] = []
      groups[key].push(c)
    })

    const today = new Date()
    const currentKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

    const allEntries = Object.entries(groups).map(([key, items]) => {
      const [year, month] = key.split('-')
      const dataRef = new Date(Number(year), Number(month) - 1, 1)
      const labelStr = dataRef.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      const label = labelStr.charAt(0).toUpperCase() + labelStr.slice(1)
      return { key, label, items }
    })

    const past = allEntries.filter(e => e.key < currentKey).sort((a, b) => b.key.localeCompare(a.key))
    const current = allEntries.find(e => e.key === currentKey)
    const future = allEntries.filter(e => e.key > currentKey).sort((a, b) => a.key.localeCompare(b.key))

    return { past, current, future, currentKey }
  }, [filteredList])

  const currentMonthKey = groupedList.currentKey

  const totals = useMemo(() => {
    if (!cobrancas) return { pagos: 0, pendentes: 0, atrasados: 0 }
    const list = cobrancas as any[]
    const hoje = new Date(); hoje.setHours(12, 0, 0, 0)
    const isAtrasada = (c: any) =>
      c.status === 'atrasado' || (c.status === 'a_vencer' && new Date(c.data_vencimento + 'T12:00:00') < hoje)
    return {
      pagos: list.filter(c => c.status === 'pago').reduce((acc, c) => acc + Number(c.valor_pago || c.valor_total_projetado || c.valor), 0),
      pendentes: list.filter(c => c.status !== 'pago' && !isAtrasada(c)).reduce((acc, c) => acc + Number(c.valor_total_projetado || c.valor), 0),
      atrasados: list.filter(isAtrasada).reduce((acc, c) => acc + Number(c.valor_total_projetado || c.valor), 0)
    }
  }, [cobrancas])

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
  }

  return (
    <PullToRefresh onRefresh={async () => { await refetch() }}>
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20 w-full overflow-x-hidden">
        {/* Sticky Header Standard */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
          <div className="mx-auto w-full max-w-[640px] px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button 
                whileTap={{ scale: 0.9 }} 
                onClick={() => navigate('/home')}
                className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
              >
                <ArrowLeft className="h-4 w-4 text-slate-500" />
              </motion.button>
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">Gestão Financeira</h1>
                <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Controle de cobranças e recebimentos</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[640px] px-4 pt-6 space-y-6">
          {/* Header de Saldo - Design Nativo */}
          <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-2xl shadow-indigo-100 dark:shadow-none relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <Wallet size={140} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Saldo Total Recebido</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-bold opacity-60">R$</span>
                <h2 className="text-3xl font-black tracking-tighter truncate">
                  {totals.pagos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h2>
              </div>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-3 relative z-10">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 flex flex-col gap-2 border border-white/10 overflow-hidden min-w-0">
                <div className="h-9 w-9 rounded-xl bg-emerald-400/20 flex items-center justify-center shrink-0">
                  <ArrowDownCircle size={18} className="text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black opacity-60 uppercase tracking-widest truncate">Recebido</p>
                  <p className="font-black text-base truncate">R$ {totals.pagos.toFixed(0)}</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 flex flex-col gap-2 border border-white/10 overflow-hidden min-w-0">
                <div className="h-9 w-9 rounded-xl bg-amber-400/20 flex items-center justify-center shrink-0">
                   <AlertCircle size={18} className="text-amber-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black opacity-60 uppercase tracking-widest truncate">Pendente</p>
                  <p className="font-black text-base truncate">R$ {totals.pendentes.toFixed(0)}</p>
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

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'a_vencer', label: 'Em Aberto' },
                { id: 'pago', label: 'Pagos' },
                { id: 'atrasado', label: 'Vencidos' }
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setFiltroTab(chip.id as any)}
                  className={cn(
                    "whitespace-nowrap px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                    filtroTab === chip.id 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                      : "bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800"
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Cobranças Agrupadas (Lógica de Três Blocos) */}
          <div className="space-y-4">
            {!groupedList.current && groupedList.past.length === 0 && groupedList.future.length === 0 ? (
              <div className="text-center py-10 opacity-30 italic font-medium">Nenhum registro encontrado</div>
            ) : (
              <Accordion type="multiple" defaultValue={[currentMonthKey]} className="w-full space-y-4">
                
                {/* 1. MESES ANTERIORES */}
                {groupedList.past.length > 0 && (
                  <AccordionItem value="past-months" className="border-none bg-white dark:bg-slate-900 rounded-[24px] shadow-sm overflow-hidden opacity-80">
                    <AccordionTrigger className="hover:no-underline px-5 py-4 transition-colors">
                      <div className="flex items-center gap-3">
                        <History className="h-5 w-5 text-slate-400" />
                        <span className="font-bold text-slate-600">Ver meses anteriores</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 px-3 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
                      {groupedList.past.map((group) => (
                        <div key={group.key} className="space-y-3">
                          <div className="px-2 border-l-4 border-slate-200">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{group.label}</span>
                          </div>
                          {renderMobileGroup(group.items)}
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* 2. MÊS ATUAL */}
                {groupedList.current && (
                  <AccordionItem value={currentMonthKey} className="border-none bg-white dark:bg-slate-900 rounded-[28px] shadow-lg shadow-indigo-100/50 dark:shadow-none overflow-hidden border-2 border-indigo-50 dark:border-indigo-900/30">
                    <AccordionTrigger className="hover:no-underline px-5 py-5 transition-colors">
                      <div className="flex items-center gap-3 text-left w-full">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                          <Calendar className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 dark:text-white text-lg leading-none truncate">
                              {groupedList.current.label}
                            </span>
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest shrink-0">
                              MÊS ATUAL
                            </span>
                          </div>
                          <span className="font-black text-indigo-600 dark:text-indigo-400 text-lg mt-1">
                            {groupedList.current.items.reduce((acc, c) => acc + getValorExibicao(c), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-0 pb-6 px-3 bg-slate-50/50 dark:bg-slate-950/50">
                      {renderMobileGroup(groupedList.current.items)}
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* 3. MESES FUTUROS */}
                {groupedList.future.map((group) => (
                  <AccordionItem key={group.key} value={group.key} className="border-none bg-white dark:bg-slate-900 rounded-[24px] shadow-sm overflow-hidden">
                    <AccordionTrigger className="hover:no-underline px-5 py-4 transition-colors">
                      <div className="flex items-center justify-between w-full pr-2 text-left">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-black text-slate-900 dark:text-white text-base">{group.label}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {group.items.length} reg.
                          </span>
                        </div>
                        <span className="font-black text-indigo-600 dark:text-indigo-400">
                          {group.items.reduce((acc, c) => acc + getValorExibicao(c), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-0 pb-4 px-3 bg-slate-50/50 dark:bg-slate-950/50">
                      {renderMobileGroup(group.items)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </div>

        {/* FAB */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setSheetOpen(true)}
          className="fixed bottom-[17px] right-6 h-14 w-14 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-200/60 flex items-center justify-center text-white z-40 ring-4 ring-white dark:ring-slate-950"
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
        <BottomSheet isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalhes do Lançamento">
          {selectedCobranca && (
            <div className="px-1 pb-16 space-y-8">
              <div className="flex flex-col items-center justify-center p-10 bg-indigo-50/50 dark:bg-slate-900 rounded-[32px] space-y-3 border border-indigo-100/50">
                <p className="text-indigo-400 font-black uppercase tracking-[0.2em] text-[10px]">Total a Pagar</p>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                  {getValorExibicao(selectedCobranca).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h2>
                {extrairDiasProporcionais(selectedCobranca.descricao) && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                    Valor proporcional ({extrairDiasProporcionais(selectedCobranca.descricao)} dias)
                  </p>
                )}
                {isTaxaMatricula(selectedCobranca) && (
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-bold">
                    Taxa de matrícula
                  </p>
                )}
                {selectedCobranca.valor_multa_projetado > 0 && selectedCobranca.status !== 'pago' && (
                  <p className="text-xs text-rose-500 font-bold text-center mt-1">
                    + {Number(selectedCobranca.valor_multa_projetado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} Multa
                    {selectedCobranca.valor_juros_projetado > 0 && <><br />+ {Number(selectedCobranca.valor_juros_projetado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} Juros</>}
                  </p>
                )}
                <div className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 shadow-sm",
                  selectedCobranca.status === 'pago' ? "bg-emerald-500 text-white" :
                  selectedCobranca.status === 'atrasado' ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                )}>
                  {selectedCobranca.status === 'pago' ? 'RECEBIDO COMPLETAMENTE' : selectedCobranca.status === 'atrasado' ? 'VENCIDO / PENDENTE' : 'AGUARDANDO PAGAMENTO'}
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                      <LayoutGrid size={18} className="text-slate-400" />
                    </div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Descrição</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{selectedCobranca.descricao}</span>
                </div>

                <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                      <Calendar size={18} className="text-slate-400" />
                    </div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Vencimento</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {new Date(selectedCobranca.data_vencimento).toLocaleDateString('pt-BR', { dateStyle: 'long' })}
                  </span>
                </div>

                <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                      <User size={18} className="text-slate-400" />
                    </div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Vinculado a</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{selectedCobranca.alunos?.nome_completo || 'Lançamento Avulso'}</span>
                </div>

                {/* Tipo de Cobrança Detalhado */}
                <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center",
                      (() => {
                        const tipoVisual = detectarTipoCobranca(selectedCobranca)
                        if (tipoVisual === 'matricula') return 'bg-orange-50 text-orange-600'
                        if (tipoVisual === 'mensalidade_proporcional') return 'bg-emerald-50 text-emerald-600'
                        if (tipoVisual === 'mensalidade_cheia') return 'bg-blue-50 text-blue-600'
                        return 'bg-slate-50 text-slate-600'
                      })()
                    )}>
                      <Wallet size={18} />
                    </div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Tipo</span>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                      (() => {
                        const tipoVisual = detectarTipoCobranca(selectedCobranca)
                        if (tipoVisual === 'matricula') return 'bg-orange-50 text-orange-600'
                        if (tipoVisual === 'mensalidade_proporcional') return 'bg-emerald-50 text-emerald-600'
                        if (tipoVisual === 'mensalidade_cheia') return 'bg-blue-50 text-blue-600'
                        return 'bg-slate-100 text-slate-600'
                      })()
                    )}>
                      {(() => {
                        const tipoVisual = detectarTipoCobranca(selectedCobranca)
                        return getLabelTipoCobranca(tipoVisual)
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {selectedCobranca.status !== 'pago' ? (
                  <Button 
                    onClick={() => handleBaixar(selectedCobranca.id)}
                    className="w-full h-16 rounded-[24px] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-100"
                  >
                    CONFIRMAR RECEBIMENTO
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleEstornar(selectedCobranca.id)}
                    className="w-full h-16 rounded-[24px] bg-amber-500 text-white font-black uppercase text-sm tracking-widest shadow-xl shadow-amber-100"
                  >
                    ESTORNAR PAGAMENTO
                  </Button>
                )}
                
                <Button 
                  onClick={() => handleExcluir(selectedCobranca.id)}
                  variant="ghost"
                  className="w-full h-14 text-rose-500 font-black uppercase text-xs tracking-widest"
                >
                  EXCLUIR REGISTRO PERMANENTEMENTE
                </Button>
              </div>
            </div>
          )}
        </BottomSheet>
      </div>
    </PullToRefresh>
  )

  function renderMobileGroup(items: any[]) {
    return (
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {items.map((c: any, idx: number) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <NativeCard 
                swipeable={true}
                onDelete={() => handleExcluir(c.id)}
                onClick={() => { setSelectedCobranca(c); setDetailOpen(true); }}
                className="p-4"
              >
                <div className="flex items-start gap-3 w-full overflow-hidden">
                  <div className={cn(
                    "h-12 w-12 rounded-[16px] flex items-center justify-center shrink-0 shadow-sm transition-colors",
                    (() => {
                      const hoje = new Date(); hoje.setHours(12, 0, 0, 0)
                      const isVencida = (c.status === 'a_vencer' || c.status === 'atrasado') && new Date(c.data_vencimento + 'T12:00:00') < hoje
                      if (c.status === 'pago') return "bg-emerald-50 text-emerald-600"
                      if (isVencida) return "bg-rose-100 text-rose-700 animate-pulse"
                      return "bg-indigo-50 text-indigo-500"
                    })()
                  )}>
                    {(() => {
                      const hoje = new Date(); hoje.setHours(12, 0, 0, 0)
                      const isVencida = (c.status === 'a_vencer' || c.status === 'atrasado') && new Date(c.data_vencimento + 'T12:00:00') < hoje
                      if (c.status === 'pago') return <CheckCircle2 size={24} />
                      if (isVencida) return <AlertCircle size={24} />
                      return <Calendar size={24} />
                    })()}
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="font-black text-slate-900 dark:text-white leading-tight truncate text-sm">
                      {c.descricao}
                    </h3>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mt-0.5 truncate">
                      {c.alunos?.nome_completo || 'Avulso'}
                    </p>
                    <div className="mt-2">
                       <p className="font-black text-indigo-600 dark:text-indigo-400 text-base tracking-tighter leading-none">
                        {getValorExibicao(c).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col justify-start pt-1">
                    <div className={cn(
                      "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm",
                      c.status === 'pago' ? "bg-emerald-500 text-white" : 
                      (c.status === 'atrasado' || new Date(c.data_vencimento + 'T12:00:00') < new Date()) ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                    )}>
                      {c.status === 'pago' ? 'PAGO' : (c.status === 'atrasado' || new Date(c.data_vencimento + 'T12:00:00') < new Date()) ? 'VENCIDO' : 'ABERTO'}
                    </div>
                  </div>
                </div>
              </NativeCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    )
  }
}
