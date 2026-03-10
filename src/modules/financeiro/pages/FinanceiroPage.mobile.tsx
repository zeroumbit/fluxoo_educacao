import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, 
  Search, 
  Plus, 
  Filter, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  CheckCircle2, 
  History, 
  X, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  RotateCcw,
  Loader2,
  ArrowLeft,
  ChevronRight,
  HelpCircle,
  PiggyBank,
  ArrowUpRight,
  Receipt
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { useAuth } from '@/modules/auth/AuthContext'
import { 
  useCobrancas, 
  useCriarCobranca, 
  useAtualizarCobranca, 
  useMarcarComoPago, 
  useExcluirCobranca, 
  useDesfazerPagamento 
} from '../hooks'
import { useConfigFinanceira } from '../hooks-avancado'
import { useAlunos } from '@/modules/alunos/hooks'
import { useMatriculaAtivaDoAluno } from '@/modules/academico/hooks'
import { useTurmaDoAluno } from '@/modules/turmas/hooks'

// Components Mobile
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const cobrancaSchema = z.object({
  aluno_id: z.string().min(1, 'Selecione um aluno ou Avulso'),
  descricao: z.string().min(1, 'Descrição obrigatória'),
  valor: z.string().min(1, 'Valor obrigatório'),
  data_vencimento: z.string().min(1, 'Vencimento obrigatório'),
  status: z.enum(['a_vencer', 'pago', 'atrasado']).default('a_vencer'),
})

type CobrancaFormValues = z.infer<typeof cobrancaSchema>

type Tab = 'todos' | 'a_vencer' | 'atrasado' | 'pago'

export function FinanceiroPageMobile() {
  const { authUser } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [detalheOpen, setDetalheOpen] = useState(false)
  const [selectedCobranca, setSelectedCobranca] = useState<any | null>(null)
  const [editando, setEditando] = useState<any | null>(null)

  const { data: cobrancas, isLoading, refetch } = useCobrancas(activeTab === 'todos' ? undefined : activeTab)
  const { data: alunos } = useAlunos()
  const { data: configFin } = useConfigFinanceira()
  
  const criar = useCriarCobranca()
  const atualizar = useAtualizarCobranca()
  const marcarPago = useMarcarComoPago()
  const excluir = useExcluirCobranca()
  const desfazer = useDesfazerPagamento()

  const { register, handleSubmit, setValue, watch, reset, control, formState: { errors, isSubmitting } } = useForm<CobrancaFormValues>({
    resolver: zodResolver(cobrancaSchema),
  })

  // Watchers for visual feedback and auto-fill
  const formAlunoId = watch('aluno_id')
  const { data: matriculaAtiva } = useMatriculaAtivaDoAluno(formAlunoId || '')
  const { data: turmaDoAluno } = useTurmaDoAluno(formAlunoId || '')

  useEffect(() => {
    if (formOpen && !editando && matriculaAtiva && configFin && formAlunoId && formAlunoId !== 'avulso') {
      const hoje = new Date()
      let mes = hoje.getMonth() + 1
      let ano = hoje.getFullYear()
      
      if (hoje.getDate() > (configFin.dia_vencimento_padrao || 10)) {
        mes++
        if (mes > 12) { mes = 1; ano++ }
      }

      const dataSugerida = `${ano}-${String(mes).padStart(2, '0')}-${String(configFin.dia_vencimento_padrao || 10).padStart(2, '0')}`
      setValue('data_vencimento', dataSugerida)
      setValue('valor', String(matriculaAtiva.valor_matricula || '0'))
      setValue('descricao', `Mensalidade ${mes}/${ano} - ${turmaDoAluno?.nome || ''}`)
    }
  }, [formOpen, editando, matriculaAtiva, configFin, formAlunoId, turmaDoAluno, setValue])

  const stats = useMemo(() => {
    if (!cobrancas) return { total: 0, vencido: 0, abertas: 0 }
    return {
      total: cobrancas.filter(c => c.status !== 'pago').reduce((acc, c) => acc + Number(c.valor), 0),
      vencido: cobrancas.filter(c => c.status === 'atrasado').reduce((acc, c) => acc + Number(c.valor), 0),
      abertas: cobrancas.filter(c => c.status === 'a_vencer' || c.status === 'atrasado').length,
    }
  }, [cobrancas])

  const filteredCobrancas = useMemo(() => {
    if (!cobrancas) return []
    return cobrancas.filter(c => 
      ((c as any).alunos?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.descricao?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [cobrancas, searchTerm])

  const abrirNovo = () => {
    setEditando(null)
    reset({
      aluno_id: '',
      descricao: '',
      valor: '',
      data_vencimento: new Date().toISOString().split('T')[0],
      status: 'a_vencer'
    })
    setFormOpen(true)
  }

  const abrirEdicao = (cobranca: any) => {
    setEditando(cobranca)
    reset({
      aluno_id: cobranca.aluno_id || 'avulso',
      descricao: cobranca.descricao,
      valor: String(cobranca.valor),
      data_vencimento: cobranca.data_vencimento,
      status: cobranca.status
    })
    setFormOpen(true)
  }

  const onSubmit = async (data: CobrancaFormValues) => {
    if (!authUser) return
    try {
      const payload = {
        ...data,
        tenant_id: authUser.tenantId,
        valor: Number(data.valor.replace(',', '.')),
        aluno_id: data.aluno_id === 'avulso' ? null : data.aluno_id
      }

      if (editando) {
        await atualizar.mutateAsync({ id: editando.id, cobranca: payload })
        toast.success('Cobrança atualizada!')
      } else {
        await criar.mutateAsync(payload)
        toast.success('Cobrança criada!')
      }
      setFormOpen(false)
      refetch()
    } catch {
      toast.error('Erro ao salvar cobrança')
    }
  }

  const handleMarcarComoPago = async (id: string) => {
    try {
      await marcarPago.mutateAsync(id)
      toast.success('Pagamento processado!')
      refetch()
    } catch {
      toast.error('Erro ao processar baixa')
    }
  }

  const handleDesfazerPagamento = async (id: string) => {
    try {
      await desfazer.mutateAsync(id)
      toast.success('Pagamento desfeito!')
      refetch()
    } catch {
      toast.error('Erro ao desfazer')
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta cobrança?')) return
    try {
      await excluir.mutateAsync(id)
      toast.success('Cobrança removida')
      refetch()
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const handleRefresh = async () => {
    await refetch()
  }

  return (
    <MobilePageLayout
      title="Gestão Financeira"
      leftAction={
        <button onClick={() => window.history.back()} className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </button>
      }
      rightActions={
        <button onClick={() => setHelpOpen(true)} className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
          <HelpCircle className="h-5 w-5 text-indigo-500" />
        </button>
      }
    >
      {/* Premium Stats Header - Now with 3 info items matching Web colors */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar mb-6 pt-4 -mx-4 px-4">
        <div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-100 dark:shadow-none min-w-[200px] relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1.5">
              <PiggyBank className="h-4 w-4 opacity-70" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none">A RECEBER</span>
            </div>
            <div className="text-2xl font-black leading-none">
              R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[9px] font-bold opacity-60 mt-2">Saldo previsto no mês</p>
          </div>
          <TrendingUp className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 rotate-12" />
        </div>

        <div className="bg-rose-500 p-6 rounded-[32px] text-white shadow-xl shadow-rose-100 dark:shadow-none min-w-[200px] relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertCircle className="h-4 w-4 opacity-70" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none">EM ATRASO</span>
            </div>
            <div className="text-2xl font-black leading-none">
              R$ {stats.vencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[9px] font-bold opacity-60 mt-2">Pagamentos pendentes</p>
          </div>
          <AlertCircle className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 rotate-12" />
        </div>

        <div className="bg-emerald-500 p-6 rounded-[32px] text-white shadow-xl shadow-emerald-100 dark:shadow-none min-w-[200px] relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1.5">
              <CheckCircle2 className="h-4 w-4 opacity-70" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none">ABERTAS</span>
            </div>
            <div className="text-2xl font-black leading-none">
              {stats.abertas} <span className="text-xs font-bold opacity-70 uppercase ml-1">unidades</span>
            </div>
            <p className="text-[9px] font-bold opacity-60 mt-2">Total de boletos ativos</p>
          </div>
          <Receipt className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 rotate-12" />
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar por aluno ou descrição..." 
            className="h-14 rounded-2xl bg-white dark:bg-slate-900 border-none shadow-sm pl-12 text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
          {(['todos', 'a_vencer', 'atrasado', 'pago'] as Tab[]).map(tab => (
            <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={cn(
                 "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap px-4",
                 activeTab === tab ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-400"
               )}
            >
              {tab === 'todos' ? 'Tudo' : tab === 'a_vencer' ? 'Abertos' : tab === 'atrasado' ? 'Atrasados' : 'Pagos'}
            </button>
          ))}
        </div>
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-4 pb-32">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-4 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest leading-none">Processando fluxo...</p>
            </div>
          ) : filteredCobrancas.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {filteredCobrancas.map((cob, idx) => (
                <motion.div
                  key={cob.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => {
                    setSelectedCobranca(cob)
                    setDetalheOpen(true)
                  }}
                >
                  <NativeCard className="p-0 overflow-hidden border-none shadow-sm dark:bg-slate-900 active:bg-slate-50 dark:active:bg-slate-800 transition-colors cursor-pointer">
                    <div className="p-5">
                      {/* Top Row: Info Header */}
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                           <Badge className={cn(
                             "text-[8px] font-black uppercase px-2 py-0.5 border-none rounded-md",
                             cob.status === 'atrasado' ? "bg-rose-100 text-rose-600" :
                             cob.status === 'pago' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                           )}>
                             {cob.status === 'a_vencer' ? 'Em Aberto' : cob.status === 'atrasado' ? 'Atrasado' : 'Liquidado'}
                           </Badge>
                           <span className="text-[9px] font-black text-slate-300 tracking-widest uppercase">#{cob.id.split('-')[0]}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(cob.data_vencimento), 'dd/MM/yyyy')}
                        </div>
                      </div>

                      {/* Middle Row: Main Data */}
                      <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight line-clamp-2">
                              {(cob as any).alunos?.nome_completo || 'Cobrança Avulsa / Externo'}
                            </h3>
                            <p className="text-[11px] font-medium text-slate-500 mt-1.5 leading-tight italic">
                              {cob.descricao}
                            </p>
                          </div>
                         <div className="text-right shrink-0">
                            <div className={cn(
                               "text-xl font-black tracking-tight leading-none",
                               cob.status === 'atrasado' ? "text-rose-600" : 
                               cob.status === 'pago' ? "text-emerald-600" : "text-slate-900 dark:text-white"
                            )}>
                               R$ {Number(cob.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                         </div>
                      </div>

                      {/* Status indicator for Atrasados */}
                      {cob.status === 'atrasado' && (
                        <div className="mt-3 py-2 px-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100/50 dark:border-rose-500/20 flex items-center justify-between">
                           <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Cobrança Expirada</span>
                           <AlertCircle className="h-4 w-4 text-rose-500 animate-pulse" />
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="px-5 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-50 dark:border-slate-800/50 flex justify-between items-center">
                       <div className="flex gap-2">
                          {cob.status !== 'pago' ? (
                            <Button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarcarComoPago(cob.id);
                              }}
                              className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-emerald-100 dark:shadow-none"
                            >
                              MARCAR COMO PAGO
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => handleDesfazerPagamento(cob.id)}
                              variant="outline"
                              className="h-10 px-4 border-slate-200 text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                            >
                              DESFAZER BAIXA
                            </Button>
                          )}
                       </div>

                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <button className="h-9 w-9 flex items-center justify-center text-slate-400">
                             <MoreVertical className="h-5 w-5" />
                           </button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="rounded-2xl w-44">
                            <DropdownMenuItem onClick={() => abrirEdicao(cob)} className="gap-3 py-3">
                               <Pencil className="h-4 w-4 text-blue-500" />
                               <span className="font-bold">Editar Dados</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExcluir(cob.id)} className="gap-3 py-3 text-rose-600">
                               <Trash2 className="h-4 w-4" />
                               <span className="font-bold">Excluir</span>
                            </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                  </NativeCard>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="py-20 text-center px-10">
              <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                <CreditCard className="h-10 w-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Nada por aqui</h3>
              <p className="text-slate-500 text-sm mt-2">Nenhuma cobrança registrada neste período ou filtro.</p>
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={abrirNovo}
        className="fixed bottom-24 right-6 h-16 w-16 rounded-[24px] bg-indigo-600 text-white shadow-2xl shadow-indigo-100 dark:shadow-none flex items-center justify-center z-50 transition-all active:scale-95"
      >
        <Plus className="h-8 w-8" />
      </motion.button>

      {/* Form BottomSheet */}
      <BottomSheet
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editando ? "Editar Cobrança" : "Nova Cobrança"}
        size="full"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2 pb-12">
          <div className="space-y-6">
            <div className="bg-emerald-50 dark:bg-emerald-500/10 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-500/20 flex gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-100">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-100 leading-tight">Gestão de Receitas</h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-1 leading-relaxed">Registre cobranças avulsas ou vincule a alunos para o portal dos pais.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vincular a</Label>
              <Select value={formAlunoId} onValueChange={(v) => setValue('aluno_id', v)}>
                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none font-bold text-base px-5">
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-[300px]">
                  <SelectItem value="avulso" className="font-bold py-3">Cobrança Avulsa (Sem Aluno)</SelectItem>
                  {alunos?.map(aluno => (
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
                className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-5 text-base font-bold shadow-sm"
                placeholder="Ex: Mensalidade Março"
              />
              {errors.descricao && <p className="text-[10px] text-rose-500 font-bold ml-2">{errors.descricao.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Valor (R$)</Label>
                <Input 
                  {...register('valor')}
                  type="text"
                  className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-5 text-base font-black text-indigo-600 shadow-sm"
                  placeholder="0,00"
                />
                {errors.valor && <p className="text-[10px] text-rose-500 font-bold ml-2">{errors.valor.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vencimento</Label>
                <Input 
                  {...register('data_vencimento')}
                  type="date"
                  className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-5 text-base font-bold shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Status Inicial</Label>
              <Select value={watch('status')} onValueChange={(v: any) => setValue('status', v)}>
                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none font-bold text-base px-5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="a_vencer" className="font-bold py-3 text-slate-600 italic">Em Aberto</SelectItem>
                  <SelectItem value="pago" className="font-bold py-3 text-emerald-600">Já Recebido (Baixa Imediata)</SelectItem>
                  <SelectItem value="atrasado" className="font-bold py-3 text-rose-600">Considerar Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-8">
            <Button 
               type="submit" 
               disabled={isSubmitting}
               className="w-full h-16 rounded-[24px] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (editando ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR COBRANÇA')}
            </Button>
            <Button 
               type="button" 
               variant="ghost" 
               onClick={() => setFormOpen(false)}
               className="w-full h-12 mt-2 font-bold text-slate-400"
            >
               FECHAR
            </Button>
          </div>
        </form>
      </BottomSheet>

      {/* Detail BottomSheet (Nova Visualização de Detalhes) */}
      <BottomSheet
        isOpen={detalheOpen}
        onClose={() => setDetalheOpen(false)}
        title="Detalhes da Cobrança"
        size="full"
      >
        {selectedCobranca && (
          <div className="space-y-8 pt-4 pb-20">
            {/* Header Detail */}
            <div className="flex flex-col items-center text-center space-y-3">
               <div className={cn(
                 "h-20 w-20 rounded-[32px] flex items-center justify-center shadow-lg",
                 selectedCobranca.status === 'atrasado' ? "bg-rose-500 text-white shadow-rose-100" :
                 selectedCobranca.status === 'pago' ? "bg-emerald-500 text-white shadow-emerald-100" : "bg-slate-900 text-white shadow-slate-100"
               )}>
                 <Receipt className="h-10 w-10" />
               </div>
               <div>
                 <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                    R$ {Number(selectedCobranca.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </h2>
                 <Badge className={cn(
                    "mt-3 text-[10px] font-black uppercase px-4 py-1 border-none rounded-full tracking-widest",
                    selectedCobranca.status === 'atrasado' ? "bg-rose-100 text-rose-600" :
                    selectedCobranca.status === 'pago' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                 )}>
                    {selectedCobranca.status === 'a_vencer' ? 'Aguardando Pagamento' : selectedCobranca.status === 'atrasado' ? 'Pagamento Atrasado' : 'Cobrança Liquidada'}
                 </Badge>
               </div>
            </div>

            {/* List Detail */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 space-y-6">
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Aluno / Benemérito</p>
                  <p className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{(selectedCobranca as any).alunos?.nome_completo || 'Cobrança Avulsa'}</p>
               </div>

               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Vencimento</p>
                    <p className="font-bold text-slate-900 dark:text-white">{format(new Date(selectedCobranca.data_vencimento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Referência ID</p>
                    <p className="font-mono text-xs font-bold text-slate-500">{selectedCobranca.id}</p>
                  </div>
               </div>

               <div className="space-y-1 border-t border-slate-50 dark:border-slate-800 pt-6">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Descrição da Operação</p>
                  <p className="font-medium text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                    {selectedCobranca.descricao}
                  </p>
               </div>
            </div>

            {/* Actions in Detail */}
            <div className="grid grid-cols-2 gap-4">
               {selectedCobranca.status !== 'pago' ? (
                 <Button 
                   onClick={() => { handleMarcarComoPago(selectedCobranca.id); setDetalheOpen(false); }}
                   className="h-16 rounded-[24px] bg-emerald-600 text-white font-black uppercase tracking-widest shadow-xl shadow-emerald-100"
                 >
                   CONFIRMAR PAGAMENTO
                 </Button>
               ) : (
                 <Button 
                   onClick={() => { handleDesfazerPagamento(selectedCobranca.id); setDetalheOpen(false); }}
                   variant="outline"
                   className="h-16 rounded-[24px] border-slate-200 text-slate-500 font-bold uppercase"
                 >
                   DESFAZER
                 </Button>
               )}
               <Button 
                 onClick={() => { setDetalheOpen(false); abrirEdicao(selectedCobranca); }}
                 className="h-16 rounded-[24px] bg-slate-900 text-white font-black uppercase tracking-widest"
               >
                 EDITAR DADOS
               </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Info BottomSheet */}
      <BottomSheet
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Ajuda e Informações"
      >
        <div className="space-y-6 pt-2 pb-12">
          <div className="bg-indigo-50 dark:bg-indigo-500/10 p-6 rounded-[32px] border border-indigo-100 dark:border-indigo-500/20">
             <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-100 uppercase tracking-widest mb-3">Financeiro Inteligente</h4>
             <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed font-medium">
               O módulo financeiro do Fluxoo permite que você tenha controle total sobre as mensalidades e taxas extras de seus alunos.
             </p>
          </div>

          <div className="space-y-4">
             <div className="flex gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl transition-colors">
                <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                   <ArrowUpRight className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">Automação de Baixas</h5>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">Ao clicar em "Baixar Pagamento", o saldo é atualizado em tempo real e o responsável recebe a confirmação no portal.</p>
                </div>
             </div>

             <div className="flex gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl transition-colors">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                   <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">Gestão de Vencidos</h5>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">O sistema identifica automaticamente cobranças vencidas e altera o status para Vermelho para facilitar sua cobrança ativa.</p>
                </div>
             </div>

             <div className="flex gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl transition-colors">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                   <History className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">Auditabilidade</h5>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">Você pode desfazer uma baixa a qualquer momento se o pagamento tiver sido registrado por erro.</p>
                </div>
             </div>
          </div>

          <Button 
            onClick={() => setHelpOpen(false)}
            className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold mt-4"
          >
            ENTENDI
          </Button>
        </div>
      </BottomSheet>
    </MobilePageLayout>
  )
}
