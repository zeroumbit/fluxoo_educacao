import { useQuery } from '@tanstack/react-query'
import { portalService } from '../service'
import { usePortalContext } from '../context'
import { PencilLine, Calendar, Clock, Info, Search, LayoutList, Trophy, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SeletorAluno } from '../components/SeletorAluno'
import { BotaoVoltar } from '../components/BotaoVoltar'
import { format, parseISO, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Helper de vibração
const _vibrate = (ms: number | number[] = 20) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

const AtividadesSkeleton = () => (
  <div className="space-y-6 animate-pulse px-1">
    <div className="h-8 w-48 bg-slate-100 rounded-lg" />
    <div className="h-32 bg-indigo-600 rounded-[40px]" />
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-40 bg-white border border-slate-50 rounded-[32px]" />
      ))}
    </div>
  </div>
)

export function PortalAtividadesPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const { alunoSelecionado, tenantId, isMultiAluno } = usePortalContext()
  const [busca, setBusca] = useState('')

  const { data: atividades, isLoading } = useQuery({
    queryKey: ['portal', 'atividades', tenantId, alunoSelecionado?.id],
    queryFn: () => portalService.buscarAtividades(alunoSelecionado!.id, tenantId!),
    enabled: !!tenantId && !!alunoSelecionado?.id,
  })

  if (isLoading) return <AtividadesSkeleton />

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 space-y-6">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
          <PencilLine className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-800 tracking-tighter italic uppercase">Contexto Não Definido</h2>
          <p className="text-sm text-slate-400 font-medium">Selecione um aluno para acessar as atividades.</p>
        </div>
      </div>
    )
  }

  const atividadesFiltradas = atividades?.filter((item: any) => 
    item.atividade?.titulo?.toLowerCase().includes(busca.toLowerCase()) || 
    item.atividade?.tipo?.toLowerCase().includes(busca.toLowerCase())
  )

  const getTipoBadge = (tipo: string) => {
    const tipos: Record<string, string> = {
      'prova': 'bg-red-50 text-red-600 border-red-100',
      'trabalho': 'bg-indigo-50 text-indigo-600 border-indigo-100',
      'atividade': 'bg-emerald-50 text-emerald-600 border-emerald-100',
      'projeto': 'bg-amber-50 text-amber-600 border-amber-100',
      'licao_casa': 'bg-blue-50 text-blue-600 border-blue-100'
    }
    return tipos[tipo.toLowerCase()] || 'bg-slate-50 text-slate-600 border-slate-100'
  }

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-700 font-sans">

      {/* 1. Header & Filtro */}
      {!hideHeader && (
        <div className="flex flex-col gap-4 px-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <BotaoVoltar />
              <h2 className="text-3xl font-black tracking-tighter text-slate-800 italic uppercase">Atividades</h2>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Avaliações & Tarefas</p>
            </div>
          </div>
          {isMultiAluno && <SeletorAluno />}
        </div>
      )}

      {/* 2. Hero Section */}
      <div className="bg-indigo-600 p-8 rounded-[40px] shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-6 items-center justify-between text-white mx-1 border border-indigo-500">
        <div className="absolute -top-16 -right-16 opacity-10 pointer-events-none rotate-12">
           <PencilLine size={280} />
        </div>

        <div className="relative z-10 space-y-3 text-center md:text-left">
           <h2 className="text-3xl font-black tracking-tighter italic leading-none uppercase">Central de Tarefas</h2>
           <p className="text-indigo-100 font-bold italic opacity-80 max-w-sm text-sm">
             Acompanhe prazos, avaliações e lições programadas.
           </p>
        </div>

        <div className="relative z-10 w-full md:w-auto min-w-[280px]">
           <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-300" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar atividade..."
                className="pl-14 bg-white/10 border-white/20 text-white placeholder:text-indigo-200/50 rounded-[24px] h-12 focus:bg-white/20 transition-all border-2 text-sm font-bold italic focus:ring-0"
              />
           </div>
        </div>
      </div>

      {/* 3. Listagem */}
      {!atividadesFiltradas || atividadesFiltradas.length === 0 ? (
        <div className="bg-slate-50/50 rounded-[40px] border-4 border-dashed border-slate-100 p-16 text-center flex flex-col items-center justify-center space-y-4 mx-1">
          <LayoutList size={48} className="text-slate-200" />
          <h3 className="text-xl font-black text-slate-800 italic uppercase">Nenhuma atividade</h3>
          <p className="text-xs text-slate-400 font-medium italic">Não há tarefas ou avaliações registradas para este período.</p>
        </div>
      ) : (
        <div className="space-y-4 px-1">
          <AnimatePresence mode="popLayout">
            {atividadesFiltradas.map((item: any, idx: number) => {
              const dataEntrega = item.atividade?.data_entrega ? parseISO(item.atividade.data_entrega) : null;
              const isVencida = dataEntrega && isAfter(new Date(), dataEntrega);
              
              return (
                <motion.div
                  key={item.atividade?.id || idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group active:scale-[0.99]"
                >
                  <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                    {/* Lateral Date Section */}
                    <div className="flex md:flex-col items-center justify-center gap-2 md:w-20 shrink-0 md:border-r border-slate-100 pr-0 md:pr-6">
                       <p className="text-3xl font-black text-slate-800 leading-none">
                          {dataEntrega ? format(dataEntrega, "dd") : '--'}
                       </p>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                          {dataEntrega ? format(dataEntrega, "MMM", { locale: ptBR }) : '---'}
                       </p>
                       {isVencida && (
                         <div className="mt-2 text-red-500 hidden md:block">
                           <AlertTriangle size={16} />
                         </div>
                       )}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2">
                           <div className="flex flex-wrap gap-2">
                              <Badge className={cn("border-none font-black uppercase text-[8px] tracking-[0.15em] py-1 px-3 rounded-full shadow-none", getTipoBadge(item.atividade?.tipo || ''))}>
                                 {item.atividade?.tipo || 'Geral'}
                              </Badge>
                              {item.atividade?.pontuacao_maxima && (
                                <Badge className="bg-amber-50 text-amber-600 border-none font-black uppercase text-[8px] tracking-[0.15em] py-1 px-3 rounded-full flex items-center gap-1.5 shadow-none">
                                   <Trophy size={10} /> {item.atividade.pontuacao_maxima} Pontos
                                </Badge>
                              )}
                           </div>
                           <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-tight group-hover:text-indigo-600 transition-colors">
                             {item.atividade?.titulo}
                           </h3>
                        </div>
                        <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0">
                           <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
                              <Clock size={12} className="text-indigo-400" />
                              <span className="text-[10px] font-black uppercase italic tracking-widest">
                                {item.horario || '--:--'}
                              </span>
                           </div>
                        </div>
                      </div>

                      <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100/50 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                          <Info size={12} className="text-indigo-400" /> Detalhes & Instruções
                        </p>
                        <p className="text-sm font-bold text-slate-600 italic leading-relaxed">
                          {item.atividade?.descricao || 'Sem descrição detalhada. Consulte o professor em sala.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
                           <Calendar size={12} className="text-slate-300" />
                           Entrega até: {dataEntrega ? format(dataEntrega, "dd/MM/yyyy") : 'N/A'}
                        </div>
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
                           <LayoutList size={12} className="text-slate-300" />
                           {item.turno || 'Integral'}
                        </div>
                     </div>
                     <button className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-600 hover:text-indigo-700 italic flex items-center gap-1.5 transition-colors">
                        Sincronizar com Agenda <Calendar size={12} />
                     </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
