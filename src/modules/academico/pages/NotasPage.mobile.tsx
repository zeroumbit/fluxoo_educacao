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
  ArrowLeft,
  LayoutGrid,
  Loader2,
  Copy
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [globalNota, setGlobalNota] = useState<string>('')
  const [globalFaltas, setGlobalFaltas] = useState<string>('')
  const [globalObs, setGlobalObs] = useState<string>('')
  const [isSavingAll, setIsSavingAll] = useState(false)
  const [alunoId, setAlunoId] = useState<string>('all')
  
  // Hooks de Dados
  const { data: turmas, isLoading: isLoadingTurmas } = useTurmas()
  const { data: disciplinas, isLoading: isLoadingDisciplinas } = useDisciplinas()
  const { data: boletins, isLoading: isLoadingBoletins, refetch } = useBoletinsPorTurma(
    turmaId, 
    anoLetivo, 
    Number(bimestre)
  )
  const { mutateAsync: upsertNota, isPending: isSaving } = useUpsertNota()

  // Estado Local
  const [notasLocais, setNotasLocais] = useState<Record<string, { nota: string, faltas: string, observacoes: string }>>({})
  const [cached, setCached] = useState<any[]>([])

  useEffect(() => {
    get(CACHE_KEY_NOTAS).then(v => { if (v) setCached(v) })
  }, [])

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

  const handleSaveNota = async (activeId: string, dados: { nota: string, faltas: string, observacoes: string }) => {
    if (!turmaId || !disciplinaNome) {
      toast.error('Escolha Turma e Disciplina primeiro')
      return
    }

    try {
      await upsertNota({
        boletimBase: {
          tenant_id: authUser?.tenantId,
          aluno_id: activeId,
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

  const aplicarMassa = () => {
    if (selecionados.length === 0) return
    setNotasLocais(prev => {
      const novo = { ...prev }
      selecionados.forEach(id => {
        novo[id] = {
          nota: globalNota || (novo[id]?.nota || ''),
          faltas: globalFaltas || (novo[id]?.faltas || '0'),
          observacoes: globalObs || (novo[id]?.observacoes || '')
        }
      })
      return novo
    })
    toast.success(`Aplicado a ${selecionados.length} alunos`, { position: 'top-center' })
    setIsBulkOpen(false)
    setGlobalNota('')
    setGlobalFaltas('')
    setGlobalObs('')
  }

  const filteredAlunos = (todosAlunos || []).filter(a => {
    const matchesSearch = a.nome_completo.toLowerCase().includes(search.toLowerCase())
    const matchesSelected = alunoId === 'all' || a.id === alunoId
    return matchesSearch && matchesSelected
  })

  async function salvarTodasNotas() {
    if (!turmaId || !disciplinaNome) return
    setIsSavingAll(true)
    try {
      for (const [id, dados] of Object.entries(notasLocais)) {
        if (!dados.nota) continue
        await upsertNota({
          boletimBase: {
            tenant_id: authUser?.tenantId,
            aluno_id: id,
            turma_id: turmaId,
            ano_letivo: anoLetivo,
            bimestre: Number(bimestre)
          },
          disciplina: disciplinaNome,
          nota: parseFloat(dados.nota.replace(',', '.')),
          faltas: parseInt(dados.faltas),
          observacoes: dados.observacoes
        })
      }
      toast.success('Todas as notas salvas devidamente!')
      refetch()
    } catch (e: any) {
      toast.error('Erro ao salvar lote')
    } finally {
      setIsSavingAll(false)
    }
  }

  if (!turmaId || !disciplinaNome) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
        <div className="mx-auto w-full max-w-[640px] px-4 pt-16 text-center">
            <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Diário Mobile</h3>
            <p className="text-slate-500 text-sm mb-8 px-6">Selecione os filtros básicos para começar a lançar as notas.</p>
            <Button onClick={() => setIsFilterOpen(true)} className="w-full h-15 rounded-2xl bg-indigo-600 font-bold">Configurar Filtros</Button>
        </div>
        
        <FilterSheet 
            isOpen={isFilterOpen} 
            onClose={() => setIsFilterOpen(false)}
            turmas={turmas} disciplinas={disciplinas} todosAlunos={todosAlunos}
            turmaId={turmaId} setTurmaId={setTurmaId}
            alunoId={alunoId} setAlunoId={setAlunoId}
            disciplinaNome={disciplinaNome} setDisciplinaNome={setDisciplinaNome}
            bimestre={bimestre} setBimestre={setBimestre}
            anoLetivo={anoLetivo} isLoadingAlunos={isLoadingAlunos}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 px-4 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-slate-100 dark:bg-slate-800" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-5 w-5"/></Button>
                <div>
                    <h1 className="font-black text-base leading-none">{turmas?.find(t => t.id === turmaId)?.nome}</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{disciplinaNome} • {bimestre}º Bim</p>
                </div>
            </div>
            <Button onClick={() => setIsFilterOpen(true)} className="h-10 w-10 p-0 rounded-xl bg-indigo-600"><Filter className="h-4 w-4"/></Button>
        </div>
        <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Buscar por nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-0" />
        </div>
      </div>

      <div className="px-4 pt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
            <NativeCard className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl items-center justify-center flex"><User className="text-indigo-600 h-5 w-5"/></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase">Alunos</p><p className="font-black text-lg">{filteredAlunos.length}</p></div>
            </NativeCard>
            <NativeCard className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl items-center justify-center flex"><CheckCircle2 className="text-emerald-600 h-5 w-5"/></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase">Salvas</p><p className="font-black text-lg">{Object.keys(notasLocais).length}</p></div>
            </NativeCard>
        </div>

        <div className="flex gap-3">
            <Button className="flex-1 h-14 rounded-2xl bg-indigo-600 font-black shadow-lg" onClick={salvarTodasNotas} disabled={isSavingAll}>{isSavingAll ? 'Salvando...' : 'Salvar Todas'}</Button>
            <Button variant="outline" className="h-14 w-14 rounded-2xl border-2" onClick={() => setIsBulkOpen(true)}><Copy/></Button>
        </div>

        <PullToRefresh onRefresh={async () => { await refetch() }}>
            <div className="space-y-3 pb-20">
                {filteredAlunos.map(aluno => (
                    <NativeCard key={aluno.id} onClick={() => { setSelectedAluno(aluno); setIsEditOpen(true); }} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 shadow-inner">
                                {notasLocais[aluno.id]?.nota || aluno.nome_completo.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-[15px] truncate">{aluno.nome_completo}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{notasLocais[aluno.id]?.faltas || 0} faltas</p>
                            </div>
                        </div>
                        <Edit3 className="text-slate-300 h-5 w-5"/>
                    </NativeCard>
                ))}
            </div>
        </PullToRefresh>
      </div>

      <BulkApplySheet 
        isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} selecionados={selecionados.length > 0 ? selecionados : filteredAlunos.map(a => a.id)}
        globalNota={globalNota} setGlobalNota={setGlobalNota}
        globalFaltas={globalFaltas} setGlobalFaltas={setGlobalFaltas}
        globalObs={globalObs} setGlobalObs={setGlobalObs} onAplicar={aplicarMassa}
      />

      <FilterSheet 
        isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)}
        turmas={turmas} disciplinas={disciplinas} todosAlunos={todosAlunos}
        turmaId={turmaId} setTurmaId={setTurmaId}
        alunoId={alunoId} setAlunoId={setAlunoId}
        disciplinaNome={disciplinaNome} setDisciplinaNome={setDisciplinaNome}
        bimestre={bimestre} setBimestre={setBimestre}
        anoLetivo={anoLetivo} isLoadingAlunos={isLoadingAlunos}
      />

      <EditSheet 
        isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}
        aluno={selectedAluno} notaInicial={selectedAluno ? notasLocais[selectedAluno.id] : null}
        onSave={handleSaveNota} isSaving={isSaving}
      />
    </div>
  )
}

function BulkApplySheet({ isOpen, onClose, selecionados, globalNota, setGlobalNota, globalFaltas, setGlobalFaltas, globalObs, setGlobalObs, onAplicar }: any) {
    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Lançar em Lote" size="half">
            <div className="p-4 space-y-6">
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100"><p className="font-black text-indigo-600">Alunos: {selecionados.length}</p></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><Label>Nota</Label><Input value={globalNota} onChange={e => setGlobalNota(e.target.value)} className="h-14 rounded-xl"/></div>
                    <div className="space-y-1"><Label>Faltas</Label><Input value={globalFaltas} onChange={e => setGlobalFaltas(e.target.value)} className="h-14 rounded-xl"/></div>
                </div>
                <Button className="w-full h-14 rounded-2xl bg-indigo-600 font-black" onClick={onAplicar}>Aplicar em Lote</Button>
            </div>
        </BottomSheet>
    )
}

function FilterSheet({ isOpen, onClose, turmas, disciplinas, todosAlunos, turmaId, setTurmaId, alunoId, setAlunoId, disciplinaNome, setDisciplinaNome, bimestre, setBimestre, anoLetivo, isLoadingAlunos }: any) {
    const [activeTab, setActiveTab] = useState<'turma'|'aluno'|'materia'|'periodo'>('turma')
    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Filtros" size="full">
            <div className="flex flex-col h-full p-4">
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6">
                    {['turma','aluno','materia','periodo'].map((t: any) => (
                        <button key={t} onClick={() => setActiveTab(t)} className={cn("flex-1 h-10 rounded-lg text-[10px] font-black uppercase", activeTab === t ? "bg-white text-indigo-600 shadow" : "text-slate-400")}>
                            {t}
                        </button>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto space-y-3">
                    {activeTab === 'turma' && turmas?.map((t: any) => (
                        <button key={t.id} onClick={() => { setTurmaId(t.id); setAlunoId('all'); setActiveTab('aluno'); }} className={cn("w-full p-6 h-20 rounded-2xl border-2 text-left font-black text-base", turmaId === t.id ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-slate-50")}>
                            {t.nome}
                        </button>
                    ))}
                    {activeTab === 'aluno' && (
                        <>
                            <button onClick={() => { setAlunoId('all'); setActiveTab('materia'); }} className={cn("w-full p-6 h-20 rounded-2xl border-2 text-left font-black text-base", alunoId === 'all' ? "border-indigo-600 bg-indigo-50" : "border-slate-50")}>Todos Alunos</button>
                            {todosAlunos?.map((a: any) => (
                                <button key={a.id} onClick={() => { setAlunoId(a.id); setActiveTab('materia'); }} className={cn("w-full p-6 h-20 rounded-2xl border-2 text-left font-black text-base", alunoId === a.id ? "border-indigo-600 bg-indigo-50" : "border-slate-50")}>
                                    {a.nome_completo}
                                </button>
                            ))}
                        </>
                    )}
                    {activeTab === 'materia' && disciplinas?.map((d: any) => (
                        <button key={d.id} onClick={() => { setDisciplinaNome(d.nome); setActiveTab('periodo'); }} className={cn("w-full p-6 h-20 rounded-2xl border-2 text-left font-black text-base uppercase italic", disciplinaNome === d.nome ? "border-indigo-600 bg-indigo-50" : "border-slate-50")}>
                            {d.nome}
                        </button>
                    ))}
                    {activeTab === 'periodo' && (
                        <div className="grid grid-cols-2 gap-3">
                            {['1','2','3','4'].map(b => (
                                <button key={b} onClick={() => setBimestre(b)} className={cn("h-32 rounded-3xl border-2 font-black text-4xl", bimestre === b ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-slate-50 text-slate-300")}>
                                    {b}º
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <Button className="w-full h-15 rounded-2xl bg-indigo-600 font-black mt-6" onClick={onClose}>Confirmar Filtros</Button>
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
        }
    }, [isOpen, notaInicial])

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Diário do Aluno" size="half">
            <div className="p-4 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                    <div className="h-14 w-14 rounded-xl bg-white flex items-center justify-center font-black text-xl shadow-sm">{aluno?.nome_completo.charAt(0)}</div>
                    <p className="font-black text-lg truncate">{aluno?.nome_completo}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><Label>Nota</Label><Input value={nota} onChange={e => setNota(e.target.value)} className="h-16 rounded-2xl text-center font-black text-xl text-indigo-600"/></div>
                    <div className="space-y-1"><Label>Faltas</Label><Input value={faltas} onChange={e => setFaltas(e.target.value)} className="h-16 rounded-2xl text-center font-black text-xl"/></div>
                </div>
                <div className="space-y-1"><Label>Obs</Label><Input value={observacoes} onChange={e => setObservacoes(e.target.value)} className="h-16 rounded-2xl"/></div>
                <Button className="w-full h-15 rounded-2xl bg-indigo-600 font-black shadow-lg" onClick={() => onSave(aluno.id, { nota, faltas, observacoes })} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Nota'}</Button>
            </div>
        </BottomSheet>
    )
}
