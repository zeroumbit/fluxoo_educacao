import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSignature, Receipt, Clock, Info, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortalContext } from '../../context';
import { useDashboardFamilia, useAvisosPortal } from '../../hooks';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { usePortalNotifications } from '@/hooks/useNotifications';

// Helper to get initials
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export function PortalHomeV2Mobile() {
  const navigate = useNavigate();
  const { responsavel, vinculos, selecionarAluno, alunoSelecionado } = usePortalContext();
  const { data: dashboard } = useDashboardFamilia();
  const { data: avisos } = useAvisosPortal();
  const { data: notifications } = usePortalNotifications(responsavel?.id);
  
  // Helper de vigência e mensagens
  const hojeStr = new Date().toISOString().split('T')[0];
  const activeAvisos = (avisos ?? []).filter((a: any) => !a.data_fim || a.data_fim >= hojeStr).slice(0, 5);

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

  const getInformativeCard = (offset: number) => {
    const idx = (currentMessageIdx + offset) % informativeMessages.length;
    return informativeMessages[idx];
  };

  const informativeIcons = [Info, Clock, ArrowRight, FileSignature, Receipt];
  const getIcon = (offset: number) => {
    const idx = (currentMessageIdx + offset) % informativeIcons.length;
    return informativeIcons[idx];
  };

  // Alertas dinâmicos
  const alerts = [];
  if (dashboard?.financeiro?.totalAtrasadas && dashboard.financeiro.totalAtrasadas > 0) {
    alerts.push({
      id: 'fin-atraso',
      text: `Você possui ${dashboard.financeiro.totalAtrasadas} fatura(s) em atraso. Regularize para evitar suspensão de serviços.`,
      type: 'error',
      icon: Receipt
    });
  }

  // Novo alerta verde (Em Dia) solicitado pelo usuário
  if (dashboard?.financeiro?.proximoVencimento && dashboard.financeiro.totalAtrasadas === 0) {
    const dataVenc = new Date(dashboard.financeiro.proximoVencimento.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR');
    alerts.push({
      id: 'fin-em-dia',
      text: `${responsavel?.nome?.split(' ')[0] || 'Responsável'}, sua mensalidade está em dia, mas caso já queira pagar a mensalidade que vence em ${dataVenc}, clique aqui.`,
      type: 'success',
      icon: Receipt,
      action: () => navigate('/portal/financeiro')
    });
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-safe">
      {/* 1. Header de Boas-Vindas */}
      {/* Safe area top para dispositivos com notch (iOS) */}
      <header className="flex items-start justify-between pt-[env(safe-area-inset-top,12px)] mt-2 pb-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] text-slate-500 leading-tight">Bom dia,</span>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-[34px]">
            {responsavel?.nome?.split(' ')[0] || 'Responsável'}
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <NotificationBell
            total={notifications?.total || 0}
            items={notifications?.items || []}
          />
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
                className={`w-12 h-12 rounded-full border-2 border-white flex items-center justify-center font-semibold shadow-sm cursor-pointer active:scale-95 transition-transform touch-manipulation ${
                  alunoSelecionado?.id === v.aluno?.id ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}
                aria-label={`Selecionar aluno ${v.aluno?.nome_completo || 'aluno'}`}
              >
                {getInitials(v.aluno?.nome_completo || 'A')}
              </motion.button>
            ))}
          </div>
        </div>
      </header>

      {/* 2. Alertas Críticos - iOS Banner / Material Alert */}
      <section className="flex flex-col gap-3" role="region" aria-label="Alertas">
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={alert.action}
            className={cn(
               "flex items-start gap-3 p-4 rounded-[16px] border active:scale-95 transition-all",
               alert.type === 'error' && "bg-orange-50 border-orange-200 text-orange-900",
               alert.type === 'success' && "bg-emerald-50 border-emerald-200 text-emerald-900",
            )}
            role="alert"
          >
            <alert.icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-slate-700" aria-hidden="true" />
            <span className="text-[14px] font-bold leading-tight">{alert.text}</span>
          </motion.div>
        ))}
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

      {/* 4. Mural Rápido - Horizontal Scroll */}
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
        {/* Horizontal scroll snap - padrão iOS/Android */}
        <div
          className="flex gap-3 overflow-x-auto pb-4 px-1 snap-x hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          role="region"
          aria-label="Lista horizontal de avisos"
        >
          {activeAvisos.length === 0 ? (
            <>
              {[0, 1, 2, 3].map((offset) => {
                const Icon = getIcon(offset);
                return (
                  <motion.div
                    key={offset}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: offset * 0.1 }}
                    className="min-w-[260px] flex-shrink-0 bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-center snap-start relative overflow-hidden"
                  >
                    <Icon className="absolute -right-2 -top-2 w-16 h-16 text-slate-50 opacity-50" />
                    
                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-teal-500" />
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.p
                        key={getInformativeCard(offset)}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.6 }}
                        className="text-[14px] font-medium text-slate-700 leading-snug italic"
                      >
                        {getInformativeCard(offset)}
                      </motion.p>
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </>
          ) : (
            activeAvisos.map((news: any) => (
              <div
                key={news.id}
                className="min-w-[260px] flex-shrink-0 bg-white p-4 rounded-[20px] border border-slate-200 shadow-sm snap-start"
              >
                {/* Chip - Material Design 3 */}
                <span className="inline-block px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-[11px] font-medium uppercase tracking-wide mb-3">
                  {news.turma?.nome || 'Geral'}
                </span>
                {/* Title - iOS Body (16px Regular) / Material Body Large (16px Regular) */}
                <h3 className="text-[16px] text-slate-900 mb-2 leading-tight">{news.titulo}</h3>
                {/* Caption - iOS Caption 1 (12px Regular) / Material Label Small (12px Regular) */}
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
