import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSignature, Receipt, Clock, Info, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortalContext } from '../../context';
import { usePortalNotifications } from '@/hooks/useNotifications';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { ModalContratoEscola } from '../../components/ModalContratoEscola';
import { useFilaVirtual } from '../../hooks';
import { useDashboardFamilia, useAvisosPortal, useConfigPix } from '../../hooks';

// Helper to get initials
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export function PortalHomeV2Web() {
  const navigate = useNavigate();
  const { responsavel, vinculos, selecionarAluno, alunoSelecionado, tenantId } = usePortalContext();
  const { data: dashboard } = useDashboardFamilia();
  const { data: avisos } = useAvisosPortal();
  const { data: configPix } = useConfigPix();
  const { data: notifications } = usePortalNotifications(responsavel?.id);
  const { data: historicoFila } = useFilaVirtual();
  const filaAtiva = historicoFila?.find((f: any) => f.status === 'aguardando');
  
  const [showContrato, setShowContrato] = React.useState(false);

  // Auto-trigger de contrato pendente
  React.useEffect(() => {
    if (responsavel && !responsavel.termos_aceitos) {
      setShowContrato(true);
    }
  }, [responsavel]);

  const hojeStr = new Date().toISOString().split('T')[0];
  const activeAvisos = (avisos ?? []).filter((a: any) => !a.data_fim || a.data_fim >= hojeStr).slice(0, 3);

  const informativeMessages = [
    "Um dia produtivo começa com uma boa parceria entre escola e família!",
    "A educação é o passaporte para o futuro. Vamos juntos!",
    "Mantenha os dados do aluno sempre atualizados na secretaria.",
    "Acompanhe o desempenho do seu filho na aba de Notas e Frequência.",
    "A escola é o lugar onde grandes sonhos começam a tomar forma.",
    "Parceria escola e família: o sucesso do aluno começa aqui!"
  ];

  const [currentMessageIdx, setCurrentMessageIdx] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMessageIdx((prev) => (prev + 1) % informativeMessages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const getInformativeCard = (offset: number) => {
    const idx = (currentMessageIdx + offset) % informativeMessages.length;
    return informativeMessages[idx];
  };

  const informativeIcons = [Info, Clock, ArrowRight, FileSignature, Receipt];
  const getIcon = (offset: number) => {
    const idx = (currentMessageIdx + offset) % informativeIcons.length;
    return informativeIcons[idx];
  };

  const habilitarNotificacoes = true;

  const alerts = [];
  if (habilitarNotificacoes && dashboard?.financeiro?.totalAtrasadas && dashboard.financeiro.totalAtrasadas > 0) {
    alerts.push({
      id: 'fin-atraso',
      text: `Você possui ${dashboard.financeiro.totalAtrasadas} fatura(s) em atraso. Regularize para evitar suspensão de serviços.`,
      type: 'error',
      icon: Receipt,
      action: () => navigate('/portal/financeiro', { state: { selectedCobrancaId: dashboard.financeiro.piorPendencia?.id } })
    });
  }
 
  if (habilitarNotificacoes && dashboard?.financeiro?.proximoVencimento && dashboard.financeiro.totalAtrasadas === 0) {
    const dataVenc = new Date(dashboard.financeiro.proximoVencimento.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR');
    alerts.push({
      id: 'fin-em-dia',
      text: `${responsavel?.nome?.split(' ')[0] || 'Responsável'}, sua mensalidade está em dia, mas caso já queira pagar a mensalidade que vence em ${dataVenc}, `,
      highlight: 'clique aqui',
      type: 'success',
      icon: Receipt,
      action: () => navigate('/portal/financeiro', { state: { selectedCobrancaId: dashboard.financeiro.proximoVencimento?.id } })
    });
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      <header className="flex items-end justify-between border-b border-slate-200 pb-8 mt-2">
        <div className="flex flex-col">
          <span className="text-base font-medium text-slate-500 mb-1">Visão Geral da Família</span>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Bom dia, {responsavel?.nome?.split(' ')[0] || 'Responsável'}</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-400 tracking-wider">ACESSAR PERFIL:</span>
            <div className="flex -space-x-2">
              {vinculos.map((v: any, index: number) => (
                <div
                  key={v.aluno?.id || `vinculo-${index}`}
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
          <NotificationBell
            total={notifications?.total || 0}
            items={notifications?.items || []}
          />
        </div>
      </header>

      {/* Card de Resumo do Aluno Selecionado - Web */}
      {alunoSelecionado && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex items-center gap-6"
        >
          <div className="w-20 h-20 rounded-[28px] bg-teal-500 text-white flex items-center justify-center text-4xl font-black shadow-lg shadow-teal-500/10 overflow-hidden shrink-0">
             {alunoSelecionado.foto_url ? (
               <img src={alunoSelecionado.foto_url} alt="" className="w-full h-full object-cover" />
             ) : (
               getInitials(alunoSelecionado.nome_completo)
             )}
          </div>
          <div className="flex flex-col flex-1 gap-1">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              {alunoSelecionado.nome_completo}
            </h2>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-xl text-sm font-bold uppercase tracking-widest">
                {alunoSelecionado.turma?.nome || 'Sem Turma'}
              </span>
              {alunoSelecionado.codigo_transferencia && (
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(alunoSelecionado.codigo_transferencia || '');
                    alert('ID copiado!');
                  }}
                  className="flex items-center gap-2 font-mono font-bold text-xs uppercase tracking-tight bg-amber-50 text-amber-700 px-3 py-1 rounded-xl border border-amber-100 hover:bg-amber-100 transition-colors"
                >
                   ID: {alunoSelecionado.codigo_transferencia}
                   <ArrowRight size={14} className="text-amber-400 rotate-[-45deg]" />
                </button>
              )}
            </div>
          </div>
          <button 
            onClick={() => navigate(`/portal/alunos/${alunoSelecionado.id}`)}
            className="px-8 py-4 bg-slate-50 text-slate-600 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors"
          >
            Ver Perfil Completo
          </button>
        </motion.div>
      )}

      {/* Cards Dinâmicos: Contrato e Fila (Absorção V1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {responsavel && !responsavel.termos_aceitos && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setShowContrato(true)}
            className="bg-amber-600 p-8 rounded-[40px] text-white shadow-xl shadow-amber-100 flex items-center justify-between cursor-pointer group hover:bg-amber-700 transition-all"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <FileSignature size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black mb-1">Contrato Pendente</h3>
                <p className="text-xs font-medium text-amber-100 italic">Toque aqui para assinar eletronicamente.</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-amber-200 group-hover:translate-x-2 transition-transform" />
          </motion.div>
        )}

        {filaAtiva && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/portal/fila')}
            className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-100 flex items-center justify-between cursor-pointer group hover:bg-indigo-700 transition-all"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center relative">
                <Clock size={28} />
                {filaAtiva.status === 'aguardando' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-400 rounded-full animate-ping" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-black mb-1">Fila Virtual</h3>
                <p className="text-xs font-medium text-indigo-100 italic">
                  Status: <span className="font-bold uppercase tracking-wider">{filaAtiva.status || 'Inativa'}</span>
                </p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-indigo-200 group-hover:translate-x-2 transition-transform" />
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Alertas */}
          <section className="flex flex-col gap-4 max-w-[800px]">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">Alertas e Pendências</h2>
            <div className="grid grid-cols-1 gap-4">
              {alerts.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Nenhum alerta pendente.</p>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={alert.action}
                    className={cn(
                      "flex items-start gap-4 p-5 rounded-3xl border shadow-sm transition-all cursor-pointer hover:shadow-md",
                      alert.type === 'error' && "bg-orange-50 border-orange-100 text-orange-800",
                      alert.type === 'success' && "bg-emerald-50 border-emerald-100 text-emerald-800",
                      alert.type === 'danger' && "bg-rose-50 border-rose-100 text-rose-800"
                    )}
                  >
                    <div className="p-2 bg-white rounded-xl shadow-sm"><alert.icon className="w-6 h-6" /></div>
                    <span className="text-base font-bold leading-snug">
                      {alert.text}
                      {alert.highlight && (
                        <span className="text-teal-600 font-black underline decoration-2 underline-offset-2 hover:text-teal-700 transition-colors">
                          {alert.highlight}
                        </span>
                      )}
                    </span>
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
            <div className="grid grid-cols-1 gap-6">
              {activeAvisos.length === 0 ? (
                <>
                  {[0].map((offset) => {
                    const Icon = getIcon(offset);
                    return (
                      <motion.div
                        key={offset}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: offset * 0.1 }}
                        className="bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm flex flex-col items-center text-center justify-center min-h-[220px] relative overflow-hidden group hover:border-teal-200 transition-all duration-500"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                          <Icon className="w-24 h-24" />
                        </div>

                        <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                          <Icon className="w-7 h-7 text-teal-500" />
                        </div>

                        <AnimatePresence mode="wait">
                          <motion.p
                            key={getInformativeCard(offset)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.5 }}
                            className="text-slate-600 font-bold leading-relaxed text-base px-2"
                          >
                            {getInformativeCard(offset)}
                          </motion.p>
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </>
              ) : (
                activeAvisos.slice(0, 1).map((news: any) => (
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
                <div className="flex flex-col gap-2 pl-8">
                  <p className="text-sm font-bold text-slate-500 italic">Dia tranquilo!</p>
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    Não há eventos ou lembretes agendados para hoje. Aproveite o dia!
                  </p>
                </div>
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

      <ModalContratoEscola 
        open={showContrato}
        onClose={() => setShowContrato(false)}
        responsavel={responsavel}
        tenantId={tenantId || responsavel?.tenant_id}
        alunoNome={alunoSelecionado?.nome_completo}
      />
    </div>
  );
}
