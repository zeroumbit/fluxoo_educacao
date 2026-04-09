import { useState, useMemo } from 'react'
import { useAuth } from '@/modules/auth/AuthContext'
import { useAgendaDiaria } from '@/modules/professor/hooks'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Loader2, Calendar, Search, Clock, Check, X, MapPin, ChevronRight, Filter
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function ProfessorAgendaPage() {
  const { authUser } = useAuth()
  const { data: agenda, isLoading } = useAgendaDiaria()
  const [busca, setBusca] = useState('')

  const aulasFiltradas = useMemo(() => {
    if (!agenda) return []
    return agenda.filter((aula: any) =>
      aula.turma_nome?.toLowerCase().includes(busca.toLowerCase()) ||
      aula.disciplina_nome?.toLowerCase().includes(busca.toLowerCase())
    )
  }, [agenda, busca])

  const aulasHoje = agenda?.length || 0
  const chamadasPendentes = agenda?.filter((a: any) => !a.chamada_realizada).length || 0

  if (isLoading) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-zinc-100 rounded-full" />
          <Loader2 className="w-16 h-16 animate-spin text-zinc-900 absolute top-0 left-0 border-4 border-transparent border-t-zinc-900 rounded-full" />
        </div>
        <p className="text-sm font-black uppercase tracking-widest text-zinc-400">Carregando Agenda...</p>
      </div>
    )
  }

  const dataAtual = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <div className="flex flex-col min-h-full">
      {/* Header Nativo Premium */}
      <div className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-zinc-200/50 px-6 pt-safe pb-4 flex flex-col gap-1 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Minha Agenda</h1>
          <div className="w-10 h-10 bg-zinc-100 rounded-2xl flex items-center justify-center active:scale-95 transition-transform">
             <Filter className="w-5 h-5 text-zinc-600" />
          </div>
        </div>
        <p className="text-[13px] text-zinc-500 font-bold uppercase tracking-widest leading-none opacity-70">
          {dataAtual}
        </p>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Stats Summary Chips */}
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          <div className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-3 rounded-[24px] shadow-lg shadow-zinc-200 shrink-0">
            <Calendar className="w-4 h-4 opacity-70" />
            <span className="text-sm font-black">{aulasHoje} Aulas</span>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-[24px] border shrink-0 transition-all",
            chamadasPendentes > 0 ? "bg-orange-50 border-orange-100 text-orange-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"
          )}>
            <Clock className="w-4 h-4 opacity-70" />
            <span className="text-sm font-black">{chamadasPendentes} Pendências</span>
          </div>
          <div className="flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-[24px] text-zinc-600 shrink-0">
            <Check className="w-4 h-4 opacity-70 text-emerald-500" />
            <span className="text-sm font-black">Próxima: 13:30</span>
          </div>
        </div>

        {/* Busca Tátil */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
          <input 
            type="text"
            placeholder="Filtrar por turma ou matéria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full h-14 pl-11 pr-4 bg-white border border-zinc-200 rounded-3xl text-[15px] font-medium focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all shadow-sm"
          />
        </div>

        {/* Timeline List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {aulasFiltradas.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 bg-white rounded-[40px] border border-zinc-100 shadow-sm"
              >
                <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-inner">
                  <Calendar className="w-10 h-10 text-zinc-300" />
                </div>
                <h3 className="text-zinc-900 text-lg font-black tracking-tight">Dia Livre!</h3>
                <p className="text-zinc-500 text-sm font-medium">Nenhuma aula encontrada para hoje.</p>
              </motion.div>
            ) : (
              aulasFiltradas.map((aula: any, index: number) => (
                <motion.div
                  key={aula.grade_id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", damping: 20, stiffness: 100, delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden border-none shadow-sm transition-all active:scale-[0.98] cursor-pointer rounded-[32px] bg-white ring-1 ring-zinc-100">
                    <CardContent className="p-0">
                      <div className="flex items-stretch min-h-[120px]">
                        {/* Indicador Lateral de Horário */}
                        <div className="w-20 bg-zinc-50 flex flex-col items-center justify-center border-r border-zinc-100/50 gap-1">
                          <span className="text-xs font-black text-zinc-400 uppercase tracking-tighter">Início</span>
                          <span className="text-lg font-black text-zinc-900 leading-none">{aula.hora_inicio}</span>
                          <div className="h-4 w-[2px] bg-zinc-200 rounded-full my-0.5" />
                          <span className="text-xs font-bold text-zinc-400">{aula.hora_fim}</span>
                        </div>

                        {/* Conteúdo Principal */}
                        <div className="flex-1 p-5 flex flex-col justify-between gap-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <h3 className="font-black text-[17px] text-zinc-900 leading-tight truncate">
                                {aula.disciplina_nome}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-0.5 opacity-60">
                                <MapPin size={12} className="text-zinc-500" />
                                <span className="text-[11px] font-bold uppercase tracking-wider">{aula.sala || 'Sala não inf.'}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                               <Badge className="bg-zinc-100 text-zinc-700 border-none px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest">
                                 {aula.turma_nome}
                               </Badge>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              {aula.chamada_realizada ? (
                                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg ring-1 ring-emerald-100 shadow-sm">
                                  <Check className="w-3 h-3" />
                                  <span className="text-[9px] font-black uppercase tracking-wider">Chamada OK</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded-lg ring-1 ring-red-100 shadow-sm">
                                  <X className="w-3 h-3" />
                                  <span className="text-[9px] font-black uppercase tracking-wider">Pendente</span>
                                </div>
                              )}
                              {aula.conteudo_registrado && (
                                <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg ring-1 ring-indigo-100">
                                  <Check className="w-3 h-3" />
                                  <span className="text-[9px] font-black uppercase tracking-wider">Conteúdo</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300">
                              <ChevronRight size={18} strokeWidth={3} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default ProfessorAgendaPage
