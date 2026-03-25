import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutList, Clock, ChevronRight, X, Info, FileText, AlertCircle, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAtividadesPortal } from '../../hooks';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';

export function PortalAtividadesV2() {
  const { data: atividades, isLoading } = useAtividadesPortal();
  const [selectedAtv, setSelectedAtv] = useState<any | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 font-bold text-slate-500">Carregando conteúdos...</p>
      </div>
    );
  }

  if (!atividades || atividades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
          <LayoutList className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">Sem conteúdos postados</h3>
        <p className="text-slate-500 max-w-xs font-semibold">Materiais, lições e comunicados de aula aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 relative">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Materiais & Atividades</h2>
        <p className="text-slate-500 font-semibold uppercase text-[10px] tracking-widest mt-1">Conteúdos Educacionais e Lições</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {atividades.map((item: any, idx: number) => {
          const { atividade } = item;
          if (!atividade) return null;

          const dataExibicao = atividade.created_at || new Date().toISOString();
          const tipoColor = atividade.tipo === 'pdf' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600';

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
                          {atividade.tipo || 'Material'}
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
                    {atividade.descricao || 'Clique para ver os detalhes e links deste material.'}
                 </p>
              </div>

              <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-500">
                       <Clock className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Postado em</p>
                       <p className="text-xs font-black text-slate-800">
                          {format(parseISO(dataExibicao), "dd 'de' MMM", { locale: ptBR })}
                       </p>
                    </div>
                 </div>

                 {atividade.disciplina && (
                   <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Disciplina</span>
                      <span className="text-xs font-black text-indigo-600">{atividade.disciplina}</span>
                   </div>
                 )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* MODAL VERSÃO WEB - DASHBOARD CENTRADO */}
      <AnimatePresence>
        {selectedAtv && !isMobile && (
          <Dialog open={!!selectedAtv} onOpenChange={(open) => !open && setSelectedAtv(null)}>
            <DialogContent className="sm:max-w-[700px] border-none shadow-2xl rounded-[40px] p-0 overflow-hidden bg-white">
              <div className="flex h-full max-h-[85vh]">
                {/* Lateral Banner */}
                <div className="w-1/3 bg-orange-500 p-10 flex flex-col justify-between text-white hidden md:flex">
                   <div className="space-y-6">
                      <div className="w-16 h-16 rounded-[24px] bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/20">
                         <FileText className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-black leading-tight uppercase tracking-tighter italic">Detalhes<br/>do Material</h3>
                   </div>
                   <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Fluxoo Edu V2</div>
                </div>

                {/* Content */}
                <div className="flex-1 p-10 overflow-y-auto">
                   <DialogHeader className="mb-8">
                      <div className="flex items-center gap-2 mb-3">
                         <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {selectedAtv.tipo || 'ATIVIDADE'}
                         </span>
                         {selectedAtv.disciplina && (
                           <span className="text-indigo-600 font-bold text-xs uppercase tracking-widest leading-none bg-indigo-50 px-2 py-1 rounded-md">
                              {selectedAtv.disciplina}
                           </span>
                         )}
                      </div>
                      <DialogTitle className="text-3xl font-black text-slate-800 tracking-tight leading-tight mb-2">
                         {selectedAtv.titulo}
                      </DialogTitle>
                      <DialogDescription className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                         <Clock size={14} className="text-orange-400" /> 
                         PUBLICADO EM {format(parseISO(selectedAtv.created_at || new Date().toISOString()), "dd 'DE' MMMM", { locale: ptBR })}
                      </DialogDescription>
                   </DialogHeader>

                   <div className="space-y-8">
                      <div className="space-y-3">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Info size={14} className="text-orange-500" /> Descrição
                         </h4>
                         <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 text-slate-600 font-medium leading-relaxed italic whitespace-pre-line text-sm">
                            {selectedAtv.descricao || 'Nenhuma instrução adicional informada.'}
                         </div>
                      </div>

                      {selectedAtv.anexo_url && (
                        <div className="space-y-3">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acesso Rápido</h4>
                           <a 
                             href={selectedAtv.anexo_url}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="flex items-center justify-between w-full bg-slate-900 hover:bg-zinc-800 text-white p-5 rounded-[28px] transition-all group"
                           >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                   <ExternalLink className="w-5 h-5 text-orange-400" />
                                </div>
                                <span className="font-black text-sm uppercase tracking-tighter">Acessar Link ou Anexo</span>
                              </div>
                              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                           </a>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => setSelectedAtv(null)}
                        className="w-full py-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-slate-600 transition-colors"
                      >
                        [ Fechar Detalhes ]
                      </button>
                   </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* MODAL VERSÃO MOBILE - (DRAWER APP NATIVO) */}
      <AnimatePresence>
        {selectedAtv && isMobile && (
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
              className="fixed bottom-0 left-0 right-0 h-[80vh] bg-white rounded-t-[50px] shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Mobile Header Handle */}
              <div className="w-full flex justify-center pt-3 pb-1">
                 <div className="w-12 h-1.5 bg-slate-100 rounded-full" />
              </div>

              <div className="p-8 flex-1 overflow-y-auto">
                 <div className="flex justify-between items-start mb-8">
                    <div className="flex flex-col gap-2">
                       <span className="bg-orange-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest self-start">
                          {selectedAtv.tipo || 'ATIVIDADE'}
                       </span>
                       <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-[1.1] pr-4">
                          {selectedAtv.titulo}
                       </h3>
                    </div>
                    <button 
                      onClick={() => setSelectedAtv(null)}
                      className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 active:scale-90 transition-transform"
                    >
                      <X className="w-6 h-6" />
                    </button>
                 </div>

                 <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-orange-500">
                       <Clock className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Publicado em</p>
                       <p className="text-base font-black text-slate-800">
                          {format(parseISO(selectedAtv.created_at || new Date().toISOString()), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                       </p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                          <Info size={14} className="text-orange-500" /> Descrição Completa
                       </p>
                       <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-[32px] text-slate-600 font-bold italic leading-relaxed text-sm whitespace-pre-line">
                          {selectedAtv.descricao || 'Nenhuma instrução adicional fornecida.'}
                       </div>
                    </div>

                    {selectedAtv.disciplina && (
                      <div className="flex items-center justify-between p-6 bg-indigo-50/50 rounded-[32px] border border-indigo-100/50">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white">
                               <LayoutList className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-indigo-700">Disciplina</span>
                         </div>
                         <span className="text-sm font-black text-indigo-600">{selectedAtv.disciplina}</span>
                      </div>
                    )}

                    {selectedAtv.anexo_url && (
                      <motion.a 
                        whileTap={{ scale: 0.98 }}
                        href={selectedAtv.anexo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between bg-zinc-900 text-white p-6 rounded-[32px] shadow-xl shadow-zinc-900/10"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                               <ExternalLink className="w-6 h-6 text-orange-400" />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1.5">Material de Apoio</span>
                               <span className="text-lg font-black leading-none">Abrir Anexo / Link</span>
                            </div>
                         </div>
                         <ChevronRight className="w-6 h-6 text-zinc-600" />
                      </motion.a>
                    )}
                 </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
