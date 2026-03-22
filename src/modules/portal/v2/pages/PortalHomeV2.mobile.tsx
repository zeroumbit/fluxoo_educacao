import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileSignature, Receipt, Clock, Info, ArrowRight } from 'lucide-react';
import { usePortalContext } from '../../context';
import { useDashboardFamilia, useAvisosPortal } from '../../hooks';

// Helper to get initials
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export function PortalHomeV2Mobile() {
  const navigate = useNavigate();
  const { responsavel, vinculos, selecionarAluno, alunoSelecionado } = usePortalContext();
  const { data: dashboard } = useDashboardFamilia();
  const { data: avisos } = useAvisosPortal();

  // Filtrar alertas baseados nos dados reais do dashboard
  const alerts = [];
  if (dashboard?.financeiro?.totalAtrasadas && dashboard.financeiro.totalAtrasadas > 0) {
    alerts.push({
      id: 'fin-atraso',
      text: `Você possui ${dashboard.financeiro.totalAtrasadas} fatura(s) em atraso.`,
      type: 'fin',
      icon: Receipt
    });
  }
  if (dashboard?.financeiro?.totalPendente && dashboard.financeiro.totalPendente > 0 && dashboard?.financeiro?.totalAtrasadas === 0) {
    alerts.push({
      id: 'fin-pendente',
      text: `Há cobranças aguardando pagamento. Total: R$ ${dashboard.financeiro.totalPendente.toLocaleString('pt-BR')}`,
      type: 'fin',
      icon: Receipt
    });
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-safe">
      {/* 1. Header de Boas-Vindas */}
      {/* Safe area top para dispositivos com notch (iOS) */}
      <header className="flex items-center justify-between pt-[env(safe-area-inset-top,16px)] mt-4 pb-2">
        <div className="flex flex-col gap-0.5">
          {/* Caption 1 - iOS / Label Small - Material */}
          <span className="text-[13px] font-medium text-slate-500 leading-tight">Bom dia,</span>
          {/* Large Title - iOS / Headline Small - Material */}
          <h1 className="text-[28px] font-bold text-slate-800 tracking-tight leading-[34px]">
            {responsavel?.nome || 'Responsável'}
          </h1>
        </div>
        {/* Avatar Stack - Touch targets 48px (Android) / 44pt (iOS) */}
        <div className="flex -space-x-2">
          {vinculos.map((v: any) => (
            <motion.button
              key={v.aluno?.id}
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                selecionarAluno(v);
                navigate(`/portal/alunos/${v.aluno?.id}`);
              }}
              className={`w-12 h-12 rounded-full border-2 border-white flex items-center justify-center font-bold shadow-sm cursor-pointer active:scale-95 transition-transform touch-manipulation min-h-[48px] min-w-[48px] ${
                alunoSelecionado?.id === v.aluno?.id ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-600'
              }`}
              aria-label={`Selecionar aluno ${v.aluno?.nome_completo || 'aluno'}`}
            >
              {getInitials(v.aluno?.nome_completo || 'A')}
            </motion.button>
          ))}
        </div>
      </header>

      {/* 2. Alertas Críticos */}
      <section className="flex flex-col gap-3">
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-start gap-3 p-4 rounded-[20px] border min-h-[48px] ${
              alert.type === 'fin' ? 'bg-orange-50 border-orange-100 text-orange-800' : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}
            role="alert"
          >
            <alert.icon className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            {/* Body - iOS / Body Medium - Material */}
            <span className="text-[15px] font-medium leading-tight">{alert.text}</span>
          </motion.div>
        ))}
      </section>

      {/* 3. Agenda do Dia Consolidada */}
      <section className="flex flex-col bg-white p-5 rounded-[28px] shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4 px-1">
          {/* Title 2 - iOS / Title Small - Material */}
          <h2 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-500" aria-hidden="true" />
            Agenda Hoje
          </h2>
        </div>

        <div className="flex flex-col gap-5 pl-2 relative before:absolute before:inset-y-1 before:left-[15px] before:w-px before:bg-slate-200">
          {!dashboard?.avisosRecentes || dashboard.avisosRecentes.length === 0 ? (
            // Caption - iOS / Body Small - Material
            <p className="text-[13px] text-slate-400 pl-5 italic">Nenhum evento para hoje.</p>
          ) : (
            dashboard.avisosRecentes.map((item: any, idx: number) => (
              <div key={idx} className="flex gap-3 relative">
                <div className="flex flex-col items-center mt-1 z-10">
                  <div className="w-[10px] h-[10px] rounded-full bg-teal-500 shadow-sm border-2 border-white" />
                </div>
                <div className="flex flex-col flex-1">
                  {/* Caption 2 - iOS / Label Medium - Material */}
                  <span className="text-[12px] font-semibold text-slate-400 mb-1">
                    {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {/* Card com touch target adequado */}
                  <div className="bg-slate-50 border border-slate-100 rounded-[16px] p-3 flex flex-col justify-center min-h-[48px]">
                    {/* Caption 2 - iOS / Label Small - Material */}
                    <span className="text-[11px] font-bold text-slate-500 tracking-wide mb-1 flex items-center gap-1 uppercase">
                      {item.turma?.nome || 'Geral'}
                    </span>
                    {/* Body - iOS / Body Medium - Material */}
                    <span className="text-[15px] font-semibold text-slate-800 leading-tight">{item.titulo}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 4. Mural Rápido */}
      <section className="flex flex-col gap-3 pb-4">
        <div className="flex items-center justify-between px-1">
          {/* Title 2 - iOS / Title Small - Material */}
          <h2 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
            <Info className="w-5 h-5 text-teal-500" aria-hidden="true" />
            Mural Rápido
          </h2>
          {/* Touch target 48px mínimo */}
          <button
            onClick={() => navigate('/portal/avisos')}
            className="min-h-[48px] min-w-[48px] px-3 flex items-center justify-center rounded-[12px] active:bg-slate-100 transition-colors touch-manipulation"
            aria-label="Ver todos os avisos"
          >
            {/* Label - iOS / Label Large - Material */}
            <span className="text-[14px] font-semibold text-teal-600 flex items-center">
              Ver tudo <ArrowRight className="w-[18px] h-[18px] ml-1" />
            </span>
          </button>
        </div>
        {/* Horizontal scroll snap - padrão iOS/Android */}
        <div
          className="flex gap-3 overflow-x-auto pb-4 px-1 snap-x hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          role="region"
          aria-label="Lista horizontal de avisos"
        >
          {!avisos || avisos.length === 0 ? (
            // Caption - iOS / Body Small - Material
            <p className="text-[13px] text-slate-400 italic py-2">Nenhum aviso no mural.</p>
          ) : (
            avisos.map((news: any) => (
              <div
                key={news.id}
                className="min-w-[260px] flex-shrink-0 bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm snap-start"
              >
                {/* Chip - Material Design 3 */}
                <span className="inline-block px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold uppercase tracking-wide mb-3">
                  {news.turma?.nome || 'Geral'}
                </span>
                {/* Title - iOS / Body Large - Material */}
                <h3 className="text-[16px] font-bold text-slate-800 mb-2 leading-tight">{news.titulo}</h3>
                {/* Caption - iOS / Label Small - Material */}
                <span className="text-[12px] text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  {new Date(news.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
