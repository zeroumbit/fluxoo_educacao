import { useNavigate } from 'react-router-dom'
import { useDashboard } from '../dashboard.hooks'
import {
  Users,
  CreditCard,
  AlertTriangle,
  Megaphone,
  ArrowUpRight,
  TrendingUp,
  ChevronRight,
  Plus,
  Calendar,
  Zap,
  Bell,
  Info,
  Eye,
  Phone,
  Mail,
  DollarSign,
  X,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import type { AvisoRecente, RadarAluno } from '../dashboard.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { useEffect, useState } from 'react'
import { get, set } from 'idb-keyval'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { useEscolaNotifications } from '@/hooks/useNotifications'
import { useAuth } from '@/modules/auth/AuthContext'
import { OnboardingGuide } from '../components/OnboardingGuide'
import CorujaIcon from '@/assets/coruja_ANDROID.svg'

const CACHE_KEY = 'dashboard_cache'

// ---------------------------------------------------------------------------
// Sub-componente: Notificação de Alunos Sem Matrícula
// ---------------------------------------------------------------------------
interface AlunosSemMatriculaNotificationProps {
  count: number
  onDismiss: () => void
}

function AlunosSemMatriculaNotificationMobile({ count, onDismiss }: AlunosSemMatriculaNotificationProps) {
  const navigate = useNavigate()
  
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-sm mx-4 mt-2">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/50 hover:bg-white flex items-center justify-center transition-all text-amber-600"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      
      <div className="p-4 pr-12">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <img src={CorujaIcon} alt="Fluxoo" className="h-5 w-5" />
          </div>

          <div className="flex-1">
            <h3 className="font-black text-amber-900 text-sm tracking-tight mb-1">
              Alunos sem Matrícula
            </h3>
            <p className="text-[11px] font-medium text-amber-700 mb-3 leading-snug">
              Você tem <strong>{count} {count === 1 ? 'aluno' : 'alunos'}</strong> sem matrícula ativa.
            </p>

            <Button
              onClick={() => navigate('/matriculas')}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] px-4 h-8 shadow-sm shadow-amber-200"
            >
              Realizar Matrícula
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-componente: BottomSheet de Detalhes do Radar de Evasão (Mobile)
// ---------------------------------------------------------------------------
interface RadarEvasaoBottomSheetProps {
  aluno: RadarAluno | null
  isOpen: boolean
  onClose: () => void
}

function RadarEvasaoBottomSheetMobile({ aluno, isOpen, onClose }: RadarEvasaoBottomSheetProps) {
  const navigate = useNavigate()

  if (!aluno) return null

  const nivel =
    aluno.cobrancas_atrasadas >= 2 && aluno.faltas_consecutivas >= 5
      ? 'CRÍTICO'
      : aluno.cobrancas_atrasadas >= 1 && aluno.faltas_consecutivas >= 3
      ? 'ALERTA'
      : 'ATENÇÃO'

  const nivelColors = {
    CRÍTICO: 'bg-red-600 text-white',
    ALERTA: 'bg-amber-500 text-white',
    ATENÇÃO: 'bg-yellow-400 text-yellow-900',
  }

  const nivelBgColors = {
    CRÍTICO: 'bg-red-50',
    ALERTA: 'bg-amber-50',
    ATENÇÃO: 'bg-yellow-50',
  }

  const nivelIcons = {
    CRÍTICO: AlertTriangle,
    ALERTA: AlertTriangle,
    ATENÇÃO: Info,
  }

  const NivelIcon = nivelIcons[nivel]

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Radar de Evasão" size="full">
      <div className="space-y-6">
        {/* Cabeçalho do Aluno */}
        <div className="flex items-center gap-4 pb-4 border-b border-zinc-100">
          <div className="h-16 w-16 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
            <Users className="h-8 w-8 text-rose-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-black text-2xl text-zinc-900 tracking-tight">{aluno.nome_completo}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${nivelColors[nivel]}`}>
                Risco {nivel}
              </span>
            </div>
          </div>
        </div>

        {/* Caixa de Alerta Explicativa */}
        <div className={`rounded-[1.5rem] p-5 border-2 ${nivelBgColors[nivel]} border-current`}>
          <div className="flex items-start gap-3">
            <NivelIcon className={`h-6 w-6 shrink-0 ${nivel === 'CRÍTICO' ? 'text-red-600' : nivel === 'ALERTA' ? 'text-amber-600' : 'text-yellow-600'}`} />
            <div className="flex-1">
              <h3 className={`font-black text-lg mb-1 ${nivel === 'CRÍTICO' ? 'text-red-900' : nivel === 'ALERTA' ? 'text-amber-900' : 'text-yellow-900'}`}>
                Por que verificar este aluno?
              </h3>
              <p className={`text-sm font-medium ${nivel === 'CRÍTICO' ? 'text-red-700' : nivel === 'ALERTA' ? 'text-amber-700' : 'text-yellow-700'}`}>
                Este aluno apresenta sinais de risco de evasão. É importante entrar em contato e entender a situação para evitar o abandono escolar.
              </p>
            </div>
          </div>
        </div>

        {/* Motivos do Risco */}
        <div>
          <h3 className="font-black text-lg text-zinc-900 tracking-tight mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            Motivos do Risco
          </h3>
          <div className="space-y-3">
            {aluno.faltas_consecutivas > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-100">
                <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-red-900 text-base">
                    {aluno.faltas_consecutivas} falta{aluno.faltas_consecutivas > 1 ? 's' : ''} consecutiva{aluno.faltas_consecutivas > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-red-600 font-medium mt-0.5">
                    Registradas nos últimos 21 dias
                  </p>
                </div>
              </div>
            )}
            {aluno.cobrancas_atrasadas > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100">
                <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <DollarSign className="h-5 w-5 text-rose-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-rose-900 text-base">
                    {aluno.cobrancas_atrasadas} cobrança{aluno.cobrancas_atrasadas > 1 ? 's' : ''} em atraso
                  </p>
                  <p className="text-sm text-rose-600 font-medium mt-0.5">
                    Pendência{aluno.cobrancas_atrasadas > 1 ? 's' : ''} financeira{aluno.cobrancas_atrasadas > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recomendações */}
        <div className="rounded-2xl bg-sky-50 border border-sky-100 p-5">
          <h3 className="font-black text-zinc-900 mb-3 flex items-center gap-2">
            <Eye className="h-5 w-5 text-sky-600" />
            O que fazer?
          </h3>
          <ul className="space-y-2 text-sm font-medium text-sky-800">
            <li className="flex items-start gap-2">
              <span className="text-sky-600 font-black">•</span>
              Entre em contato com o aluno ou responsável
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-600 font-black">•</span>
              Verifique a situação financeira
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-600 font-black">•</span>
              Registre a ocorrência no prontuário
            </li>
          </ul>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-3 pt-4 border-t border-zinc-100">
          <Button
            onClick={() => {
              navigate(`/alunos/${aluno.aluno_id}`)
              onClose()
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm px-6 h-12 shadow-sm shadow-rose-200"
          >
            <Users className="h-5 w-5 mr-2" />
            Ver Perfil Completo
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl font-bold text-sm h-12"
            >
              <Phone className="h-4 w-4 mr-2" />
              Ligar
            </Button>
            <Button
              variant="outline"
              className="border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl font-bold text-sm h-12"
            >
              <Mail className="h-4 w-4 mr-2" />
              Mensagem
            </Button>
          </div>
        </div>
      </div>
    </BottomSheet>
  )
}

export function DashboardPageMobile() {
  const navigate = useNavigate()
  const { data: dashboardData, isLoading, refetch } = useDashboard()
  const [cachedData, setCachedData] = useState<any>(null)
  const [selectedRadarAluno, setSelectedRadarAluno] = useState<RadarAluno | null>(null)
  const [isRadarSheetOpen, setIsRadarSheetOpen] = useState(false)
  const [showAlunosSemMatriculaNotification, setShowAlunosSemMatriculaNotification] = useState(true)

  const { authUser } = useAuth()
  const userRole = authUser?.role
  const { data: notifications } = useEscolaNotifications(authUser?.tenantId)

  const handleOpenRadarDetails = (aluno: RadarAluno) => {
    setSelectedRadarAluno(aluno)
    setIsRadarSheetOpen(true)
  }

  const handleCloseRadarSheet = () => {
    setIsRadarSheetOpen(false)
    setTimeout(() => setSelectedRadarAluno(null), 300)
  }

  useEffect(() => {
    get(CACHE_KEY).then(val => { if (val) setCachedData(val) })
  }, [])

  useEffect(() => {
    if (dashboardData) {
      set(CACHE_KEY, dashboardData)
      setCachedData(dashboardData)
    }
  }, [dashboardData])

  const displayData = dashboardData || cachedData
  const isActuallyLoading = isLoading && !cachedData
  
  const onboardingStatus = {
    needsOnboarding: false,
    perfilCompleto: displayData?.onboarding?.perfilCompleto,
    possuiFilial: displayData?.onboarding?.possuiFilial,
    possuiTurma: displayData?.onboarding?.possuiTurma,
    possuiAluno: displayData?.onboarding?.possuiAluno,
  }

  if (userRole === 'funcionario' && displayData?.onboarding) {
    onboardingStatus.needsOnboarding = !onboardingStatus.perfilCompleto || !onboardingStatus.possuiFilial || !onboardingStatus.possuiTurma
  }

  const onRefresh = async () => { await refetch() }

  const quickActions = [
    { label: 'Novo Aluno', icon: Plus, path: '/alunos/novo', color: 'bg-indigo-600' },
    { label: 'Matricular', icon: Zap, path: '/matriculas', color: 'bg-emerald-600' },
    { label: 'Chamada', icon: Calendar, path: '/frequencia', color: 'bg-amber-500' },
    { label: 'Financeiro', icon: CreditCard, path: '/financeiro', color: 'bg-rose-500' },
  ]

  // Skeleton Loading (Rule 5: No spinners)
  if (isActuallyLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-32">
        <div className="mx-auto w-full max-w-[640px] px-4 pt-6 space-y-8">
          <div className="space-y-2 pt-2">
            <Skeleton className="h-3 w-32 rounded-lg" />
            <Skeleton className="h-8 w-52 rounded-lg" />
          </div>
          <div className="flex gap-5 overflow-hidden">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col items-center gap-2.5 shrink-0">
                <Skeleton className="h-16 w-16 rounded-[1.5rem]" />
                <Skeleton className="h-2.5 w-14 rounded" />
              </div>
            ))}
          </div>
          <Skeleton className="h-44 w-full rounded-3xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  // Se for funcionário e precisar de onboarding
  if (userRole === 'funcionario' && onboardingStatus?.needsOnboarding) {
    return (
      <div className="min-h-screen bg-slate-50/50 px-4 pt-6">
        <OnboardingGuide status={{
          perfilCompleto: !!onboardingStatus?.perfilCompleto,
          possuiFilial: !!onboardingStatus?.possuiFilial,
          possuiTurma: !!onboardingStatus?.possuiTurma,
          possuiAluno: !!onboardingStatus?.possuiAluno
        }} />
      </div>
    )
  }

  const recebimentos = displayData?.totalReceber || 0
  const pagamentos = displayData?.totalPagar || 0
  const saldo = recebimentos - pagamentos
  const saldoPositivo = saldo >= 0

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-32">
      <div className="mx-auto w-full max-w-[640px] px-4">
        <PullToRefresh onRefresh={onRefresh}>
          <div className="space-y-7 pt-6">


            {/* ── Saudação ── */}
            <section className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-1.5">
                  {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
                <h1 className="text-[1.625rem] font-black text-slate-900 dark:text-white tracking-tight leading-none">
                  Fluxoo <span className="text-indigo-600">Edu</span>
                </h1>
              </div>
              <NotificationBell
                total={notifications?.total || 0}
                items={notifications?.items || []}
              />
            </section>

            {/* Notificação de Alunos Sem Matrícula */}
            {(displayData?.alunosSemMatricula ?? 0) > 0 && showAlunosSemMatriculaNotification && (
              <AlunosSemMatriculaNotificationMobile
                count={displayData?.alunosSemMatricula ?? 0}
                onDismiss={() => setShowAlunosSemMatriculaNotification(false)}
              />
            )}

            {/* ── Ações Rápidas ── */}
            <section>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-0.5">Ações Rápidas</h3>
              <div className="flex gap-5 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                {quickActions.map((action, i) => (
                  <motion.button
                    key={i}
                    onClick={() => navigate(action.path)}
                    whileTap={{ scale: 0.92 }}
                    className="flex flex-col items-center gap-2.5 shrink-0"
                  >
                    <div className={`h-16 w-16 rounded-[1.5rem] ${action.color} shadow-lg flex items-center justify-center text-white`}>
                      <action.icon className="h-7 w-7" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 tracking-tight whitespace-nowrap">{action.label}</span>
                  </motion.button>
                ))}
              </div>
            </section>

            {/* ── Grid 2x2: Métricas Principais ── */}
            <section className="grid grid-cols-2 gap-4">
              {/* Card 1: Alunos */}
              <motion.div
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/alunos')}
                className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Alunos</p>
                    <div className="h-8 w-8 rounded-[10px] bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-indigo-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                    {displayData?.totalAlunosAtivos || 0}
                  </p>
                </div>
                <p className="text-[10px] font-bold text-slate-500 mt-3 leading-tight">
                  <span className="text-indigo-600 dark:text-indigo-400">{displayData?.totalAlunosAtivos > 0 ? Math.min(100, Math.round(((displayData?.totalAlunosAtivos || 0) / (displayData?.limiteAlunos || 1)) * 100)) : 0}%</span> da licença
                </p>
              </motion.div>

              {/* Card 2: Mensalidades */}
              <motion.div
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/financeiro')}
                className="bg-sky-50/50 dark:bg-sky-900/10 rounded-2xl p-4 shadow-sm border border-sky-100 dark:border-sky-900/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-sky-500">Mensalidades</p>
                    <div className="h-8 w-8 rounded-[10px] bg-sky-100 dark:bg-sky-800 flex items-center justify-center shrink-0">
                      <CreditCard className="h-4 w-4 text-sky-600" />
                    </div>
                  </div>
                  <p className="text-xl font-black text-sky-900 dark:text-sky-100 tracking-tight leading-none truncate" title={`R$ ${recebimentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}>
                    R$ {recebimentos >= 10000 ? (recebimentos/1000).toFixed(1).replace('.', ',') + 'k' : recebimentos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <p className="text-[10px] font-bold text-sky-600 mt-3 leading-tight truncate">
                  {recebimentos > 0 ? 'Cobranças pendentes' : 'Em dia'}
                </p>
              </motion.div>

              {/* Card 3: Contas */}
              <motion.div
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/financeiro-relatorios')}
                className="rounded-2xl p-4 shadow-sm border border-rose-100 bg-rose-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-rose-500">Contas</p>
                    <div className="h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0 bg-rose-100">
                      <TrendingUp className="h-4 w-4 text-rose-700" />
                    </div>
                  </div>
                  <p className="text-xl font-black tracking-tight leading-none text-rose-900 truncate" title={`R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}>
                    R$ {Math.abs(saldo) >= 10000 ? (saldo/1000).toFixed(1).replace('.', ',') + 'k' : saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <p className="text-[10px] font-bold mt-3 leading-tight truncate text-rose-600">
                  {saldoPositivo ? 'Saúde positiva' : 'Atenção ao fluxo'}
                </p>
              </motion.div>

              {/* Card 4: Alertas Ativos */}
              <motion.div
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (displayData?.radarEvasao && displayData.radarEvasao.length > 0) {
                    handleOpenRadarDetails(displayData.radarEvasao[0])
                  } else {
                    navigate('/frequencia')
                  }
                }}
                className={`rounded-2xl p-4 shadow-sm border flex flex-col justify-between ${displayData?.radarEvasao?.length > 0 ? 'bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30' : 'bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700'}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-[9px] font-black uppercase tracking-widest ${displayData?.radarEvasao?.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>Alertas Ativos</p>
                    <div className={`h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0 ${displayData?.radarEvasao?.length > 0 ? 'bg-amber-100 dark:bg-amber-800' : 'bg-slate-50 dark:bg-slate-700'}`}>
                      <AlertTriangle className={`h-4 w-4 ${displayData?.radarEvasao?.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                    </div>
                  </div>
                  <p className={`text-2xl font-black tracking-tight leading-none ${displayData?.radarEvasao?.length > 0 ? 'text-amber-700 dark:text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                    {displayData?.radarEvasao?.length || 0}
                  </p>
                </div>
                <p className={`text-[10px] font-bold mt-3 leading-tight truncate ${displayData?.radarEvasao?.length > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                  {displayData?.radarEvasao?.length > 0 ? 'Toque para ver' : 'Alunos no radar'}
                </p>
              </motion.div>
            </section>

            {/* ── Radar de Atenção ── */}
            {displayData?.radarEvasao && displayData.radarEvasao.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Radar de Atenção</h3>
                  </div>
                  <Badge className="bg-rose-500 text-white border-0 text-[9px] font-black h-5 px-2.5 rounded-full">
                    {displayData.radarEvasao.length}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {displayData.radarEvasao.slice(0, 3).map((aluno: RadarAluno) => (
                    <motion.div
                      key={aluno.aluno_id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleOpenRadarDetails(aluno)}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 cursor-pointer"
                    >
                      <div className="h-11 w-11 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 font-black text-base shrink-0">
                        {aluno.nome_completo.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate mb-1">{aluno.nome_completo}</h4>
                        <div className="flex gap-2 items-center flex-wrap">
                          {aluno.faltas_consecutivas >= 3 && (
                            <span className="text-[9px] font-black text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">
                              {aluno.faltas_consecutivas} Faltas
                            </span>
                          )}
                          {aluno.cobrancas_atrasadas > 0 && (
                            <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded">
                              {aluno.cobrancas_atrasadas} Pendência{aluno.cobrancas_atrasadas > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Mural ── */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Megaphone className="h-4 w-4 text-indigo-500" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Mural</h3>
                </div>
                <Button variant="ghost" className="text-[10px] font-black uppercase text-indigo-500 p-0 h-auto" onClick={() => navigate('/mural')}>
                  Ver todos
                </Button>
              </div>

              <div className="space-y-3">
                {displayData?.avisosRecentes?.map((aviso: AvisoRecente) => (
                  <motion.div
                    key={aviso.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/mural')}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="secondary" className="text-[8px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-0 font-black uppercase px-2.5 py-1 rounded-lg">
                        {aviso.turmas?.nome || 'Geral'}
                      </Badge>
                      <span className="text-[9px] font-bold text-slate-300">
                        {format(new Date(aviso.created_at), "dd MMM", { locale: ptBR })}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1 leading-snug">{aviso.titulo}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{aviso.conteudo}</p>
                  </motion.div>
                ))}
                {(!displayData?.avisosRecentes || displayData.avisosRecentes.length === 0) && (
                  <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Megaphone className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-300">Nenhum comunicado recente</p>
                  </div>
                )}
              </div>
            </section>

          </div>
        </PullToRefresh>
      </div>

      {/* BottomSheet de Detalhes do Radar de Evasão */}
      <RadarEvasaoBottomSheetMobile
        aluno={selectedRadarAluno}
        isOpen={isRadarSheetOpen}
        onClose={handleCloseRadarSheet}
      />
    </div>
  )
}
