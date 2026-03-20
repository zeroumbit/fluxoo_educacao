import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, CalendarDays, LineChart, BookOpen, 
  MapPin, ShieldCheck, Car, Settings, X 
} from 'lucide-react';
import { GradeCurricularV2 } from '../components/GradeCurricularV2';

import { usePortalContext } from '../../context';
import { useDashboardAluno } from '../../hooks';

// Helper to get initials
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export function PortalAlunoPerfilV2Mobile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { alunoSelecionado } = usePortalContext();
  const { data: dashboard } = useDashboardAluno();
  
  // Estado para controlar qual módulo está aberto dentro do drill-down
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const student = alunoSelecionado;

  // Funções Utilitárias para formatar o Título do Header Modal
  const getModuleTitle = (mod: string) => {
    switch (mod) {
      case 'grade': return 'Grade Curricular';
      case 'boletim': return 'Boletim & Frequência';
      case 'diario': return 'Diário de Classe';
      case 'material': return 'Material Escolar';
      case 'autorizacoes': return 'Autorizações de Retirada';
      default: return 'Módulo';
    }
  };

  const MOCK_MODULES = [
    { id: 'grade', label: 'Grade Curricular', icon: CalendarDays, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'boletim', label: 'Boletim', icon: LineChart, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'diario', label: 'Diário / Agenda', icon: BookOpen, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'material', label: 'Livros e Materiais', icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'autorizacoes', label: 'Autorizações', icon: ShieldCheck, color: 'text-teal-500', bg: 'bg-teal-50' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* 1. Header do Aluno (Contextual) */}
      <header className="relative bg-white pt-6 pb-8 px-4 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border-b border-slate-100 rounded-b-[40px] z-10">
        <button 
          onClick={() => navigate('/portal')}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <motion.div 
            layoutId={`avatar-${student?.id}`}
            className="w-20 h-20 rounded-[28px] bg-teal-500 text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-teal-500/20"
          >
            {student?.nome_completo ? getInitials(student.nome_completo) : 'A'}
          </motion.div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1 text-wrap pr-4">
              {student?.nome_completo || 'Aluno'}
            </h1>
            <p className="text-sm font-semibold text-teal-600 mb-1">{student?.turma?.nome || 'Sem Turma'}</p>
            <p className="text-xs font-bold text-slate-400 font-mono tracking-widest uppercase">RA: {student?.id?.slice(0, 8) || '---'}</p>
          </div>
        </div>
      </header>

      {/* 2. Grid de Módulos e Fila Virtual */}
      <main className="flex-1 px-4 py-8 flex flex-col gap-8">
        
        {/* Fila Virtual Action Component (Só aparece se no horário de saída simulado, aqui sempre visível) */}
        <motion.button 
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-[32px] p-5 shadow-xl shadow-zinc-900/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-teal-400 border border-zinc-700">
              <Car className="w-6 h-6" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1.5">Fila Virtual</span>
              <span className="text-lg font-black text-white leading-none">Avisar Chegada</span>
            </div>
          </div>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400"
          >
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </motion.div>
        </motion.button>

        {/* Módulos do Aluno (Drill-down) */}
        <div className="grid grid-cols-2 gap-3">
          {MOCK_MODULES.map((mod) => (
             <motion.button
              key={mod.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveModule(mod.id)}
              className="flex flex-col gap-4 p-5 rounded-[32px] bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-slate-200 hover:shadow-md transition-all text-left"
             >
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${mod.bg} ${mod.color}`}>
                 <mod.icon className="w-6 h-6" strokeWidth={2.5} />
               </div>
               <span className="text-sm font-black text-slate-800 tracking-tight leading-tight px-1 pb-1">
                 {mod.label}
               </span>
             </motion.button>
          ))}
        </div>
      </main>

      {/* 3. Bottom Sheet Interno do Módulo (Drill-down Isolado) */}
      <AnimatePresence>
        {activeModule && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed inset-0 z-50 flex flex-col bg-white"
          >
            {/* Header Fixo do Sheet */}
            <header className="flex items-center justify-between px-4 py-4 border-b border-slate-100 bg-white z-20">
              <button 
                onClick={() => setActiveModule(null)}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-500"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                {getModuleTitle(activeModule)}
              </h2>
              <div className="w-10" /> {/* Spacer */}
            </header>
            
            {/* Conteúdo do Módulo Dinâmico */}
            <div className="flex-1 overflow-y-auto w-full">
              {activeModule === 'grade' && <GradeCurricularV2 />}
              {activeModule !== 'grade' && (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <Settings className="w-12 h-12 text-slate-200 mb-4 animate-spin-slow" />
                  <p className="font-medium text-slate-500">Módulo em desenvolvimento</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
