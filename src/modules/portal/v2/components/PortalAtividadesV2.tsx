import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutList, Calendar, Clock, ChevronRight, X, Info, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAtividadesPortal } from '../../hooks';

export function PortalAtividadesV2() {
  const { data: atividades, isLoading } = useAtividadesPortal();
  const [selectedAtv, setSelectedAtv] = useState<any | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 font-bold text-slate-500">Carregando atividades escolares...</p>
      </div>
    );
  }

  if (!atividades || atividades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
          <LayoutList className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">Sem atividades pendentes</h3>
        <p className="text-slate-500 max-w-xs font-semibold">Trabalhos, provas e lições de casa aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 relative">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Atividades Escolares</h2>
        <p className="text-slate-500 font-semibold uppercase text-[10px] tracking-widest mt-1">Trabalhos, Provas & Lição de Casa</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {atividades.map((item: any, idx: number) => {
          const { atividade } = item;
          if (!atividade) return null;

          const isVencida = new Date(atividade.data_entrega) < new Date();
          const tipoColor = atividade.tipo === 'prova' ? 'bg-rose-50 text-rose-600' : 'bg-orange-50 text-orange-600';

          return (
            <motion.div
              key={atividade.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedAtv(atividade)}
              className="group bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                 <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-2">
                       <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${tipoColor}`}>
                          {atividade.tipo || 'Atividade'}
                       </span>
                       <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl">
                          {item.turno || 'Integral'}
                       </span>
                    </div>
                    <div className="w-12 h-12 rounded-[20px] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-inner">
                       <ChevronRight className="w-6 h-6" />
                    </div>
                 </div>

                 <h4 className="text-xl font-black text-slate-800 tracking-tight mb-2 group-hover:text-orange-700 transition-colors">
                    {atividade.titulo}
                 </h4>
                 
                 <p className="text-sm font-medium text-slate-500 line-clamp-2 italic mb-6">
                    {atividade.descricao || 'Clique para ver os detalhes e orientações desta atividade.'}
                 </p>
              </div>

              <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isVencida ? 'bg-rose-50 text-rose-500' : 'bg-orange-50 text-orange-500'}`}>
                       <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Entrega</p>
                       <p className={`text-xs font-black ${isVencida ? 'text-rose-600' : 'text-slate-800'}`}>
                          {format(parseISO(atividade.data_entrega), "dd 'de' MMM", { locale: ptBR })}
                       </p>
                    </div>
                 </div>

                 {atividade.pontuacao_maxima && (
                   <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pontuação</span>
                      <span className="text-xs font-black text-emerald-600">{atividade.pontuacao_maxima} Pontos</span>
                   </div>
                 )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedAtv && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAtv(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 h-[85vh] bg-white rounded-t-[64px] shadow-2xl z-50 overflow-hidden"
            >
              <div className="h-full flex flex-col md:flex-row">
                 {/* Sidebar Decorativa (Mobile Top / Web Left) */}
                 <div className="w-full md:w-1/3 bg-orange-500 p-12 flex flex-col justify-between text-white relative overflow-hidden">
                    <motion.div 
                       initial={{ opacity: 0, scale: 0.5 }}
                       animate={{ opacity: 0.1, scale: 1.5 }}
                       className="absolute -bottom-20 -right-20 w-80 h-80 bg-white rounded-full" 
                    />
                    
                    <div>
                       <div className="w-16 h-16 rounded-[24px] bg-white/20 backdrop-blur-xl flex items-center justify-center mb-10 border border-white/30">
                          <FileText className="w-8 h-8" />
                       </div>
                       <h3 className="text-3xl font-black tracking-tight leading-tight mb-4">
                          {selectedAtv.titulo}
                       </h3>
                       <span className="px-4 py-2 bg-white/20 backdrop-blur-xl text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/20 inline-block">
                          {selectedAtv.tipo || 'ATIVIDADE ESCOLAR'}
                       </span>
                    </div>

                    <div className="bg-white/10 backdrop-blur-xl rounded-[32px] p-6 border border-white/20">
                       <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10">
                          <Calendar className="w-5 h-5 text-orange-200" />
                          <div>
                             <p className="text-[10px] font-black tracking-widest uppercase opacity-60">Prazo Final</p>
                             <p className="text-lg font-black">{format(parseISO(selectedAtv.data_entrega), "dd 'de' MMMM", { locale: ptBR })}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                          <div>
                             <p className="text-[10px] font-black tracking-widest uppercase opacity-60">Valor Máximo</p>
                             <p className="text-lg font-black">{selectedAtv.pontuacao_maxima || '0'} Pontos</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Content Area */}
                 <div className="flex-1 p-12 md:p-20 overflow-y-auto">
                    <div className="flex justify-end mb-12">
                       <button 
                         onClick={() => setSelectedAtv(null)}
                         className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
                       >
                         <X className="w-8 h-8" />
                       </button>
                    </div>

                    <div className="max-w-2xl">
                       <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                          <Info className="w-4 h-4 text-orange-500" /> Descrição da Atividade
                       </h5>
                       <div className="bg-slate-50/50 border border-slate-100 p-10 rounded-[48px] mb-12">
                          <p className="text-lg font-semibold text-slate-600 leading-relaxed italic">
                             {selectedAtv.descricao ? (
                               <div dangerouslySetInnerHTML={{ __html: selectedAtv.descricao.replace(/\n/g, '<br/>') }} />
                             ) : 'Nenhuma instrução adicional fornecida para esta atividade.'}
                          </p>
                       </div>

                       <div className="bg-amber-50 rounded-[32px] p-8 border border-amber-100 flex gap-6 items-start">
                          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                             <AlertCircle className="w-6 h-6 text-amber-600" />
                          </div>
                          <div>
                             <h6 className="text-sm font-black text-amber-900 uppercase tracking-tight mb-1">Lembrete para os Responsáveis</h6>
                             <p className="text-sm font-medium text-amber-800 leading-relaxed">
                                Garanta que todos os materiais necessários estejam organizados antecipadamente para evitar atrasos na entrega.
                             </p>
                          </div>
                       </div>
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
