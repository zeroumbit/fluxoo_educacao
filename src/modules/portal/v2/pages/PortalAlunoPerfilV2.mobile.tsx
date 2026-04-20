import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, CalendarDays, LineChart, BookOpen, 
  MapPin, ShieldCheck, Car, Settings, PencilLine, LayoutList, Calendar, Activity, Library, Trophy, Copy
} from 'lucide-react';
import { GradeCurricularV2 } from '../components/GradeCurricularV2';
import { PortalSelosV2 } from '../components/PortalSelosV2';
import { PortalBoletimPage } from '../../pages/PortalBoletimPage';
import { PortalFrequenciaPage } from '../../pages/PortalFrequenciaPage';
import { PortalPlanosAulaPage } from '../../pages/PortalPlanosAulaPage';
import { PortalAtividadesV2 } from '../components/PortalAtividadesV2';
import { PortalLivrosPage } from '../../pages/PortalLivrosPage';
import { PortalAgendaPage } from '../../pages/PortalAgendaPage';
import { PortalAutorizacoesPage } from '../../pages/PortalAutorizacoesPage';
import { PortalFilaVirtualPage } from '../../pages/PortalFilaVirtualPage';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { usePortalContext } from '../../context';
import { useDashboardAluno, useSelosPortal } from '../../hooks';
import { NativeHeader } from '../components/NativeHeader';

// Helper to get initials
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export function PortalAlunoPerfilV2Mobile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const context = usePortalContext();
  const { alunoSelecionado } = context;
  const { data: dashboard } = useDashboardAluno();
  const { data: selos } = useSelosPortal();

  // Estado para controlar qual módulo está aberto dentro do drill-down
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [showFilaVirtual, setShowFilaVirtual] = useState(false);

  // Sincroniza o aluno selecionado se acessar via URL direta
  React.useEffect(() => {
    if (id && (!alunoSelecionado || alunoSelecionado.id !== id)) {
      const vinculo = (context.vinculos || []).find((v: any) => (v.aluno_id || v.aluno?.id) === id);
      if (vinculo) {
        context.selecionarAluno(vinculo);
      }
    }
  }, [id, context.vinculos, alunoSelecionado?.id]);

  const student = alunoSelecionado;

  // Funções Utilitárias para formatar o Título do Header Modal
  const getModuleTitle = (mod: string) => {
    switch (mod) {
      case 'grade': return 'Grade Curricular';
      case 'boletim': return 'Boletim Escolar';
      case 'frequencia': return 'Frequência';
      case 'planos': return 'Planos de Aula';
      case 'atividades': return 'Atividades e Provas';
      case 'material': return 'Materiais de Livros';
      case 'agenda': return 'Agenda de Eventos';
      case 'autorizacoes': return 'Autorizações';
      case 'selos': return 'Conquistas';
      default: return 'Módulo';
    }
  };

  const REAL_MODULES = [
    { id: 'grade', label: 'Grade Curricular', icon: CalendarDays, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'boletim', label: 'Boletim Escolar', icon: LineChart, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'frequencia', label: 'Frequência', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'planos', label: 'Planos de Aula', icon: LayoutList, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'atividades', label: 'Atividades e Provas', icon: PencilLine, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'material', label: 'Materiais de Livros', icon: Library, color: 'text-violet-500', bg: 'bg-violet-50' },
    { id: 'agenda', label: 'Agenda de Eventos', icon: Calendar, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 'autorizacoes', label: 'Autorizações', icon: ShieldCheck, color: 'text-teal-500', bg: 'bg-teal-50' },
    { id: 'selos', label: 'Conquistas', icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-full bg-slate-50">
      <NativeHeader title={student?.nome_completo?.split(' ')[0] || 'Perfil'} showBack />

      {/* 1. Perfil Summary - Estilo Nativo */}
      <div className="bg-white pb-6 px-4 shadow-sm border-b border-slate-100 z-10">
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
            <div className="flex items-center flex-wrap gap-2 mb-0.5">
              <p className="text-[14px] font-semibold text-teal-600">
                {student?.turma?.nome || 'Sem Turma'}
              </p>
              {student?.codigo_transferencia && (
                <>
                  <span className="text-slate-300 text-[10px]">•</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(student.codigo_transferencia);
                      toast.success('ID do aluno copiado!');
                      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
                    }}
                    className="flex items-center gap-1 active:scale-95 transition-transform bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100"
                  >
                    <span className="text-[11px] font-bold text-amber-700 font-mono">
                      ID: {student.codigo_transferencia}
                    </span>
                    <Copy size={10} className="text-amber-400" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Preview de Conquistas (Selos) - Novo */}
        {selos && selos.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Conquistas Recentes</span>
              <button 
                onClick={() => setActiveModule('selos')}
                className="text-[10px] font-black text-teal-600 uppercase tracking-widest px-1"
              >
                Ver Todas
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar snap-x">
              {selos.slice(0, 5).map((selo: any) => (
                <motion.div
                  key={selo.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveModule('selos')}
                  className={cn(
                    "min-w-[80px] h-[80px] rounded-[24px] flex items-center justify-center text-3xl shadow-sm border border-white snap-center",
                    selo.cor_bg || 'bg-amber-100'
                  )}
                >
                  {selo.icone || '🏆'}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Módulos e Fila Virtual */}
      <main className="px-4 py-6 flex flex-col gap-6">

        {/* Fila Virtual Action - Padrão iOS Card / Material Elevated Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowFilaVirtual(true)}
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
            <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white z-20 pt-safe">
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
              {activeModule === 'atividades' && <PortalAtividadesV2 />}
              {activeModule === 'material' && <PortalLivrosPage hideHeader />}
              {activeModule === 'agenda' && <PortalAgendaPage hideHeader />}
              {activeModule === 'autorizacoes' && <PortalAutorizacoesPage hideHeader />}
              {activeModule === 'selos' && <PortalSelosV2 />}

              {!['grade', 'boletim', 'frequencia', 'planos', 'atividades', 'material', 'agenda', 'autorizacoes', 'selos'].includes(activeModule) && (
                <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                  <Settings className="w-16 h-16 text-slate-200 mb-4" />
                  <p className="text-[15px] font-medium text-slate-500 text-center">Módulo em desenvolvimento</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Fila Virtual - Bottom Sheet Dedicado */}
        {showFilaVirtual && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed inset-0 z-50 flex flex-col bg-white"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fila-virtual-title"
          >
            {/* Header Fixo */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white z-20 pt-safe">
              <button
                onClick={() => setShowFilaVirtual(false)}
                className="w-12 h-12 flex items-center justify-center rounded-[16px] bg-slate-50 text-slate-500 active:bg-slate-100 transition-colors touch-manipulation min-h-[48px] min-w-[48px]"
                aria-label="Fechar fila virtual"
              >
                <ArrowLeft className="w-6 h-6" aria-hidden="true" />
              </button>
              <h2 id="fila-virtual-title" className="text-[17px] font-bold text-slate-800 tracking-tight">
                Fila Virtual
              </h2>
              <div className="w-12" aria-hidden="true" />
            </header>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto w-full px-4 py-2">
              <PortalFilaVirtualPage hideHeader />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
