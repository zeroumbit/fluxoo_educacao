import React, { useState } from 'react'
import { usePortalContext } from '../context'
import { useDashboardAluno, useConfigPix, useSolicitacoesDocumento } from '../hooks'
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
  Star
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

// --- COMPONENTES AUXILIARES ---

const StatCard = ({ label, value, trend, icon: Icon, color }: { label: string, value: string, trend: string, icon: any, color: string }) => (
  <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-sm flex flex-col gap-4 flex-1">
    <div className="flex justify-between items-start">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm", color)}>
        <Icon size={24} className="text-white" />
      </div>
      <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
        <TrendingUp size={12} /> {trend}
      </div>
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-3xl font-black text-slate-800 tracking-tighter">{value}</h4>
    </div>
  </div>
);

const StudentActionIcon = ({ icon: Icon, label, colorName, onClick, badge }: { icon: any, label: string, colorName: string, onClick?: () => void, badge?: string }) => (
  <div className="flex flex-col items-center gap-3 group cursor-pointer relative" onClick={onClick}>
    <div className={cn(
      "w-14 h-14 rounded-[24px] flex items-center justify-center transition-all shadow-sm border border-transparent group-hover:scale-110 group-hover:border-slate-100",
      `bg-${colorName}-500/10`
    )}>
      <Icon size={24} className={`text-${colorName}-500`} />
    </div>
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter text-center max-w-[70px] leading-tight group-hover:text-teal-600 transition-colors">
      {label}
    </span>
    {badge && (
      <span className="absolute -top-1 -right-1 bg-teal-500 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-xl shadow-teal-500/30 whitespace-nowrap z-10">
        {badge}
      </span>
    )}
  </div>
);

const PixModal = ({ onClose, valor, configPix }: { onClose: () => void, valor: number, configPix: any }) => {
  const [copiado, setCopiado] = useState(false);

  const handleCopiarChave = () => {
    if (configPix?.chave_pix) {
      navigator.clipboard.writeText(configPix.chave_pix);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-[64px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-12 border-b border-slate-100 bg-teal-50/30 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Pagar via PIX</h3>
            <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-1">Mensalidade Escolar • {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-white rounded-3xl transition-all shadow-sm">
            <X size={28} className="text-slate-400" />
          </button>
        </div>
        <div className="p-12 text-center space-y-12">
          {!configPix ? (
             <div className="py-10 text-slate-400 font-bold">Configuração PIX não disponível.</div>
          ) : (
            <>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor do Título</p>
                <h2 className="text-6xl font-black text-slate-800 tracking-tighter">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)}
                </h2>
              </div>
              
              {configPix.qr_code_url ? (
                <div className="mx-auto w-56 h-56 bg-white border-2 border-dashed border-teal-100 rounded-[48px] flex items-center justify-center shadow-inner relative group cursor-pointer p-4">
                  <img src={configPix.qr_code_url} alt="QR Code" className="w-full h-full object-contain opacity-90 group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-[48px] transition-opacity">
                    <span className="bg-teal-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase">Ampliar</span>
                  </div>
                </div>
              ) : (
                <div className="mx-auto w-56 h-56 bg-slate-50 rounded-[48px] flex items-center justify-center">
                   <QrCode size={100} className="text-slate-100" />
                </div>
              )}

              <div className="space-y-4">
                <button 
                  onClick={handleCopiarChave}
                  className="w-full bg-teal-500 text-white py-6 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-teal-500/30 hover:bg-teal-600 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {copiado ? <CheckCircle2 size={24} /> : <Copy size={24} />}
                  {copiado ? 'Copiado!' : 'Copiar Código PIX'}
                </button>
                <p className="text-[10px] text-slate-400 font-bold italic flex items-center justify-center gap-2">
                  <Info size={14} className="text-amber-500" /> A baixa bancária ocorre em até 10 minutos.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export function PortalDashboardPage() {
  const { alunoSelecionado, isLoading: loadingCtx, isMultiAluno, vinculos, selecionarAluno } = usePortalContext()
  const { data: dashboard, isLoading } = useDashboardAluno()
  const { data: configPix } = useConfigPix()
  const { data: solicitacoes } = useSolicitacoesDocumento()
  const navigate = useNavigate()
  const [showPixModal, setShowPixModal] = useState(false)

  if (loadingCtx || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#14B8A6]" />
      </div>
    )
  }

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* 1. Header do Aluno - Ultra Premium */}
      <div className="bg-white p-8 md:p-14 rounded-[56px] border border-slate-100 shadow-sm flex flex-col gap-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] -mr-24 -mt-24 pointer-events-none">
          <GraduationCap size={500} />
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="relative">
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-[52px] bg-teal-500 flex items-center justify-center text-white text-5xl md:text-6xl font-black shadow-2xl shadow-teal-500/30 border-8 border-white">
              {nomeAluno.charAt(0)}
            </div>
            {isMultiAluno && vinculos && vinculos.length > 1 && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-3 bg-white p-3 rounded-full shadow-2xl border border-slate-50 z-20">
                {vinculos.map(v => (
                  <button 
                    key={v.aluno.id}
                    onClick={() => selecionarAluno(v)}
                    title={v.aluno.nome_social || v.aluno.nome_completo}
                    className={cn(
                      "w-11 h-11 rounded-full font-black text-xs transition-all flex items-center justify-center",
                      v.aluno.id === alunoSelecionado.id 
                      ? 'bg-teal-600 text-white scale-125 shadow-lg' 
                      : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
                    )}
                  >
                    {(v.aluno.nome_social || v.aluno.nome_completo).charAt(0)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 text-center lg:text-left space-y-8">
            <div className="space-y-1">
              <h2 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tighter leading-tight italic">{nomeAluno}</h2>
              <p className="text-slate-400 font-bold text-xl">{turma?.nome || 'Turma não informada'} • <span className="text-teal-500">{turma?.turno || 'Turno não informado'}</span></p>
            </div>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-8 border-t border-slate-50 pt-8">
              <StudentActionIcon
                icon={Calendar}
                label="Agenda"
                colorName="teal"
                onClick={() => navigate('/portal/agenda')}
              />
              <StudentActionIcon icon={Activity} label="Frequência" colorName="emerald" onClick={() => navigate('/portal/frequencia')} />
              <StudentActionIcon icon={FileText} label="Boletim" colorName="violet" onClick={() => navigate('/portal/boletim')} />
              <StudentActionIcon icon={Library} label="Livros" colorName="indigo" onClick={() => navigate('/portal/livros')} />
              <StudentActionIcon icon={Clock} label="Fila" colorName="blue" onClick={() => navigate('/portal/fila')} />
            </div>
          </div>

          {/* Card de Pagamento Flutuante */}
          <div className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl min-w-full lg:min-w-[320px] relative overflow-hidden group border border-white/5">
             <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12 group-hover:scale-125 transition-transform duration-500">
               <QrCode size={140} />
             </div>
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Pendente</p>
             <h4 className="text-4xl font-black mb-1 tracking-tighter">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fin?.totalPendente || 0)}
             </h4>
             <p className={cn(
                "text-teal-400 text-[10px] font-black uppercase tracking-widest mb-10 italic flex items-center gap-2"
             )}>
                {(fin?.totalAtrasadas || 0) > 0 ? <AlertTriangle size={14} className="text-red-400" /> : <CheckCircle2 size={14} />}
                {fin?.totalAtrasadas ? `${fin.totalAtrasadas} boletos pendentes` : 'Tudo em dia'}
             </p>
             <button 
                onClick={() => setShowPixModal(true)}
                className="w-full bg-teal-500 hover:bg-teal-400 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center gap-3 relative z-10 active:scale-95"
             >
                <QrCode size={20} /> Pagar via PIX
             </button>
          </div>
        </div>
      </div>

      {/* 2. Estatísticas Rápidas (StatCards) - Dados reais do dashboard */}
      {dashboard && (
        <div className="flex flex-col md:flex-row gap-8">
          <StatCard
            label="Documentos Solicitados"
            value={String(solicitacoes?.length || 0)}
            trend={`${solicitacoes?.filter((s: any) => s.status === 'pendente' || s.status === 'em_analise').length || 0} em andamento`}
            icon={FileText}
            color="bg-teal-500"
          />
          <StatCard
            label="Total Pendente"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fin?.totalPendente || 0)}
            trend={fin?.totalAtrasadas ? `${fin.totalAtrasadas} em atraso` : 'Tudo em dia'}
            icon={DollarSign}
            color="bg-amber-500"
          />
          <StatCard
            label="Avisos Recentes"
            value={String(dashboard.avisosRecentes.length)}
            trend="Últimos 30 dias"
            icon={Megaphone}
            color="bg-blue-500"
          />
        </div>
      )}

      {/* Alertas Críticos */}
      {(fin?.totalAtrasadas || 0) > 0 && (
        <div className="bg-red-50 p-8 rounded-[40px] border border-red-100 flex flex-col md:flex-row items-center gap-6 animate-pulse">
           <div className="h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center shrink-0 shadow-sm">
             <AlertTriangle className="h-7 w-7 text-red-600" />
           </div>
           <div className="flex-1 text-center md:text-left">
             <p className="text-lg font-black text-red-900 tracking-tight">Pendência Financeira Detectada</p>
             <p className="text-sm text-red-600/80 font-bold uppercase tracking-wider text-[10px]">Regularize seu status para manter o acesso completo aos serviços escolares.</p>
           </div>
           <button onClick={() => navigate('/portal/cobrancas')} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20 active:scale-95 transition-all">
             Verificar agora
           </button>
        </div>
      )}

      {/* 3. Mural da Unidade - Avisos Completos */}
      <div className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-sm space-y-10">
        <div className="flex justify-between items-center">
          <h3 className="text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-4 italic">
            <Megaphone className="text-teal-500" size={36} /> Mural da Unidade
          </h3>
          <button
            onClick={() => navigate('/portal/avisos')}
            className="text-[10px] font-black text-teal-600 bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-full uppercase tracking-tighter transition-all flex items-center gap-2"
          >
            Ver todos <ChevronRight size={16} />
          </button>
        </div>
        <div className="space-y-8">
          {dashboard?.avisosRecentes && dashboard.avisosRecentes.length > 0 ? (
            dashboard.avisosRecentes.map((aviso: any, idx: number) => (
              <div key={aviso.id || idx}>
                <div className="flex gap-6 group cursor-pointer" onClick={() => navigate('/portal/avisos')}>
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
                    idx % 2 === 0 ? "bg-blue-50 text-blue-500 group-hover:bg-blue-500" : "bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500",
                    "group-hover:text-white shadow-sm"
                  )}>
                    {idx % 2 === 0 ? <Info size={24} /> : <Activity size={24} />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-black text-slate-800 tracking-tight">{aviso.titulo}</p>
                    <p className="text-sm text-slate-400 font-bold leading-relaxed line-clamp-2">{aviso.conteudo}</p>
                  </div>
                </div>
                {idx < dashboard.avisosRecentes.length - 1 && <div className="h-px bg-slate-50 w-full mt-8"></div>}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                <Info className="h-10 w-10 text-slate-200" />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Nenhum aviso recente.</p>
            </div>
          )}
        </div>
      </div>

      {showPixModal && <PixModal onClose={() => setShowPixModal(false)} valor={fin?.totalPendente || 0} configPix={configPix} />}
    </div>
  )
}
