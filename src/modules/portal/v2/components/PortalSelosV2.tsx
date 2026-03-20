import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Calendar } from 'lucide-react';
import { useSelosPortal } from '../../hooks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function PortalSelosV2() {
  const { data: selos, isLoading } = useSelosPortal();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 font-bold text-slate-500">Carregando conquistas...</p>
      </div>
    );
  }

  if (!selos || selos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
          <Trophy className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">Sem selos ainda</h3>
        <p className="text-slate-500 max-w-xs font-medium">As conquistas e selos atribuídos pelos professores aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Selos e Conquistas</h2>
          <p className="text-slate-500 font-semibold uppercase text-[10px] tracking-widest mt-1">Reconhecimento Acadêmico</p>
        </div>
        <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl flex items-center gap-2">
          <Star className="w-4 h-4 fill-current" />
          <span className="font-bold text-sm">{selos.length} Conquistas</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {selos.map((selo: any, idx: number) => (
          <motion.div
            key={selo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-shadow flex gap-6"
          >
            <div className={`w-20 h-20 rounded-[24px] flex-shrink-0 flex items-center justify-center text-3xl shadow-inner ${selo.cor_bg || 'bg-amber-100'}`}>
              {selo.icone || '🏆'}
            </div>
            <div className="flex flex-col justify-center flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-lg font-black text-slate-800 tracking-tight">{selo.nome || 'Selo de Mérito'}</h4>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {format(new Date(selo.created_at), 'dd MMM', { locale: ptBR })}
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500 leading-relaxed italic mb-2">
                "{selo.descricao || 'Parabéns pelo excelente desempenho!'}"
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atribuído por:</span>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{selo.professor_nome || 'Coordenação'}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
