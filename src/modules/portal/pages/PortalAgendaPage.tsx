import { usePortalContext } from '../context'
import { useQuery } from '@tanstack/react-query'
import { portalService } from '../service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Clock, ChevronRight, Info, Heart } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SeletorAluno } from '../components/SeletorAluno'
import { BotaoVoltar } from '../components/BotaoVoltar'

const vibrate = (ms: number | number[] = 20) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
}

const AgendaSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-8 w-40 bg-slate-100 rounded-lg" />
    {[1, 2, 3].map(i => (
      <div key={i} className="h-32 bg-white border border-slate-100 rounded-2xl shadow-sm flex overflow-hidden">
        <div className="w-20 bg-slate-50" />
        <div className="flex-1 p-4 space-y-3">
          <div className="h-5 bg-slate-50 rounded w-3/4" />
          <div className="h-4 bg-slate-50 rounded w-full" />
          <div className="flex gap-3">
            <div className="h-6 bg-slate-50 rounded-full w-20" />
            <div className="h-6 bg-slate-50 rounded-full w-20" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

export function PortalAgendaPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const { tenantId, isMultiAluno } = usePortalContext()
  
  const { data: eventos, isLoading } = useQuery({
    queryKey: ['portal', 'eventos', tenantId],
    queryFn: () => portalService.buscarEventos(tenantId!),
    enabled: !!tenantId
  })

  const formatarDiaSemana = (dataStr: string) => {
    try { return format(parseISO(dataStr), "eeee", { locale: ptBR }) }
    catch { return '' }
  }
  const formatarData = (dataStr: string) => {
    try { return format(parseISO(dataStr), "dd 'de' MMMM", { locale: ptBR }) }
    catch { return dataStr }
  }
  const getDia = (dataStr: string) => dataStr.split('-')[2]
  const getMes = (dataStr: string) => {
    try { return format(parseISO(dataStr), "MMM", { locale: ptBR }) }
    catch { return '' }
  }

  if (isLoading) return <AgendaSkeleton />

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-500 font-sans">

      {/* Header */}
      {!hideHeader && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-3">
            <BotaoVoltar />
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">Agenda</h2>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Calendário Institucional</p>
            </div>
          </div>
          {isMultiAluno && <SeletorAluno />}
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-1 w-5 bg-slate-900 rounded-full" />
          <p className="text-xs font-bold uppercase text-slate-800 tracking-wider">Próximos Eventos</p>
        </div>

        <AnimatePresence mode="popLayout">
          {eventos && eventos.length > 0 ? (
            <div className="space-y-3">
              {eventos.map((evento: any, idx: number) => (
                <motion.div
                  key={evento.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => vibrate(15)}
                  className="group cursor-pointer"
                >
                  <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden flex flex-col sm:flex-row active:scale-[0.98] transition-transform">
                    
                    {/* Data */}
                    <div className="sm:w-24 bg-slate-900 flex sm:flex-col items-center justify-center p-4 text-white shrink-0 gap-2 sm:gap-0.5 group-hover:bg-teal-600 transition-colors">
                       <span className="text-2xl sm:text-3xl font-bold leading-none">{getDia(evento.data_inicio)}</span>
                       <span className="text-[10px] font-medium uppercase tracking-wider opacity-50">{getMes(evento.data_inicio)}</span>
                    </div>

                    <CardContent className="p-4 flex-1">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-slate-800 leading-tight group-hover:text-teal-600 transition-colors">
                            {evento.nome}
                          </h3>
                          {evento.publico_alvo === 'toda_escola' && (
                            <Heart size={14} className="text-teal-500 fill-current shrink-0 mt-0.5" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                          {evento.description || evento.descricao || 'Atividade escolar programada.'}
                        </p>
                        <div className="flex flex-wrap gap-4 pt-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                            <Clock size={12} className="text-slate-300" />
                            {formatarDiaSemana(evento.data_inicio)}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                            <Users size={12} className="text-slate-300" />
                            {evento.publico_alvo?.replace('_', ' ') || 'toda escola'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-50 p-10 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-4">
              <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-slate-200">
                <Calendar size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">Agenda vazia</h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">Nenhum evento publicado para os próximos dias.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info */}
      <div className="bg-slate-900 rounded-2xl p-5 md:p-6 text-white flex items-start gap-4 shadow-lg">
        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-teal-400 shrink-0">
          <Info size={18} />
        </div>
        <div>
          <h5 className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider mb-1">Dica</h5>
          <p className="text-xs text-slate-400 leading-relaxed">
            Toque em um evento para sincronizar com sua agenda e receber lembretes.
          </p>
        </div>
      </div>
    </div>
  )
}
