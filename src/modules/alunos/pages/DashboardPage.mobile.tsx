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

const CACHE_KEY = 'dashboard_cache'

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
            <section>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-1.5">
                {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
              <h1 className="text-[1.625rem] font-black text-slate-900 dark:text-white tracking-tight leading-none">
                Fluxoo <span className="text-indigo-600">Edu</span>
              </h1>
            </section>

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

            {/* ── Card Principal: Total de Alunos ── */}
            <motion.section
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/alunos')}
              className="relative bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-3xl p-6 shadow-xl shadow-indigo-200/50 dark:shadow-none overflow-hidden cursor-pointer"
            >
              <Users className="absolute -right-4 -bottom-4 h-36 w-36 text-white/[0.07]" />
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/10">
                    <Users className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-white/40" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-200/80 mb-1">Total de Alunos</p>
                  <p className="text-4xl font-black tracking-tighter leading-none">{displayData?.totalAlunosAtivos || 0}</p>
                </div>
                <div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(((displayData?.totalAlunosAtivos || 0) / (displayData?.limiteAlunos || 1)) * 100, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-white/90 rounded-full"
                    />
                  </div>
                  <p className="text-[9px] font-semibold text-indigo-200/70 mt-2">
                    {displayData?.totalAlunosAtivos} de {displayData?.limiteAlunos} vagas utilizadas
                  </p>
                </div>
              </div>
            </motion.section>

            {/* ── Grid 2 colunas: Finanças ── */}
            <section className="grid grid-cols-2 gap-4">
              <motion.div
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/financeiro')}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer"
              >
                <div className="h-10 w-10 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center border border-rose-100 dark:border-rose-900/30 mb-3">
                  <CreditCard className="h-5 w-5 text-rose-500" />
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Pendentes</p>
                <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">
                  R$ {recebimentos.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </motion.div>

              <motion.div
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/financeiro-relatorios')}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer"
              >
                <div className={`h-10 w-10 rounded-2xl ${saldoPositivo ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'} flex items-center justify-center border mb-3`}>
                  <TrendingUp className={`h-5 w-5 ${saldoPositivo ? 'text-emerald-500' : 'text-rose-500'}`} />
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Saldo Proj.</p>
                <p className={`text-lg font-black tracking-tight leading-none ${saldoPositivo ? 'text-emerald-600' : 'text-rose-600'}`}>
                  R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
