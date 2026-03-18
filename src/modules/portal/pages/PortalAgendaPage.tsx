import { useState, useMemo } from 'react'
import { usePortalContext } from '../context'
import { useQuery } from '@tanstack/react-query'
import { portalService } from '../service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, Users, Clock, Info, Heart, MapPin, CalendarDays, ExternalLink } from 'lucide-react'
import { format, parseISO, startOfMonth, endOfMonth, isSameDay, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SeletorAluno } from '../components/SeletorAluno'
import { BotaoVoltar } from '../components/BotaoVoltar'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

const vibrate = (ms: number | number[] = 20) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
}

const AgendaSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-10 w-48 bg-slate-100 rounded-lg" />
      <div className="h-10 w-32 bg-slate-100 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 h-96 bg-white border border-slate-100 rounded-2xl shadow-sm" />
      <div className="lg:col-span-7 space-y-4">
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
    </div>
  </div>
)

export function PortalAgendaPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const { tenantId, isMultiAluno } = usePortalContext()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)

  // Intervalo de busca (mês atual visualizado no calendário)
  const dateRange = useMemo(() => ({
    start: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
    end: format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
  }), [currentMonth])

  const { data: eventos, isLoading } = useQuery({
    queryKey: ['portal', 'eventos', tenantId, dateRange.start, dateRange.end],
    queryFn: () => portalService.buscarEventos(tenantId!, dateRange.start, dateRange.end),
    enabled: !!tenantId
  })

  // Filtragem de eventos
  const eventosFiltrados = useMemo(() => {
    if (!eventos) return []
    if (!selectedDate) return eventos
    
    // Se uma data específica for selecionada no calendário
    return eventos.filter((ev: any) => isSameDay(parseISO(ev.data_inicio), selectedDate))
  }, [eventos, selectedDate])

  // Dias que possuem eventos (para marcadores no calendário)
  const diasComEvento = useMemo(() => {
    if (!eventos) return []
    return eventos.map((ev: any) => parseISO(ev.data_inicio))
  }, [eventos])

  const formatarDiaSemana = (dataStr: string) => {
    try { return format(parseISO(dataStr), "eeee", { locale: ptBR }) }
    catch { return '' }
  }

  const getDia = (dataStr: string) => dataStr.split('-')[2]
  const getMes = (dataStr: string) => {
    try { return format(parseISO(dataStr), "MMM", { locale: ptBR }) }
    catch { return '' }
  }

  const getEventStyle = (tipo: string) => {
    const styles: Record<string, string> = {
      'feriado': 'bg-red-50 text-red-600 border-red-100',
      'aula': 'bg-blue-50 text-blue-600 border-blue-100',
      'prova': 'bg-amber-50 text-amber-600 border-amber-100',
      'evento': 'bg-teal-50 text-teal-600 border-teal-100',
      'reuniao': 'bg-slate-50 text-slate-600 border-slate-100'
    }
    return styles[tipo.toLowerCase()] || 'bg-slate-50 text-slate-600 border-slate-100'
  }

  const getDotColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'feriado': 'bg-red-500',
      'aula': 'bg-blue-500',
      'prova': 'bg-amber-500',
      'evento': 'bg-teal-500',
      'reuniao': 'bg-slate-500'
    }
    return colors[tipo.toLowerCase()] || 'bg-slate-400'
  }

  if (isLoading) return <AgendaSkeleton />

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 font-sans">

      {/* Header */}
      {!hideHeader && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-3">
            <BotaoVoltar />
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">Agenda</h2>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Calendário Escolar e Eventos</p>
            </div>
          </div>
          {isMultiAluno && <SeletorAluno />}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Lado Esquerdo: Calendário */}
        <div className="lg:col-span-5 space-y-4 sticky top-4">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  vibrate(10)
                  setSelectedDate(date)
                }}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                locale={ptBR}
                className="w-full"
                modifiers={{
                  hasEvent: diasComEvento
                }}
                modifiersStyles={{
                  hasEvent: { 
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                    textDecorationColor: '#14b8a6',
                    textUnderlineOffset: '4px'
                  }
                }}
                components={{
                  DayButton: ({ day, modifiers, ...props }) => {
                    const hasEvent = diasComEvento.some(d => isSameDay(d, day.date))
                    return (
                      <div className="relative w-full h-full p-0 flex flex-col items-center justify-center">
                        <Button
                          {...props}
                          variant="ghost"
                          className={cn(
                            "h-8 w-8 p-0 font-medium transition-all rounded-full flex items-center justify-center hover:bg-slate-100 relative z-10 focus-visible:ring-0",
                            isSameDay(day.date, selectedDate || new Date()) ? "bg-teal-600 text-white hover:bg-teal-700" : "text-slate-700",
                            !isSameDay(day.date, new Date()) && !isSameDay(day.date, selectedDate || new Date()) && hasEvent ? "font-bold text-teal-600" : ""
                          )}
                        >
                          {format(day.date, 'd')}
                        </Button>
                        {hasEvent && !isSameDay(day.date, selectedDate || new Date()) && (
                          <div className="absolute bottom-1 w-1 h-1 bg-teal-500 rounded-full z-20" />
                        )}
                      </div>
                    )
                  }
                }}
              />
            </CardContent>
          </Card>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Legenda</h4>
             <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Evento', color: 'bg-teal-500' },
                  { label: 'Prova', color: 'bg-amber-500' },
                  { label: 'Feriado', color: 'bg-red-500' },
                  { label: 'Aula', color: 'bg-blue-500' }
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", item.color)} />
                    <span className="text-[10px] font-medium text-slate-600">{item.label}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Lado Direito: Listagem e Filtro */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-1 w-5 bg-teal-600 rounded-full" />
              <p className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                {selectedDate 
                  ? `Eventos em ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`
                  : 'Próximos Eventos'
                }
              </p>
            </div>
            {selectedDate && (
               <Button 
                variant="ghost" 
                size="sm" 
                className="text-[10px] uppercase font-bold text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                onClick={() => setSelectedDate(undefined)}
               >
                 Ver todos do mês
               </Button>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {eventosFiltrados && eventosFiltrados.length > 0 ? (
              <div className="space-y-4">
                {eventosFiltrados.map((evento: any, idx: number) => (
                  <motion.div
                    key={evento.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      vibrate(15)
                      setSelectedEvent(evento)
                    }}
                    className="group cursor-pointer"
                  >
                    <Card className="border border-slate-100 shadow-sm bg-white rounded-3xl overflow-hidden flex flex-col sm:flex-row hover:shadow-lg transition-all hover:border-teal-100 group">
                      
                      {/* Data Visual */}
                      <div className={cn(
                        "sm:w-20 flex sm:flex-col items-center justify-center p-4 text-white shrink-0 gap-2 sm:gap-0 transition-colors",
                        getDotColor(evento.tipo)
                      )}>
                         <span className="text-2xl font-bold leading-none">{getDia(evento.data_inicio)}</span>
                         <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">{getMes(evento.data_inicio)}</span>
                      </div>

                      <CardContent className="p-5 flex-1 relative">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <Badge className={cn("px-2 py-0 h-4 text-[9px] font-bold border-none shadow-none uppercase tracking-wider", getEventStyle(evento.tipo))}>
                                {evento.tipo || 'Evento'}
                              </Badge>
                              <h3 className="text-base font-bold text-slate-800 leading-tight group-hover:text-teal-600 transition-colors">
                                {evento.titulo || evento.nome}
                              </h3>
                            </div>
                            {evento.publico_alvo === 'toda_escola' && (
                              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-500">
                                <Heart size={14} className="fill-current" />
                              </div>
                            )}
                          </div>
                          
                          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                            {evento.description || evento.descricao || 'Atividade escolar programada para esta data.'}
                          </p>
                          
                          <div className="flex flex-wrap gap-4 pt-2">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                              <div className={cn("w-1.5 h-1.5 rounded-full", getDotColor(evento.tipo))} />
                              {formatarDiaSemana(evento.data_inicio)}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                              <Clock size={12} className="text-slate-300" />
                              {format(parseISO(evento.data_inicio), "HH:mm")}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-50 p-16 rounded-[40px] border-2 border-dashed border-slate-200 text-center space-y-4">
                <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm text-slate-200">
                  <CalendarIcon size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800">Sem eventos {selectedDate ? 'nesta data' : 'este mês'}</h3>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto">Tente selecionar outra data ou navegar entre os meses no calendário.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Informativo */}
      <div className="bg-slate-900 rounded-[32px] p-6 text-white flex flex-col md:flex-row items-center gap-6 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-teal-500/20">
          <Info size={24} />
        </div>
        <div className="flex-1 text-center md:text-left space-y-1">
          <h5 className="text-sm font-bold text-teal-400">Sincronização Ativa</h5>
          <p className="text-xs text-slate-400 leading-relaxed">
            Mantenha-se atualizado com as atividades escolares. Clique em um evento para ver detalhes e opções de compartilhamento.
          </p>
        </div>
        <Button className="bg-white text-slate-900 hover:bg-slate-100 rounded-full px-6 font-bold text-xs shrink-0">
          Como funciona?
        </Button>
      </div>

      {/* Modal de Detalhes do Evento */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
          {selectedEvent && (
            <>
              <div className={cn("h-32 p-8 flex items-end relative", getDotColor(selectedEvent.tipo))}>
                 <div className="absolute top-4 right-12 z-10">
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md uppercase text-[10px] font-bold">
                       {selectedEvent.tipo}
                    </Badge>
                 </div>
                 <h2 className="text-2xl font-black text-white leading-tight drop-shadow-md">
                   {selectedEvent.titulo || selectedEvent.nome}
                 </h2>
              </div>
              
              <div className="p-8 space-y-6 bg-white">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-slate-600">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                      <CalendarDays size={18} className="text-teal-600" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quando</p>
                      <p className="text-sm font-bold">{format(parseISO(selectedEvent.data_inicio), "dd 'de' MMMM", { locale: ptBR })}</p>
                      <p className="text-xs text-slate-500">{formatarDiaSemana(selectedEvent.data_inicio)}, às {format(parseISO(selectedEvent.data_inicio), "HH:mm")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-slate-600">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-teal-600" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Local/Público</p>
                      <p className="text-sm font-bold capitalize">{selectedEvent.publico_alvo?.replace('_', ' ') || 'Toda a escola'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Descrição</p>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {selectedEvent.description || selectedEvent.descricao || 'Este evento é parte do calendário institucional. Verifique regularmente para atualizações ou alterações de horários.'}
                    </p>
                  </div>
                </div>

                <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className="w-full rounded-2xl font-bold text-xs h-12 border-slate-200" onClick={() => setSelectedEvent(null)}>
                    Fechar
                  </Button>
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs h-12 gap-2">
                    <ExternalLink size={14} />
                    Adicionar à Agenda
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

