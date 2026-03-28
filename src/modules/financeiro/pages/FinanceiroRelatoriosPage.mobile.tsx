import { useFechamentoMensal } from '../hooks-avancado'
import { 
  Loader2, 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  PiggyBank, 
  RotateCw,
  ArrowLeft,
  ChevronRight,
  TrendingDown,
  DollarSign,
  Calendar,
  Sparkles,
  Download
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { useState, useMemo } from 'react'
import { usePermissions } from '@/providers/RBACProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Button } from '@/components/ui/button'

export function FinanceiroRelatoriosPageMobile() {
  const { data: fechamento, isLoading, refetch, isRefetching } = useFechamentoMensal()
  const { hasPermission } = usePermissions()
  const canExport = hasPermission('financeiro.relatorios.export')

  const [selectedMonth, setSelectedMonth] = useState<any | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Calcular totais consolidation
  const totaisGerais = useMemo(() => {
    if (!fechamento || fechamento.length === 0) {
      return { receitasRecebido: 0, despesasPago: 0, saldo: 0, saldoPrevisto: 0 }
    }
    return fechamento.reduce((acc, item: any) => ({
      receitasRecebido: acc.receitasRecebido + (item.total_receitas_recebido || 0),
      despesasPago: acc.despesasPago + (item.total_despesas_pago || 0),
      saldo: acc.saldo + (item.saldo || 0),
      saldoPrevisto: acc.saldoPrevisto + (item.saldo_previsto || 0),
    }), { receitasRecebido: 0, despesasPago: 0, saldo: 0, saldoPrevisto: 0 })
  }, [fechamento])

  const handleExport = () => {
    if (!fechamento || fechamento.length === 0) return
    const headers = ['Mês', 'Receitas Previsto', 'Receitas Recebido', 'Despesas Previsto', 'Despesas Pago', 'Saldo Atual']
    const rows = (fechamento as any[]).map(item => [
      new Date(item.mes).toLocaleString('pt-BR', { month: 'short', year: '2y' }),
      item.total_receitas_previsto,
      item.total_receitas_recebido,
      item.total_despesas_previsto,
      item.total_despesas_pago,
      item.saldo
    ])
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `financeiro_mobile_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-950 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest">Calculando Fechamentos...</p>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={async () => { await refetch() }}>
      <MobilePageLayout
        title="Relatórios"
        leftAction={
          <button onClick={() => window.history.back()} className="h-10 w-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </button>
        }
        rightActions={
          canExport && (
            <button onClick={handleExport} className="h-10 w-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
              <Download className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </button>
          )
        }
      >
        <div className="space-y-6 pb-20 pt-2">
            {/* Super Summary Header */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[36px] text-white shadow-2xl relative overflow-hidden">
                <Sparkles className="absolute -top-4 -right-4 h-32 w-32 opacity-10" />
                <div className="relative z-10 flex flex-col items-center text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100 opacity-60">Poder de Investimento (Saldo)</p>
                    <h2 className="text-4xl font-black tracking-tighter mt-2">
                        {formatCurrency(totaisGerais.saldo)}
                    </h2>
                    <div className="mt-6 flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                        <TrendingUp size={14} className="text-emerald-300" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-50">Fluxo Saudável</span>
                    </div>
                </div>

                <div className="mt-10 grid grid-cols-2 gap-4 relative z-10">
                    <div className="flex flex-col gap-1">
                        <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">Recebido</p>
                        <p className="text-base font-black truncate">{formatCurrency(totaisGerais.receitasRecebido)}</p>
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                        <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">Pago</p>
                        <p className="text-base font-black truncate">{formatCurrency(totaisGerais.despesasPago)}</p>
                    </div>
                </div>
            </div>

            {/* Sub Widgets Section */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                     <PiggyBank size={20} />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Previsto</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                      {formatCurrency(totaisGerais.saldoPrevisto)}
                  </p>
               </div>
               <div className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
                     <RotateCw size={20} />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Atualizar Dados</p>
                  <button onClick={() => refetch()} className="text-sm font-black text-indigo-600 mt-1 uppercase tracking-tighter">Sincronizar</button>
               </div>
            </div>

            {/* Monthly History List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Histórico de Fechamento</h3>
                    <TrendingUp size={16} className="text-slate-300" />
                </div>

                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {(fechamento as any[])?.map((month, idx) => (
                           <motion.div
                             key={idx}
                             layout
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: idx * 0.05 }}
                           >
                             <NativeCard 
                                onClick={() => { setSelectedMonth(month); setDetailOpen(true); }}
                                className="p-5"
                             >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center border border-slate-100/50">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                {new Date(month.mes).toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}
                                            </span>
                                            <span className="text-xs font-black text-slate-900 dark:text-white">
                                                {new Date(month.mes).getFullYear().toString().slice(-2)}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 dark:text-white text-sm capitalize">
                                                {new Date(month.mes).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex items-center gap-1">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-[9px] font-black text-slate-400">{formatCurrency(month.total_receitas_recebido).split(',')[0]}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                    <span className="text-[9px] font-black text-slate-400">{formatCurrency(month.total_despesas_pago).split(',')[0]}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right flex flex-col items-end gap-1">
                                        <p className={cn(
                                            "text-sm font-black tracking-tight",
                                            month.saldo >= 0 ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            {formatCurrency(month.saldo)}
                                        </p>
                                        <ChevronRight size={14} className="text-slate-300" />
                                    </div>
                                </div>
                             </NativeCard>
                           </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>

        {/* Detailed Month BottomSheet */}
        <BottomSheet isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Análise Mensal">
            {selectedMonth && (
                <div className="px-1 pb-16 space-y-8">
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Lucro Real do Período</p>
                        <h2 className={cn(
                            "text-3xl font-black tracking-tighter",
                            selectedMonth.saldo >= 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                            {formatCurrency(selectedMonth.saldo)}
                        </h2>
                        <div className="mt-4 px-4 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            {new Date(selectedMonth.mes).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Receitas Breakdown */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Receitas (Ganhos)</h4>
                            <div className="bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl p-5 border border-emerald-100/50 space-y-4">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs font-black text-emerald-800/60 uppercase">Previsto</span>
                                    <span className="text-sm font-black text-emerald-900 dark:text-emerald-400">{formatCurrency(selectedMonth.total_receitas_previsto)}</span>
                                </div>
                                <div className="flex justify-between items-baseline pt-2 border-t border-emerald-100">
                                    <span className="text-xs font-black text-emerald-800/60 uppercase">Recebido</span>
                                    <span className="text-base font-black text-emerald-600">{formatCurrency(selectedMonth.total_receitas_recebido)}</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs font-black text-emerald-800/60 uppercase">Em Aberto</span>
                                    <span className="text-sm font-black text-emerald-700/70">{formatCurrency(selectedMonth.total_receitas_aberto)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Despesas Breakdown */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest ml-1">Despesas (Gastos)</h4>
                            <div className="bg-rose-50/50 dark:bg-rose-950/10 rounded-2xl p-5 border border-rose-100/50 space-y-4">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs font-black text-rose-800/60 uppercase">Previsto</span>
                                    <span className="text-sm font-black text-rose-900 dark:text-rose-400">{formatCurrency(selectedMonth.total_despesas_previsto)}</span>
                                </div>
                                <div className="flex justify-between items-baseline pt-2 border-t border-rose-100">
                                    <span className="text-xs font-black text-rose-800/60 uppercase">Efetivado (Pago)</span>
                                    <span className="text-base font-black text-rose-600">{formatCurrency(selectedMonth.total_despesas_pago)}</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs font-black text-rose-800/60 uppercase">A Pagar</span>
                                    <span className="text-sm font-black text-rose-700/70">{formatCurrency(selectedMonth.total_despesas_aberto)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button 
                        onClick={() => setDetailOpen(false)}
                        className="w-full h-16 rounded-[24px] bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-sm tracking-widest shadow-xl"
                    >
                        FECHAR ANÁLISE
                    </Button>
                </div>
            )}
        </BottomSheet>
      </MobilePageLayout>
    </PullToRefresh>
  )
}
