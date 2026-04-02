import { useState, useMemo } from 'react'
import { useAvisosPortal } from '../hooks'
import { usePortalContext } from '../context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Megaphone, BellRing, ChevronDown, Clock, Info, AlertTriangle, ArrowLeft, MoreHorizontal, CheckCircle2, Users, Receipt } from 'lucide-react'
import { format, parseISO, isAfter, startOfDay, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { SeletorAluno } from '../components/SeletorAluno'
import { BotaoVoltar } from '../components/BotaoVoltar'

// Helper de vibração nativa
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

// --- SKELETON LOADING PREMIUM ---
const AvisosSkeleton = () => (
  <div className="space-y-6 pt-6 px-4 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-10 w-32 bg-slate-200 rounded-2xl" />
      <div className="h-10 w-10 bg-slate-200 rounded-full" />
    </div>
    <div className="h-12 w-full bg-slate-100 rounded-2xl" />
    <div className="h-32 bg-slate-900 rounded-3xl" />
    <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-white border border-slate-100 rounded-3xl" />
        ))}
    </div>
  </div>
)

interface AvisoPortalCardProps {
  aviso: any
  expirado?: boolean
  index: number
}

function AvisoPortalCard({ aviso, expirado = false, index }: AvisoPortalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isGeral = !aviso.turma_id

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1, type: 'spring', stiffness: 260, damping: 20 }}
      className="group"
    >
      <Card 
        className={cn(
          'border-0 shadow-sm transition-all duration-300 rounded-[24px] overflow-hidden cursor-pointer relative',
          expirado ? 'bg-slate-50/60 grayscale-[0.5]' : 'bg-white hover:shadow-xl active:scale-[0.98]'
        )} 
        onClick={() => { vibrate(15); setIsExpanded(!isExpanded); }}
      >
        <CardContent className="p-0">
          <div className="flex flex-col">
            <div className="p-5 flex items-start gap-4">
              <div className={cn(
                'h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-all',
                expirado 
                  ? 'bg-slate-200 text-slate-500' 
                  : (isGeral 
                      ? 'bg-teal-500 text-white shadow-teal-500/20' 
                      : 'bg-indigo-500 text-white shadow-indigo-500/20')
              )}>
                {expirado
                  ? <Clock className="h-6 w-6" />
                  : isGeral ? <Megaphone className="h-6 w-6" /> : <BellRing className="h-6 w-6" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <Badge className={cn(
                    'text-[9px] font-black uppercase tracking-tighter px-2.5 py-0.5 rounded-lg border-0 italic',
                    expirado 
                      ? 'bg-slate-200 text-slate-500' 
                      : (isGeral ? 'bg-teal-50 text-teal-600' : 'bg-indigo-50 text-indigo-600')
                  )}>
                    {isGeral ? 'Comunicado Geral' : `${aviso.turma?.nome ?? 'Turma'}`}
                  </Badge>
                  <span className="text-[10px] font-bold text-slate-400">
                    {format(new Date(aviso.created_at), "HH:mm")}
                  </span>
                </div>

                <h3 className={cn(
                  'text-[15px] font-black leading-tight tracking-tight mb-1 italic uppercase',
                  expirado ? 'text-slate-400' : 'text-slate-800'
                )}>
                  {aviso.titulo}
                </h3>

                <p className={cn(
                  'text-[13px] leading-relaxed transition-all font-medium',
                  expirado ? 'text-slate-300' : 'text-slate-500',
                  !isExpanded && 'line-clamp-2'
                )}>
                  {aviso.conteudo}
                </p>

                <div className="mt-3 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                        Visualizado
                      </span>
                   </div>
                   <div className={cn(
                      "h-6 w-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 transition-transform duration-300",
                      isExpanded && "rotate-180 bg-slate-900 text-white"
                   )}>
                      <ChevronDown size={14} />
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
  const { alunoSelecionado, isMultiAluno, isLoading: loadingCtx } = usePortalContext()
  const { data: avisos, isLoading } = useAvisosPortal()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filtroAtivo, setFiltroAtivo] = useState('tudo')

  const categorias = [
    { id: 'tudo', label: 'Tudo', icon: BellRing },
    { id: 'geral', label: 'Escola', icon: Megaphone },
    { id: 'turma', label: 'Acadêmico', icon: Users },
    { id: 'financeiro', label: 'Financeiro', icon: Receipt },
  ]

  const handleRefresh = () => {
    vibrate([30, 10, 30])
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1500)
  }

  const { hoje, anteriores, arquivados } = useMemo(() => {
    let list = avisos ?? []
    
    // Filtro por categoria
    if (filtroAtivo !== 'tudo') {
      if (filtroAtivo === 'geral') list = list.filter(a => !a.turma_id)
      if (filtroAtivo === 'turma') list = list.filter(a => !!a.turma_id)
      if (filtroAtivo === 'financeiro') list = list.filter(a => a.titulo?.toLowerCase().includes('financeiro') || a.conteudo?.toLowerCase().includes('pagamento'))
    }

    const ativos = list.filter(a => avisoEstaAtivo(a as any))
    const exp = list.filter(a => !avisoEstaAtivo(a as any))

    return {
      hoje: ativos.filter(a => isToday(new Date(a.created_at))),
      anteriores: ativos.filter(a => !isToday(new Date(a.created_at))),
      arquivados: exp
    }
  }, [avisos, filtroAtivo])

  if (loadingCtx || isLoading) return <AvisosSkeleton />

  return (
    <div className="bg-slate-50 flex flex-col pt-[env(safe-area-inset-top,24px)]">
      
      {/* 1. Header Nativo Interativo */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl px-4 py-4 space-y-4 border-b border-slate-100 shadow-sm">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <BotaoVoltar />
              <div className="flex flex-col">
                 <h2 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">Mural</h2>
                 <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest leading-none mt-1">Sua Unidade</span>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-slate-50 border border-slate-100/50" onClick={handleRefresh}>
                 <CheckCircle2 size={18} className="text-slate-400" />
              </Button>
              {isMultiAluno && <SeletorAluno />}
           </div>
        </div>

        {/* 1.1 Filtros Pills - Padrão App Nativo */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 pr-10">
           {categorias.map(cat => (
             <button
               key={cat.id}
               onClick={() => { vibrate(10); setFiltroAtivo(cat.id); }}
               className={cn(
                 "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border-2",
                 filtroAtivo === cat.id 
                  ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200" 
                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 active:bg-slate-50"
               )}
             >
               <cat.icon size={12} className={filtroAtivo === cat.id ? "text-teal-400" : "text-slate-300"} />
               {cat.label}
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-8 pb-40">
        <AnimatePresence>
          {isRefreshing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex justify-center items-center py-2 text-[10px] font-black text-teal-500 uppercase italic tracking-widest gap-2"
            >
              <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              Sincronizando mural...
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-6 text-white relative overflow-hidden shadow-2xl shadow-slate-300/40"
        >
           <div className="absolute -right-8 -top-8 opacity-10 rotate-12">
              <Megaphone size={160} />
           </div>
           <div className="relative z-10 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-400 border border-teal-500/10">
                 <BellRing size={24} />
              </div>
              <div className="space-y-1">
                 <h4 className="text-lg font-black italic uppercase tracking-tight text-teal-400">Canal de Transmissão</h4>
                 <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                   Fique por dentro das últimas atualizações diretamente da diretoria e coordenação.
                 </p>
              </div>
           </div>
        </motion.div>

        {hoje.length === 0 && anteriores.length === 0 && arquivados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
             <div className="relative">
                <div className="absolute inset-0 bg-teal-500/10 blur-3xl rounded-full" />
                <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center shadow-2xl shadow-slate-200 text-teal-500 relative z-10 animate-bounce duration-[3000ms]">
                   <CheckCircle2 size={48} />
                </div>
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Limpo e Organizado!</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-[220px] mx-auto leading-relaxed">Você já leu todos os informativos desta categoria.</p>
             </div>
          </div>
        ) : (
          <div className="space-y-12">
            {hoje.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest italic">Pub. Recentes</span>
                   <div className="h-[1px] flex-1 bg-slate-100" />
                </div>
                <div className="space-y-4">
                  {hoje.map((a, idx) => <AvisoPortalCard key={a.id} aviso={a} index={idx} />)}
                </div>
              </div>
            )}

            {anteriores.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Anteriores</span>
                   <div className="h-[1px] flex-1 bg-slate-200/50" />
                </div>
                <div className="space-y-4">
                  {anteriores.map((a, idx) => <AvisoPortalCard key={a.id} aviso={a} index={idx} />)}
                </div>
              </div>
            )}

            {arquivados.length > 0 && (
              <div className="space-y-4 px-1 opacity-60">
                <div className="flex items-center gap-3">
                   <Clock size={12} className="text-slate-300" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Histórico</span>
                   <div className="h-[1px] flex-1 bg-slate-100" />
                </div>
                <div className="space-y-4">
                  {arquivados.map((a, idx) => <AvisoPortalCard key={a.id} aviso={a} index={idx} expirado />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="py-10 flex flex-col items-center justify-center opacity-20 select-none pointer-events-none">
         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Fluxoo Edu</h4>
         <div className="w-1 h-1 rounded-full bg-slate-400 mt-2" />
      </div>

    </div>
  )
}
