import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSignature, Receipt, Clock, Info, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortalContext } from '../../context';
import { useDashboardFamilia, useAvisosPortal, useConfigPix } from '../../hooks';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { usePortalNotifications } from '@/hooks/useNotifications';
import { NativeHeader } from '../components/NativeHeader';
import { ModalContratoEscola } from '../../components/ModalContratoEscola';
import { useFilaVirtual } from '../../hooks';

// Helper to get initials
const _getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export function PortalHomeV2Mobile() {
  const navigate = useNavigate();
  const { responsavel, vinculos, _selecionarAluno, _alunoSelecionado, isLoading } = usePortalContext();
  const { data: dashboard, isLoading: loadingDash } = useDashboardFamilia();
  const { data: avisos, isLoading: loadingAvisos } = useAvisosPortal();
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
  
  const informativeMessages = [
    "Dê aquele abraço no seu pequeno hoje! O incentivo em casa faz toda a diferença.",
    "Um dia produtivo começa com uma boa parceria entre escola e família!",
    "A educação é o passaporte para o futuro. Vamos juntos nessa jornada!",
    "Dica: Mantenha os dados do aluno sempre atualizados na secretaria.",
    "Acompanhe o desempenho do seu filho na aba de Notas e Frequência.",
    "A escola é o lugar onde grandes sonhos começam a tomar forma.",
    "A parceria entre família e escola é a base para o sucesso do aluno."
  ];

  const [currentMessageIdx, setCurrentMessageIdx] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMessageIdx((prev) => (prev + 1) % informativeMessages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Skeleton Loader (Padrão iOS/Android)
  if (isLoading || loadingDash || loadingAvisos) {
    return <HomeSkeleton />
  }

  // Helper de vigência e mensagens
  const hojeStr = new Date().toISOString().split('T')[0];
  const activeAvisos = (avisos ?? []).filter((a: any) => !a.data_fim || a.data_fim >= hojeStr).slice(0, 5);

  const getInformativeCard = (offset: number) => {
    const idx = (currentMessageIdx + offset) % informativeMessages.length;
    return informativeMessages[idx];
  };

  const informativeIcons = [Info, Clock, ArrowRight, FileSignature, Receipt];
  const getIcon = (offset: number) => {
    const idx = (currentMessageIdx + offset) % informativeIcons.length;
    return informativeIcons[idx];
  };

  const habilitarNotificacoes = configPix?.notificacoes_habilitado !== false;

  // Alertas dinâmicos
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
 
  // Novo alerta verde (Em Dia) solicitado pelo usuário
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
    <div className="flex flex-col gap-4 px-4 pb-12">
      {/* 1. Header de Boas-Vindas Padronizado */}
      <NativeHeader 
        title="Home"
        showNotifications
      />

      {/* 2. Alertas Críticos - iOS Banner / Material Alert */}
      <section className="flex flex-col gap-3" role="region" aria-label="Alertas">
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={alert.action}
            className={cn(
               "flex items-start gap-3 p-4 rounded-[16px] border active:scale-95 transition-all cursor-pointer",
               alert.type === 'error' && "bg-orange-50 border-orange-200 text-orange-900",
               alert.type === 'success' && "bg-emerald-50 border-emerald-200 text-emerald-900",
            )}
            role="alert"
          >
            <alert.icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-slate-700" aria-hidden="true" />
            <span className="text-[14px] font-bold leading-tight">
              {alert.text}
              {alert.highlight && (
                <span className="text-teal-600 font-black underline decoration-2 underline-offset-2 ml-1">
                  {alert.highlight}
                </span>
              )}
            </span>
          </motion.div>
        ))}
      </section>

      {/* Cards Dinâmicos: Contrato e Fila (Absorção V1) */}
      <section className="flex flex-col gap-3 px-1">
        {responsavel && !responsavel.termos_aceitos && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setShowContrato(true)}
            className="bg-amber-600 p-6 rounded-[32px] text-white shadow-xl shadow-amber-100 flex items-center justify-between cursor-pointer active:scale-95 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <FileSignature size={24} />
              </div>
              <div>
                <h3 className="text-base font-black leading-none mb-1">Contrato Pendente</h3>
                <p className="text-[10px] font-medium text-amber-100 italic">Toque aqui para assinar.</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-200" />
          </motion.div>
        )}

        {filaAtiva && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/portal/fila')}
            className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-100 flex items-center justify-between cursor-pointer active:scale-95 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center relative">
                <Clock size={24} />
                {filaAtiva.status === 'aguardando' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 rounded-full animate-ping" />
                )}
              </div>
              <div>
                <h3 className="text-base font-black leading-none mb-1">Fila Virtual</h3>
                <p className="text-[10px] font-medium text-indigo-100 italic">
                  Status: <span className="font-bold uppercase tracking-wider">{filaAtiva.status || 'Inativa'}</span>
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-indigo-200" />
          </motion.div>
        )}
      </section>

      {/* 3. Agenda do Dia Consolidada - iOS Card / Material Card */}
      <section className="flex flex-col bg-white p-4 rounded-[20px] shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3 px-1">
          {/* Title 2 - iOS Title 2 (17px Semibold) / Material Title Small (17px Semibold) */}
          <h2 className="text-[17px] font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" aria-hidden="true" />
            Agenda Hoje
          </h2>
        </div>

        <div className="flex flex-col gap-4 pl-2 relative before:absolute before:inset-y-0.5 before:left-[14px] before:w-px before:bg-slate-200">
          {!dashboard?.avisosRecentes || dashboard.avisosRecentes.length === 0 ? (
            <div className="flex flex-col gap-1 pl-6">
              <span className="text-[14px] font-semibold text-slate-500 italic">Tudo tranquilo!</span>
              <span className="text-[12px] text-slate-400 italic leading-snug">
                Nenhum evento ou aviso agendado para hoje.
              </span>
            </div>
          ) : (
            dashboard.avisosRecentes.map((item: any, idx: number) => (
              <div key={idx} className="flex gap-3 relative">
                <div className="flex flex-col items-center mt-1 z-10">
                  <div className="w-[10px] h-[10px] rounded-full bg-teal-500 shadow-sm border-2 border-white" />
                </div>
                <div className="flex flex-col flex-1">
                  {/* Caption 2 - iOS Caption 2 (12px Regular) / Material Label Medium (12px Medium) */}
                  <span className="text-[12px] font-medium text-slate-500 mb-1">
                    {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {/* Card com touch target adequado */}
                  <div className="bg-slate-50 border border-slate-200 rounded-[12px] p-3 flex flex-col justify-center">
                    {/* Caption 2 - iOS Caption 2 (11px Medium) / Material Label Small (11px Medium) */}
                    <span className="text-[11px] font-medium text-slate-600 tracking-wide mb-1 flex items-center gap-1 uppercase">
                      {item.turma?.nome || 'Geral'}
                    </span>
                    {/* Body - iOS Body (15px Regular) / Material Body Medium (15px Regular) */}
                    <span className="text-[15px] text-slate-900 leading-tight">{item.titulo}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 4. Mural Rápido - Horizontal Scroll (Restored) */}
      <section className="flex flex-col gap-3 pb-2">
        <div className="flex items-center justify-between px-1">
          {/* Title 2 - iOS Title 2 (17px Semibold) / Material Title Small (17px Semibold) */}
          <h2 className="text-[17px] font-semibold text-slate-900 flex items-center gap-2">
            <Info className="w-5 h-5 text-teal-600" aria-hidden="true" />
            Mural Rápido
          </h2>
          {/* Touch target 48px mínimo */}
          <button
            onClick={() => navigate('/portal/avisos')}
            className="min-h-[48px] px-3 flex items-center justify-center rounded-[12px] active:bg-slate-100 transition-colors touch-manipulation"
            aria-label="Ver todos os avisos"
          >
            {/* Label - iOS Label (14px Regular) / Material Label Large (14px Medium) */}
            <span className="text-[14px] font-medium text-teal-600 flex items-center">
              Ver tudo <ArrowRight className="w-[18px] h-[18px] ml-1" />
            </span>
          </button>
        </div>
        {/* Horizontal scroll snap - padrão iOS/Android (Restored) */}
        <div
          className="flex gap-3 overflow-x-auto pb-4 px-1 snap-x hide-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          role="region"
          aria-label="Lista horizontal de avisos"
        >
          {activeAvisos.length === 0 ? (
            <>
              {[0].map((offset) => {
                const Icon = getIcon(offset);
                return (
                  <motion.div
                    key={offset}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: offset * 0.1, type: "spring", stiffness: 100, damping: 15 }}
                    className="min-w-[85vw] max-w-[340px] flex-shrink-0 bg-gradient-to-br from-teal-50 to-white p-6 rounded-[28px] border border-teal-100 shadow-[0_4px_20px_rgba(20,184,166,0.08)] flex flex-col items-center text-center justify-center snap-start relative overflow-hidden active:scale-[0.98] transition-transform duration-200"
                  >
                    <motion.div
                      initial={{ opacity: 0.3, scale: 0.8 }}
                      animate={{ opacity: 0.5, scale: 1 }}
                      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                      className="absolute -right-4 -bottom-4"
                    >
                      <Icon className="w-32 h-32 text-teal-200 opacity-30" />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="w-14 h-14 bg-gradient-to-br from-teal-100 to-teal-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner"
                    >
                      <Icon className="w-7 h-7 text-teal-600" />
                    </motion.div>

                    <AnimatePresence mode="wait">
                      <motion.p
                        key={getInformativeCard(offset)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="text-[15px] font-medium text-slate-700 leading-relaxed px-2"
                      >
                        {getInformativeCard(offset)}
                      </motion.p>
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </>
          ) : (
            activeAvisos.map((news: any, idx: number) => (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1, type: "spring", stiffness: 100, damping: 15 }}
                className="min-w-[85vw] max-w-[340px] flex-shrink-0 bg-white p-5 rounded-[28px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] snap-start active:scale-[0.98] transition-transform duration-200"
              >
                {/* Chip - Material Design 3 */}
                <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 rounded-full text-[11px] font-bold uppercase tracking-wide mb-3 border border-teal-100">
                  {news.turma?.nome || 'Geral'}
                </span>
                {/* Title - iOS Body (16px Regular) / Material Body Large (16px Regular) */}
                <h3 className="text-[16px] font-bold text-slate-900 mb-3 leading-snug">{news.titulo}</h3>
                {/* Caption - iOS Caption 1 (12px Regular) / Material Label Small (12px Regular) */}
                <span className="text-[12px] text-slate-500 font-medium flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-500" aria-hidden="true" />
                  {new Date(news.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </section>

      <ModalContratoEscola 
        open={showContrato}
        onClose={() => setShowContrato(false)}
        responsavel={responsavel}
        tenantId={responsavel?.tenant_id}
      />
    </div>
  );
}

// --- SKELETON HOME ---
function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="header-mobile-native h-20 items-center">
        <div className="space-y-2">
          <div className="h-4 w-20 bg-slate-100 rounded" />
          <div className="h-8 w-40 bg-slate-200 rounded-lg" />
        </div>
        <div className="w-12 h-12 rounded-full bg-slate-100" />
      </div>
      <div className="px-4 space-y-6">
        <div className="h-24 bg-slate-100 rounded-[28px]" />
        <div className="h-48 bg-slate-100 rounded-[28px]" />
        <div className="h-40 bg-slate-100 rounded-[28px]" />
      </div>
    </div>
  )
}
