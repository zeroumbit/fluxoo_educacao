import { NotificationBell } from '@/components/ui/NotificationBell';
import { usePortalNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { AnimatePresence,motion } from 'framer-motion';
import { ArrowRight,Clock,FileSignature,Info,Receipt,Send,X } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ModalContratoEscola } from '../../components/ModalContratoEscola';
import { usePortalContext } from '../../context';
import { useAvisosPortal,useConfigPix,useDashboardFamilia,useFilaVirtual,useTransferenciasPortal } from '../../hooks';
import { ModalCopyConfirm } from '../components/ModalCopyConfirm';

// Helper to get initials
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

function getEscolaNome(value: unknown): string {
  if (!value) return 'Não informada'
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'razao_social' in value) {
    return String((value as { razao_social?: unknown }).razao_social || 'Não informada')
  }
  return String(value)
}

export function PortalHomeV2Web() {
  const navigate = useNavigate();
  const { responsavel, vinculos, selecionarAluno, alunoSelecionado, tenantId } = usePortalContext();
  const { data: dashboard } = useDashboardFamilia();
  const { data: avisos } = useAvisosPortal();
  const { data: configPix } = useConfigPix();
  const { data: notifications } = usePortalNotifications(responsavel?.id);
  const { data: historicoFila } = useFilaVirtual();
  const { data: transferenciasPortal } = useTransferenciasPortal();
  const filaAtiva = historicoFila?.find((f: any) => f.status === 'aguardando');
  const transferenciaPendente = React.useMemo(
    () => (transferenciasPortal as any[] | undefined)?.find((t) => ['aguardando_responsavel', 'aguardando_aceite_destino'].includes(t.status)),
    [transferenciasPortal]
  );
  
  const [showContrato, setShowContrato] = React.useState(false);
  const [showCopyModal, setShowCopyModal] = React.useState(false);
  const [copyId, setCopyId] = React.useState('');
  const [showTransferenciaCard, setShowTransferenciaCard] = React.useState(true);

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
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <ModalCopyConfirm isOpen={showCopyModal} onClose={() => setShowCopyModal(false)} value={copyId} />
      <header className="flex items-center justify-between gap-6 mt-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-500 mb-1">Visão Geral da Família</span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bom dia, {responsavel?.nome?.split(' ')[0] || 'Responsável'}</h1>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">ACESSAR PERFIL:</span>
            <div className="flex items-center gap-2">
              {vinculos.map((v: any, index: number) => (
                <div
                  key={v.aluno?.id || `vinculo-${index}`}
                  onClick={() => {
                    selecionarAluno(v);
                    navigate(`/portal/alunos/${v.aluno?.id}`);
                  }}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold shadow-sm cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all ${
                    alunoSelecionado?.id === v.aluno?.id ? 'bg-teal-500 text-white border-teal-500 ring-2 ring-white ring-offset-2 ring-offset-slate-50' : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  {getInitials(v.aluno?.nome_completo || 'A')}
                </div>
              ))}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
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
          className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between gap-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-teal-500 text-white flex items-center justify-center text-xl font-bold shadow-inner overflow-hidden shrink-0">
             {alunoSelecionado.foto_url ? (
               <img src={alunoSelecionado.foto_url} alt="" className="w-full h-full object-cover" />
             ) : (
               getInitials(alunoSelecionado.nome_completo)
             )}
          </div>
          <div className="flex flex-col flex-1 gap-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
              {alunoSelecionado.nome_completo}
            </h2>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 bg-teal-50 text-teal-600 rounded-md text-xs font-semibold uppercase">
                {alunoSelecionado.turma?.nome || 'Sem Turma'}
              </span>
              {alunoSelecionado.codigo_transferencia && (
                <button
                  onClick={() => {
                    setCopyId(alunoSelecionado.codigo_transferencia || '');
                    setShowCopyModal(true);
                  }}
                  className="flex items-center gap-1.5 font-mono font-semibold text-xs uppercase tracking-tight bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-md border border-amber-100 hover:bg-amber-100 transition-colors"
                >
                   ID: {alunoSelecionado.codigo_transferencia}
                   <ArrowRight size={14} className="text-amber-400 rotate-[-45deg]" />
                </button>
              )}
            </div>
          </div>
          <button 
            onClick={() => navigate(`/portal/alunos/${alunoSelecionado.id}`)}
            className="px-5 py-2.5 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 font-semibold text-xs uppercase tracking-wide hover:bg-slate-100 transition-colors"
          >
            Ver Perfil Completo
          </button>
        </motion.div>
      )}

      {/* Cards Dinâmicos: Contrato e Fila (Absorção V1) */}
      <div className="flex flex-col gap-4">
        {transferenciaPendente && showTransferenciaCard && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/portal/transferencias')}
            className="relative bg-gradient-to-r from-orange-500 to-orange-600 p-5 rounded-2xl text-white shadow-sm flex items-center justify-between cursor-pointer group hover:from-orange-600 hover:to-orange-700 transition-all overflow-hidden"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTransferenciaCard(false);
              }}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
              aria-label="Fechar aviso de transferência"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-5 pr-8">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Send size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black mb-1">Pedido de Transferência</h3>
                <p className="text-xs font-medium text-orange-100 italic">
                  {transferenciaPendente.aluno?.nome_completo || transferenciaPendente.aluno_nome || 'Aluno'}: {getEscolaNome(transferenciaPendente.escola_origem)} → {getEscolaNome(transferenciaPendente.escola_destino)}
                </p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-orange-200 group-hover:translate-x-2 transition-transform" />
          </motion.div>
        )}

        {responsavel && !responsavel.termos_aceitos && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setShowContrato(true)}
            className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-900 shadow-sm flex items-center justify-between cursor-pointer group hover:bg-amber-100 transition-all"
          >
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-white text-amber-600 shadow-sm flex items-center justify-center">
                <FileSignature size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold mb-1">Contrato Pendente</h3>
                <p className="text-xs font-medium text-amber-700">Toque aqui para assinar eletronicamente.</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
          </motion.div>
        )}

        {filaAtiva && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/portal/fila')}
            className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl text-indigo-900 shadow-sm flex items-center justify-between cursor-pointer group hover:bg-indigo-100 transition-all"
          >
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-white text-indigo-600 shadow-sm flex items-center justify-center relative">
                <Clock size={24} />
                {filaAtiva.status === 'aguardando' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-400 rounded-full animate-ping" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold mb-1">Fila Virtual</h3>
                <p className="text-xs font-medium text-indigo-700">
                  Status: <span className="font-bold uppercase tracking-wider">{filaAtiva.status || 'Inativa'}</span>
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-indigo-600 group-hover:translate-x-1 transition-transform" />
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Alertas */}
          <section className="flex flex-col gap-3">
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
                      "flex items-start gap-4 p-4 rounded-2xl border shadow-sm transition-all cursor-pointer hover:shadow-md",
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
          <section className="flex flex-col bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Info className="w-5 h-5 text-teal-500" />
                Mural Direto
              </h2>
              <button
                onClick={() => navigate('/portal/avisos')}
                className="text-sm font-bold text-teal-600 hover:bg-teal-50 px-4 py-2 rounded-xl transition-colors"
              >
                Abrir Central de Notificações
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6">
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
                        className="bg-slate-50/50 border-2 border-dashed border-slate-200 p-8 rounded-2xl shadow-sm flex flex-col items-center text-center justify-center min-h-[220px] relative overflow-hidden group hover:border-teal-200 transition-all duration-500"
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
                  <div key={news.id} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl hover:border-teal-200 transition-colors cursor-pointer group">
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
        <div className="lg:col-span-4">
          <section className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200/60 h-full overflow-hidden">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 p-6 border-b border-slate-100 mb-0">
              <Clock className="w-5 h-5 text-slate-400" />
              Hoje na Escola
            </h2>
            
            <div className="p-6 flex flex-col gap-6 relative before:absolute before:inset-y-8 before:left-[43px] before:w-[2px] before:bg-slate-100">
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
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 hover:border-teal-200 transition-colors">
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


