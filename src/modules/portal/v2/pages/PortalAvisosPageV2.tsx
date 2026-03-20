import { useState } from 'react'
import { useAvisosPortal } from '../../hooks'
import { usePortalContext } from '../../context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Megaphone, BellRing, ChevronDown, Clock, Info, AlertTriangle, ArrowLeft } from 'lucide-react'
import { format, parseISO, isAfter, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { SeletorAluno } from '../../components/SeletorAluno'
import { BotaoVoltar } from '../../components/BotaoVoltar'

// Helper de vibração
const vibrate = (ms: number | number[] = 20) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

// Helper de vigência
function avisoEstaAtivo(aviso: { data_fim?: string | null }): boolean {
  if (!aviso.data_fim) return true
  const hoje = startOfDay(new Date())
  const fim = startOfDay(parseISO(aviso.data_fim))
  return isAfter(fim, hoje) || fim.getTime() === hoje.getTime()
}

// --- SKELETON LOADING ---
const AvisosSkeleton = () => (
  <div className="space-y-4 animate-pulse p-4">
    <div className="h-8 w-40 bg-slate-100 rounded-lg" />
    <div className="h-28 bg-slate-900 rounded-2xl" />
    <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white border border-slate-100 rounded-2xl" />)}
    </div>
  </div>
)

interface AvisoPortalCardProps {
  aviso: any // Tipado como any pois os dados vem do Supabase via hook genérico
  expirado?: boolean
  expandedId: string | null
  onToggleExpand: (id: string) => void
}

function AvisoPortalCard({ aviso, expirado = false, expandedId, onToggleExpand }: AvisoPortalCardProps) {
  const isGeral = !aviso.turma_id
  const isExpanded = expandedId === aviso.id

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group"
    >
      <Card className={cn(
        'border border-slate-100 shadow-sm transition-all duration-500 rounded-[32px] overflow-hidden cursor-pointer active:scale-[0.98]',
        expirado ? 'bg-slate-50/50 grayscale-[0.8]' : 'bg-white'
      )} onClick={() => { vibrate(15); onToggleExpand(aviso.id); }}>
        <CardContent className="p-0">
          <div className="flex flex-col">
            <div className="p-5 flex items-start gap-4">
              {/* Icon Container */}
              <div className={cn(
                'h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-sm',
                expirado 
                  ? 'bg-slate-100 text-slate-400' 
                  : (isGeral 
                      ? 'bg-teal-50 text-teal-500 border border-teal-100' 
                      : 'bg-indigo-50 text-indigo-500 border border-indigo-100')
              )}>
                {expirado
                  ? <Clock className="h-6 w-6" />
                  : isGeral ? <Megaphone className="h-6 w-6" /> : <BellRing className="h-6 w-6" />
                }
              </div>

              {/* Content Container */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-col gap-1.5">
                   <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn(
                        'text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-0 shadow-sm',
                        expirado 
                          ? 'bg-slate-200 text-slate-500' 
                          : (isGeral ? 'bg-teal-500 text-white' : 'bg-indigo-500 text-white')
                      )}>
                        {isGeral ? 'Geral' : `${aviso.turma?.nome ?? 'Turma'}`}
                      </Badge>
                      {expirado && (
                        <Badge className="bg-red-100 text-red-500 text-[9px] font-black uppercase border-0 px-3 py-1">Arquivado</Badge>
                      )}
                   </div>
                   <h3 className={cn(
                      'text-base font-black tracking-tight leading-tight transition-colors',
                      expirado ? 'text-slate-400' : 'text-slate-800'
                    )}>
                      {aviso.titulo}
                   </h3>
                </div>

                <AnimatePresence>
                  <motion.p 
                    layout
                    className={cn(
                      'text-sm font-medium leading-relaxed transition-all',
                      expirado ? 'text-slate-400' : 'text-slate-500',
                      !isExpanded ? 'line-clamp-2' : ''
                    )}
                  >
                    {aviso.conteudo}
                  </motion.p>
                </AnimatePresence>

                <div className="pt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} className="text-slate-300" />
                      {format(new Date(aviso.created_at), "dd/MM", { locale: ptBR })}
                    </span>
                    {aviso.data_fim && (
                      <span className={cn('flex items-center gap-1.5', expirado ? 'text-red-300' : 'text-amber-500')}>
                        {expirado ? 'Até' : 'Exp.'} {format(parseISO(aviso.data_fim), 'dd/MM')}
                      </span>
                    )}
                  </div>
                  
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-slate-50 text-slate-300 border border-slate-100',
                    isExpanded && 'rotate-180 bg-slate-900 border-slate-900 text-white shadow-lg'
                  )}>
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function PortalAvisosPageV2() {
  const { alunoSelecionado, isMultiAluno, isLoading: loadingCtx } = usePortalContext()
  const { data: avisos, isLoading } = useAvisosPortal()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleToggle = (id: string) => setExpandedId(prev => prev === id ? null : id)

  if (loadingCtx || isLoading) return <AvisosSkeleton />

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-6">
        <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center shadow-inner">
            <Megaphone className="h-10 w-10 text-slate-200" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Mural de Avisos</h2>
          <p className="text-sm font-semibold text-slate-400">Selecione um aluno para ver os comunicados.</p>
        </div>
      </div>
    )
  }

  const avisosAtivos = (avisos ?? []).filter((a: any) => avisoEstaAtivo(a))
  const avisosExpirados = (avisos ?? []).filter((a: any) => !avisoEstaAtivo(a))

  return (
    <div className="flex flex-col gap-6 p-4 pt-6 pb-20 font-sans">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-4">
          <BotaoVoltar />
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Avisos</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Mural da Escola</p>
          </div>
        </div>
        {isMultiAluno && <SeletorAluno />}
      </div>

      {/* Banner */}
      <div className="bg-slate-900 rounded-[40px] p-6 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
         <div className="absolute right-0 top-0 opacity-5 -mr-12 -mt-12 pointer-events-none">
            <Megaphone size={200} />
         </div>
         <div className="flex items-start gap-5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-400 shrink-0 border border-white/5">
               <BellRing size={24} />
            </div>
            <div>
               <h4 className="text-base font-black text-teal-400 mb-1 leading-none pt-1">Canal Direto</h4>
               <p className="text-xs font-medium text-slate-400 leading-relaxed pr-10">
                 Fique por dentro de eventos, feriados e comunicados importantes.
               </p>
            </div>
         </div>
      </div>

      {/* Empty State */}
      {(!avisos || avisos.length === 0) && (
        <div className="py-20 text-center space-y-5 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
           <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-200">
             <AlertTriangle size={32} />
           </div>
           <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Tudo calmo por aqui</h3>
              <p className="text-sm font-semibold text-slate-400 max-w-[200px] mx-auto">Não há novos avisos no momento.</p>
           </div>
        </div>
      )}

      {/* Ativos */}
      {avisosAtivos.length > 0 && (
        <div className="flex flex-col gap-4">
           <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-sm shadow-teal-500/50" />
                 <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none">Novidades</h3>
              </div>
              <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest">
                {avisosAtivos.length} {avisosAtivos.length === 1 ? 'Aviso' : 'Avisos'}
              </span>
           </div>
           <div className="flex flex-col gap-4">
              <AnimatePresence mode="popLayout">
                {avisosAtivos.map(aviso => (
                  <AvisoPortalCard
                    key={aviso.id}
                    aviso={aviso}
                    expandedId={expandedId}
                    onToggleExpand={handleToggle}
                  />
                ))}
              </AnimatePresence>
           </div>
        </div>
      )}

      {/* Histórico */}
      {avisosExpirados.length > 0 && (
        <div className="flex flex-col gap-4 mt-4">
           <div className="flex items-center gap-2 border-t border-slate-100 pt-8 px-1">
              <Clock className="h-3 w-3 text-slate-300" />
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Histórico Arquivado ({avisosExpirados.length})</h3>
           </div>
           <div className="flex flex-col gap-4">
              {avisosExpirados.map(aviso => (
                <AvisoPortalCard
                  key={aviso.id}
                  aviso={aviso}
                  expirado
                  expandedId={expandedId}
                  onToggleExpand={handleToggle}
                />
              ))}
           </div>
        </div>
      )}
    </div>
  )
}
