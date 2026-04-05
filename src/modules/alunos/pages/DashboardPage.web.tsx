import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/AuthContext'
import { useDashboard } from '../dashboard.hooks'
import {
  Users,
  CreditCard,
  AlertTriangle,
  Megaphone,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  X,
  Info,
  Eye,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  Shield,
  Clock,
  AlertOctagon,
  CheckCircle2,
  RefreshCcw,
  Archive,
  UserCircle,
} from 'lucide-react'
import { BadgeGravidade } from '@/components/ui/BadgeGravidade'
import { RadarEvasaoModal } from '../components/RadarEvasaoModal'
import type { AlertaStatus, RadarAlunoComStatus } from '../AlertasContext'
import { AlertasProvider, useAlertas } from '../AlertasContext'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { OnboardingGuide } from '../components/OnboardingGuide'
import { cn } from '@/lib/utils'
import type { AvisoRecente, RadarAluno } from '../dashboard.service'
import { useState, useEffect, useMemo } from 'react'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { useEscolaNotifications } from '@/hooks/useNotifications'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import CorujaIcon from '@/assets/coruja_ANDROID.svg'

// ---------------------------------------------------------------------------
// Sub-componente: Notificação de Alunos Sem Matrícula
// ---------------------------------------------------------------------------
interface AlunosSemMatriculaNotificationProps {
  count: number
  onDismiss: () => void
}

function AlunosSemMatriculaNotification({ count, onDismiss }: AlunosSemMatriculaNotificationProps) {
  const navigate = useNavigate()
  
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-sm">
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/50 hover:bg-white flex items-center justify-center transition-all text-amber-600 hover:text-amber-700"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="p-6 pr-14">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
            <img src={CorujaIcon} alt="Fluxoo" className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <h3 className="font-black text-amber-900 text-lg tracking-tight mb-1">
              Alunos sem Matrícula
            </h3>
            <p className="text-sm font-medium text-amber-700 mb-4">
              Você tem <strong className="font-black">{count} {count === 1 ? 'aluno' : 'alunos'}</strong> cadastrado{count === 1 ? '' : 's'} sem matrícula ativa.
              Regularize a situação para garantir o acesso completo ao sistema.
            </p>

            <Button
              onClick={() => navigate('/matriculas')}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm px-6 h-10 shadow-sm shadow-amber-200"
            >
              Realizar Matrícula Agora
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-componente: Card de Métrica
// ---------------------------------------------------------------------------
interface MetricCardProps {
  label: string
  value: number | string
  sub: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  warning?: boolean
  children?: React.ReactNode
  onClick?: () => void
  cardBg?: string
  cardBorder?: string
  cardTitleColor?: string
  cardValueColor?: string
  cardSubColor?: string
}

function MetricCard({ 
  label, 
  value, 
  sub, 
  icon: Icon, 
  iconBg, 
  iconColor, 
  warning, 
  children, 
  onClick,
  cardBg = 'bg-white',
  cardBorder = 'border-zinc-100',
  cardTitleColor = 'text-zinc-400',
  cardValueColor = 'text-zinc-900',
  cardSubColor = 'text-zinc-500',
}: MetricCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`border shadow-sm hover:shadow-md transition-all duration-300 rounded-[2rem] overflow-hidden group ${
        warning ? 'border-amber-100 bg-amber-50/20' : `${cardBorder} ${cardBg}`
      } ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-[30px]">
        <CardTitle className={`text-[10px] font-black uppercase tracking-[0.2em] ${warning ? 'text-amber-600' : cardTitleColor}`}>
          {label}
        </CardTitle>
        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className={`text-3xl font-black tracking-tight ${warning ? 'text-amber-700' : cardValueColor}`}>
          {value}
        </div>
        <p className={`text-[11px] mt-1 font-medium ${warning ? 'text-amber-600' : cardSubColor}`}>{sub}</p>
        {children}
      </CardContent>
    </Card>
  )
}


// ---------------------------------------------------------------------------
// Sub-componente: Card do Radar de Evasão
// ---------------------------------------------------------------------------
interface RadarCardProps {
  aluno: RadarAlunoComStatus
  onOpenDetails: (aluno: RadarAlunoComStatus) => void
}

function RadarCard({ aluno, onOpenDetails }: RadarCardProps) {
  const nivel =
    aluno.cobrancas_atrasadas >= 2 && aluno.faltas_consecutivas >= 5
      ? 'CRÍTICO'
      : aluno.cobrancas_atrasadas >= 1 && aluno.faltas_consecutivas >= 3
      ? 'ALERTA'
      : 'ATENÇÃO'

  const badgeClass =
    nivel === 'CRÍTICO'
      ? 'bg-red-600 text-white'
      : nivel === 'ALERTA'
      ? 'bg-amber-500 text-white'
      : 'bg-yellow-400 text-yellow-900'

  return (
    <div className="p-5 rounded-[1.5rem] bg-white border border-red-100 shadow-sm space-y-3">
      <div className="flex justify-between items-start gap-2">
        <button
          onClick={() => onOpenDetails(aluno)}
          className="font-bold text-sm text-zinc-900 leading-tight hover:text-rose-600 hover:underline transition-colors text-left"
        >
          {aluno.nome_completo}
        </button>
        <BadgeGravidade gravidade={
          aluno.cobrancas_atrasadas >= 2 && aluno.faltas_consecutivas >= 7 ? 'alta' :
          aluno.cobrancas_atrasadas >= 1 && aluno.faltas_consecutivas >= 3 ? 'media' : 'baixa'
        } />
      </div>
      <div className="space-y-2">
        {aluno.faltas_consecutivas > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
              <Users className="h-3.5 w-3.5 text-red-500" />
            </div>
            <p className="text-[11px] text-red-600 font-semibold">
              {aluno.faltas_consecutivas} falta{aluno.faltas_consecutivas > 1 ? 's' : ''} nos últimos 21 dias
            </p>
          </div>
        )}
        {aluno.cobrancas_atrasadas > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
              <CreditCard className="h-3.5 w-3.5 text-rose-500" />
            </div>
            <p className="text-[11px] text-rose-600 font-semibold">
              {aluno.cobrancas_atrasadas} cobrança{aluno.cobrancas_atrasadas > 1 ? 's' : ''} em atraso
            </p>
          </div>
        )}
      </div>
      <button
        onClick={() => onOpenDetails(aluno)}
        className="w-full py-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-xl transition-all flex items-center justify-center gap-2 group/btn"
      >
        Ver Detalhes
        <ArrowUpRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
      </button>
    </div>
  )
}

function StatusAprovacaoNotification({ status, metodo }: { status: string, metodo: string }) {
  if (status === 'ativa') return null
  
  const isPix = metodo === 'pix_manual' || metodo === 'pix'

  return (
    <div className={cn(
      "rounded-[2rem] p-6 text-white shadow-xl mb-8 relative overflow-hidden group border-0 transition-all",
      isPix ? "bg-indigo-600 shadow-indigo-100 font-bold" : "bg-zinc-900 shadow-zinc-100 font-bold"
    )}>
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform font-bold">
        <Shield className="h-24 w-24 text-white" />
      </div>
      <div className="relative z-10 flex items-center gap-6 font-bold">
        <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 font-bold">
          {isPix ? <Clock className="h-7 w-7 text-white" /> : <CreditCard className="h-7 w-7 text-white" />}
        </div>
        <div>
          <h3 className="text-xl font-black tracking-tight mb-1">
            {isPix ? 'Cadastro em Processamento' : 'Plano Pendente'}
          </h3>
          <p className="text-white/80 text-sm font-medium max-w-2xl leading-relaxed">
            {isPix 
              ? 'Recebemos seu comprovante e estamos revisando os dados para liberar seu acesso total. Isso levará pouco tempo.'
              : 'Seu plano ainda não foi ativado. Conclua o pagamento via Mercado Pago para liberar todas as funcionalidades.'
            }
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente Principal: DashboardPageWeb
// ---------------------------------------------------------------------------
function DashboardContent() {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const userRole = authUser?.role
  const { alertas, mudarStatusAlerta } = useAlertas()

  const {
    data: dashboardData,
    isLoading,
    error,
    refetch: refreshDashboard
  } = useDashboard()

  const [showAlunosSemMatriculaNotification, setShowAlunosSemMatriculaNotification] = useState(true)
  const [selectedRadarAluno, setSelectedRadarAluno] = useState<RadarAluno | null>(null)
  const [isRadarSheetOpen, setIsRadarSheetOpen] = useState(false)
  
  // Filtra apenas alertas ativos para a visualização principal
  const radarEvasaoAtivo = useMemo(() => alertas.filter(a => a.status === 'ativo'), [alertas])

  const handleOpenRadarDetails = (aluno: RadarAluno) => {
    setSelectedRadarAluno(aluno)
    setIsRadarSheetOpen(true)
  }

  const handleCloseRadarSheet = () => {
    setIsRadarSheetOpen(false)
    setTimeout(() => setSelectedRadarAluno(null), 300)
  }

  const onboardingStatus = {
    needsOnboarding: false,
    perfilCompleto: dashboardData?.onboarding?.perfilCompleto,
    possuiFilial: dashboardData?.onboarding?.possuiFilial,
    possuiTurma: dashboardData?.onboarding?.possuiTurma,
    possuiAluno: dashboardData?.onboarding?.possuiAluno,
    configFinanceira: dashboardData?.onboarding?.configFinanceira,
    autorizacoes: dashboardData?.onboarding?.autorizacoes,
  }

  if ((userRole === 'gestor' || userRole === 'funcionario') && dashboardData?.onboarding) {
    onboardingStatus.needsOnboarding = !onboardingStatus.perfilCompleto || !onboardingStatus.possuiFilial || !onboardingStatus.possuiTurma || !onboardingStatus.possuiAluno || !onboardingStatus.configFinanceira || !onboardingStatus.autorizacoes
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-rose-50 rounded-3xl border border-rose-100">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-black text-rose-900 tracking-tight">Ops! Algo deu errado.</h2>
        <p className="text-rose-600 mt-2 font-medium">Não conseguimos carregar as informações do painel.</p>
        <button 
          onClick={() => refreshDashboard()}
          className="mt-6 px-6 py-2.5 bg-rose-600 text-white rounded-full font-bold hover:bg-rose-700 transition-all text-sm"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  const radarEvasao = radarEvasaoAtivo
  const avisosRecentes = dashboardData?.avisosRecentes || []

  const totalAlunos = dashboardData?.totalAlunosAtivos || 0
  const limiteAlunos = dashboardData?.limiteAlunos || 1
  const mensalidadesMes = dashboardData?.totalMensalidadesMes || 0
  const receber12Meses = dashboardData?.totalReceber12Meses || 0
  const totalPagar = dashboardData?.totalPagar || 0
  const totalEstoque = dashboardData?.totalEstoque || 0
  const totalSalarios = dashboardData?.totalSalarios || 0

  // 3 cards principais — responsivos (grid 1→2→3 colunas)
  const metricsPrimary = [
    {
      label: 'Total de Alunos',
      value: totalAlunos,
      sub: `${totalAlunos} matrículas ativas (${totalAlunos > 0 ? Math.min(100, Math.round((totalAlunos / limiteAlunos) * 100)) : 0}% da licença)`,
      icon: Users,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      path: '/alunos'
    },
    {
      label: 'Mensalidades',
      value: `R$ ${mensalidadesMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      sub: mensalidadesMes > 0 ? `Receita prevista para este mês` : `Nenhuma pendência este mês`,
      icon: CreditCard,
      iconBg: 'bg-sky-100',
      iconColor: 'text-sky-700',
      path: '/financeiro',
      cardBg: 'bg-sky-50/30',
      cardBorder: 'border-sky-100',
      cardTitleColor: 'text-sky-400',
      cardValueColor: 'text-sky-900',
      cardSubColor: 'text-sky-600',
    },
    {
      label: 'Alertas Ativos',
      value: radarEvasao.length,
      sub: 'Alunos no radar de risco',
      icon: AlertTriangle,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      warning: radarEvasao.length > 0,
      path: '/frequencia'
    }
  ]

  // 4 cards secundários — linha abaixo
  const metricsSecondary = [
    {
      label: 'Contas a Pagar',
      value: `R$ ${totalPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      sub: totalPagar > 0 ? 'Despesas pendentes + folha' : 'Em dia',
      icon: TrendingUp,
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-700',
      path: '/financeiro-relatorios',
      cardBg: 'bg-rose-50/30',
      cardBorder: 'border-rose-100',
      cardTitleColor: 'text-rose-400',
      cardValueColor: 'text-rose-900',
      cardSubColor: 'text-rose-600',
    },
    {
      label: 'A Receber em 12 Meses',
      value: `R$ ${receber12Meses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      sub: 'Projeção anual de mensalidades',
      icon: Calendar,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      path: '/financeiro',
      cardBg: 'bg-emerald-50/30',
      cardBorder: 'border-emerald-100',
      cardTitleColor: 'text-emerald-400',
      cardValueColor: 'text-emerald-900',
      cardSubColor: 'text-emerald-600',
    },
    {
      label: 'Materiais em Estoque',
      value: `R$ ${totalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      sub: totalEstoque > 0 ? 'Valor total em estoque' : 'Sem itens',
      icon: Archive,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-700',
      path: '/almoxarifado',
      cardBg: 'bg-violet-50/30',
      cardBorder: 'border-violet-100',
      cardTitleColor: 'text-violet-400',
      cardValueColor: 'text-violet-900',
      cardSubColor: 'text-violet-600',
    },
    {
      label: 'Total de Salários',
      value: `R$ ${totalSalarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      sub: totalSalarios > 0 ? 'Folha mensal projetada' : 'Sem registros',
      icon: UserCircle,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-700',
      path: '/funcionarios',
      cardBg: 'bg-orange-50/30',
      cardBorder: 'border-orange-100',
      cardTitleColor: 'text-orange-400',
      cardValueColor: 'text-orange-900',
      cardSubColor: 'text-orange-600',
    },
  ]

  const statusAssinatura = dashboardData?.statusAssinatura || 'pendente'
  const metodoPagamento = dashboardData?.metodoPagamento || 'mercado_pago'

  return (
    <div className="space-y-8 pb-12">
      {/* Header com context */}
      <div className="flex items-center justify-between px-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-1">Visão Geral da Instituição</p>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">Dashboard</h1>
        </div>

      </div>

      {/* Alerta de Aprovação */}
      <StatusAprovacaoNotification status={statusAssinatura} metodo={metodoPagamento} />

      {/* Notificação de Alunos Sem Matrícula */}
      {(dashboardData?.alunosSemMatricula ?? 0) > 0 && showAlunosSemMatriculaNotification && (
        <AlunosSemMatriculaNotification
          count={dashboardData?.alunosSemMatricula ?? 0}
          onDismiss={() => setShowAlunosSemMatriculaNotification(false)}
        />
      )}

      {/* Guia de Onboarding (se necessário) */}
      {(userRole === 'gestor' || userRole === 'funcionario') && onboardingStatus?.needsOnboarding && (
        <OnboardingGuide status={{
          perfilCompleto: !!onboardingStatus?.perfilCompleto,
          possuiFilial: !!onboardingStatus?.possuiFilial,
          possuiTurma: !!onboardingStatus?.possuiTurma,
          possuiAluno: !!onboardingStatus?.possuiAluno,
          configFinanceira: !!onboardingStatus?.configFinanceira,
          autorizacoes: !!onboardingStatus?.autorizacoes
        }} isProfessor={authUser?.isProfessor} />
      )}

      {/* Grid de Métricas — 3 cards principais responsivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricsPrimary.map((m, i) => (
          <MetricCard key={i} {...m} onClick={() => navigate(m.path)} />
        ))}
      </div>

      {/* Métricas Secundárias — 4 cards abaixo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsSecondary.map((m, i) => (
          <MetricCard key={`sec-${i}`} {...m} onClick={() => navigate(m.path)} />
        ))}
      </div>

      {/* Seção: Comunicados e Radar de Evasão */}
      {avisosRecentes.length > 0 || radarEvasao.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lado Esquerdo: Radar de Evasão */}
          {radarEvasao.length > 0 && (
            <section className="flex justify-start">
              <Card className="rounded-[2.5rem] border-0 bg-rose-50/30 overflow-hidden w-full">
                <CardHeader className="p-8 pb-4 pt-[30px]">
                  <div className="flex items-center justify-between mb-2">
                     <div className="h-10 w-10 rounded-2xl bg-rose-100 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-rose-600" />
                     </div>
                     <ArrowUpRight className="h-5 w-5 text-rose-300" />
                  </div>
                  <CardTitle className="text-xl font-black text-rose-900 tracking-tight">Radar de Evasão</CardTitle>
                  <p className="text-xs font-semibold text-rose-600/70 mt-1 uppercase tracking-widest">Alunos em Risco Crítico</p>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {radarEvasao.map((aluno) => (
                    <RadarCard key={aluno.aluno_id} aluno={aluno} onOpenDetails={handleOpenRadarDetails} />
                  ))}
                </CardContent>
              </Card>
            </section>
          )}

          {/* Lado Direito: Mural de Comunicados */}
          {avisosRecentes.length > 0 && (
            <section className={`flex ${radarEvasao.length > 0 ? 'justify-end' : 'justify-start'}`}>
              <Card className="rounded-[2.5rem] border shadow-sm border-zinc-100 bg-white overflow-hidden w-full">
                <CardHeader className="p-8 flex flex-row items-center justify-between pt-[30px]">
                  <div>
                    <CardTitle className="text-2xl font-black text-zinc-900 tracking-tight">Mural de Comunicados</CardTitle>
                    <p className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-widest flex items-center gap-2">
                       <Megaphone className="h-3 w-3" /> Últimos avisos da escola
                    </p>
                  </div>
                  <ArrowUpRight className="h-6 w-6 text-zinc-200" />
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {avisosRecentes.map((aviso, idx) => (
                      <div key={idx} className="group p-6 rounded-[2rem] bg-zinc-50/50 border border-zinc-100 transition-all hover:bg-white hover:shadow-xl hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-4">
                           <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 border-zinc-200 text-zinc-500 bg-white">
                              {'AVISO'}
                           </Badge>
                           <span className="text-[10px] font-bold text-zinc-400">
                             {format(new Date(aviso.created_at), "d 'de' MMM", { locale: ptBR })}
                           </span>
                        </div>
                        <h4 className="font-black text-zinc-800 text-lg mb-2 tracking-tight line-clamp-1">{aviso.titulo}</h4>
                        <p className="text-sm font-medium text-zinc-500 leading-relaxed line-clamp-3 mb-4">{aviso.conteudo}</p>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                           Ler na íntegra <ArrowUpRight className="h-3 w-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      ) : null}

      {/* Modal de Detalhes do Radar */}
      <RadarEvasaoModal
        aluno={selectedRadarAluno as RadarAlunoComStatus}
        isOpen={isRadarSheetOpen}
        onClose={handleCloseRadarSheet}
      />
    </div>
  )
}

export function DashboardPageWeb() {
  const { data: dashboardData } = useDashboard()
  const radarData = dashboardData?.radarEvasao || []

  return (
    <AlertasProvider radarData={radarData}>
      <DashboardContent />
    </AlertasProvider>
  )
}
