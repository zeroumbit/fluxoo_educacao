import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Filter,
  CheckCircle2,
  User,
  ArrowLeft,
  Search,
  ChevronRight,
  Lock,
  Plus
} from 'lucide-react'
import { useAuth } from '@/modules/auth/AuthContext'
import { useTurmas } from '@/modules/turmas/hooks'
import {
  useAvaliacoesByTurmaDisciplina,
  useNotasPorAvaliacao,
  useSalvarNotasEmLote,
  useStatusFechamento,
  useDisciplinasPorTurma,
} from '../hooks/hooks.v2'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useFaltasTurmaPorPeriodo } from '@/modules/frequencia/hooks'

const PERIODOS_BIMESTRE: Record<string, { inicio: string, fim: string }> = {
  '1': { inicio: '2024-02-01', fim: '2024-04-30' },
  '2': { inicio: '2024-05-01', fim: '2024-06-30' },
  '3': { inicio: '2024-08-01', fim: '2024-09-30' },
  '4': { inicio: '2024-10-01', fim: '2024-12-20' },
}

// Componentes Mobile conforme MOBILE_FIRST_RULES.md
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'

export function NotasPageMobile() {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  
  // Filtros
  const [turmaId, setTurmaId] = useState<string>('')
  const [disciplinaId, setDisciplinaId] = useState<string>('')
  const [bimestre, setBimestre] = useState<string>('1')
  const [avaliacaoId, setAvaliacaoId] = useState<string>('')
  const [search, setSearch] = useState('')
  
  // UI States
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedAluno, setSelectedAluno] = useState<any>(null)
  
  // Hooks V2
  const { data: turmas } = useTurmas()
  const { data: disciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasPorTurma(turmaId)
  const { data: avaliacoes } = useAvaliacoesByTurmaDisciplina(turmaId, disciplinaId, Number(bimestre))
  const { data: notasExistentes, refetch: refetchNotas } = useNotasPorAvaliacao(avaliacaoId)
  const { data: fechamento } = useStatusFechamento(turmaId, Number(bimestre))
  const { mutateAsync: salvarLote, isPending: isSaving } = useSalvarNotasEmLote()

  // Faltas Automáticas
  const periodoAtual = PERIODOS_BIMESTRE[bimestre] || PERIODOS_BIMESTRE['1']
  const { data: faltasAgrupadas } = useFaltasTurmaPorPeriodo(
    turmaId, 
    periodoAtual.inicio, 
    periodoAtual.fim
  )

  // Estado Local de Notas
  const [notasLocais, setNotasLocais] = useState<Record<string, { nota: string; ausente: boolean }>>({})
  const isBimestreFechado = (fechamento as any)?.status === 'fechado' || (fechamento as any)?.status === 'conselho'

  useEffect(() => {
    if (notasExistentes) {
      const mapa: Record<string, { nota: string; ausente: boolean }> = {}
      notasExistentes.forEach(n => {
        mapa[n.aluno_id] = {
          nota: n.nota?.toString() || '',
          ausente: n.ausente
        }
      })
      setNotasLocais(mapa)
    } else {
      setNotasLocais({})
    }
  }, [notasExistentes])

  // Alunos da Turma
  const { data: todosAlunos } = useQuery({
    queryKey: ['alunos_turma_mobile', turmaId],
    queryFn: async () => {
      if (!turmaId) return []
      const { data: tInfo } = await supabase.from('turmas').select('nome, tenant_id').eq('id', turmaId).single()
      const { data: mat } = await supabase.from('matriculas').select('aluno_id, serie_ano, turma_id').eq('tenant_id', tInfo!.tenant_id!)
      const filtrados = (mat || []).filter(m => m.turma_id === turmaId || (m.serie_ano === tInfo!.nome))
      const ids = filtrados.map(m => m.aluno_id).filter((id): id is string => !!id)
      if (ids.length === 0) return []
      const { data: al } = await supabase.from('alunos').select('id, nome_completo').in('id', ids).order('nome_completo')
      return al || []
    },
    enabled: !!turmaId
  })

  const handleSaveNota = async (id: string, nota: string, ausente: boolean) => {
    if (isBimestreFechado) return
    const novasNotas = { ...notasLocais, [id]: { nota, ausente } }
    setNotasLocais(novasNotas)
    
    // Auto-save opcional ou botão global? Vamos usar botão global para performance em mobile
  }

  const handleSaveBatch = async () => {
    if (!avaliacaoId || isBimestreFechado) return
    try {
      const payload = Object.entries(notasLocais).map(([aluno_id, d]) => ({
        aluno_id,
        nota: d.ausente ? null : parseFloat(d.nota.replace(',', '.')),
        ausente: d.ausente
      }))
      await salvarLote({ tenantId: authUser!.tenantId, avaliacaoId, notas: payload })
      toast.success('Notas salvas!')
      refetchNotas()
      setIsEditOpen(false)
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    }
  }

  const filteredAlunos = (todosAlunos || []).filter(a => a.nome_completo.toLowerCase().includes(search.toLowerCase()))

  // View de Seleção de Filtros (Empty State)
  if (!turmaId || !disciplinaId) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 pt-20 text-center">
        <div className="h-24 w-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
          <BookOpen className="h-12 w-12 text-indigo-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Diário de classe</h2>
        <p className="text-slate-500 mb-10">Selecione os filtros para começar o lançamento das notas.</p>
        <Button onClick={() => setIsFilterOpen(true)} className="w-full h-16 rounded-2xl bg-indigo-600 font-black text-lg shadow-xl shadow-indigo-100">
          Configurar Filtros
        </Button>
        
        <FilterSheet 
          isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)}
          turmas={turmas} disciplinas={disciplinas}
          turmaId={turmaId} setTurmaId={setTurmaId}
          disciplinaId={disciplinaId} setDisciplinaId={setDisciplinaId}
          bimestre={bimestre} setBimestre={setBimestre}
          isLoadingDisc={isLoadingDisciplinas}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-40">
      {/* Header Fixo */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-100 dark:border-slate-800 px-4 pt-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 bg-slate-100 rounded-xl"><ArrowLeft size={20}/></button>
            <div className="min-w-0">
              <h1 className="font-black text-sm truncate">{turmas?.find(t => t.id === turmaId)?.nome}</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{bimestre}º Bimestre</p>
            </div>
          </div>
          <Button onClick={() => setIsFilterOpen(true)} size="sm" variant="ghost" className="rounded-xl border border-slate-200">
            <Filter size={16} className="text-indigo-600 mr-2" /> Filtros
          </Button>
        </div>

        {/* Seletor de Avaliação (Horizontal Scroll) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {avaliacoes?.length === 0 ? (
            <div className="text-[10px] font-bold text-amber-500 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 flex items-center gap-2">
              <Lock size={12}/> Nenhuma avaliação criada para este bimestre.
            </div>
          ) : (
            avaliacoes?.map(av => (
              <button
                key={av.id}
                onClick={() => setAvaliacaoId(av.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all border",
                  avaliacaoId === av.id 
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" 
                    : "bg-white border-slate-100 text-slate-500"
                )}
              >
                {av.titulo} ({av.peso}x)
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {isBimestreFechado && (
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-3 mb-2">
            <Lock className="text-red-500" size={20} />
            <div>
              <p className="text-xs font-black text-red-600 leading-none">Bimestre Fechado</p>
              <p className="text-[10px] text-red-400 mt-1">Lançamento bloqueado por segurança.</p>
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
          <Input 
            placeholder="Buscar aluno..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="h-14 pl-11 rounded-2xl bg-white border-slate-100 shadow-sm"
          />
        </div>

        <PullToRefresh onRefresh={async () => { await refetchNotas() }}>
          <div className="space-y-3">
            {filteredAlunos.map(aluno => (
              <NativeCard 
                key={aluno.id} 
                onClick={() => { if (!isBimestreFechado && avaliacaoId) { setSelectedAluno(aluno); setIsEditOpen(true); } }}
                className={cn(
                  "p-4 flex items-center justify-between transition-opacity",
                  !avaliacaoId && "opacity-50"
                )}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner",
                    notasLocais[aluno.id]?.ausente ? "bg-red-50 text-red-400" : "bg-slate-50 text-slate-400"
                  )}>
                    {notasLocais[aluno.id]?.ausente ? 'F' : (notasLocais[aluno.id]?.nota || aluno.nome_completo.charAt(0))}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm truncate">{aluno.nome_completo}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {notasLocais[aluno.id]?.nota ? (
                        <Badge variant="outline" className="h-5 text-[9px] border-emerald-100 text-emerald-600 bg-emerald-50">Nota Lançada</Badge>
                      ) : (
                        <Badge variant="outline" className="h-5 text-[9px] border-slate-100 text-slate-300">Pendente</Badge>
                      )}

                      {faltasAgrupadas && (faltasAgrupadas as any)[aluno.id] > 0 && (
                        <Badge variant="secondary" className="h-5 text-[9px] bg-red-50 text-red-600 border-red-100 font-black">
                          {(faltasAgrupadas as any)[aluno.id]} {(faltasAgrupadas as any)[aluno.id] === 1 ? 'Falta' : 'Faltas'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </NativeCard>
            ))}
          </div>
        </PullToRefresh>
      </div>

      {/* Footer Fixo: Botão Salvar */}
      {avaliacaoId && !isBimestreFechado && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white dark:from-slate-900 to-transparent z-40">
          <Button 
            onClick={handleSaveBatch} 
            disabled={isSaving}
            className="w-full h-16 rounded-2xl bg-emerald-600 font-black text-lg shadow-xl shadow-emerald-100"
          >
            {isSaving ? 'Gravando no Banco...' : 'Finalizar Lançamento'}
          </Button>
        </div>
      )}

      {/* Sheets */}
      <FilterSheet 
        isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)}
        turmas={turmas} disciplinas={disciplinas}
        turmaId={turmaId} setTurmaId={setTurmaId}
        disciplinaId={disciplinaId} setDisciplinaId={setDisciplinaId}
        bimestre={bimestre} setBimestre={setBimestre}
        isLoadingDisc={isLoadingDisciplinas}
      />

      <EditSheet 
        isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}
        aluno={selectedAluno}
        valorInicial={selectedAluno ? notasLocais[selectedAluno.id] : null}
        onSave={(nota: string, ausente: boolean) => handleSaveNota(selectedAluno.id, nota, ausente)}
      />
    </div>
  )
}

// --------------------------------------------------------------------------
// Sheets Secundários
// --------------------------------------------------------------------------

function FilterSheet({ isOpen, onClose, turmas, disciplinas, turmaId, setTurmaId, disciplinaId, setDisciplinaId, bimestre, setBimestre, isLoadingDisc }: any) {
  const [tab, setTab] = useState<'turma'|'disciplina'|'tempo'>('turma')

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Filtros Diário" size="full">
      <div className="p-4 flex flex-col h-full">
        <div className="flex border-b border-slate-100 mb-6">
          {(['turma', 'disciplina', 'tempo'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 pb-3 text-[10px] font-black uppercase tracking-tighter transition-all",
                tab === t ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-300"
              )}
            >
              {t === 'tempo' ? 'Bimestre' : t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {tab === 'turma' && turmas?.map((t: any) => (
            <button key={t.id} onClick={() => { setTurmaId(t.id); setDisciplinaId(''); setTab('disciplina') }} className={cn("w-full p-5 rounded-2xl text-left font-black transition-all", turmaId === t.id ? "bg-indigo-50 text-indigo-600 border-2 border-indigo-200" : "bg-slate-50 text-slate-500 border-2 border-transparent")}>
              {t.nome}
            </button>
          ))}

          {tab === 'disciplina' && (
            <>
              {isLoadingDisc ? <div className="p-10 text-center text-slate-400">Carregando atribuições...</div> : 
               disciplinas?.length === 0 ? <div className="p-10 text-center font-bold text-amber-600 bg-amber-50 rounded-2xl border border-dashed border-amber-200">NÃO EXISTEM DISCIPLINAS VINCULADAS A ESTA TURMA</div> :
               disciplinas?.map((d: any) => (
                <button key={d.id} onClick={() => { setDisciplinaId(d.id); setTab('tempo') }} className={cn("w-full p-5 rounded-2xl text-left font-black transition-all", disciplinaId === d.id ? "bg-indigo-50 text-indigo-600 border-2 border-indigo-200" : "bg-slate-50 text-slate-500 border-2 border-transparent")}>
                  {d.nome}
                </button>
              ))}
            </>
          )}

          {tab === 'tempo' && (
            <div className="grid grid-cols-2 gap-3">
              {['1','2','3','4'].map(b => (
                <button key={b} onClick={() => setBimestre(b)} className={cn("h-24 rounded-2xl text-2xl font-black transition-all", bimestre === b ? "bg-indigo-50 text-indigo-600 border-2 border-indigo-200" : "bg-slate-50 text-slate-300 border-2 border-transparent")}>
                  {b}º
                </button>
              ))}
            </div>
          )}
        </div>
        
        <Button onClick={onClose} className="mt-6 w-full h-15 rounded-2xl bg-slate-900 font-bold">Confirmar Filtros</Button>
      </div>
    </BottomSheet>
  )
}

function EditSheet({ isOpen, onClose, aluno, valorInicial, onSave }: any) {
  const [nota, setNota] = useState('')
  const [ausente, setAusente] = useState(false)

  useEffect(() => {
    if (isOpen && valorInicial) {
      setNota(valorInicial.nota || '')
      setAusente(valorInicial.ausente || false)
    }
  }, [isOpen, valorInicial])

  const handleDone = () => {
    onSave(nota, ausente)
    onClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Lançar Nota" size="half">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
          <div className="h-14 w-14 bg-white rounded-xl flex items-center justify-center font-black text-xl shadow-sm">{aluno?.nome_completo.charAt(0)}</div>
          <p className="font-black text-lg truncate">{aluno?.nome_completo}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="uppercase text-[10px] font-black text-slate-400">Nota da Avaliação</Label>
            <Input 
              type="number" step="0.5"
              disabled={ausente}
              value={nota} onChange={e => setNota(e.target.value)}
              className="h-16 rounded-2xl text-center text-3xl font-black text-indigo-600 bg-indigo-50/30 border-indigo-100"
              placeholder="0.0"
            />
          </div>

          <label className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 cursor-pointer">
            <Checkbox checked={ausente} onCheckedChange={(v) => { setAusente(!!v); if(v) setNota(''); }} className="h-6 w-6 rounded-lg border-red-200 data-[state=checked]:bg-red-500" />
            <div className="min-w-0">
              <p className="text-sm font-black text-red-600 leading-none">Marcar como Ausente</p>
              <p className="text-[10px] text-red-400 mt-1 uppercase">O aluno não realizou a atividade</p>
            </div>
          </label>
        </div>

        <Button onClick={handleDone} className="w-full h-16 rounded-2xl bg-indigo-600 font-black text-lg shadow-xl shadow-indigo-100">
          Salvar Nota
        </Button>
      </div>
    </BottomSheet>
  )
}
