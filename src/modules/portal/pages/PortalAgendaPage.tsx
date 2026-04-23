import { useState, useMemo } from 'react'
import { usePortalContext } from '../context'
import { useQuery } from '@tanstack/react-query'
import { portalService } from '../service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, Users, Clock, Info, Heart, MapPin, CalendarDays, ExternalLink, CheckCircle2 } from 'lucide-react'
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

  const getDia = (dataStr: string) => {
    try { return format(parseISO(dataStr), "dd") }
    catch { return '01' }
  }

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
    const safeTipo = (tipo || 'evento').toLowerCase()
    return styles[safeTipo] || 'bg-slate-50 text-slate-600 border-slate-100'
  }

  const isPassado = (dataStr: string) => {
    try {
      const dataEvento = parseISO(dataStr)
      return dataEvento < startOfDay(new Date())
    } catch { return false }
  }

  const getDotColor = (tipo: string, passado?: boolean) => {
    if (passado) return 'bg-slate-300'
    const colors: Record<string, string> = {
      'feriado': 'bg-red-500',
      'aula': 'bg-blue-500',
      'prova': 'bg-amber-500',
      'evento': 'bg-teal-500',
      'reuniao': 'bg-slate-500'
    }
    const safeTipo = (tipo || 'evento').toLowerCase()
    return colors[safeTipo] || 'bg-slate-400'
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
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  vibrate(10)
                  setSelectedDate(date)
                  // Scroll suave para a lista no mobile ao selecionar data
                  if (window.innerWidth < 1024) {
                    const listElement = document.getElementById('lista-eventos-agenda')
                    if (listElement) listElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
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
        <div className="lg:col-span-7 space-y-6" id="lista-eventos-agenda">
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
                    <Card className={cn(
                      "border border-slate-100 shadow-sm bg-white rounded-3xl overflow-hidden flex flex-row hover:shadow-xl transition-all hover:border-teal-100 group min-h-[120px] p-0 gap-0",
                      isPassado(evento.data_inicio) && "border-slate-200"
                    )}>
                      
                      {/* Data Visual - Design Nativo 100% altura horizontal */}
                      <div className={cn(
                        "w-20 sm:w-24 flex flex-col items-center justify-center p-4 sm:p-6 text-white shrink-0 gap-0 transition-colors relative self-stretch",
                        getDotColor(evento.tipo, isPassado(evento.data_inicio)),
                        isPassado(evento.data_inicio) ? "bg-slate-400" : ""
                      )}>
                         <span className="text-2xl sm:text-3xl font-black leading-none">{getDia(evento.data_inicio)}</span>
                         <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.2em] opacity-90">{getMes(evento.data_inicio)}</span>
                      </div>
 
                      <CardContent className="p-4 sm:p-6 flex-1 relative flex flex-col justify-between overflow-hidden">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-wrap gap-2">
                              <Badge className={cn(
                                "px-2 py-0.5 h-auto text-[9px] font-bold border-none shadow-none uppercase tracking-wider rounded-full", 
                                getEventStyle(evento.tipo)
                              )}>
                                {evento.tipo || 'Evento'}
                              </Badge>
                              
                              {isPassado(evento.data_inicio) && (
                                <Badge className="bg-slate-100 text-slate-500 px-2 py-0.5 h-auto text-[9px] font-bold border-none shadow-none uppercase tracking-wider rounded-full flex items-center gap-1">
                                  <Clock size={8} /> Finalizado
                                </Badge>
                              )}
                            </div>

                            {evento.publico_alvo === 'toda_escola' && (
                              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shadow-sm">
                                <Heart size={14} className="fill-current" />
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <h3 className="text-lg font-black text-slate-800 leading-tight group-hover:text-teal-600 transition-colors">
                              {evento.titulo || evento.nome}
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 font-medium">
                              {evento.description || evento.descricao || 'Atividade escolar programada para esta data.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                              <CalendarDays size={12} className="text-slate-400" />
                              {formatarDiaSemana(evento.data_inicio)}
                            </div>
                            <div className="h-1 w-1 bg-slate-300 rounded-full" />
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                              <Clock size={12} className="text-slate-400" />
                              {evento.hora_inicio ? (
                                <>
                                  {evento.hora_inicio.slice(0, 5)}
                                  {evento.hora_fim && ` - ${evento.hora_fim.slice(0, 5)}`}
                                </>
                              ) : (
                                format(parseISO(evento.data_inicio), "HH:mm")
                              )}
                            </div>
                          </div>

                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 rounded-full hover:bg-teal-50 hover:text-teal-600 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          >
                            <Info size={16} />
                          </Button>
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
           <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl bg-white focus-visible:ring-0">
          {selectedEvent && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col h-full"
            >
              {/* Header Sólido e Vibrante */}
              <div className={cn(
                "h-48 p-8 flex flex-col justify-end relative overflow-hidden", 
                isPassado(selectedEvent.data_inicio) ? "bg-slate-700" : getDotColor(selectedEvent.tipo)
              )}>
                 {/* Decorativo de fundo */}
                 <div className="absolute top-0 right-0 opacity-10 -mr-10 -mt-10">
                    <CalendarIcon size={200} className="text-white" />
                 </div>

                 <div className="flex justify-between items-start mb-4 relative z-10">
                    <Badge className="bg-white text-slate-900 border-none px-3 py-1 uppercase text-[10px] font-black tracking-widest shadow-lg">
                       {selectedEvent.tipo || 'Evento'}
                    </Badge>
                    
                    {isPassado(selectedEvent.data_inicio) ? (
                      <Badge className="bg-red-500 text-white border-none px-3 py-1 uppercase text-[10px] font-black tracking-widest shadow-lg flex items-center gap-1.5">
                        <Clock size={10} /> Finalizado
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500 text-white border-none px-3 py-1 uppercase text-[10px] font-black tracking-widest shadow-lg flex items-center gap-1.5">
                        <CheckCircle2 size={10} /> Confirmado
                      </Badge>
                    )}
                 </div>

                 <h2 className="text-3xl font-black text-white leading-tight relative z-10 tracking-tighter">
                   {selectedEvent.titulo || selectedEvent.nome}
                 </h2>
              </div>
              
              <div className="p-8 space-y-8 bg-white relative -mt-6 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <div className="grid grid-cols-1 gap-6">
                  {/* Data e Hora */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center shrink-0 shadow-sm border border-teal-100">
                      <CalendarDays size={20} className="text-teal-600" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Data e Horário</p>
                      <p className="text-base font-bold text-slate-800 leading-tight">
                        {selectedEvent.data_inicio ? format(parseISO(selectedEvent.data_inicio), "dd 'de' MMMM", { locale: ptBR }) : 'Data Indeterminada'}
                      </p>
                      <p className="text-sm font-medium text-slate-500">
                        {selectedEvent.data_inicio ? (
                          <>
                            {formatarDiaSemana(selectedEvent.data_inicio)}, às{' '}
                            {selectedEvent.hora_inicio ? (
                              <>
                                {selectedEvent.hora_inicio.slice(0, 5)}
                                {selectedEvent.hora_fim && ` às ${selectedEvent.hora_fim.slice(0, 5)}`}
                              </>
                            ) : (
                              format(parseISO(selectedEvent.data_inicio), "HH:mm")
                            )}
                          </>
                        ) : 'Consulte a secretaria'}
                      </p>
                    </div>
                  </div>

                  {/* Local */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 shadow-sm border border-indigo-100">
                      <MapPin size={20} className="text-indigo-600" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Onde será</p>
                      <p className="text-base font-bold text-slate-800 leading-tight">
                        {selectedEvent.local || 'Local não definido'}
                      </p>
                      <p className="text-sm font-medium text-slate-500 capitalize">
                        Público: {selectedEvent.publico_alvo?.replace('_', ' ') || 'Toda a escola'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-4 bg-teal-500 rounded-full" />
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Sobre o Evento</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 italic relative">
                    <p className="text-[15px] text-slate-600 leading-relaxed font-medium">
                      "{selectedEvent.description || selectedEvent.descricao || 'Este evento é parte integrante do nosso cronograma escolar. Contamos com a sua participação para tornar este momento ainda mais especial.'}"
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <Button 
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm h-14 gap-3 shadow-xl shadow-slate-100 active:scale-[0.98] transition-all"
                  >
                    <ExternalLink size={18} />
                    ADICIONAR À MINHA AGENDA
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full rounded-2xl font-bold text-slate-400 hover:text-slate-600 h-12 text-xs uppercase tracking-widest" 
                    onClick={() => setSelectedEvent(null)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  </div>
  )
}
