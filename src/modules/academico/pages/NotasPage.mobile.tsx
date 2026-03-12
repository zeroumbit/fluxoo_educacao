import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  GraduationCap, 
  Search, 
  Filter, 
  Save, 
  ChevronRight, 
  BookOpen, 
  AlertCircle,
  CheckCircle2,
  User,
  MoreVertical,
  Edit3,
  ArrowLeft
} from 'lucide-react'
import { useAuth } from '@/modules/auth/AuthContext'
import { useTurmas } from '@/modules/turmas/hooks'
import { useDisciplinas } from '@/modules/livros/hooks'
import { useBoletinsPorTurma, useUpsertNota } from '../hooks'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { get, set } from 'idb-keyval'

// Componentes Mobile conforme MOBILE_FIRST_RULES.md
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const CACHE_KEY_NOTAS = 'mobile_notas_cache'

export function NotasPageMobile() {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  
  // Filtros
  const [turmaId, setTurmaId] = useState<string>('')
  const [disciplinaNome, setDisciplinaNome] = useState<string>('')
  const [bimestre, setBimestre] = useState<string>('1')
  const [anoLetivo] = useState<number>(new Date().getFullYear())
  
  // UI States
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [selectedAluno, setSelectedAluno] = useState<any>(null)
  const [search, setSearch] = useState('')
  
  // Hooks de Dados
  const { data: turmas, isLoading: isLoadingTurmas } = useTurmas()
  const { data: disciplinas, isLoading: isLoadingDisciplinas } = useDisciplinas()
  const { data: boletins, isLoading: isLoadingBoletins, refetch } = useBoletinsPorTurma(
    turmaId, 
    anoLetivo, 
    Number(bimestre)
  )
  const { mutateAsync: upsertNota, isPending: isSaving } = useUpsertNota()

  // Estado Local (Offline-first / Edição rápida)
  const [notasLocais, setNotasLocais] = useState<Record<string, { nota: string, faltas: string, observacoes: string }>>({})
  const [cached, setCached] = useState<any[]>([])

  // Sincronizar cache
  useEffect(() => {
    get(CACHE_KEY_NOTAS).then(v => { if (v) setCached(v) })
  }, [])

  // Sincronizar notas locais quando os boletins carregarem
  useEffect(() => {
    if (boletins && disciplinaNome) {
      const novasNotas: Record<string, { nota: string, faltas: string, observacoes: string }> = {}
      boletins.forEach((bol: any) => {
        const disc = bol.disciplinas?.find((d: any) => d.disciplina === disciplinaNome)
        if (disc) {
          novasNotas[bol.aluno_id] = {
            nota: disc.nota.toString(),
            faltas: disc.faltas.toString(),
            observacoes: disc.observacoes || ''
          }
        }
      })
      setNotasLocais(novasNotas)
      set(CACHE_KEY_NOTAS, boletins)
    }
  }, [boletins, disciplinaNome])

  // Busca de Alunos (Mesma lógica do Web para consistência)
  const { data: todosAlunos, isLoading: isLoadingAlunos } = useQuery({
    queryKey: ['alunos_turma_mobile', turmaId],
    queryFn: async (): Promise<any[]> => {
      if (!turmaId) return []
      const { data: turmaInfo } = await supabase.from('turmas').select('nome, tenant_id').eq('id', turmaId).single()
      if (!turmaInfo) return []
      const { data: matriculas } = await supabase.from('matriculas').select('aluno_id, serie_ano, turma_id').eq('tenant_id', turmaInfo.tenant_id!)
      if (!matriculas) return []
      const matriculasFiltradas = matriculas.filter(m => {
        if (m.turma_id === turmaId) return true
        const nomeTurmaNorm = (turmaInfo.nome || '').toLowerCase().trim().replace('º', '').replace('°', '')
        const serieNorm = (m.serie_ano || '').toLowerCase().trim().replace('º', '').replace('°', '')
        return nomeTurmaNorm === serieNorm || (m.serie_ano === turmaInfo.nome)
      })
      if (matriculasFiltradas.length === 0) return []
      const ids = matriculasFiltradas.map(m => m.aluno_id)
      const { data: alunosData } = await supabase.from('alunos').select('id, nome_completo').in('id', ids)
      return alunosData || []
    },
    enabled: !!turmaId
  })

  const handleSaveNota = async (alunoId: string, dados: { nota: string, faltas: string, observacoes: string }) => {
    if (!turmaId || !disciplinaNome) {
      toast.error('Escolha Turma e Disciplina primeiro')
      return
    }

    try {
      await upsertNota({
        boletimBase: {
          tenant_id: authUser?.tenantId,
          aluno_id: alunoId,
          turma_id: turmaId,
          ano_letivo: anoLetivo,
          bimestre: Number(bimestre)
        },
        disciplina: disciplinaNome,
        nota: parseFloat(dados.nota.replace(',', '.')),
        faltas: parseInt(dados.faltas),
        observacoes: dados.observacoes
      })
      toast.success('Nota salva!', { position: 'top-center' })
      refetch()
      setIsEditOpen(false)
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message, { position: 'top-center' })
    }
  }

  const filteredAlunos = (todosAlunos || []).filter(a => 
    a.nome_completo.toLowerCase().includes(search.toLowerCase())
  )

  const isLoading = isLoadingTurmas || isLoadingDisciplinas || (isLoadingBoletins && !cached.length)

  // Empty State Helper
  if (!turmaId || !disciplinaNome) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-32">
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
          <div className="mx-auto w-full max-w-[640px] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/dashboard')}
                className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
              >
                <ArrowLeft className="h-4 w-4 text-slate-500" />
              </motion.button>
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">Notas</h1>
            </div>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFilterOpen(true)}
              className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
            >
              <Filter className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[640px] px-4 pt-16 text-center">
          <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-50">
            <BookOpen className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Configure o Diário</h3>
          <p className="text-slate-500 text-sm max-w-[240px] mx-auto mb-8">
            Selecione a turma e a disciplina para começar a lançar as notas do bimestre.
          </p>
          <Button 
            onClick={() => setIsFilterOpen(true)}
            className="w-full h-14 rounded-2xl bg-indigo-600 font-bold text-base shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            Abrir Filtros
          </Button>
        </div>

        {/* Filter Sheet */}
        <FilterSheet 
          isOpen={isFilterOpen} 
          onClose={() => setIsFilterOpen(false)}
          turmas={turmas}
          disciplinas={disciplinas}
          turmaId={turmaId}
          setTurmaId={setTurmaId}
          disciplinaNome={disciplinaNome}
          setDisciplinaNome={setDisciplinaNome}
          bimestre={bimestre}
          setBimestre={setBimestre}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-32">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="mx-auto w-full max-w-[640px] px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-left">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/dashboard')}
                className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"
              >
                <ArrowLeft className="h-4 w-4 text-slate-500" />
              </motion.button>
              <div className="flex flex-col min-w-0">
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none truncate">
                  {turmaId ? turmas?.find(t => t.id === turmaId)?.nome : 'Notas'}
                </h1>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  {disciplinaNome} • {bimestre}º Bimestre
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
               <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFilterOpen(true)}
                className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <Filter className="h-4 w-4" />
              </motion.button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar aluno..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl border-0 bg-slate-100/80 dark:bg-slate-800/80 text-base font-medium"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-[640px] px-4 pt-5">
        <PullToRefresh onRefresh={async () => { await refetch() }}>
          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
              </div>
            ) : filteredAlunos.length === 0 ? (
              <div className="py-20 text-center">
                <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4 text-slate-300">
                  <User className="h-8 w-8" />
                </div>
                <p className="font-bold text-slate-400">Nenhum aluno encontrado</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredAlunos.map((aluno, idx) => {
                  const notaInfo = notasLocais[aluno.id] || { nota: '-', faltas: '0' }
                  const hasGrade = notaInfo.nota !== '-' && notaInfo.nota !== ''
                  
                  return (
                    <motion.div
                      key={aluno.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      layout
                    >
                      <NativeCard 
                        onClick={() => {
                          setSelectedAluno(aluno)
                          setIsEditOpen(true)
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 border",
                            hasGrade ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                     : "bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-800 dark:text-slate-600"
                          )}>
                            {hasGrade ? notaInfo.nota : aluno.nome_completo.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[14px] font-bold text-slate-900 dark:text-white truncate">
                              {aluno.nome_completo}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-slate-500">
                                {notaInfo.faltas} faltas
                              </span>
                              {notaInfo.observacoes && (
                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                              )}
                              {notaInfo.observacoes && (
                                <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                                  {notaInfo.observacoes}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                             <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                <Edit3 className="h-4 w-4 text-slate-400" />
                             </div>
                             {hasGrade && (
                               <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Lançado</span>
                             )}
                          </div>
                        </div>
                      </NativeCard>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>
        </PullToRefresh>
      </div>

      {/* Sheets */}
      <FilterSheet 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)}
        turmas={turmas}
        disciplinas={disciplinas}
        turmaId={turmaId}
        setTurmaId={setTurmaId}
        disciplinaNome={disciplinaNome}
        setDisciplinaNome={setDisciplinaNome}
        bimestre={bimestre}
        setBimestre={setBimestre}
      />

      <EditSheet 
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        aluno={selectedAluno}
        notaInicial={selectedAluno ? notasLocais[selectedAluno.id] : null}
        onSave={handleSaveNota}
        isSaving={isSaving}
      />
    </div>
  )
}

// --- SUBCOMPONENTES ---

function FilterSheet({ 
  isOpen, onClose, turmas, disciplinas, 
  turmaId, setTurmaId, 
  disciplinaNome, setDisciplinaNome,
  bimestre, setBimestre
}: any) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Filtros do Diário" size="half">
      <div className="space-y-6 pt-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Turma</Label>
            <div className="grid grid-cols-2 gap-2">
              {turmas?.map((t: any) => (
                <button
                  key={t.id}
                  onClick={() => setTurmaId(t.id)}
                  className={cn(
                    "h-12 px-4 rounded-xl text-xs font-bold transition-all border",
                    turmaId === t.id 
                      ? "bg-indigo-600 border-indigo-600 text-white" 
                      : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  )}
                >
                  {t.nome}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Disciplina</Label>
            <div className="flex flex-wrap gap-2">
              {disciplinas?.map((d: any) => (
                <button
                  key={d.id}
                  onClick={() => setDisciplinaNome(d.nome)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-xs font-bold transition-all border",
                    disciplinaNome === d.nome 
                      ? "bg-indigo-600 border-indigo-600 text-white" 
                      : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  )}
                >
                  {d.nome}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bimestre</Label>
            <div className="grid grid-cols-4 gap-2">
              {['1', '2', '3', '4'].map((b) => (
                <button
                  key={b}
                  onClick={() => setBimestre(b)}
                  className={cn(
                    "h-12 rounded-xl text-xs font-bold transition-all border",
                    bimestre === b 
                      ? "bg-indigo-600 border-indigo-600 text-white" 
                      : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  )}
                >
                  {b}º
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button 
          className="w-full h-14 rounded-2xl bg-indigo-600 font-bold text-base mt-4" 
          onClick={onClose}
          disabled={!turmaId || !disciplinaNome}
        >
          Aplicar Filtros
        </Button>
      </div>
    </BottomSheet>
  )
}

function EditSheet({ isOpen, onClose, aluno, notaInicial, onSave, isSaving }: any) {
  const [nota, setNota] = useState('')
  const [faltas, setFaltas] = useState('0')
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    if (isOpen && notaInicial) {
      setNota(notaInicial.nota || '')
      setFaltas(notaInicial.faltas || '0')
      setObservacoes(notaInicial.observacoes || '')
    } else if (isOpen) {
      setNota('')
      setFaltas('0')
      setObservacoes('')
    }
  }, [isOpen, notaInicial])

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Lançar Nota" size="half">
      <div className="space-y-6 pt-4">
        {aluno && (
          <div className="flex items-center gap-4 mb-2">
            <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-100">
              {aluno.nome_completo.charAt(0)}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">{aluno.nome_completo}</h4>
              <p className="text-xs text-slate-400">ID: {aluno.id.split('-')[0]}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nota Final</Label>
            <Input 
              inputMode="decimal"
              placeholder="0.0"
              value={nota}
              onChange={e => setNota(e.target.value)}
              className="h-14 rounded-xl text-base font-bold text-center text-indigo-600"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Faltas</Label>
            <Input 
              inputMode="numeric"
              placeholder="0"
              value={faltas}
              onChange={e => setFaltas(e.target.value)}
              className="h-14 rounded-xl text-base font-bold text-center"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observações</Label>
          <Input 
            placeholder="Feedback para o aluno..."
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
            className="h-14 rounded-2xl text-base"
          />
        </div>

        <div className="pt-2">
          <Button 
            className="w-full h-14 rounded-2xl bg-indigo-600 font-bold text-base"
            disabled={isSaving}
            onClick={() => onSave(aluno.id, { nota, faltas, observacoes })}
          >
            {isSaving ? "Salvando..." : "Salvar Nota"}
          </Button>
          <Button variant="ghost" className="w-full h-12 mt-2 text-slate-400 font-bold" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
