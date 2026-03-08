import { useState } from 'react'
import { useAvisosPortal } from '../hooks'
import { usePortalContext } from '../context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Megaphone, BellRing, ChevronDown, ChevronUp, Clock, Info, AlertTriangle, ArrowLeft } from 'lucide-react'
import { format, parseISO, isAfter, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { SeletorAluno } from '../components/SeletorAluno'

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
  <div className="space-y-4 animate-pulse">
    <div className="h-8 w-40 bg-slate-100 rounded-lg" />
    <div className="h-28 bg-slate-900 rounded-2xl" />
    <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white border border-slate-100 rounded-2xl" />)}
    </div>
  </div>
)

interface AvisoPortalCardProps {
  aviso: any
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
        'border border-slate-100 shadow-sm transition-all duration-500 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98]',
        expirado ? 'bg-slate-50/50 grayscale-[0.8]' : 'bg-white'
      )} onClick={() => { vibrate(15); onToggleExpand(aviso.id); }}>
        <CardContent className="p-0">
          <div className="flex flex-col">
            <div className="p-4 flex items-start gap-3">
              {/* Icon Container */}
              <div className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
                expirado 
                  ? 'bg-slate-100 text-slate-400' 
                  : (isGeral 
                      ? 'bg-teal-50 text-teal-500' 
                      : 'bg-indigo-50 text-indigo-500')
              )}>
                {expirado
                  ? <Clock className="h-5 w-5" />
                  : isGeral ? <Megaphone className="h-5 w-5" /> : <BellRing className="h-5 w-5" />
                }
              </div>

              {/* Content Container */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-col gap-1.5">
                   <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn(
                        'text-[8px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border-0',
                        expirado 
                          ? 'bg-slate-200 text-slate-500' 
                          : (isGeral ? 'bg-teal-500 text-white' : 'bg-indigo-500 text-white')
                      )}>
                        {isGeral ? 'Geral' : `${aviso.turma?.nome ?? 'Turma'}`}
                      </Badge>
                      {expirado && (
                        <Badge className="bg-red-100 text-red-500 text-[8px] font-semibold uppercase border-0 px-2 py-0.5">Arquivado</Badge>
                      )}
                   </div>
                   <h3 className={cn(
                      'text-sm font-bold leading-tight transition-colors',
                      expirado ? 'text-slate-400' : 'text-slate-800'
                    )}>
                      {aviso.titulo}
                   </h3>
                </div>

                <AnimatePresence>
                  <motion.p 
                    layout
                    className={cn(
                      'text-xs leading-relaxed transition-all',
                      expirado ? 'text-slate-400' : 'text-slate-500',
                      !isExpanded ? 'line-clamp-2' : ''
                    )}
                  >
                    {aviso.conteudo}
                  </motion.p>
                </AnimatePresence>

                <div className="pt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-[10px] font-medium text-slate-300 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-slate-300" />
                      {format(new Date(aviso.created_at), "dd/MM", { locale: ptBR })}
                    </span>
                    {aviso.data_fim && (
                      <span className={cn('flex items-center gap-1', expirado ? 'text-red-300' : 'text-amber-500')}>
                        {expirado ? 'Até' : 'Exp.'} {format(parseISO(aviso.data_fim), 'dd/MM')}
                      </span>
                    )}
                  </div>
                  
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all bg-slate-50 text-slate-300',
                    isExpanded && 'rotate-180 bg-slate-900 text-white'
                  )}>
                    <ChevronDown size={16} />
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

export function PortalAvisosPage() {
  const { alunoSelecionado, isMultiAluno } = usePortalContext()
  const { data: avisos, isLoading } = useAvisosPortal()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleToggle = (id: string) => setExpandedId(prev => prev === id ? null : id)

  if (isLoading) return <AvisosSkeleton />

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
            <Megaphone className="h-8 w-8 text-slate-200" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800">Avisos</h2>
          <p className="text-sm text-slate-400">Selecione um aluno para ver os avisos.</p>
        </div>
      </div>
    )
  }

  const avisosAtivos = (avisos ?? []).filter(a => avisoEstaAtivo(a as any))
  const avisosExpirados = (avisos ?? []).filter(a => !avisoEstaAtivo(a as any))

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-500 font-sans">
      
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Avisos</h2>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Mural da Unidade</p>
        </div>
        {isMultiAluno && <SeletorAluno />}
      </div>

      {/* Banner */}
      <div className="bg-slate-900 rounded-2xl p-5 md:p-6 text-white relative overflow-hidden shadow-lg">
         <div className="absolute right-0 top-0 opacity-5 -mr-10 -mt-10 pointer-events-none">
            <Megaphone size={200} />
         </div>
         <div className="flex items-start gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
               <BellRing size={20} />
            </div>
            <div>
               <h4 className="text-sm font-bold text-teal-400 mb-1">Canal Direto</h4>
               <p className="text-xs text-slate-400 leading-relaxed">
                 Acompanhe eventos e informes importantes da instituição.
               </p>
            </div>
         </div>
      </div>

      {/* 3. Empty State Handling */}
      {(!avisos || avisos.length === 0) && (
        <div className="py-10 text-center space-y-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-slate-200">
             <AlertTriangle size={28} />
           </div>
           <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">Sem avisos</h3>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">Nenhum aviso publicado no momento.</p>
           </div>
        </div>
      )}

      {/* 4. Categoría: Publicações Ativas */}
      {avisosAtivos.length > 0 && (
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                 <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ativos</h3>
              </div>
              <Badge variant="outline" className="text-[9px] font-semibold tracking-wider uppercase rounded-full border-slate-200 text-slate-400 px-3 py-1">
                {avisosAtivos.length}
              </Badge>
           </div>
           <div className="space-y-3">
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

      {/* 5. Categoría: Histórico Arquivado */}
      {avisosExpirados.length > 0 && (
        <div className="space-y-3 mt-6">
           <div className="flex items-center gap-2 border-t border-slate-100 pt-6">
              <Clock className="h-3 w-3 text-slate-300" />
              <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Arquivados ({avisosExpirados.length})</h3>
           </div>
           <div className="space-y-6">
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

      <div className="flex justify-center pt-4">
        <Button variant="ghost" onClick={() => { vibrate(10); window.history.back(); }}
          className="text-slate-400 font-semibold uppercase text-[10px] tracking-widest hover:text-teal-600 h-11 px-6 rounded-full">
          Retornar ao Portal
        </Button>
      </div>
    </div>
  )
}
