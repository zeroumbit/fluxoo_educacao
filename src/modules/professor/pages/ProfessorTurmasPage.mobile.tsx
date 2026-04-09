import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Users,
  Clock,
  TrendingUp,
  Search,
  BookOpen,
  ChevronRight,
  School,
  Eye
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/AuthContext'
import { useSaudeTurmas } from '@/modules/professor/hooks'
import { useTurmas } from '@/modules/turmas/hooks'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { NativeCard } from '@/components/mobile/NativeCard'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const CACHE_KEY = 'professor_turmas_mobile_v1'

export function ProfessorTurmasPageMobile() {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const [search, setSearch] = useState('')
  const [cached, setCached] = useState<any[]>([])

  const { data: saudeTurmas, isLoading: isLoadingSaude, refetch } = useSaudeTurmas()
  const { data: turmas, isLoading: isLoadingTurmas } = useTurmas()

  // Cache
  useEffect(() => {
    import('idb-keyval').then(({ get }) => {
      get(CACHE_KEY).then(v => { if (v) setCached(v) })
    })
  }, [])

  useEffect(() => {
    if (saudeTurmas) {
      import('idb-keyval').then(({ set }) => {
        set(CACHE_KEY, saudeTurmas)
      })
    }
  }, [saudeTurmas])

  const turmasUnicas = useMemo(() => {
    if (!saudeTurmas && !cached.length) return []
    const data = saudeTurmas || cached
    const map = new Map()
    data.forEach((turma: any) => {
      if (!map.has(turma.turma_id)) {
        map.set(turma.turma_id, {
          turma_id: turma.turma_id,
          turma_nome: turma.turma_nome,
          total_alunos: turma.total_alunos || 0,
          percentual_presenca: turma.percentual_presenca || 0,
          media_geral: turma.media_geral || 0,
        })
      }
    })
    return Array.from(map.values())
  }, [saudeTurmas, cached])

  const turmasComDetalhes = useMemo(() => {
    if (!turmasUnicas || !turmas) return turmasUnicas

    return turmasUnicas.map((turma: any) => {
      const turmaInfo = turmas.find((t: any) => t.id === turma.turma_id)
      return {
        ...turma,
        turno: turmaInfo?.turno || '',
        sala: turmaInfo?.sala || '',
      }
    })
  }, [turmasUnicas, turmas])

  const filteredTurmas = useMemo(() => {
    return turmasComDetalhes.filter((turma: any) =>
      turma.turma_nome.toLowerCase().includes(search.toLowerCase())
    )
  }, [turmasComDetalhes, search])

  const totalAlunos = turmasUnicas.reduce((sum: number, t: any) => sum + t.total_alunos, 0)
  const mediaPresenca = turmasUnicas.length > 0
    ? turmasUnicas.reduce((sum: number, t: any) => sum + t.percentual_presenca, 0) / turmasUnicas.length
    : 0
  const mediaGeral = turmasUnicas.length > 0
    ? turmasUnicas.reduce((sum: number, t: any) => sum + t.media_geral, 0) / turmasUnicas.length
    : 0

  const isLoading = isLoadingSaude || isLoadingTurmas
  const temDadosReais = turmasUnicas.length > 0 && turmasUnicas.some((t: any) => t.total_alunos > 0)

  const displayTurmas = isLoading ? [] : filteredTurmas

  // Skeleton loading
  if (isLoading && !cached.length) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-32">
        <div className="mx-auto w-full max-w-[640px] px-4 pt-6 space-y-4">
          <Skeleton className="h-14 w-full rounded-2xl" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  // Empty state quando não há turmas
  if (!temDadosReais && !isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-32">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
          <div className="mx-auto w-full max-w-[640px] px-4 py-4">
            <div className="flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/dashboard')}
                className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <ArrowLeft className="h-4 w-4 text-slate-500" />
              </motion.button>
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">Minhas Turmas</h1>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Sem turmas disponíveis</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty Content */}
        <div className="flex flex-col items-center justify-center py-24 px-4">
          <div className="h-24 w-24 bg-slate-100 dark:bg-slate-800/50 rounded-[3rem] flex items-center justify-center mb-6">
            <School className="h-12 w-12 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Suas turmas aparecerão aqui</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Aguarde o cadastro pela escola</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-32">

      {/* ── STICKY HEADER (Rule 2) ─────────────────── */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="mx-auto w-full max-w-[640px] px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/dashboard')}
                className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <ArrowLeft className="h-4 w-4 text-slate-500" />
              </motion.button>
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">Minhas Turmas</h1>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{displayTurmas.length} turmas</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Pesquisar turma..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl border-0 bg-slate-100/60 dark:bg-slate-800/60 text-base font-medium"
            />
          </div>
        </div>
      </div>

      {/* ── LIST ──────────────────────────────────── */}
      <div className="mx-auto w-full max-w-[640px] px-4 pt-5">
        {/* Stats Cards */}
        {temDadosReais && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
              <Users className="h-5 w-5 text-blue-500 mx-auto mb-1.5" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Alunos</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{totalAlunos}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
              <Clock className="h-5 w-5 text-emerald-500 mx-auto mb-1.5" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Frequência</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">
                {mediaPresenca > 0 ? `${mediaPresenca.toFixed(0)}%` : '—'}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
              <TrendingUp className="h-5 w-5 text-violet-500 mx-auto mb-1.5" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Média</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">
                {mediaGeral > 0 ? mediaGeral.toFixed(1) : '—'}
              </p>
            </div>
          </div>
        )}

        <PullToRefresh onRefresh={async () => { await refetch() }}>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {displayTurmas.map((turma: any, idx) => {
                const freq = turma.percentual_presenca
                const media = turma.media_geral
                const temFreq = freq > 0
                const temMedia = media > 0

                let statusText = 'Sem dados'
                let statusColor = 'text-slate-400'
                let bgColor = 'bg-slate-50 dark:bg-slate-800/40'

                if (temFreq && temMedia) {
                  if (freq >= 75 && media >= 7) {
                    statusText = 'Excelente'
                    statusColor = 'text-emerald-600 dark:text-emerald-400'
                    bgColor = 'bg-emerald-50 dark:bg-emerald-900/20'
                  } else if (freq >= 50 && media >= 5) {
                    statusText = 'Regular'
                    statusColor = 'text-amber-600 dark:text-amber-400'
                    bgColor = 'bg-amber-50 dark:bg-amber-900/20'
                  } else {
                    statusText = 'Crítico'
                    statusColor = 'text-red-600 dark:text-red-400'
                    bgColor = 'bg-red-50 dark:bg-red-900/20'
                  }
                } else if (temFreq) {
                  statusText = freq >= 75 ? 'Bom' : 'Atenção'
                  statusColor = freq >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  bgColor = freq >= 75 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
                }

                return (
                  <motion.div
                    key={turma.turma_id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    layout
                  >
                    <NativeCard
                      onClick={() => navigate(`/professores/turmas/${turma.turma_id}`)}
                      className="p-0 overflow-hidden rounded-[2rem] border-slate-100 dark:border-slate-800 shadow-sm"
                    >
                      <div className="p-4">
                        {/* Header do Card */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex gap-3 min-w-0">
                            <div className={cn(
                              "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                              "bg-gradient-to-br from-indigo-500 to-violet-600"
                            )}>
                              <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-[15px] font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{turma.turma_nome}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                {turma.turno && (
                                  <Badge className="text-[8px] font-black uppercase rounded-lg px-2 h-5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border-0">
                                    {turma.turno}
                                  </Badge>
                                )}
                                {turma.sala && (
                                  <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                    <School className="h-3.5 w-3.5" />{turma.sala}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); navigate(`/professores/turmas/${turma.turma_id}`) }}
                            className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-700"
                          >
                            <Eye className="h-5 w-5" />
                          </motion.button>
                        </div>

                        {/* Info Compacta */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                              {turma.total_alunos}/{turma.capacidade_maxima || 30} alunos
                            </span>
                          </div>
                          <div className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl",
                            bgColor
                          )}>
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-tighter",
                              statusColor
                            )}>
                              {statusText}
                            </span>
                          </div>
                        </div>

                        {/* Ações Rápidas (Estilo Web) */}
                        <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-50 dark:border-slate-800/60">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/professores/turmas/${turma.turma_id}`) }}
                            className="h-10 rounded-xl font-bold text-[10px] uppercase gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 flex items-center justify-center transition-colors"
                          >
                            <BookOpen size={14} />
                            Visualizar Turma
                            <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    </NativeCard>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {displayTurmas.length === 0 && temDadosReais && (
              <div className="py-24 text-center">
                <div className="h-24 w-24 bg-slate-100/50 rounded-[3rem] flex items-center justify-center mx-auto mb-6">
                  <Search className="h-12 w-12 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Nenhuma Turma</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Tente outro termo de busca</p>
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>
    </div>
  )
}
