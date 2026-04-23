import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, CalendarDays, LineChart, BookOpen, 
  MapPin, ShieldCheck, Car, Settings, Trophy, BookMarked, LayoutList,
  Activity, Calendar, Copy
} from 'lucide-react';
import { GradeCurricularV2 } from '../components/GradeCurricularV2';
import { PortalSelosV2 } from '../components/PortalSelosV2';
import { PortalPlanosAulaV2 } from '../components/PortalPlanosAulaV2';
import { PortalAtividadesV2 } from '../components/PortalAtividadesV2';
import { PortalBoletimPage } from '../../pages/PortalBoletimPage';
import { PortalFrequenciaPage } from '../../pages/PortalFrequenciaPage';
import { PortalLivrosPage } from '../../pages/PortalLivrosPage';
import { PortalAgendaPage } from '../../pages/PortalAgendaPage';
import { PortalAutorizacoesPage } from '../../pages/PortalAutorizacoesPage';
import { PortalFilaVirtualPage } from '../../pages/PortalFilaVirtualPage';
import { usePortalContext } from '../../context';
import { useDashboardAluno } from '../../hooks';
import { toast } from 'sonner';

// Helper to get initials
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

const REAL_MODULES = [
  { id: 'grade', label: 'Grade Curricular', icon: CalendarDays, color: 'text-blue-500', bg: 'bg-blue-50', border: 'hover:border-blue-200' },
  { id: 'boletim', label: 'Boletim Escolar', icon: LineChart, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'hover:border-indigo-200' },
  { id: 'frequencia', label: 'Frequência', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'hover:border-emerald-200' },
  { id: 'planos', label: 'Planos de Aula', icon: BookMarked, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'hover:border-emerald-200' },
  { id: 'atividades', label: 'Atividades e Provas', icon: LayoutList, color: 'text-orange-500', bg: 'bg-orange-50', border: 'hover:border-orange-200' },
  { id: 'material', label: 'Livros e Materiais', icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'hover:border-emerald-200' },
  { id: 'agenda', label: 'Agenda de Eventos', icon: Calendar, color: 'text-rose-500', bg: 'bg-rose-50', border: 'hover:border-rose-200' },
  { id: 'autorizacoes', label: 'Autorizações', icon: ShieldCheck, color: 'text-teal-500', bg: 'bg-teal-50', border: 'hover:border-teal-200' },
  { id: 'selos', label: 'Conquistas', icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50', border: 'hover:border-amber-200' },
];

export function PortalAlunoPerfilV2Web() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const context = usePortalContext();
  const { alunoSelecionado } = context;
  const { data: _dashboard } = useDashboardAluno();
  const [activeModule, setActiveModule] = useState<string>('grade');
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

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* 1. Web Header Header and Return Array */}
      <header className="flex items-center justify-between border-b border-slate-200 pb-8 mt-2">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/portal/alunos')}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-6 border-l border-slate-200 pl-6">
            <div className="w-20 h-20 rounded-full bg-teal-500 text-white flex items-center justify-center text-4xl font-black shadow-lg shadow-teal-500/20 overflow-hidden">
              {student?.foto_url ? (
                <img src={student.foto_url} alt={student.nome_completo} className="w-full h-full object-cover" />
              ) : (
                student?.nome_completo ? getInitials(student.nome_completo) : 'A'
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2 text-wrap pr-10">
                {student?.nome_completo || 'Aluno'}
              </h1>
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-500 uppercase tracking-widest">
                <span className="text-teal-600 bg-teal-50 px-3 py-1 rounded-lg">{(student as any)?.turma?.nome || 'Sem Turma'}</span>
                {(student as any)?.codigo_transferencia && (
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText((student as any).codigo_transferencia);
                      toast.success('ID copiado!');
                    }}
                    className="flex items-center gap-1.5 font-mono font-bold text-[10px] uppercase tracking-widest bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100 hover:bg-amber-100 transition-colors group/copy"
                  >
                    ID: {(student as any).codigo_transferencia}
                    <Copy size={10} className="text-amber-400 group-hover/copy:text-amber-600 transition-colors" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowFilaVirtual(true)}
          className="flex items-center gap-3 bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-800 shadow-xl shadow-zinc-900/10 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-teal-400 border border-zinc-700">
            <Car className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-none mb-1">Fila Virtual</span>
            <span className="text-sm font-black text-white leading-none">Avisar Chegada</span>
          </div>
        </button>
      </header>

      {/* 2. Conteúdo Módulos Desktop (Layout Side-by-Side) */}
      <div className="flex gap-8 items-start">
        {/* Menu Lateral */}
        <div className="w-1/4 min-w-[300px] flex flex-col gap-3">
          {REAL_MODULES.map((mod) => (
             <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className={`flex items-center gap-4 p-5 rounded-3xl border transition-all text-left ${
                activeModule === mod.id 
                  ? 'bg-white border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.06)]' 
                  : `bg-slate-50/50 border-transparent hover:bg-white ${mod.border}`
              }`}
             >
               <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center ${mod.bg} ${mod.color} shadow-sm`}>
                 <mod.icon className="w-6 h-6" strokeWidth={2.5} />
               </div>
               <span className="text-base font-black text-slate-800 tracking-tight leading-tight flex-1">
                 {mod.label}
               </span>
               <div className={`w-2 h-2 rounded-full ${activeModule === mod.id ? mod.color.replace('text-', 'bg-') : 'bg-transparent'}`} />
             </button>
          ))}
        </div>

        {/* Workspace do Módulo Acionado */}
        <div className="flex-1 min-h-[600px] bg-white rounded-[48px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 p-10 overflow-hidden">
          {activeModule === 'grade' && <GradeCurricularV2 />}
          {activeModule === 'selos' && <PortalSelosV2 />}
          {activeModule === 'planos' && <PortalPlanosAulaV2 />}
          {activeModule === 'atividades' && <PortalAtividadesV2 />}
          
          {activeModule === 'boletim' && <PortalBoletimPage hideHeader />}
          {activeModule === 'frequencia' && <PortalFrequenciaPage hideHeader />}
          {activeModule === 'material' && <PortalLivrosPage hideHeader />}
          {activeModule === 'agenda' && <PortalAgendaPage hideHeader />}
          {activeModule === 'autorizacoes' && <PortalAutorizacoesPage hideHeader />}
          
          {!['grade', 'selos', 'planos', 'atividades', 'boletim', 'frequencia', 'material', 'agenda', 'autorizacoes'].includes(activeModule) && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-32">
               <Settings className="w-16 h-16 text-zinc-300 mb-6 animate-spin-slow" />
               <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Módulo em Desenvolvimento</h2>
               <p className="font-semibold text-zinc-500">Esta visão web está sendo implementada.</p>
            </div>
          )}
        </div>
      </div>

      {/* Fila Virtual Dialog - Web */}
      {showFilaVirtual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
              <button
                onClick={() => setShowFilaVirtual(false)}
                className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
                aria-label="Fechar fila virtual"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-slate-800">Fila Virtual</h2>
              <div className="w-12" aria-hidden="true" />
            </header>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-6">
              <PortalFilaVirtualPage hideHeader />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
