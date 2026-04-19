import { useQuery } from '@tanstack/react-query'
import { portalService } from '../service'
import { usePortalContext } from '../context'
import { BookOpen, Calendar, Clock, Info, Search, LayoutList, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SeletorAluno } from '../components/SeletorAluno'
import { BotaoVoltar } from '../components/BotaoVoltar'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Helper de vibração
const _vibrate = (ms: number | number[] = 20) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

const PlanosSkeleton = () => (
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

export function PortalPlanosAulaPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const { alunoSelecionado, tenantId, isMultiAluno } = usePortalContext()
  const [busca, setBusca] = useState('')

  const { data: planos, isLoading } = useQuery({
    queryKey: ['portal', 'planos-aula', tenantId, alunoSelecionado?.id],
    queryFn: () => portalService.buscarPlanosAula(alunoSelecionado!.id, tenantId!),
    enabled: !!tenantId && !!alunoSelecionado?.id,
  })

  if (isLoading) return <PlanosSkeleton />

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 space-y-6">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
          <LayoutList className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-800 tracking-tighter italic uppercase">Contexto Não Definido</h2>
          <p className="text-sm text-slate-400 font-medium">Selecione um aluno para acessar os planos de aula.</p>
        </div>
      </div>
    )
  }

  const planosFiltrados = planos?.filter((p: any) => 
    p.plano?.disciplina?.toLowerCase().includes(busca.toLowerCase()) || 
    p.plano?.conteudo_previsto?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-700 font-sans">

      {/* 1. Header & Filtro */}
      {!hideHeader && (
        <div className="flex flex-col gap-4 px-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <BotaoVoltar />
              <h2 className="text-3xl font-black tracking-tighter text-slate-800 italic uppercase">Planos de Aula</h2>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Conteúdos Pedagógicos</p>
            </div>
          </div>
          {isMultiAluno && <SeletorAluno />}
        </div>
      )}

      {/* 2. Hero Section */}
      <div className="bg-indigo-600 p-8 rounded-[40px] shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-6 items-center justify-between text-white mx-1 border border-indigo-500">
        <div className="absolute -top-16 -right-16 opacity-10 pointer-events-none rotate-12">
           <LayoutList size={280} />
        </div>

        <div className="relative z-10 space-y-3 text-center md:text-left">
           <h2 className="text-3xl font-black tracking-tighter italic leading-none uppercase">Diário de Classe</h2>
           <p className="text-indigo-100 font-bold italic opacity-80 max-w-sm text-sm">
             Acompanhe o que está sendo ensinado em cada disciplina.
           </p>
        </div>

        <div className="relative z-10 w-full md:w-auto min-w-[280px]">
           <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-300" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar disciplina ou conteúdo..."
                className="pl-14 bg-white/10 border-white/20 text-white placeholder:text-indigo-200/50 rounded-[24px] h-12 focus:bg-white/20 transition-all border-2 text-sm font-bold italic focus:ring-0"
              />
           </div>
        </div>
      </div>

      {/* 3. Listagem */}
      {!planosFiltrados || planosFiltrados.length === 0 ? (
        <div className="bg-slate-50/50 rounded-[40px] border-4 border-dashed border-slate-100 p-16 text-center flex flex-col items-center justify-center space-y-4 mx-1">
          <LayoutList size={48} className="text-slate-200" />
          <h3 className="text-xl font-black text-slate-800 italic uppercase">Nenhum plano encontrado</h3>
          <p className="text-xs text-slate-400 font-medium italic">Os planos de aula para este período ainda não foram registrados.</p>
        </div>
      ) : (
        <div className="space-y-4 px-1">
          <AnimatePresence mode="popLayout">
            {planosFiltrados.map((item: any, idx: number) => (
              <motion.div
                key={item.plano?.id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden p-6 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">{item.plano?.disciplina}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-500 font-bold uppercase text-[8px] py-1 px-3 rounded-full">
                          {item.turno || 'Turno N/A'}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 italic flex items-center gap-1">
                          <Clock size={12} /> {item.horario || '--:--'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
                      <Calendar size={14} className="text-indigo-400" />
                      <span className="text-xs font-black uppercase italic">
                        {item.plano?.data_aula ? format(parseISO(item.plano.data_aula), "dd 'de' MMM", { locale: ptBR }) : '--/--'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 space-y-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-1.5">
                      <Info size={10} className="text-indigo-400" /> Conteúdo Previsto
                    </p>
                    <p className="text-xs font-bold text-slate-600 italic leading-relaxed">
                      {item.plano?.conteudo_previsto || 'Não informado.'}
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 space-y-2">
                    <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest italic flex items-center gap-1.5">
                      <CheckCircle size={10} /> Conteúdo Realizado
                    </p>
                    <p className="text-xs font-bold text-slate-600 italic leading-relaxed">
                      {item.plano?.conteudo_realizado || 'Aguardando registro do professor.'}
                    </p>
                  </div>
                </div>

                {item.plano?.observacoes && (
                  <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100/50 flex gap-3">
                    <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest italic">Observações</p>
                      <p className="text-xs font-bold text-slate-500 italic leading-relaxed">{item.plano.observacoes}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

const CheckCircle = ({ size = 16, className }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
)
