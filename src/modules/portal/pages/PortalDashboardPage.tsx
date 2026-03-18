import React, { useState, useEffect } from 'react'
import { usePortalContext } from '../context'
import { supabase } from '@/lib/supabase'
import { useDashboardAluno, useConfigPix, useSolicitacoesDocumento, useTransferenciasPortal, useResponderTransferencia } from '../hooks'
import { ModalFichaAluno } from '../components/ModalFichaAluno'
import { ModalContratoEscola } from '../components/ModalContratoEscola'
import { PortalModalPage } from '../components/PortalModalPage'
import { PortalAgendaPage } from './PortalAgendaPage'
import { PortalFrequenciaPage } from './PortalFrequenciaPage'
import { PortalBoletimPage } from './PortalBoletimPage'
import { PortalLivrosPage } from './PortalLivrosPage'
import { PortalFilaVirtualPage } from './PortalFilaVirtualPage'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2,
  Activity,
  AlertTriangle,
  TrendingUp,
  Clock,
  Users,
  DollarSign,
  ShoppingCart,
  ArrowRight,
  Info,
  BookOpen,
  Library,
  GraduationCap,
  Calendar,
  ChevronRight,
  FileText,
  Megaphone,
  QrCode,
  Copy,
  X,
  CheckCircle2,
  Package,
  Star,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  UserCircle,
  Eye,
  Download,
  Printer,
  Globe,
  Lock,
  MessageSquare,
  ShoppingBag
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

// Helper de vibração
const vibrate = (ms: number = 30) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

// --- SKELETON LOADING (MOBILE FIRST) ---
const DashboardSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="bg-white p-5 md:p-12 rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm flex flex-col gap-5 relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-slate-100 flex-shrink-0" />
        <div className="flex-1 space-y-3 text-center md:text-left w-full">
          <div className="h-6 bg-slate-100 rounded-lg w-3/4 mx-auto md:mx-0" />
          <div className="h-3 bg-slate-100 rounded-lg w-1/2 mx-auto md:mx-0" />
          <div className="flex justify-center md:justify-start gap-3 mt-4">
            <div className="w-10 h-10 bg-slate-100 rounded-xl" />
            <div className="w-10 h-10 bg-slate-100 rounded-xl" />
            <div className="w-10 h-10 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
    <div className="flex gap-3 overflow-x-hidden">
      <div className="flex-1 bg-white p-4 rounded-2xl h-24 border border-slate-100 shadow-sm" />
      <div className="flex-1 bg-white p-4 rounded-2xl h-24 border border-slate-100 shadow-sm" />
    </div>
    <div className="bg-white p-5 rounded-2xl h-36 border border-slate-100 shadow-sm space-y-3">
      <div className="h-5 bg-slate-100 rounded-lg w-1/3 mb-4" />
      <div className="flex gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-slate-100 rounded-lg w-full" />
          <div className="h-3 bg-slate-100 rounded-lg w-2/3" />
        </div>
      </div>
    </div>
  </div>
)
// --- COMPONENTES AUXILIARES ---

const StatCard = ({ label, value, trend, icon: Icon, color, onClick }: { label: string, value: string, trend: string, icon: any, color: string, onClick?: () => void }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "bg-white p-4 md:p-10 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6 flex-1 cursor-pointer transition-all hover:shadow-md",
      onClick && "hover:border-teal-100"
    )}
  >
    <div className="flex justify-between items-start">
      <div className={cn("w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center", color)}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald-500 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-full">
        <TrendingUp size={10} /> {trend}
      </div>
    </div>
    <div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <h4 className="text-xl md:text-2xl font-bold text-slate-800">{value}</h4>
    </div>
  </motion.div>
);


const StudentActionIcon = ({ icon: Icon, label, colorName, onClick, badge }: { icon: any, label: string, colorName: string, onClick?: () => void, badge?: string }) => {
  return (
    <motion.div
      whileTap={{ scale: 0.9 }}
      className="flex flex-col items-center gap-1.5 group cursor-pointer relative snap-center"
      onClick={() => {
        vibrate(20);
        if (onClick) onClick();
      }}
    >
      <div className={cn(
        "w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm",
        `bg-${colorName}-100`
      )}>
        <Icon size={20} className={`text-${colorName}-600`} />
      </div>
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight text-center max-w-[56px] leading-tight">
        {label}
      </span>
      {badge && (
        <span className="absolute -top-1 -right-1 bg-teal-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap z-10">
          {badge}
        </span>
      )}
    </motion.div>
  );
};

const PixModal = ({ onClose, valor, configPix }: { onClose: () => void, valor: number, configPix: any }) => {
  const [copiado, setCopiado] = useState(false);

  const handleCopiarChave = () => {
    vibrate(40);
    if (configPix?.chave_pix) {
      navigator.clipboard.writeText(configPix.chave_pix);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-6 pb-0">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100) onClose();
        }}
        className="relative bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden pb-safe"
      >
        <div className="pt-3 pb-1 flex justify-center w-full md:hidden">
            <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>
        <div className="p-5 border-b border-slate-100 bg-teal-50/30 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Pagar via PIX</h3>
            <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-wider mt-0.5">Mensalidade Escolar</p>
          </div>
          <button onClick={() => { vibrate(20); onClose(); }} className="p-2 bg-white/50 hover:bg-white rounded-xl shadow-sm">
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <div className="p-5 text-center space-y-5">
          {!configPix ? (
             <div className="py-8 text-slate-400 font-medium text-sm">Configuração PIX não disponível.</div>
          ) : (
            <>
              <div className="space-y-0.5">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Valor</p>
                <h2 className="text-3xl font-bold text-slate-800">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)}
                </h2>
              </div>
              
              {configPix.qr_code_url ? (
                <div className="mx-auto w-44 h-44 bg-white border-2 border-dashed border-teal-100 rounded-2xl flex items-center justify-center p-3">
                  <img src={configPix.qr_code_url} alt="QR Code" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="mx-auto w-44 h-44 bg-slate-50 rounded-2xl flex items-center justify-center">
                   <QrCode size={60} className="text-slate-100" />
                </div>
              )}

              <div className="space-y-3 pb-2">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopiarChave}
                  className="w-full bg-teal-500 text-white py-3.5 rounded-xl font-semibold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2"
                >
                  {copiado ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                  {copiado ? 'Copiado!' : 'Copiar Código PIX'}
                </motion.button>
                <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
                  <Info size={12} className="text-amber-500" /> Baixa em até 10 minutos.
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export function PortalDashboardPage() {
  const { responsavel, alunoSelecionado, isLoading: loadingCtx, isMultiAluno, vinculos, selecionarAluno } = usePortalContext()
  const { data: dashboard, isLoading } = useDashboardAluno()
  const { data: configPix } = useConfigPix()
  const { data: solicitacoes } = useSolicitacoesDocumento()
  const { data: transferencias } = useTransferenciasPortal()
  const responderTransferencia = useResponderTransferencia()
  const navigate = useNavigate()
  const [showPixModal, setShowPixModal] = useState(false)
  const [showFichaModal, setShowFichaModal] = useState(false)
  const [modalTransferencia, setModalTransferencia] = useState<any>(null)
  const [recusando, setRecusando] = useState(false)
  const [motivoRecusa, setMotivoRecusa] = useState('')
  const [showContratoModal, setShowContratoModal] = useState(false)
  const [escolaInfo, setEscolaInfo] = useState<any>(null)

  // Estados para os novos Modais
  const [modalOpen, setModalOpen] = useState({
    agenda: false,
    frequencia: false,
    boletim: false,
    livros: false,
    fila: false
  })

  const openModal = (key: keyof typeof modalOpen) => {
    vibrate(40)
    setModalOpen(prev => ({ ...prev, [key]: true }))
  }

  // Carregar informações da escola para o contrato
  useEffect(() => {
    async function fetchEscola() {
      if (!alunoSelecionado?.tenant_id) return
      const { data } = await supabase.from('escolas').select('*').eq('id', alunoSelecionado.tenant_id).maybeSingle()
      if (data) setEscolaInfo(data)
    }
    fetchEscola()
  }, [alunoSelecionado?.tenant_id])

  // Lógica de Primeiro Acesso - Abre contrato se não aceitou
  useEffect(() => {
    if (responsavel && !responsavel.termos_aceitos) {
      setShowContratoModal(true)
    }
  }, [responsavel])

  if (loadingCtx || isLoading) {
    return <DashboardSkeleton />
  }

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 p-6">
        <Users className="h-16 w-16 text-slate-300" />
        <h2 className="text-xl font-bold text-[#1E293B]">Nenhum aluno vinculado</h2>
        <p className="text-slate-500 text-sm">Entre em contato com a escola para vincular seu acesso.</p>
      </div>
    )
  }

  const turma = alunoSelecionado.turma
  const fin = dashboard?.financeiro
  const nomeAluno = alunoSelecionado.nome_social || alunoSelecionado.nome_completo

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ALERTA DE TRANSFERÊNCIA PENDENTE (ALTA PRIORIDADE) */}
      {transferencias?.filter(t => t.status === 'pendente_pais').map(transf => (
        <div key={transf.id} className="bg-gradient-to-r from-indigo-600 to-blue-700 p-5 rounded-2xl text-white shadow-lg flex flex-col md:flex-row items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 -mr-6 -mt-6 pointer-events-none">
            <ShieldAlert size={100} />
          </div>
          
          <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>

          <div className="flex-1 text-center md:text-left space-y-1 relative z-10">
            <Badge className="bg-white/20 text-white border-0 font-semibold px-2 py-0.5 text-[9px]">
              Ação Necessária
            </Badge>
            <h3 className="text-base md:text-lg font-bold leading-tight">
              Transferência para {transf.aluno?.nome_completo}
            </h3>
            <p className="text-indigo-100 text-xs max-w-2xl">
              A escola <strong>{transf.escola_destino?.razao_social}</strong> solicitou a transferência.
            </p>
          </div>

          <div className="flex gap-2 relative z-10 w-full md:w-auto">
            <button 
              onClick={() => {
                setModalTransferencia(transf)
                setRecusando(false)
              }}
              className="bg-white text-indigo-700 px-5 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider shadow-sm active:scale-95 flex items-center justify-center gap-2 w-full md:w-auto"
            >
              Analisar
            </button>
          </div>
        </div>
      ))}

      <motion.div 
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) > 50 && isMultiAluno && vinculos) {
            vibrate(40);
            const currentIndex = vinculos.findIndex((v: any) => v.aluno.id === alunoSelecionado.id);
            if (info.offset.x < -50 && currentIndex < vinculos.length - 1) {
              selecionarAluno(vinculos[currentIndex + 1]);
            } else if (info.offset.x > 50 && currentIndex > 0) {
              selecionarAluno(vinculos[currentIndex - 1]);
            }
          }
        }}
        className="bg-white p-5 md:p-12 rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm flex flex-col gap-6 relative overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <div className="absolute top-0 right-0 opacity-[0.02] -mr-12 -mt-12 pointer-events-none text-teal-500">
          <GraduationCap className="w-[200px] h-[200px] md:w-[300px] md:h-[300px]" />
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-8 relative z-10">
          <div className="relative pointer-events-none">
            <div className="w-20 h-20 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-2xl md:rounded-[2.5rem] bg-teal-500 flex items-center justify-center text-white text-3xl md:text-5xl font-bold shadow-lg shadow-teal-500/20 border-4 border-white">
              {nomeAluno.charAt(0)}
            </div>
            {isMultiAluno && vinculos && vinculos.length > 1 && (
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-white p-1.5 rounded-full shadow-lg border border-slate-100 z-20 pointer-events-auto">
                {vinculos.map((v: any) => (
                  <button 
                    key={v.aluno.id}
                    onClick={() => { vibrate(20); selecionarAluno(v); }}
                    title={v.aluno.nome_social || v.aluno.nome_completo}
                    className={cn(
                      "w-8 h-8 rounded-full font-bold text-[10px] transition-all flex items-center justify-center",
                      v.aluno.id === alunoSelecionado.id 
                      ? 'bg-teal-600 text-white scale-110 shadow-md' 
                      : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
                    )}
                  >
                    {(v.aluno.nome_social || v.aluno.nome_completo).charAt(0)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-4 select-none">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800">{nomeAluno}</h2>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <p className="text-slate-400 font-medium text-sm">{turma?.nome || 'Carregando turma...'}</p>
                <div className="w-1 h-1 rounded-full bg-slate-200" />
                <p className="text-teal-500 font-medium text-xs md:text-sm">{turma?.turno || 'Carregando turno...'}</p>
              </div>
              <div className="flex justify-center lg:justify-start items-center gap-2 flex-wrap pt-1">
                {turma?.valor_mensalidade && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-semibold px-2 py-0.5 rounded-lg text-[10px]">
                    Mensalidade: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(turma.valor_mensalidade)}
                  </Badge>
                )}
                {alunoSelecionado?.status === 'ativo' ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-semibold px-2 py-0.5 rounded-lg text-[10px]">
                    Matriculado(a)
                  </Badge>
                ) : dashboard?.financeiro?.cobrancasMatricula?.some((c: any) => ['a_vencer', 'atrasado'].includes(c.status)) ? (
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-semibold px-2 py-0.5 rounded-lg text-[10px]">
                    Matrícula pendente
                  </Badge>
                ) : null}
              </div>
            </div>
            
            <div 
              className="overflow-x-auto scrollbar-hide py-2 w-full h-fit snap-x snap-mandatory"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="flex gap-6 md:gap-10 border-t border-slate-50 pt-8 justify-start md:justify-center min-w-max px-4">
                <StudentActionIcon
                  icon={Calendar}
                  label="Agenda"
                  colorName="teal"
                  onClick={() => openModal('agenda')}
                />
                <StudentActionIcon
                  icon={BookOpen}
                  label="Diário"
                  colorName="emerald"
                  onClick={() => openModal('frequencia')}
                />
                <StudentActionIcon
                  icon={FileText}
                  label="Boletim"
                  colorName="violet"
                  onClick={() => openModal('boletim')}
                />
                <StudentActionIcon
                  icon={Library}
                  label="Livros"
                  colorName="indigo"
                  onClick={() => openModal('livros')}
                />
                <StudentActionIcon
                  icon={Clock}
                  label="Fila"
                  colorName="blue"
                  onClick={() => openModal('fila')}
                />
                <StudentActionIcon
                  icon={UserCircle}
                  label="Perfil"
                  colorName="slate"
                  onClick={() => {
                    vibrate(40);
                    setShowFichaModal(true);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card de Pagamento */}
          <motion.div 
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/portal/cobrancas')}
            className="bg-slate-900 p-8 rounded-2xl md:rounded-[2.5rem] text-white shadow-lg min-w-full md:min-w-[320px] relative overflow-hidden cursor-pointer hover:bg-slate-800 transition-colors group"
          >
             <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
               <QrCode size={100} />
             </div>
             <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Total Pendente</p>
             <h4 className="text-2xl font-bold mb-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fin?.totalPendente || 0)}
             </h4>
             <p className={cn(
                "text-teal-400 text-[10px] font-medium uppercase tracking-wider mb-5 flex items-center gap-1.5"
             )}>
                {(fin?.totalAtrasadas || 0) > 0 ? <AlertTriangle size={12} className="text-red-400" /> : <CheckCircle2 size={12} />}
                {fin?.totalAtrasadas ? `${fin.totalAtrasadas} pendentes` : 'Tudo em dia'}
             </p>
             <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPixModal(true);
                }}
                className="w-full bg-teal-500 hover:bg-teal-400 py-3.5 rounded-xl font-semibold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 relative z-10 active:scale-95"
             >
                <QrCode size={16} /> Pagar via PIX
             </button>
          </motion.div>
        </div>
      </motion.div>

      {/* 2. Estatísticas Rápidas */}
      {dashboard && (
        <div className="flex flex-col md:flex-row gap-3">
          <StatCard
            label="Documentos Solicitados"
            value={String(solicitacoes?.length || 0)}
            trend={`${solicitacoes?.filter((s: any) => s.status === 'pendente' || s.status === 'em_analise').length || 0} em andamento`}
            icon={FileText}
            color="bg-teal-500"
            onClick={() => navigate('/portal/documentos')}
          />
          <StatCard
            label="Total Pendente"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fin?.totalPendente || 0)}
            trend={fin?.totalAtrasadas ? `${fin.totalAtrasadas} em atraso` : 'Tudo em dia'}
            icon={DollarSign}
            color="bg-amber-500"
            onClick={() => navigate('/portal/cobrancas')}
          />
          <StatCard
            label="Avisos Recentes"
            value={String(dashboard.avisosRecentes.length)}
            trend="Últimos 30 dias"
            icon={Megaphone}
            color="bg-blue-500"
            onClick={() => navigate('/portal/avisos')}
          />
        </div>
      )}

      {/* Alertas Críticos */}
      {(fin?.totalAtrasadas || 0) > 0 && (
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex flex-col md:flex-row items-center gap-4">
           <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
             <AlertTriangle className="h-5 w-5 text-red-600" />
           </div>
           <div className="flex-1 text-center md:text-left">
             <p className="text-sm font-bold text-red-900">Pendência Financeira</p>
             <p className="text-xs text-red-600/80">Regularize para manter acesso completo.</p>
           </div>
           <button onClick={() => navigate('/portal/cobrancas')} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-semibold uppercase tracking-wider shadow-sm active:scale-95">
             Verificar
           </button>
        </div>
      )}

      {/* 3. Mural da Unidade - Avisos Completos */}
      <div className="bg-white p-8 md:p-12 rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Megaphone className="text-teal-500" size={20} /> Mural
          </h3>
          <button
            onClick={() => navigate('/portal/avisos')}
            className="text-[10px] font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1"
          >
            Ver todos <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-4">
          {dashboard?.avisosRecentes && dashboard.avisosRecentes.length > 0 ? (
            dashboard.avisosRecentes.map((aviso: any, idx: number) => (
              <div key={aviso.id || idx}>
                <div className="flex gap-3 cursor-pointer" onClick={() => navigate('/portal/avisos')}>
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    idx % 2 === 0 ? "bg-blue-50 text-blue-500" : "bg-emerald-50 text-emerald-500"
                  )}>
                    {idx % 2 === 0 ? <Info size={18} /> : <Activity size={18} />}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{aviso.titulo}</p>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{aviso.conteudo}</p>
                  </div>
                </div>
                {idx < dashboard.avisosRecentes.length - 1 && <div className="h-px bg-slate-50 w-full mt-4"></div>}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center">
                <Info className="h-7 w-7 text-slate-200" />
              </div>
              <p className="text-slate-400 font-medium text-xs">Nenhum aviso recente.</p>
            </div>
          )}
        </div>
      </div>

      {showPixModal && <PixModal onClose={() => setShowPixModal(false)} valor={fin?.totalPendente || 0} configPix={configPix} />}

      <ModalFichaAluno 
        open={showFichaModal} 
        onOpenChange={setShowFichaModal} 
      />

      <ModalContratoEscola
        open={showContratoModal}
        onClose={() => setShowContratoModal(false)}
        responsavel={responsavel}
        tenantId={alunoSelecionado.tenant_id}
        alunoNome={alunoSelecionado?.nome_completo}
        escolaNome={escolaInfo?.razao_social}
        escolaCnpj={escolaInfo?.cnpj}
        escolaEndereco={escolaInfo ? `${escolaInfo.logradouro}, ${escolaInfo.numero} - ${escolaInfo.bairro}, ${escolaInfo.cidade}/${escolaInfo.estado}` : undefined}
      />

      {/* MODAL DE CONSENTIMENTO DE TRANSFERÊNCIA */}
      <Dialog open={!!modalTransferencia} onOpenChange={(open) => {
        if (!open) {
          setModalTransferencia(null)
          setRecusando(false)
          setMotivoRecusa('')
        }
      }}>
        <DialogContent className="max-w-lg rounded-2xl border-0 p-0 overflow-hidden bg-white shadow-2xl">
          <div className="bg-indigo-600 p-5 text-white relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldAlert size={80} />
            </div>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Consentimento de Transferência</DialogTitle>
              <DialogDescription className="text-indigo-100 text-xs mt-1">
                Conforme a LGPD, sua autorização é necessária para compartilhar os dados do aluno.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-5 space-y-5">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="h-12 w-12 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                {modalTransferencia?.aluno?.nome_completo?.charAt(0)}
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Aluno(a)</p>
                <p className="text-base font-bold text-slate-800">{modalTransferencia?.aluno?.nome_completo}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider text-center">Origem</p>
                <div className="p-3 bg-slate-50 rounded-xl text-center font-medium text-slate-700 text-xs">
                  {modalTransferencia?.escola_origem?.razao_social}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider text-center">Destino</p>
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-center font-medium text-indigo-700 text-xs">
                  {modalTransferencia?.escola_destino?.razao_social}
                </div>
              </div>
            </div>

            {recusando ? (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                <p className="text-xs font-medium text-slate-600">Por que está recusando?</p>
                <textarea 
                  value={motivoRecusa}
                  onChange={(e) => setMotivoRecusa(e.target.value)}
                  placeholder="Opcional: motivo da recusa..."
                  className="w-full h-20 p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm resize-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed bg-amber-50 p-4 rounded-xl border border-amber-100">
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Info size={14} /> Importante
                </p>
                <p className="text-amber-800">
                  Ao clicar em <strong>"Autorizar"</strong>, você permite compartilhar dados de <strong>{modalTransferencia?.aluno?.nome_completo}</strong> com a nova instituição.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="p-5 pt-0 flex-col sm:flex-row gap-3">
            {recusando ? (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => setRecusando(false)}
                  className="rounded-xl font-semibold text-xs uppercase tracking-wider"
                >
                  Voltar
                </Button>
                <Button 
                  disabled={responderTransferencia.isPending}
                  onClick={async () => {
                    try {
                      await responderTransferencia.mutateAsync({ id: modalTransferencia.id, aprovado: false, motivoRecusa })
                      toast.success("Transferência recusada.")
                      setModalTransferencia(null)
                    } catch { toast.error("Erro ao processar.") }
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-xs uppercase tracking-wider h-11"
                >
                  {responderTransferencia.isPending ? <Loader2 className="animate-spin" /> : 'Confirmar Recusa'}
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost"
                  onClick={() => setRecusando(true)}
                  className="rounded-xl font-semibold text-xs uppercase tracking-wider text-slate-400 hover:text-red-600"
                >
                  Recusar
                </Button>
                <Button 
                  disabled={responderTransferencia.isPending}
                  onClick={async () => {
                    try {
                      await responderTransferencia.mutateAsync({ id: modalTransferencia.id, aprovado: true })
                      toast.success("Transferência autorizada!")
                      setModalTransferencia(null)
                    } catch { toast.error("Erro ao processar.") }
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs uppercase tracking-wider h-11 shadow-sm"
                >
                  {responderTransferencia.isPending ? <Loader2 className="animate-spin" /> : 'Autorizar'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAIS DE AÇÕES DO ALUNO */}
      <PortalModalPage
        open={modalOpen.agenda}
        onOpenChange={(open) => setModalOpen(prev => ({ ...prev, agenda: open }))}
        title="Agenda"
        subtitle="Calendário Institucional"
        icon={Calendar}
        colorClass="bg-teal-600"
      >
        <PortalAgendaPage hideHeader />
      </PortalModalPage>

      <PortalModalPage
        open={modalOpen.frequencia}
        onOpenChange={(open) => setModalOpen(prev => ({ ...prev, frequencia: open }))}
        title="Diário"
        subtitle="Frequência e Conteúdos"
        icon={BookOpen}
        colorClass="bg-emerald-600"
      >
        <PortalFrequenciaPage hideHeader />
      </PortalModalPage>

      <PortalModalPage
        open={modalOpen.boletim}
        onOpenChange={(open) => setModalOpen(prev => ({ ...prev, boletim: open }))}
        title="Boletim"
        subtitle="Performance Acadêmica"
        icon={FileText}
        colorClass="bg-violet-600"
      >
        <PortalBoletimPage hideHeader />
      </PortalModalPage>

      <PortalModalPage
        open={modalOpen.livros}
        onOpenChange={(open) => setModalOpen(prev => ({ ...prev, livros: open }))}
        title="Biblioteca"
        subtitle="Acervo de Materiais"
        icon={Library}
        colorClass="bg-indigo-600"
      >
        <PortalLivrosPage hideHeader />
      </PortalModalPage>

      <PortalModalPage
        open={modalOpen.fila}
        onOpenChange={(open) => setModalOpen(prev => ({ ...prev, fila: open }))}
        title="Fila Virtual"
        subtitle="Chegada & Pick-up"
        icon={Clock}
        colorClass="bg-blue-600"
      >
        <PortalFilaVirtualPage hideHeader />
      </PortalModalPage>

    </div>
  )
}
