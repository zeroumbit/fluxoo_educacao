import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSignature, Receipt, Clock, Info, ArrowRight } from 'lucide-react';
import { usePortalContext } from '../../context';
import { useDashboardAluno, useAvisosPortal } from '../../hooks';

// Helper to get initials
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export function PortalHomeV2Web() {
  const navigate = useNavigate();
  const { responsavel, vinculos, selecionarAluno, alunoSelecionado } = usePortalContext();
  const { data: dashboard } = useDashboardAluno();
  const { data: avisos } = useAvisosPortal();

  // Alertas dinâmicos
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
    <div className="flex flex-col gap-8 w-full">
      {/* 1. Header Web */}
      <header className="flex items-end justify-between border-b border-slate-200 pb-8 mt-2">
        <div className="flex flex-col">
          <span className="text-base font-medium text-slate-500 mb-1">Visão Geral da Família</span>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Bom dia, {responsavel?.nome?.split(' ')[0] || 'Responsável'}</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-400 tracking-wider">ACESSAR PERFIL:</span>
          <div className="flex -space-x-2">
            {vinculos.map((v: any) => (
              <div
                key={v.aluno?.id}
                onClick={() => {
                  selecionarAluno(v);
                  navigate(`/portal/alunos/${v.aluno?.id}`);
                }}
                className={`w-14 h-14 rounded-full border-4 border-white flex items-center justify-center font-bold shadow-md cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all ${
                  alunoSelecionado?.id === v.aluno?.id ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {getInitials(v.aluno?.nome_completo || 'A')}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* 2. Grid de Conteúdo Web */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal: Alertas e Mural */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Alertas */}
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">Alertas e Pendências</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Nenhum alerta pendente.</p>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className={`flex items-start gap-4 p-5 rounded-3xl border shadow-sm ${alert.type === 'fin' ? 'bg-orange-50 border-orange-100 text-orange-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                    <div className="p-2 bg-white rounded-xl shadow-sm"><alert.icon className="w-6 h-6" /></div>
                    <span className="text-base font-bold leading-snug">{alert.text}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Mural Desktop */}
          <section className="flex flex-col gap-4 bg-white p-8 rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <Info className="w-8 h-8 text-teal-500" />
                Mural Direto
              </h2>
              <button 
                onClick={() => navigate('/portal/avisos')}
                className="text-sm font-bold text-teal-600 hover:bg-teal-50 px-4 py-2 rounded-xl transition-colors"
              >
                Abrir Central de Notificações
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {!avisos || avisos.length === 0 ? (
                <p className="col-span-3 text-sm text-slate-400 italic py-8 text-center">Nenhum aviso no mural.</p>
              ) : (
                avisos.map((news: any) => (
                  <div key={news.id} className="bg-slate-50 border border-slate-100 p-6 rounded-3xl hover:border-teal-200 transition-colors cursor-pointer group">
                    <span className="inline-block px-3 py-1.5 bg-white text-slate-600 rounded-lg text-[11px] font-black uppercase tracking-widest mb-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
                      {news.turma?.nome || 'Geral'}
                    </span>
                    <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight group-hover:text-teal-600 transition-colors">{news.titulo}</h3>
                    <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5 shadow-none pb-0">
                      <Clock className="w-4 h-4" /> {new Date(news.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Sidebar: Agenda Consolidada */}
        <div className="lg:col-span-1">
          <section className="flex flex-col bg-white p-8 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 h-full">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 mb-8">
              <Clock className="w-7 h-7 text-teal-500" />
              Hoje na Escola
            </h2>
            
            <div className="flex flex-col gap-8 relative before:absolute before:inset-y-2 before:left-[19px] before:w-[2px] before:bg-slate-100">
              {!dashboard?.avisosRecentes || dashboard.avisosRecentes.length === 0 ? (
                <p className="text-sm text-slate-400 pl-8 italic">Nenhum evento hoje.</p>
              ) : (
                dashboard.avisosRecentes.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-6 relative group cursor-default">
                    <div className="flex flex-col items-center mt-1 z-10">
                      <div className={`w-5 h-5 rounded-full bg-teal-500 shadow-sm border-4 border-white group-hover:scale-125 transition-transform`} />
                    </div>
                    <div className="flex flex-col flex-1 pl-1">
                      <span className="text-sm font-black text-slate-400 mb-2">
                        {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 hover:border-teal-200 transition-colors">
                        <span className="text-[10px] uppercase font-black text-teal-600 tracking-widest mb-2 flex items-center gap-1">
                          {item.turma?.nome || 'Geral'}
                        </span>
                        <span className="text-base font-bold text-slate-800">{item.titulo}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
