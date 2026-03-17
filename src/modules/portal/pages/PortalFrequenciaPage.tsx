import { useFrequenciaAluno } from '../hooks'
import { usePortalContext } from '../context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarCheck, Check, X, AlertCircle, TrendingUp, UserMinus, ChevronRight, Activity } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SeletorAluno } from '../components/SeletorAluno'
import { BotaoVoltar } from '../components/BotaoVoltar'

const vibrate = (ms: number | number[] = 20) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
}

const FrequenciaSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-8 w-40 bg-slate-100 rounded-lg" />
    <div className="h-36 bg-slate-900 rounded-2xl" />
    <div className="grid grid-cols-2 gap-3">
      {[1, 2].map(i => <div key={i} className="h-20 bg-white border border-slate-100 rounded-2xl" />)}
    </div>
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white border border-slate-100 rounded-2xl" />)}
    </div>
  </div>
)

export function PortalFrequenciaPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const { alunoSelecionado, isMultiAluno } = usePortalContext()
  const { data: frequencias, isLoading } = useFrequenciaAluno()

  if (isLoading) return <FrequenciaSkeleton />

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
          <CalendarCheck className="h-8 w-8 text-slate-200" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800">Frequência</h2>
          <p className="text-sm text-slate-400">Selecione um aluno para monitorar.</p>
        </div>
      </div>
    )
  }

  const totalDias = frequencias?.length || 0
  const presencas = frequencias?.filter(f => f.status === 'presente').length || 0
  const faltas = frequencias?.filter(f => f.status === 'falta').length || 0
  const taxaPresenca = totalDias > 0 ? Math.round((presencas / totalDias) * 100) : 0

  const statusConfig: Record<string, { label: string, color: string, icon: any, bg: string, ring: string }> = {
    presente: { label: 'Presente', color: 'text-emerald-600', icon: Check, bg: 'bg-emerald-50', ring: 'ring-emerald-100' },
    falta: { label: 'Falta', color: 'text-red-600', icon: X, bg: 'bg-red-50', ring: 'ring-red-100' },
    justificada: { label: 'Justificada', color: 'text-amber-600', icon: AlertCircle, bg: 'bg-amber-50', ring: 'ring-amber-100' },
  }

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-500 font-sans">

      {/* Header */}
      {!hideHeader && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-3">
            <BotaoVoltar />
            <div className="flex flex-col gap-0.5">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">Frequência</h2>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Histórico de Assiduidade</p>
            </div>
          </div>
          {isMultiAluno && <SeletorAluno />}
        </div>
      )}

      {/* Resumo */}
      <div className="bg-slate-900 rounded-2xl md:rounded-3xl p-5 md:p-8 text-white relative overflow-hidden shadow-lg">
         <div className="absolute right-0 top-0 opacity-5 -mr-10 -mt-10 pointer-events-none">
            <Activity size={200} />
         </div>
         
         <div className="relative z-10 flex flex-col gap-5">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingUp size={20} />
               </div>
               <div>
                  <h4 className="text-base md:text-lg font-bold leading-tight">Taxa de Frequência</h4>
                  <p className="text-[10px] font-medium text-emerald-400/60 uppercase tracking-wider">Performance Acadêmica</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="rounded-xl md:rounded-2xl bg-white/5 border border-white/10 p-4 md:p-5 relative overflow-hidden">
                <p className="text-2xl md:text-3xl font-bold text-white leading-none">{taxaPresenca}%</p>
                <div className="flex items-center gap-2 mt-2">
                   <div className="h-1 w-5 bg-emerald-500 rounded-full" />
                   <p className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wider">Assiduidade</p>
                </div>
                <div className="absolute bottom-0 left-0 h-1 bg-emerald-500" style={{ width: `${taxaPresenca}%` }} />
              </div>

              <div className="rounded-xl md:rounded-2xl bg-white/5 border border-white/10 p-4 md:p-5">
                <p className="text-2xl md:text-3xl font-bold text-red-400 leading-none">{faltas}</p>
                <div className="flex items-center gap-2 mt-2">
                   <div className="h-1 w-5 bg-red-500/50 rounded-full" />
                   <p className="text-[9px] font-semibold text-white/30 uppercase tracking-wider">Faltas</p>
                </div>
              </div>
            </div>
         </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="h-1 w-5 bg-slate-900 rounded-full" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Timeline</h3>
           </div>
           <Badge variant="outline" className="text-[9px] font-semibold tracking-wider uppercase rounded-full border-slate-200 text-slate-400 px-3 py-1">
             {totalDias} registros
           </Badge>
        </div>
        
        <AnimatePresence mode="popLayout">
          {frequencias && frequencias.length > 0 ? (
            <div className="space-y-3">
              {frequencias.map((freq, idx) => {
                const config = statusConfig[freq.status] || statusConfig.presente
                const StatusIcon = config.icon
                
                return (
                  <motion.div
                    key={freq.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => vibrate(15)}
                    className="group"
                  >
                    <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden active:scale-[0.98] transition-transform">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                         <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0", 
                              config.bg, config.color
                            )}>
                               <StatusIcon size={18} />
                            </div>
                            <div className="min-w-0">
                               <h4 className="text-sm font-bold text-slate-800 leading-tight truncate">
                                  {format(new Date(freq.data_aula + 'T12:00:00'), "EEEE, dd/MM", { locale: ptBR })}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{config.label}</span>
                                  {freq.justificativa && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 rounded-full">
                                      <div className="w-1 h-1 bg-amber-400 rounded-full" />
                                      <span className="text-[8px] font-bold text-amber-600 uppercase">Doc</span>
                                    </div>
                                  )}
                                </div>
                            </div>
                         </div>
                         <ChevronRight size={16} className="text-slate-200 shrink-0" />
                      </CardContent>
                      
                      {freq.justificativa && (
                        <div className="bg-slate-50 px-4 py-3 border-t border-slate-100">
                          <div className="flex items-start gap-3">
                            <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-500 italic line-clamp-2">"{freq.justificativa}"</p>
                          </div>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="bg-slate-50 p-10 md:p-16 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-4"
            >
              <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-slate-200">
                <UserMinus size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">Sem registros</h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">Nenhum registro de frequência encontrado para o ciclo atual.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
