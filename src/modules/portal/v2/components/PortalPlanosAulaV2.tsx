import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import { BookMarked, Calendar, ChevronRight, Clock, MapPin, X, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePlanosAulaPortal } from '../../hooks';

export function PortalPlanosAulaV2() {
  const { data: planos, isLoading } = usePlanosAulaPortal();
  const [selectedPlano, setSelectedPlano] = useState<any | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 font-bold text-slate-500">Carregando planos de aula...</p>
      </div>
    );
  }

  if (!planos || planos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
          <BookMarked className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">Sem planos de aula disponíveis</h3>
        <p className="text-slate-500 max-w-xs font-semibold">Os planos de aula e objetivos pedagógicos aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 relative">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Planos de Aula</h2>
        <p className="text-slate-500 font-semibold uppercase text-[10px] tracking-widest mt-1">Planejamento Pedagógico & Objetivos</p>
      </div>

      <div className="space-y-6">
        {planos.map((item: any, idx: number) => {
          const { plano } = item;
          if (!plano) return null;
          
          return (
            <motion.div
              key={plano.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedPlano(plano)}
              className="group flex flex-col md:flex-row items-center cursor-pointer relative"
            >
              {/* Data Sidebar (Timeline) */}
              <div className="w-24 md:w-32 flex flex-col items-end md:items-center pr-6 border-r-2 border-slate-100 group-hover:border-emerald-500 transition-colors py-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">
                  {format(parseISO(plano.data_aula), 'EEEE', { locale: ptBR }).split('-')[0]}
                </span>
                <span className="text-2xl font-black text-slate-800 group-hover:text-emerald-600 transition-colors leading-none my-1">
                  {format(parseISO(plano.data_aula), 'dd/MM')}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {format(parseISO(plano.data_aula), 'yyyy')}
                </span>
              </div>

              {/* Card Conteúdo */}
              <div className="flex-1 ml-6 bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm group-hover:shadow-md hover:border-emerald-200 transition-all flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                      {plano.disciplina || 'Geral'}
                    </span>
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{item.turno || 'Integral'}</span>
                    </div>
                  </div>
                  <h4 className="text-lg font-black text-slate-800 tracking-tight mb-1 group-hover:text-emerald-700 transition-colors">
                    {plano.titulo}
                  </h4>
                  <p className="text-sm font-medium text-slate-500 line-clamp-1 italic max-w-md">
                    {plano.objetivos || 'Acesse para ver os objetivos pedagógicos da aula.'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-inner">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </div>

              {/* Floating Dot (Timeline) */}
              <div className="hidden md:block absolute left-[31px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-4 border-slate-100 group-hover:border-emerald-500 transition-colors z-10" />
            </motion.div>
          );
        })}
      </div>

      {/* Modal Lateral (Details Sidebar) */}
      <AnimatePresence>
        {selectedPlano && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPlano(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 p-10 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Info className="w-6 h-6" />
                </div>
                <button 
                  onClick={() => setSelectedPlano(null)}
                  className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-xl mb-6 inline-block">
                Plano de Aula Detalhado
              </span>

              <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-tight mb-8 pr-12">
                {selectedPlano.titulo}
              </h3>

              <div className="space-y-10">
                 <section>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                       <BookMarked className="w-3.5 h-3.5" /> Objetivos Pedagógicos
                    </h5>
                    <p className="text-base font-medium text-slate-600 leading-relaxed bg-slate-50/50 p-6 rounded-[32px] border border-slate-100">
                       {selectedPlano.objetivos || 'Objetivos não especificados para esta aula.'}
                    </p>
                 </section>

                 <section>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Conteúdo Programático</h5>
                      <div className="text-base font-semibold text-slate-500 leading-relaxed prose prose-slate max-w-none">
                        {selectedPlano.conteudo ? (
                          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedPlano.conteudo) }} />
                        ) : 'Nenhum conteúdo adicional cadastrado.'}
                      </div>
                 </section>

                 <div className="grid grid-cols-2 gap-4 pt-10 border-t border-slate-100">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Data da Aula</span>
                       <span className="text-sm font-black text-slate-800">{format(parseISO(selectedPlano.data_aula), 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Disciplina</span>
                       <span className="text-sm font-black text-emerald-600">{selectedPlano.disciplina || 'Base Comum'}</span>
                    </div>
                 </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
