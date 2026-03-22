import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  User,
  ChevronRight,
  Filter,
  X,
  GraduationCap,
  Layers,
  Calendar,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  MoreVertical,
  Pencil,
  Eye,
  DollarSign,
  Clock,
  BookOpen
} from 'lucide-react'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useMatriculas, useExcluirMatricula } from '../hooks'
import { get, set } from 'idb-keyval'
import { toast } from 'sonner'

const CACHE_KEY = 'matriculas_list_cache'

export function MatriculasListPageMobile() {
  const navigate = useNavigate()
  const { data: matriculas, isLoading, refetch } = useMatriculas()
  const deleteMatricula = useExcluirMatricula()
  const [searchTerm, setSearchTerm] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [cachedData, setCachedData] = useState<any[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedMatricula, setSelectedMatricula] = useState<any | null>(null)
  const [isActionsOpen, setIsActionsOpen] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    get(CACHE_KEY).then(val => { if (val) setCachedData(val) })
  }, [])

  useEffect(() => {
    if (matriculas) set(CACHE_KEY, matriculas)
  }, [matriculas])

  const displayData = (matriculas || cachedData) as any[]
  const isActuallyLoading = isLoading && !cachedData.length

  const filteredData = useMemo(() => {
    return displayData?.filter(m =>
      m.aluno?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.serie_ano?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [displayData, searchTerm])

  const onRefresh = async () => { await refetch() }

  const handleOpenActions = (matricula: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedMatricula(matricula)
    setIsActionsOpen(true)
  }

  const handleEdit = () => {
    setIsActionsOpen(false)
    navigate(`/matriculas/nova?id=${selectedMatricula?.id}`)
  }

  const handleViewDetails = () => {
    setIsActionsOpen(false)
    setShowDetailsModal(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMatricula.mutateAsync(deleteId)
      toast.success('Matrícula excluída')
      setDeleteId(null)
      setIsActionsOpen(false)
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  if (isActuallyLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-32">
        <div className="mx-auto w-full max-w-[640px] px-4 pt-6 space-y-4">
          <Skeleton className="h-12 w-full rounded-2xl" />
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-32">
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="mx-auto w-full max-w-[640px] px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/dashboard')} className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <ArrowLeft className="h-4 w-4 text-slate-500" />
              </motion.button>
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">Matrículas</h1>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{filteredData?.length || 0} registros</p>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsFilterOpen(true)} className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Filter className="h-4 w-4 text-slate-500" />
            </motion.button>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por aluno ou turma..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl border-0 bg-slate-100/80 dark:bg-slate-800/80 focus-visible:ring-indigo-500 text-base font-medium"
            />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1"><X className="h-4 w-4 text-slate-400" /></button>}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[640px] px-4 pt-5">
        <PullToRefresh onRefresh={onRefresh}>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredData?.map((m, idx) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03, duration: 0.25 }} layout>
                  <NativeCard
                    swipeable
                    onClick={() => navigate(`/alunos/${m.aluno_id}`)}
                    onDelete={() => setDeleteId(m.id)}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-600 overflow-hidden">
                        {m.aluno?.foto_url ? <img src={m.aluno.foto_url} alt="" className="w-full h-full object-cover" /> : <User className="h-6 w-6 text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <h3 className="font-bold text-slate-900 dark:text-white text-[14px] truncate leading-tight">{m.aluno?.nome_completo || 'Sem Nome'}</h3>
                          <Badge className={`text-[8px] font-black h-[18px] px-1.5 rounded-md border-0 shrink-0 ${m.status === 'ativa' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-500'}`}>{m.status.toUpperCase()}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100/50"><Layers className="h-2.5 w-2.5 text-indigo-500" /><span className="text-[9px] font-black text-indigo-700 dark:text-indigo-400 uppercase">{m.serie_ano}</span></div>
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100"><Calendar className="h-2.5 w-2.5 text-slate-400" /><span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{m.ano_letivo}</span></div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleOpenActions(m, e)}
                        className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 active:bg-slate-200 shrink-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </NativeCard>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredData?.length === 0 && (
              <div className="py-20 text-center">
                <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-50">
                   <GraduationCap className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Nenhuma Matrícula</h3>
                <p className="text-xs font-medium text-slate-400 max-w-[200px] mx-auto mt-2 leading-relaxed">Inicie um novo processo clicando no botão abaixo.</p>
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>

      <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/matriculas/nova')} className="fixed bottom-24 right-5 h-14 w-14 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-200/60 flex items-center justify-center text-white z-40 ring-4 ring-white dark:ring-slate-950">
        <Plus className="h-6 w-6" />
      </motion.button>

      <BottomSheet isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filtrar Matrículas" size="half">
        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {['Todos', 'Ativa', 'Concluída', 'Cancelada'].map(s => <Button key={s} variant="outline" className="rounded-xl h-12 text-xs font-bold">{s}</Button>)}
            </div>
          </div>
          <Button className="w-full h-14 rounded-2xl bg-indigo-600 font-bold" onClick={() => setIsFilterOpen(false)}>Aplicar Filtros</Button>
        </div>
      </BottomSheet>

      {/* Action Sheet para Matrícula */}
      <BottomSheet
        isOpen={isActionsOpen}
        onClose={() => setIsActionsOpen(false)}
        title={selectedMatricula?.aluno?.nome_completo || 'Matrícula'}
        size="peek"
      >
        <div className="space-y-2 pt-4 pb-8">
          <button
            onClick={handleViewDetails}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl active:bg-slate-50 transition-colors"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Eye size={18} />
            </div>
            <span className="font-bold text-slate-700">Ver Detalhes da Matrícula</span>
          </button>

          <button
            onClick={() => {
              setIsActionsOpen(false)
              navigate(`/alunos/${selectedMatricula?.aluno_id}`)
            }}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl active:bg-slate-50 transition-colors"
          >
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <User size={18} />
            </div>
            <span className="font-bold text-slate-700">Ver Detalhes do Aluno</span>
          </button>

          <button
            onClick={handleEdit}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl active:bg-slate-50 transition-colors"
          >
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Pencil size={18} />
            </div>
            <span className="font-bold text-slate-700">Editar Matrícula</span>
          </button>

          <button
            onClick={() => {
              setIsActionsOpen(false)
              setDeleteId(selectedMatricula?.id || null)
            }}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl active:bg-rose-50 transition-colors text-rose-600"
          >
            <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <Trash2 size={18} />
            </div>
            <span className="font-bold">Excluir Matrícula</span>
          </button>
        </div>
      </BottomSheet>

      {/* Modal de Detalhes da Matrícula */}
      <BottomSheet
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Detalhes da Matrícula"
        size="half"
      >
        <div className="space-y-5 pt-4 pb-8">
          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge className={`text-[11px] font-black h-[28px] px-4 rounded-full border-0 ${
              selectedMatricula?.status === 'ativa' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-amber-500 text-white'
            }`}>
              {selectedMatricula?.status?.toUpperCase() || 'N/A'}
            </Badge>
          </div>

          {/* Informações da Matrícula */}
          <div className="space-y-3">
            {/* Ano Letivo */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Calendar size={16} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Ano Letivo</p>
                <p className="text-[15px] font-semibold text-slate-900">{selectedMatricula?.ano_letivo || 'N/A'}</p>
              </div>
            </div>

            {/* Data da Matrícula */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Data da Matrícula</p>
                <p className="text-[15px] font-semibold text-slate-900">
                  {selectedMatricula?.data_matricula 
                    ? new Date(selectedMatricula.data_matricula).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Turma / Série */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <BookOpen size={16} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Turma / Ano</p>
                <p className="text-[15px] font-semibold text-slate-900">{selectedMatricula?.serie_ano || 'N/A'}</p>
              </div>
            </div>

            {/* Turno */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="h-9 w-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <GraduationCap size={16} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Turno</p>
                <p className="text-[15px] font-semibold text-slate-900">{selectedMatricula?.turno || 'N/A'}</p>
              </div>
            </div>

            {/* Valor da Matrícula */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="h-9 w-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <DollarSign size={16} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Valor da Matrícula</p>
                <p className="text-[15px] font-semibold text-slate-900">
                  {selectedMatricula?.valor 
                    ? `R$ ${Number(selectedMatricula.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Data da Primeira Cobrança */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Calendar size={16} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Primeira Cobrança</p>
                <p className="text-[15px] font-semibold text-slate-900">
                  {selectedMatricula?.data_primeira_cobranca 
                    ? new Date(selectedMatricula.data_primeira_cobranca).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Delete Confirmation Sheet (Rule 4) */}
      <BottomSheet isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Matrícula">
         <div className="space-y-6 pt-6 text-center">
            <div className="h-20 w-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-2"><Trash2 className="h-10 w-10 text-red-500" /></div>
            <div className="space-y-1 px-4">
               <h4 className="text-lg font-black text-slate-900">Confirmar Exclusão</h4>
               <p className="text-xs text-slate-500 font-medium">Esta ação não pode ser desfeita. Deseja realmente excluir esta matrícula?</p>
            </div>
            <div className="flex gap-3 mt-6">
               <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setDeleteId(null)}>Cancelar</Button>
               <Button className="flex-1 h-14 rounded-2xl bg-red-600 font-bold" onClick={handleDelete} disabled={deleteMatricula.isPending}>
                  {deleteMatricula.isPending ? 'Excluindo...' : 'Sim, Excluir'}
               </Button>
            </div>
         </div>
      </BottomSheet>
    </div>
  )
}
