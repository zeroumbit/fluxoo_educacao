import { useState } from 'react'
import { useAuth } from '@/modules/auth/AuthContext'
import { useEscola, useSolicitacoesUpgrade, useCriarSolicitacaoUpgrade, useAssinaturaAtiva } from '../hooks'
import { 
  CreditCard, 
  ArrowUpCircle, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Trophy,
  Plus,
  ArrowLeft,
  Sparkles,
  Zap,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn, formatCurrency } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function PlanoPageMobile() {
  const { authUser } = useAuth()
  const { data: escola, isLoading: loadingEscola, refetch: refetchEscola } = useEscola()
  const { data: assinatura, isLoading: loadingAssinatura, refetch: refetchAssinatura } = useAssinaturaAtiva()
  const { data: solicitacoes, refetch: refetchSolicitacoes } = useSolicitacoesUpgrade()
  const criarUpgrade = useCriarSolicitacaoUpgrade()

  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [novoLimite, setNovoLimite] = useState<number>(0)

  const activePlan = (assinatura as any)?.plano || (escola as any)?.plano
  const currentLimit = Number((assinatura as any)?.limite_alunos_contratado || (escola as any)?.limite_alunos_contratado || 0)
  const valorUnitario = Number((assinatura as any)?.valor_por_aluno_contratado || (activePlan ? activePlan.valor_por_aluno : 0))
  const totalMensal = Number((assinatura as any)?.valor_total_contratado || (currentLimit * valorUnitario))
  const dataReferencia = (assinatura as any)?.data_inicio || (escola as any)?.data_inicio || (escola as any)?.created_at

  const handleRequestUpgrade = async () => {
    if (novoLimite <= currentLimit) {
      toast.error('O novo limite deve ser maior que o atual.')
      return
    }

    try {
      await criarUpgrade.mutateAsync({
        tenant_id: authUser!.tenantId,
        limite_atual: currentLimit,
        limite_solicitado: novoLimite,
        valor_atual: totalMensal,
        valor_proposto: novoLimite * valorUnitario,
        status: 'pendente'
      })
      toast.success('Solicitação enviada!')
      setUpgradeOpen(false)
      setNovoLimite(0)
    } catch {
      toast.error('Erro ao enviar solicitação.')
    }
  }

  if (loadingEscola || loadingAssinatura || (!escola && !assinatura)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-950 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando Plano...</p>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={async () => { await Promise.all([refetchEscola(), refetchAssinatura(), refetchSolicitacoes()]) }}>
      <MobilePageLayout
        title="Meu Plano"
        leftAction={
          <button onClick={() => window.history.back()} className="h-10 w-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </button>
        }
      >
        <div className="space-y-6 pb-20 pt-2">
            {/* Plan Hero Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                <Sparkles className="absolute -top-4 -right-4 h-40 w-40 opacity-10 text-indigo-400" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 w-fit">
                        <Trophy size={14} className="text-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">
                            {(escola as any)?.status_assinatura || 'Assinatura Ativa'}
                        </span>
                    </div>
                    
                    <h2 className="text-3xl font-black tracking-tighter mt-4 leading-none">
                        {activePlan?.nome || 'Plano Personalizado'}
                    </h2>
                    <p className="text-xs text-indigo-200/60 font-medium mt-2">
                        Desde {dataReferencia ? format(new Date(dataReferencia), "dd 'de' MMMM", { locale: ptBR }) : '—'}
                    </p>

                    <div className="mt-10 grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
                        <div>
                            <p className="text-[9px] font-black text-indigo-300/50 uppercase tracking-[0.2em] mb-1">Capacidade</p>
                            <p className="text-xl font-black">{currentLimit} <span className="text-sm font-medium text-indigo-300/40 ml-1">vagas</span></p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-indigo-300/50 uppercase tracking-[0.2em] mb-1">Total Mensal</p>
                            <p className="text-xl font-black text-indigo-400">{formatCurrency(totalMensal)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upgrade CTA Card */}
            <NativeCard className="p-0 overflow-hidden border-none shadow-xl shadow-indigo-100 dark:shadow-none bg-indigo-600">
                <div className="p-6 flex items-center justify-between text-white relative">
                    <Zap className="absolute -left-4 -top-4 h-24 w-24 opacity-20 text-indigo-400" />
                    <div className="relative z-10 flex-1">
                        <h3 className="text-lg font-black tracking-tight leading-none">Precisa de mais espaço?</h3>
                        <p className="text-xs text-indigo-100/70 font-bold uppercase tracking-tighter mt-2">Expanda seus limites agora</p>
                    </div>
                    <button 
                        onClick={() => setUpgradeOpen(true)}
                        className="relative z-10 h-14 px-6 bg-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all group"
                    >
                        <Plus size={24} className="text-indigo-600 group-hover:rotate-90 transition-transform" />
                    </button>
                </div>
            </NativeCard>

            {/* Quick Details List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dados de Faturamento</h3>
                    <CreditCard size={14} className="text-slate-300" />
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm divide-y dark:divide-slate-800 overflow-hidden">
                    <div className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                                <TrendingUp size={18} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Valor por Aluno</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white mt-1.5">{formatCurrency(valorUnitario)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-5 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                                <CreditCard size={18} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Forma de Pagamento</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white mt-1.5 capitalize">
                                    {(escola as any)?.metodo_pagamento?.replace('_', ' ') || 'Processamento Manual'}
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-300" />
                    </div>
                </div>
            </div>

            {/* History Section */}
            <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Solicitações de Mudança</h3>
                    <Clock size={14} className="text-slate-300" />
                </div>

                <div className="space-y-3">
                   {solicitacoes?.map((sol: any, idx) => (
                      <NativeCard key={idx} className="p-5">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-12 w-12 rounded-2xl flex flex-col items-center justify-center border",
                                    sol.status === 'aprovado' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                    sol.status === 'pendente' ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-slate-50 border-slate-100 text-slate-400"
                                )}>
                                    {sol.status === 'aprovado' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                                </div>
                                <div className="max-w-[160px]">
                                    <h4 className="font-black text-slate-900 dark:text-white text-sm">
                                        + {sol.limite_solicitado - sol.limite_atual} vagas
                                    </h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1 truncate">
                                        Expansão solicitada em {format(new Date(sol.created_at), "dd/MM")}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <span className={cn(
                                    "text-[9px] font-black uppercase px-2 py-1 rounded-lg",
                                    sol.status === 'aprovado' ? "bg-emerald-100 text-emerald-700" :
                                    sol.status === 'pendente' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                                )}>
                                    {sol.status}
                                </span>
                                <p className="text-xs font-black text-slate-500 mt-2">{formatCurrency(sol.valor_proposto)}</p>
                            </div>
                         </div>
                      </NativeCard>
                   ))}
                   {(!solicitacoes || solicitacoes.length === 0) && (
                      <div className="text-center py-12 text-slate-300">
                         <Clock size={32} className="mx-auto mb-3 opacity-20" />
                         <p className="text-[10px] font-black uppercase tracking-widest">Sem solicitações recentes</p>
                      </div>
                   )}
                </div>
            </div>
        </div>

        {/* Upgrade BottomSheet */}
        <BottomSheet isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} title="Solicitar Expansão">
            <div className="px-1 pb-16 space-y-8">
                <div className="flex flex-col items-center justify-center p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-[40px] border border-indigo-100/50">
                    <ArrowUpCircle className="h-12 w-12 text-indigo-600 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Upgrade de Capacidade</p>
                    <h2 className="text-3xl font-black tracking-tighter text-indigo-950 dark:text-indigo-200">Novos Alunos</h2>
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Meta de Vagas Totais</Label>
                        <div className="relative">
                            <Input 
                                type="number" 
                                placeholder="Ex: 500"
                                value={novoLimite || ''}
                                onChange={(e) => setNovoLimite(Number(e.target.value))}
                                className="h-20 rounded-[28px] bg-slate-50 border-none text-2xl font-black px-8 focus:ring-2 focus:ring-indigo-200"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Atual</span>
                                <span className="text-sm font-black text-indigo-600">{currentLimit}</span>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {novoLimite > currentLimit && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-6 bg-slate-900 rounded-[32px] text-white flex items-center justify-between"
                            >
                                <div>
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Investimento Mensal</p>
                                    <p className="text-xl font-black mt-1">
                                        {formatCurrency(novoLimite * valorUnitario)}
                                    </p>
                                </div>
                                <Sparkles className="text-indigo-500 h-8 w-8" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <Button 
                    onClick={handleRequestUpgrade}
                    disabled={criarUpgrade.isPending || novoLimite <= currentLimit}
                    className="w-full h-20 rounded-[32px] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-indigo-200 disabled:opacity-30 transition-all font-montserrat"
                >
                    {criarUpgrade.isPending ? <Loader2 size={24} className="animate-spin" /> : 'CONFIRMAR PEDIDO'}
                </Button>
            </div>
        </BottomSheet>
      </MobilePageLayout>
    </PullToRefresh>
  )
}
