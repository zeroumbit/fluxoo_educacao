import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileSignature, Receipt, Clock, Info, ArrowRight } from 'lucide-react';
import { usePortalContext } from '../../context';
import { useDashboardAluno, useAvisosPortal } from '../../hooks';

// Helper to get initials
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export function PortalHomeV2Mobile() {
  const navigate = useNavigate();
  const { responsavel, vinculos, selecionarAluno, alunoSelecionado } = usePortalContext();
  const { data: dashboard } = useDashboardAluno();
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
    <div className="flex flex-col gap-6 p-4">
      {/* 1. Header de Boas-Vindas */}
      <header className="flex items-center justify-between pt-4 mt-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-500">Bom dia,</span>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{responsavel?.nome || 'Responsável'}</h1>
        </div>
        <div className="flex -space-x-3">
          {vinculos.map((v: any) => (
            <motion.div
              key={v.aluno?.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                selecionarAluno(v);
                navigate(`/portal/alunos/${v.aluno?.id}`);
              }}
              className={`w-12 h-12 rounded-full border-[3px] border-white flex items-center justify-center font-bold shadow-md cursor-pointer ${
                alunoSelecionado?.id === v.aluno?.id ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {getInitials(v.aluno?.nome_completo || 'A')}
            </motion.div>
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
            className={`flex items-start gap-3 p-4 rounded-2xl border ${
              alert.type === 'fin' ? 'bg-orange-50 border-orange-100 text-orange-800' : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}
          >
            <alert.icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium leading-tight">{alert.text}</span>
          </motion.div>
        ))}
      </section>

      {/* 3. Agenda do Dia Consolidada */}
      <section className="flex flex-col bg-white p-5 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100/50">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-500" />
            Agenda Hoje
          </h2>
        </div>
        
        <div className="flex flex-col gap-6 pl-2 relative before:absolute before:inset-y-2 before:left-3.5 before:w-px antes:bg-slate-200">
          {!dashboard?.avisosRecentes || dashboard.avisosRecentes.length === 0 ? (
            <p className="text-sm text-slate-400 pl-6 italic">Nenhum evento para hoje.</p>
          ) : (
            dashboard.avisosRecentes.map((item: any, idx: number) => (
              <div key={idx} className="flex gap-4 relative">
                <div className="flex flex-col items-center mt-0.5 z-10">
                  <div className={`w-3 h-3 rounded-full bg-teal-500 shadow-sm border-2 border-white`} />
                </div>
                <div className="flex flex-col flex-1 pl-1">
                  <span className="text-xs font-bold text-slate-400 mb-0.5">
                    {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col justify-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 flex items-center gap-1">
                      {item.turma?.nome || 'Geral'}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{item.titulo}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 4. Mural Rápido */}
      <section className="flex flex-col gap-3 mt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Info className="w-5 h-5 text-teal-500" />
            Mural Rápido
          </h2>
          <button onClick={() => navigate('/portal/avisos')} className="text-sm font-semibold text-teal-600 flex items-center">
            Ver tudo <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-6 px-1 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {!avisos || avisos.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-4">Nenhum aviso no mural.</p>
          ) : (
            avisos.map((news: any) => (
              <div
                key={news.id}
                className="min-w-[240px] flex-shrink-0 bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm snap-start"
              >
                <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wide mb-3">
                  {news.turma?.nome || 'Geral'}
                </span>
                <h3 className="text-base font-bold text-slate-800 mb-1 leading-tight">{news.titulo}</h3>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {new Date(news.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
      
    </div>
  );
}
