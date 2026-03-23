import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, LineChart, BookOpen,
  MapPin, ShieldCheck, Car, Settings, PencilLine, LayoutList, Calendar, Activity, Library
} from 'lucide-react';
import { GradeCurricularV2 } from '../components/GradeCurricularV2';
import { PortalBoletimPage } from '../../pages/PortalBoletimPage';
import { PortalFrequenciaPage } from '../../pages/PortalFrequenciaPage';
import { PortalPlanosAulaPage } from '../../pages/PortalPlanosAulaPage';
import { PortalAtividadesPage } from '../../pages/PortalAtividadesPage';
import { PortalLivrosPage } from '../../pages/PortalLivrosPage';
import { PortalAgendaPage } from '../../pages/PortalAgendaPage';
import { PortalAutorizacoesPage } from '../../pages/PortalAutorizacoesPage';

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
      case 'boletim': return 'Boletim Escolar';
      case 'frequencia': return 'Frequência';
      case 'planos': return 'Planos de Aula';
      case 'atividades': return 'Tarefas & Atividades';
      case 'material': return 'Livros e Materiais';
      case 'agenda': return 'Agenda de Eventos';
      case 'autorizacoes': return 'Autorizações';
      default: return 'Módulo';
    }
  };

  const REAL_MODULES = [
    { id: 'boletim', label: 'Boletim', icon: LineChart, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'frequencia', label: 'Frequência', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'planos', label: 'Planos de Aula', icon: LayoutList, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'atividades', label: 'Tarefas', icon: PencilLine, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'material', label: 'Livros e Mats', icon: Library, color: 'text-violet-500', bg: 'bg-violet-50' },
    { id: 'agenda', label: 'Agenda', icon: Calendar, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 'grade', label: 'Grade', icon: CalendarDays, color: 'text-slate-500', bg: 'bg-slate-50' },
    { id: 'autorizacoes', label: 'Logística', icon: ShieldCheck, color: 'text-teal-500', bg: 'bg-teal-50' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* 1. Header do Aluno - Padrão iOS Large Title / Material Top App Bar */}
      <header className="relative bg-white pt-[env(safe-area-inset-top,16px)] pb-6 px-4 shadow-sm border-b border-slate-100 z-10">
        {/* Back Button - Touch target 48px mínimo */}
        <button
          onClick={() => navigate('/portal')}
          className="w-12 h-12 flex items-center justify-center rounded-[16px] bg-slate-50 text-slate-500 active:bg-slate-100 transition-colors mb-4 touch-manipulation min-h-[48px] min-w-[48px]"
          aria-label="Voltar para home"
        >
          <ArrowLeft className="w-6 h-6" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-4">
          {/* Avatar - 80px padrão iOS Contact Large / Material Avatar Extra Large */}
          <motion.div
            layoutId={`avatar-${student?.id}`}
            className="w-20 h-20 rounded-[24px] bg-teal-500 text-white flex items-center justify-center text-[28px] font-bold shadow-sm"
            aria-hidden="true"
          >
            {student?.nome_completo ? getInitials(student.nome_completo) : 'A'}
          </motion.div>
          <div className="flex flex-col flex-1 min-w-0">
            {/* Title - iOS Large Title / Material Headline Small */}
            <h1 className="text-[22px] font-bold text-slate-800 tracking-tight leading-tight mb-1 truncate">
              {student?.nome_completo || 'Aluno'}
            </h1>
            {/* Caption - iOS Caption 1 / Material Label Large */}
            <p className="text-[14px] font-semibold text-teal-600 mb-0.5">
              {student?.turma?.nome || 'Sem Turma'}
            </p>
            {/* Caption 2 - iOS Caption 2 / Material Label Medium */}
            <p className="text-[12px] font-bold text-slate-400 font-mono tracking-wide uppercase">
              RA: {student?.id?.slice(0, 8) || '---'}
            </p>
          </div>
        </div>
      </header>

      {/* 2. Módulos e Fila Virtual */}
      <main className="flex-1 px-4 py-6 flex flex-col gap-6">

        {/* Fila Virtual Action - Padrão iOS Card / Material Elevated Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-[24px] p-4 shadow-sm touch-manipulation min-h-[48px]"
          aria-label="Avisar chegada na fila virtual"
        >
          <div className="flex items-center gap-4">
            {/* Icon container - 48px */}
            <div className="w-12 h-12 rounded-[16px] bg-zinc-800 flex items-center justify-center text-teal-400 border border-zinc-700" aria-hidden="true">
              <Car className="w-6 h-6" />
            </div>
            <div className="flex flex-col text-left">
              {/* Caption - iOS Caption 1 / Material Label Medium */}
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide leading-none mb-1.5">Fila Virtual</span>
              {/* Title 3 - iOS / Title Medium - Material */}
              <span className="text-[17px] font-bold text-white leading-none">Avisar Chegada</span>
            </div>
          </div>
          {/* Animated icon - iOS/Android visual feedback */}
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-10 h-10 rounded-[12px] bg-teal-500/20 flex items-center justify-center text-teal-400"
            aria-hidden="true"
          >
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </motion.div>
        </motion.button>

        {/* Módulos do Aluno - Grid 2 colunas padrão iOS/Android */}
        <div className="grid grid-cols-2 gap-3">
          {REAL_MODULES.map((mod) => (
            <motion.button
              key={mod.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveModule(mod.id)}
              className="flex flex-col gap-3 p-4 rounded-[24px] bg-white border border-slate-100 shadow-sm active:scale-95 transition-all touch-manipulation min-h-[48px] text-left"
              aria-label={`Abrir ${mod.label}`}
            >
              {/* Icon container - 48px padrão iOS SF Symbols / Material Icons */}
              <div
                className={`w-12 h-12 rounded-[16px] flex items-center justify-center ${mod.bg} ${mod.color}`}
                aria-hidden="true"
              >
                <mod.icon className="w-6 h-6" strokeWidth={2.5} />
              </div>
              {/* Label - iOS Caption 1 / Material Label Large */}
              <span className="text-[14px] font-bold text-slate-800 tracking-tight leading-tight px-0.5">
                {mod.label}
              </span>
            </motion.button>
          ))}
        </div>
      </main>

      {/* 3. Bottom Sheet/Modal - Padrão iOS Sheet / Android Bottom Sheet */}
      <AnimatePresence>
        {activeModule && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed inset-0 z-50 flex flex-col bg-white"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Header Fixo do Sheet - Padrão iOS Navigation Bar / Material Top App Bar */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white z-20 pt-[env(safe-area-inset-top,12px)]">
              {/* Back Button - Touch target 48px */}
              <button
                onClick={() => setActiveModule(null)}
                className="w-12 h-12 flex items-center justify-center rounded-[16px] bg-slate-50 text-slate-500 active:bg-slate-100 transition-colors touch-manipulation min-h-[48px] min-w-[48px]"
                aria-label="Fechar módulo"
              >
                <ArrowLeft className="w-6 h-6" aria-hidden="true" />
              </button>
              {/* Title - iOS Title / Material Title Medium */}
              <h2 id="modal-title" className="text-[17px] font-bold text-slate-800 tracking-tight">
                {getModuleTitle(activeModule)}
              </h2>
              {/* Spacer para equilíbrio */}
              <div className="w-12" aria-hidden="true" />
            </header>

            {/* Conteúdo do Módulo - Scrollable */}
            <div className="flex-1 overflow-y-auto w-full px-4 py-2">
              {activeModule === 'grade' && <GradeCurricularV2 />}
              {activeModule === 'boletim' && <PortalBoletimPage hideHeader />}
              {activeModule === 'frequencia' && <PortalFrequenciaPage hideHeader />}
              {activeModule === 'planos' && <PortalPlanosAulaPage hideHeader />}
              {activeModule === 'atividades' && <PortalAtividadesPage hideHeader />}
              {activeModule === 'material' && <PortalLivrosPage hideHeader />}
              {activeModule === 'agenda' && <PortalAgendaPage hideHeader />}
              {activeModule === 'autorizacoes' && <PortalAutorizacoesPage hideHeader />}
              
              {!['grade', 'boletim', 'frequencia', 'planos', 'atividades', 'material', 'agenda', 'autorizacoes'].includes(activeModule) && (
                <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                  <Settings className="w-16 h-16 text-slate-200 mb-4" />
                  <p className="text-[15px] font-medium text-slate-500 text-center">Módulo em desenvolvimento</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
