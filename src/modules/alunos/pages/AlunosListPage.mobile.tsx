import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlunos, useExcluirAluno } from '../hooks'
import { useMatriculasAtivas } from '@/modules/academico/hooks'
import {
  Search,
  Plus,
  User,
  ChevronRight,
  Filter,
  ArrowLeft,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { get, set } from 'idb-keyval'

const CACHE_KEY = 'alunos_list_cache'

export function AlunosListPageMobile() {
  const navigate = useNavigate()
  const { data: alunos, isLoading, refetch } = useAlunos()
  const { data: matriculasAtivas } = useMatriculasAtivas()
  const excluirAluno = useExcluirAluno()

  const [searchTerm, setSearchTerm] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [cachedAlunos, setCachedAlunos] = useState<any[]>([])

  useEffect(() => {
    get(CACHE_KEY).then(val => { if (val) setCachedAlunos(val) })
  }, [])

  useEffect(() => {
    if (alunos) set(CACHE_KEY, alunos)
  }, [alunos])

  const displayAlunos = (alunos || cachedAlunos) as any[]

  const alunosComMatriculaIds = useMemo(() => {
    return new Set(matriculasAtivas?.map(m => m.aluno_id) || [])
  }, [matriculasAtivas])

  const filteredAlunos = useMemo(() => {
    return displayAlunos?.filter(a =>
      a.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.cpf?.includes(searchTerm)
    )
  }, [displayAlunos, searchTerm])

  const onRefresh = async () => { await refetch() }

  const handleExcluir = async (aluno: any) => {
    if (aluno.status === 'ativo') {
      toast.error('Não é possível excluir um aluno ativo.', {
        description: 'Desative-o primeiro.',
        position: 'top-center'
      })
    }
  }

  // Skeleton Loading
  if (isLoading && !cachedAlunos.length) {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-32">
        <div className="mx-auto w-full max-w-[640px] px-4 pt-6 space-y-4">
          <Skeleton className="h-12 w-full rounded-2xl" />
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-[88px] w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-32">
      {/* ── Sticky Top: Search ── */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="mx-auto w-full max-w-[640px] px-4 py-3 space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/dashboard')}
                className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
              >
                <ArrowLeft className="h-4 w-4 text-slate-500" />
              </motion.button>
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">Alunos</h1>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {filteredAlunos?.length || 0} registros
                </p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFilterOpen(true)}
              className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
            >
              <Filter className="h-4 w-4 text-slate-500" />
            </motion.button>
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl border-0 bg-slate-100/80 dark:bg-slate-800/80 focus-visible:ring-indigo-500 text-base font-medium"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto w-full max-w-[640px] px-4 pt-5">
        <PullToRefresh onRefresh={onRefresh}>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredAlunos?.map((aluno, idx) => (
                <motion.div
                  key={aluno.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.25 }}
                  layout
                >
                  <NativeCard
                    swipeable
                    onClick={() => navigate(`/alunos/${aluno.id}`)}
                    onDelete={() => handleExcluir(aluno)}
                    onEdit={() => navigate(`/alunos/${aluno.id}?edit=true`)}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Avatar */}
                      <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-600 overflow-hidden">
                        {aluno.foto_url ? (
                          <img src={aluno.foto_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-slate-300" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 dark:text-white text-[14px] truncate leading-tight">
                            {aluno.nome_completo}
                          </h3>
                          <Badge className={`text-[8px] font-black h-[18px] px-1.5 rounded-md border-0 shrink-0 ${
                            alunosComMatriculaIds.has(aluno.id)
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30'
                              : 'bg-amber-50 text-amber-500 dark:bg-amber-900/30'
                          }`}>
                            {alunosComMatriculaIds.has(aluno.id) ? 'ATIVO' : 'PEND.'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-none">
                          {aluno.filiais?.nome_unidade || 'Sem Unidade'}
                        </p>
                      </div>

                      <ChevronRight className="h-4 w-4 text-slate-200 shrink-0 ml-1" />
                    </div>
                  </NativeCard>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty State */}
            {filteredAlunos?.length === 0 && (
              <div className="py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
                  <Search className="h-7 w-7 text-slate-200" />
                </div>
                <p className="font-black text-slate-300 text-sm mb-1">Nenhum resultado</p>
                <p className="text-slate-400 text-xs">Tente outra busca.</p>
                <Button variant="outline" onClick={() => setSearchTerm('')} className="mt-4 rounded-xl text-xs font-bold">
                  Limpar busca
                </Button>
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/alunos/novo')}
        className="fixed bottom-24 right-5 h-14 w-14 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-200/60 dark:shadow-none flex items-center justify-center text-white z-40 ring-4 ring-white dark:ring-slate-950"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {/* Filter Bottom Sheet */}
      <BottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filtrar Alunos"
        size="half"
      >
        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
            <div className="flex gap-2">
              {['Todos', 'Ativos', 'Inativos'].map(s => (
                <Button key={s} variant="outline" className="flex-1 rounded-xl h-12 text-xs font-bold active:bg-indigo-50 active:text-indigo-700 active:border-indigo-200">
                  {s}
                </Button>
              ))}
            </div>
          </div>
          <Button className="w-full h-14 rounded-2xl bg-indigo-600 font-bold" onClick={() => setIsFilterOpen(false)}>
            Aplicar
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}
