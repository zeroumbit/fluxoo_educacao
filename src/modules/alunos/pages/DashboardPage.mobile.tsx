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
  Search,
  Calendar,
  Zap,
  Bell
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import type { AvisoRecente, RadarAluno } from '../dashboard.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { useEffect, useState } from 'react'
import { get, set } from 'idb-keyval'

const CACHE_KEY = 'dashboard_cache'

export function DashboardPageMobile() {
  const navigate = useNavigate()
  const { data: dashboardData, isLoading, refetch } = useDashboard()
  const [cachedData, setCachedData] = useState<any>(null)

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
            <section className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-1.5">
                  {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
                <h1 className="text-[1.625rem] font-black text-slate-900 dark:text-white tracking-tight leading-none">
                  Fluxoo <span className="text-indigo-600">Edu</span>
                </h1>
              </div>
              <motion.button
                whileTap={{ scale: 0.92 }}
                className="h-11 w-11 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700"
                onClick={() => navigate('/alunos')}
              >
                <Search className="h-5 w-5 text-slate-400" />
              </motion.button>
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
                      onClick={() => navigate(`/alunos/${aluno.aluno_id}`)}
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
    </div>
  )
}
