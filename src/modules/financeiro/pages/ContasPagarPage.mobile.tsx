import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Loader2, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Trash2, 
  Edit2, 
  AlertCircle, 
  ArrowLeft,
  Filter,
  Wallet,
  ArrowUpCircle,
  Receipt,
  Repeat,
  ChevronRight,
  Sparkles
} from 'lucide-react'

import { useAuth } from '@/modules/auth/AuthContext'
import { usePermissions } from '@/providers/RBACProvider'
import { useContasPagar, useCriarContaPagar, useAtualizarContaPagar, useDeletarContaPagar } from '../hooks-avancado'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  favorecido: z.string().optional(),
  data_vencimento: z.string().min(1, 'Vencimento obrigatório'),
  valor: z.coerce.number().min(0.01, 'Valor inválido'),
  recorrente: z.boolean().default(false),
})

type ContasPagarFormValues = z.infer<typeof schema>

export function ContasPagarPageMobile() {
  const { authUser } = useAuth()
  const { data: contas, isLoading, refetch } = useContasPagar()
  const criar = useCriarContaPagar()
  const atualizar = useAtualizarContaPagar()
  const deletar = useDeletarContaPagar()

  const { hasPermission } = usePermissions()
  const canCreate = hasPermission('financeiro.contas_pagar.create')
  const canEdit = hasPermission('financeiro.contas_pagar.edit')
  const canPay = hasPermission('financeiro.contas_pagar.pay')

  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedConta, setSelectedConta] = useState<any | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'pendente' | 'pago'>('todos')

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<ContasPagarFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { recorrente: false }
  })

  const isRecorrente = watch('recorrente')

  const abrirNovo = () => {
    setEditMode(false)
    setSelectedConta(null)
    reset({ nome: '', favorecido: '', data_vencimento: '', valor: 0, recorrente: false })
    setFormOpen(true)
  }

  const abrirEdicao = (conta: any) => {
    setEditMode(true)
    setSelectedConta(conta)
    reset({
      nome: conta.nome,
      favorecido: conta.favorecido || '',
      data_vencimento: conta.data_vencimento,
      valor: conta.valor,
      recorrente: !!conta.recorrente
    })
    setFormOpen(true)
  }

  const onSubmit = async (data: ContasPagarFormValues) => {
    if (!authUser) return
    try {
      if (editMode && selectedConta) {
        await atualizar.mutateAsync({ id: selectedConta.id, updates: data })
        toast.success('Despesa atualizada!')
      } else {
        await criar.mutateAsync({ ...data, tenant_id: authUser.tenantId })
        toast.success('Despesa registrada!')
      }
      setFormOpen(false)
      refetch()
    } catch {
      toast.error('Erro ao salvar despesa')
    }
  }

  const handlePagar = async (id: string) => {
    try {
      await atualizar.mutateAsync({ id, updates: { status: 'pago' } })
      toast.success('Pagamento confirmado!')
      setDetailOpen(false)
      refetch()
    } catch {
      toast.error('Erro ao registrar pagamento')
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Excluir esta despesa permanentemente?')) return
    try {
      await deletar.mutateAsync(id)
      toast.success('Despesa removida')
      setDetailOpen(false)
      refetch()
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const filteredContas = useMemo(() => {
    if (!contas) return []
    return (contas as any[]).filter(c => {
      const matchStatus = filtro === 'todos' || c.status === filtro
      const matchBusca = c.nome.toLowerCase().includes(busca.toLowerCase()) || 
                         (c.favorecido || '').toLowerCase().includes(busca.toLowerCase())
      return matchStatus && matchBusca
    })
  }, [contas, filtro, busca])

  const volumes = useMemo(() => {
    if (!contas) return { total: 0, pendente: 0, pago: 0 }
    const list = contas as any[]
    return {
      total: list.reduce((acc, c) => acc + Number(c.valor), 0),
      pendente: list.filter(c => c.status !== 'pago').reduce((acc, c) => acc + Number(c.valor), 0),
      pago: list.filter(c => c.status === 'pago').reduce((acc, c) => acc + Number(c.valor), 0),
    }
  }, [contas])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-950 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-xs font-black uppercase tracking-widest">Sincronizando Despesas...</p>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={async () => { await refetch() }}>
      <MobilePageLayout
        title="Contas a Pagar"
        leftAction={
          <button onClick={() => window.history.back()} className="h-10 w-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </button>
        }
      >
        <div className="space-y-6 pb-20">
          {/* Dashboard de Despesas */}
          <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
               <Receipt size={140} />
            </div>
            
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 opacity-80">Total em Aberto</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-bold opacity-40">R$</span>
                <h2 className="text-4xl font-black tracking-tighter">
                  {volumes.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h2>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 relative z-10">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                   <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Vencimento Hoje</p>
                   <p className="text-base font-black">R$ {volumes.pendente.toFixed(0)}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                   <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Pago</p>
                   <p className="text-base font-black text-emerald-400">R$ {volumes.pago.toFixed(0)}</p>
                </div>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar despesa ou fornecedor..." 
                className="h-14 rounded-2xl bg-white dark:bg-slate-900 border-none shadow-sm pl-12 text-sm font-bold w-full"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'todos', label: 'Tudo' },
                { id: 'pendente', label: 'Pendentes' },
                { id: 'pago', label: 'Pagas' }
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setFiltro(chip.id as any)}
                  className={cn(
                    "whitespace-nowrap px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                    filtro === chip.id 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                      : "bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800"
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Contas */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredContas.map((c: any, idx) => (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <NativeCard 
                    swipeable={true}
                    onDelete={canEdit ? () => handleExcluir(c.id) : undefined}
                    onEdit={canEdit ? () => abrirEdicao(c) : undefined}
                    onClick={() => { setSelectedConta(c); setDetailOpen(true); }}
                    className="p-5"
                  >
                    <div className="flex items-start gap-4 w-full overflow-hidden">
                      <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                        c.status === 'pago' ? "bg-emerald-50 text-emerald-600" : 
                        "bg-slate-50 text-rose-500"
                      )}>
                        {c.status === 'pago' ? <CheckCircle2 size={28} /> : 
                         c.recorrente ? <Repeat size={28} /> : <AlertCircle size={28} />}
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className="font-black text-slate-900 dark:text-white leading-tight truncate text-base">
                          {c.nome}
                        </h3>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mt-1 truncate">
                          {c.favorecido || 'Despesa Geral'}
                        </p>
                        <div className="mt-3 flex items-center gap-1.5">
                           <span className="text-[10px] font-black text-slate-300 uppercase shrink-0">Vence em:</span>
                           <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase">
                             {new Date(c.data_vencimento).toLocaleDateString('pt-BR')}
                           </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right pl-3">
                         <p className="font-black text-slate-900 dark:text-white text-base">
                            R$ {Number(c.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                         </p>
                         <div className={cn(
                          "inline-flex px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest mt-1.5 shadow-sm",
                          c.status === 'pago' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                        )}>
                          {c.status === 'pago' ? 'LIQUIDADO' : 'PENDENTE'}
                        </div>
                      </div>
                    </div>
                  </NativeCard>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredContas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 opacity-20">
                 <Wallet size={48} />
                 <p className="text-xs font-black uppercase tracking-widest mt-4">Nenhuma despesa encontrada</p>
              </div>
            )}
          </div>
        </div>

        {/* FAB para Nova Despesa */}
        {canCreate && (
          <motion.button
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            whileTap={{ scale: 0.8 }}
            onClick={abrirNovo}
            className="fixed bottom-28 right-6 h-18 w-18 rounded-[24px] bg-slate-900 shadow-2xl text-white z-40 flex items-center justify-center border-4 border-white dark:border-slate-950"
          >
            <Plus className="h-8 w-8 text-indigo-400" strokeWidth={3} />
          </motion.button>
        )}

        {/* Form BottomSheet */}
        <BottomSheet isOpen={formOpen} onClose={() => setFormOpen(false)} title={editMode ? "Editar Despesa" : "Nova Despesa"}>
          <form onSubmit={handleSubmit(onSubmit)} className="px-1 pb-16 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">O que é? (Nome da Conta)</Label>
              <Input 
                {...register('nome')}
                className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-5 text-base font-bold w-full"
                placeholder="Ex: Aluguel da Sede"
              />
              {errors.nome && <p className="text-[10px] text-rose-500 font-bold ml-2">{errors.nome.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Fornecedor / Favorecido</Label>
              <Input 
                {...register('favorecido')}
                className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-5 text-base font-bold w-full"
                placeholder="Ex: Imobiliária Silva"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Valor (R$)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  {...register('valor')}
                  className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-5 text-base font-bold w-full"
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vencimento</Label>
                <Input 
                  type="date"
                  {...register('data_vencimento')}
                  className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-5 text-base font-bold w-full"
                />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <Repeat className={cn("h-5 w-5", isRecorrente ? "text-indigo-600" : "text-slate-300")} />
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">Despesa Recorrente</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Repetir todo mês?</p>
                  </div>
               </div>
               <Switch checked={isRecorrente} onCheckedChange={(v) => setValue('recorrente', v)} />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-16 rounded-[24px] bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-sm tracking-widest shadow-xl"
            >
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : editMode ? 'ATUALIZAR' : 'REGISTRAR DESPESA'}
            </Button>
          </form>
        </BottomSheet>

        {/* Details BottomSheet */}
        <BottomSheet isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalhes da despesa">
          {selectedConta && (
            <div className="px-1 pb-16 space-y-8">
              <div className="flex flex-col items-center justify-center p-10 bg-slate-900 rounded-[32px] text-white space-y-3 shadow-2xl relative overflow-hidden">
                <Sparkles className="absolute top-0 right-0 p-8 opacity-10 rotate-12 h-32 w-32" />
                <p className="text-indigo-300 font-black uppercase tracking-[0.2em] text-[10px] relative z-10">Valor a Pagar</p>
                <h2 className="text-4xl font-black tracking-tighter relative z-10">
                  {Number(selectedConta.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h2>
                <div className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 relative z-10",
                  selectedConta.status === 'pago' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                )}>
                  {selectedConta.status === 'pago' ? 'LIQUIDADO' : 'PENDENTE DE PAGAMENTO'}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Descrição</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{selectedConta.nome}</span>
                </div>
                <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Vencimento</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {new Date(selectedConta.data_vencimento).toLocaleDateString('pt-BR', { dateStyle: 'long' })}
                  </span>
                </div>
                <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Fornecedor</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{selectedConta.favorecido || 'Não informado'}</span>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                {canPay && selectedConta.status !== 'pago' && (
                  <Button 
                    onClick={() => handlePagar(selectedConta.id)}
                    className="w-full h-16 rounded-[24px] bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-sm tracking-widest shadow-xl shadow-emerald-100"
                  >
                    CONFIRMAR PAGAMENTO
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {canEdit && (
                    <Button 
                      onClick={() => { setDetailOpen(false); abrirEdicao(selectedConta); }}
                      variant="outline"
                      className="h-14 rounded-2xl border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-widest"
                    >
                      <Edit2 className="h-4 w-4 mr-2" /> EDITAR
                    </Button>
                  )}
                  {canEdit && (
                    <Button 
                      onClick={() => handleExcluir(selectedConta.id)}
                      variant="outline"
                      className="h-14 rounded-2xl border-rose-100 text-rose-500 font-black uppercase text-[10px] tracking-widest"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> EXCLUIR
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </BottomSheet>
      </MobilePageLayout>
    </PullToRefresh>
  )
}
