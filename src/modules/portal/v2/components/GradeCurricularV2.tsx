import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, startOfWeek, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePlanosAulaPortal } from '../../hooks';
import { Calendar } from 'lucide-react';

const DAYS_TO_SHOW = 14; 
const START_DATE = startOfWeek(new Date(), { weekStartsOn: 1 });

export function GradeCurricularV2() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data: todosPlanos, isLoading } = usePlanosAulaPortal();

  // Gerar dias do calendário
  const days = Array.from({ length: DAYS_TO_SHOW }).map((_, i) => {
    return addDays(START_DATE, i);
  });

  // Filtrar aulas do dia selecionado
  const aulasDoDia = useMemo(() => {
    if (!todosPlanos) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    return todosPlanos.filter((item: any) => {
      const dataAula = item.plano?.data_aula;
      return dataAula === dateStr;
    }).map((item: any) => ({
      id: item.plano.id,
      hora: item.horario || 'Horário não definido',
      disciplina: item.plano.disciplina || 'Geral',
      titulo: item.plano.titulo,
      objetivos: item.plano.objetivos,
      cor: item.plano.disciplina?.toLowerCase().includes('mat') ? 'bg-emerald-500' : 
           item.plano.disciplina?.toLowerCase().includes('port') ? 'bg-orange-500' :
           'bg-teal-500'
    }));
  }, [todosPlanos, selectedDate]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 font-bold text-slate-500">Buscando sua grade...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-slate-50 min-h-full pb-20 pt-4">
      
      {/* 1. Calendário Horizontal Swipeable */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 px-1">Grade Curricular</h3>
        <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {days.map((date, idx) => {
            const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const diaDaSemana = format(date, 'EE', { locale: ptBR }).toUpperCase();
            const diaDoMes = format(date, 'dd');
            
            // Verifica se tem aula neste dia para mostrar o dot
            const hasClass = todosPlanos?.some((p: any) => p.plano?.data_aula === format(date, 'yyyy-MM-dd'));

            return (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedDate(date)}
                className={`relative min-w-[64px] h-[84px] rounded-[24px] flex flex-col items-center justify-center snap-center flex-shrink-0 transition-colors ${
                  isSelected ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'bg-white text-slate-500 border border-slate-100'
                }`}
              >
                <span className={`text-[10px] font-bold tracking-wider mb-1 ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                  {isToday ? 'HOJE' : diaDaSemana}
                </span>
                <span className={`text-2xl font-black ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                  {diaDoMes}
                </span>

                {/* Dot de Aula */}
                {hasClass && (
                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-teal-500'} ring-2 ring-white/50`} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 2. Timeline de Aulas */}
      <div className="flex-1 px-4">
        <div className="bg-white rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100/50 p-6 min-h-[300px]">
          <div className="flex items-center justify-between mb-8 px-2">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </span>
            <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
              {aulasDoDia.length} Aulas
            </span>
          </div>

          {aulasDoDia.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center opacity-40">
               <Calendar className="w-12 h-12 text-slate-300 mb-4" />
               <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Nenhuma aula cadastrada</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 pl-4 border-l-2 border-slate-100">
              {aulasDoDia.map((aula) => (
                <motion.div
                  key={aula.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative pl-6"
                >
                  {/* Indicador de Timeline */}
                  <div className={`absolute -left-[11px] top-6 w-5 h-5 rounded-full ${aula.cor} border-[4px] border-white shadow-sm ring-1 ring-slate-100`} />
                  
                  <div className="flex flex-col justify-center rounded-3xl bg-slate-50/80 border border-slate-100 p-4">
                    <span className="text-[11px] font-bold text-slate-400 font-mono tracking-wider mb-1">
                      {aula.hora}
                    </span>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-base font-black text-slate-800 tracking-tight leading-none mb-1.5">
                          {aula.disciplina}
                        </h4>
                        <p className="text-xs font-semibold text-slate-500">
                          {aula.titulo}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

