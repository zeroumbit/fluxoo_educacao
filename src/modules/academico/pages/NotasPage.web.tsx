import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/modules/auth/AuthContext'
import { useTurmas } from '@/modules/turmas/hooks'
import { cn } from '@/lib/utils'
import {
  useAvaliacoesByTurmaDisciplina,
  useCriarAvaliacao,
  useExcluirAvaliacao,
  useNotasPorAvaliacao,
  useSalvarNotasEmLote,
  useStatusFechamento,
  useFecharBimestre,
  useReabrirBimestre,
  useDisciplinasPorTurma,
} from '../hooks/hooks.v2'
import { useFaltasTurmaPorPeriodo } from '@/modules/frequencia/hooks'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  GraduationCap,
  Save,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  LayoutGrid,
  BookOpen,
  Lock,
  Unlock,
  Trash2,
  Award,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { TipoAvaliacao } from '../service.v2'

const TIPOS_AVALIACAO: { value: TipoAvaliacao; label: string }[] = [
  { value: 'prova', label: 'Prova' },
  { value: 'trabalho', label: 'Trabalho' },
  { value: 'simulado', label: 'Simulado' },
  { value: 'participacao', label: 'Participação' },
  { value: 'recuperacao', label: 'Recuperação' },
  { value: 'exame_final', label: 'Exame Final' },
]

const PERIODOS_BIMESTRE: Record<number, { inicio: string; fim: string }> = {
  1: { inicio: '2026-02-01', fim: '2026-04-30' },
  2: { inicio: '2026-05-01', fim: '2026-07-31' },
  3: { inicio: '2026-08-01', fim: '2026-10-31' },
  4: { inicio: '2026-11-01', fim: '2026-12-25' },
}

// --------------------------------------------------------------------------
// Modal de Nova Avaliação
// --------------------------------------------------------------------------
function ModalNovaAvaliacao({
  tenantId,
  turmaId,
  disciplinaId,
  bimestre,
  onClose,
}: {
  tenantId: string
  turmaId: string
  disciplinaId: string
  bimestre: number
  onClose: () => void
}) {
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<TipoAvaliacao>('prova')
  const [peso, setPeso] = useState('1')
  const [dataAplicacao, setDataAplicacao] = useState('')
  const { mutateAsync: criarAvaliacao, isPending } = useCriarAvaliacao()

  const handleSalvar = async () => {
    if (!titulo.trim()) { toast.error('Informe o título da avaliação'); return }
    const pesoNum = parseFloat(peso.replace(',', '.'))
    if (isNaN(pesoNum) || pesoNum <= 0) { toast.error('Peso inválido'); return }
    try {
      await criarAvaliacao({
        tenant_id: tenantId,
        turma_id: turmaId,
        disciplina_id: disciplinaId,
        bimestre,
        tipo,
        titulo: titulo.trim(),
        peso: pesoNum,
        data_aplicacao: dataAplicacao || undefined,
      })
      toast.success('Avaliação criada!')
      onClose()
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">Nova Avaliação</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Título</label>
            <Input
              placeholder="Ex: Prova Bimestral 1"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              className="rounded-xl border-slate-200 h-11"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tipo</label>
              <Select value={tipo} onValueChange={v => setTipo(v as TipoAvaliacao)}>
                <SelectTrigger className="rounded-xl border-slate-200 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_AVALIACAO.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Peso</label>
              <Input
                placeholder="1.0"
                value={peso}
                onChange={e => setPeso(e.target.value)}
                className="rounded-xl border-slate-200 h-11 text-center font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Data de Aplicação</label>
            <Input
              type="date"
              value={dataAplicacao}
              onChange={e => setDataAplicacao(e.target.value)}
              className="rounded-xl border-slate-200 h-11"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 h-11 rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSalvar}
            disabled={isPending}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 font-bold"
          >
            {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Award size={16} />}
            {isPending ? 'Salvando...' : 'Criar Avaliação'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// --------------------------------------------------------------------------
// Painel de lançamento de notas para uma avaliação
// --------------------------------------------------------------------------
function PainelLancamentoNotas({
  avaliacao,
  alunos,
  tenantId,
  onDeleted,
  faltasPorAluno,
}: {
  avaliacao: { id: string; titulo: string; tipo: string; peso: number }
  alunos: { id: string; nome_completo: string }[]
  tenantId: string
  onDeleted: () => void
  faltasPorAluno?: Record<string, number>
}) {
  const { data: notasExistentes } = useNotasPorAvaliacao(avaliacao.id)
  const { mutateAsync: salvarEmLote, isPending: isSaving } = useSalvarNotasEmLote()
  const { mutateAsync: excluirAvaliacao } = useExcluirAvaliacao()
  const { authUser } = useAuth()

  const [notas, setNotas] = useState<Record<string, { nota: string; ausente: boolean }>>({})
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Sincroniza notas existentes com estado local
  useEffect(() => {
    if (!notasExistentes) return
    const map: Record<string, { nota: string; ausente: boolean }> = {}
    notasExistentes.forEach(n => {
      map[n.aluno_id] = { nota: n.nota?.toString() ?? '', ausente: n.ausente }
    })
    setNotas(map)
  }, [notasExistentes])

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault()
      const next = inputRefs.current[index + 1]
      if (next) next.focus()
    }
  }, [])

  const handleSalvar = async () => {
    const payload = alunos.map(aluno => {
      const local = notas[aluno.id]
      const ausente = local?.ausente ?? false
      const notaRaw = local?.nota ?? ''
      const nota = ausente ? null : (notaRaw === '' ? null : parseFloat(notaRaw.replace(',', '.')))
      return { aluno_id: aluno.id, nota, ausente }
    })

    try {
      await salvarEmLote({ tenantId, avaliacaoId: avaliacao.id, notas: payload })
      toast.success(`Notas de "${avaliacao.titulo}" salvas!`)
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + e.message)
    }
  }

  const handleExcluir = async () => {
    if (!confirm(`Excluir a avaliação "${avaliacao.titulo}"? Esta ação não pode ser desfeita.`)) return
    try {
      await excluirAvaliacao(avaliacao.id)
      toast.success('Avaliação excluída')
      onDeleted()
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    }
  }

  const tipoLabel = TIPOS_AVALIACAO.find(t => t.value === avaliacao.tipo)?.label ?? avaliacao.tipo

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header da Avaliação */}
      <div className="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Award size={18} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{avaliacao.titulo}</h3>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {tipoLabel} · Peso {avaliacao.peso}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSalvar}
            disabled={isSaving}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9 px-4 font-bold gap-1"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar
          </Button>
          <button
            onClick={handleExcluir}
            className="p-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Lista de alunos */}
      <div className="divide-y divide-slate-50">
        {alunos.map((aluno, index) => {
          const local = notas[aluno.id] ?? { nota: '', ausente: false }
          return (
            <div
              key={aluno.id}
              className={`flex items-center gap-4 px-5 py-3 transition-colors ${local.ausente ? 'bg-red-50/40' : 'hover:bg-slate-50/50'}`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                {aluno.nome_completo.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">{aluno.nome_completo}</p>
                {faltasPorAluno && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Faltas no bimestre: <span className={cn(faltasPorAluno[aluno.id] > 0 ? "text-red-500" : "text-emerald-500")}>{faltasPorAluno[aluno.id] || 0}</span>
                    </p>
                    <Badge variant="outline" className="h-4 text-[8px] border-emerald-100 text-emerald-600 bg-emerald-50 gap-1 px-1.5 font-black uppercase">
                      <CheckCircle2 size={8}/> Sincronizado
                    </Badge>
                  </div>
                )}
              </div>

              {/* Checkbox ausente */}
              <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={local.ausente}
                  onChange={e =>
                    setNotas(prev => ({ ...prev, [aluno.id]: { ...local, ausente: e.target.checked, nota: '' } }))
                  }
                  className="w-3.5 h-3.5 rounded border-slate-300 text-red-500 focus:ring-red-400"
                />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ausente</span>
              </label>

              {/* Input nota */}
              <Input
                ref={el => { inputRefs.current[index] = el }}
                type="number"
                step="0.5"
                min="0"
                max="10"
                placeholder="—"
                disabled={local.ausente}
                value={local.nota}
                onChange={e =>
                  setNotas(prev => ({ ...prev, [aluno.id]: { ...local, nota: e.target.value } }))
                }
                onKeyDown={e => handleKeyDown(index, e)}
                className="w-20 text-center font-bold text-indigo-700 rounded-xl h-10 border-slate-200 disabled:bg-slate-100 disabled:text-slate-300 shrink-0"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --------------------------------------------------------------------------
// Componente Principal
// --------------------------------------------------------------------------
export function NotasPageWeb() {
  const { authUser } = useAuth()
  const { data: turmas } = useTurmas()
  const location = useLocation()
  const [turmaId, setTurmaId] = useState(() => (location.state as any)?.turmaId || '')
  const { data: disciplinas, isLoading: isLoadingDisc } = useDisciplinasPorTurma(turmaId)
  const [disciplinaId, setDisciplinaId] = useState('')
  const [bimestre, setBimestre] = useState('1')
  const [anoLetivo] = useState(new Date().getFullYear())
  const [showModal, setShowModal] = useState(false)

  // Faltas Automáticas
  const periodo = PERIODOS_BIMESTRE[Number(bimestre)] || PERIODOS_BIMESTRE[1]
  const { data: faltasResumo } = useFaltasTurmaPorPeriodo(turmaId, periodo.inicio, periodo.fim)

  // Alunos da turma
  const { data: todosAlunos } = useQuery({
    queryKey: ['alunos_turma', turmaId],
    queryFn: async (): Promise<{ id: string; nome_completo: string }[]> => {
      if (!turmaId) return []
      try {
        const { data: turmaInfo } = await supabase
          .from('turmas')
          .select('nome, tenant_id')
          .eq('id', turmaId)
          .single()
        if (!turmaInfo) return []

        const { data: matriculas } = await supabase
          .from('matriculas' as any)
          .select('aluno_id, serie_ano, turma_id')
          .eq('tenant_id', turmaInfo.tenant_id!)
          
        const filtradas = (matriculas || []).filter((m: any) => m.turma_id === turmaId)

        const ids = filtradas.map((m: any) => m.aluno_id).filter((id): id is string => !!id)
        if (ids.length === 0) return []

        const { data: alunosData } = await supabase
          .from('alunos')
          .select('id, nome_completo')
          .in('id', ids)
          .order('nome_completo')
        return alunosData || []
      } catch { return [] }
    },
    enabled: !!turmaId,
  })

  const { data: avaliacoes, refetch: refetchAvaliacoes } = useAvaliacoesByTurmaDisciplina(
    turmaId,
    disciplinaId,
    Number(bimestre)
  )

  const { data: fechamento } = useStatusFechamento(turmaId, Number(bimestre))
  const { mutateAsync: fecharBimestre, isPending: isClosing } = useFecharBimestre()
  const { mutateAsync: reabrirBimestre, isPending: isReopening } = useReabrirBimestre()

  const totalNotas = (todosAlunos?.length ?? 0) * (avaliacoes?.length ?? 0)
  const bimFechado = (fechamento as any)?.status === 'fechado' || (fechamento as any)?.status === 'conselho'

  const handleFecharBimestre = async () => {
    if (!confirm(`Fechar o ${bimestre}º bimestre para a turma selecionada? Esta ação impedirá alterações nas notas.`)) return
    try {
      await fecharBimestre({ turmaId, bimestre: Number(bimestre) })
      toast.success(`${bimestre}º bimestre fechado!`)
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    }
  }

  const handleReabrirBimestre = async () => {
    if (!confirm(`Reabrir o ${bimestre}º bimestre? Isso permitirá novas alterações.`)) return
    try {
      await reabrirBimestre({ turmaId, bimestre: Number(bimestre) })
      toast.success(`${bimestre}º bimestre reaberto!`)
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    }
  }

  const telaVazia = !turmaId || !disciplinaId

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Modal */}
      {showModal && turmaId && disciplinaId && (
        <ModalNovaAvaliacao
          tenantId={authUser!.tenantId}
          turmaId={turmaId}
          disciplinaId={disciplinaId}
          bimestre={Number(bimestre)}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Diário de Avaliações</h1>
          <p className="text-muted-foreground text-sm">Lançamento de notas por avaliação · {anoLetivo}</p>
        </div>

        <div className="flex items-center gap-2">
          {turmaId && bimFechado ? (
            <Button
              onClick={handleReabrirBimestre}
              disabled={isReopening}
              variant="outline"
              className="h-10 px-5 rounded-xl font-bold text-amber-600 border-amber-200 hover:bg-amber-50 gap-2"
            >
              <Unlock size={15} />
              Reabrir Bimestre
            </Button>
          ) : turmaId ? (
            <Button
              onClick={handleFecharBimestre}
              disabled={isClosing || !avaliacoes?.length}
              variant="outline"
              className="h-10 px-5 rounded-xl font-bold text-slate-600 border-slate-200 hover:bg-slate-100 gap-2"
            >
              <Lock size={15} />
              Fechar Bimestre
            </Button>
          ) : null}

          <Button
            onClick={() => {
              if (!turmaId || !disciplinaId) { toast.error('Selecione turma e disciplina primeiro'); return }
              if (bimFechado) { toast.error('Bimestre fechado. Reabra para adicionar avaliações.'); return }
              setShowModal(true)
            }}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 h-10 px-6 rounded-xl shadow-md font-bold gap-2"
          >
            <Plus size={16} />
            Nova Avaliação
          </Button>
        </div>
      </div>

      {/* Badge de bimestre fechado */}
      {bimFechado && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 font-medium">
          <Lock size={16} className="shrink-0" />
          {bimestre}º Bimestre fechado — Notas bloqueadas para edição.
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
              <User className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Alunos</p>
              <p className="text-2xl font-bold text-slate-900">{todosAlunos?.length ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Award className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Avaliações</p>
              <p className="text-2xl font-bold text-slate-900">{avaliacoes?.length ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Notas Possíveis</p>
              <p className="text-2xl font-bold text-slate-900">{totalNotas}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border border-indigo-100 bg-indigo-50/30 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <LayoutGrid className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Ciclo</p>
              <p className="text-2xl font-bold text-slate-900">{bimestre}º Bim.</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Turma</label>
              <Select value={turmaId} onValueChange={v => { setTurmaId(v); setDisciplinaId('') }}>
                <SelectTrigger className="w-full bg-white border-slate-200 h-11 rounded-xl">
                  <SelectValue placeholder="Selecionar turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas?.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Disciplina</label>
              <Select value={disciplinaId} onValueChange={setDisciplinaId} disabled={!turmaId || (disciplinas?.length === 0 && !isLoadingDisc)}>
                <SelectTrigger className={cn(
                  "w-full bg-white border-slate-200 h-11 rounded-xl",
                  turmaId && disciplinas?.length === 0 && !isLoadingDisc && "border-amber-200 bg-amber-50"
                )}>
                  <SelectValue placeholder={
                    !turmaId ? 'Aguardando turma...' : 
                    isLoadingDisc ? 'Carregando...' :
                    disciplinas?.length === 0 ? 'NÃO EXISTEM DISCIPLINAS PARA ESSA TURMA' :
                    'Selecionar disciplina'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {disciplinas?.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-xs font-bold text-amber-600">NÃO EXISTEM DISCIPLINAS PARA ESSA TURMA</p>
                      <p className="text-[10px] text-slate-400 mt-1">Vincule disciplinas em Configurações &gt; Turmas</p>
                    </div>
                  ) : (
                    disciplinas?.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bimestre</label>
              <Select value={bimestre} onValueChange={setBimestre}>
                <SelectTrigger className="w-full bg-white border-slate-200 h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1º Bimestre</SelectItem>
                  <SelectItem value="2">2º Bimestre</SelectItem>
                  <SelectItem value="3">3º Bimestre</SelectItem>
                  <SelectItem value="4">4º Bimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ano Letivo</label>
              <div className="flex items-center justify-center h-11 px-4 bg-slate-50 rounded-xl text-slate-500 font-bold border border-slate-200">
                {anoLetivo}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {telaVazia ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-zinc-50 rounded-[28px] flex items-center justify-center text-zinc-200">
                <BookOpen size={40} />
              </div>
              <div className="max-w-xs">
                <h3 className="text-lg font-bold text-zinc-700">Aguardando Seleção</h3>
                <p className="text-zinc-500 text-sm mt-1">Selecione a turma e a disciplina para gerenciar as avaliações do bimestre.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {!avaliacoes?.length ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <Award size={28} className="text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700">Nenhuma avaliação cadastrada</h3>
                    <p className="text-slate-400 text-sm mt-1">Clique em "Nova Avaliação" para começar.</p>
                  </div>
                </div>
              ) : (
                avaliacoes.map(av => (
                  <PainelLancamentoNotas
                    key={av.id}
                    avaliacao={av}
                    alunos={todosAlunos ?? []}
                    tenantId={authUser!.tenantId}
                    onDeleted={() => refetchAvaliacoes()}
                    faltasPorAluno={faltasResumo}
                  />
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dica */}
      <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl flex items-start gap-4">
        <div className="p-3 bg-white rounded-2xl text-indigo-500 shadow-sm shrink-0">
          <CheckCircle2 size={20} />
        </div>
        <div>
          <h4 className="font-bold text-indigo-900 text-sm">Dica de Produtividade</h4>
          <p className="text-sm text-indigo-700/80 leading-relaxed mt-0.5">
            Use <strong>TAB</strong> ou <strong>Enter</strong> para navegar entre notas rapidamente.
            Marque "Ausente" para registrar falta na avaliação e feche o bimestre quando todas as notas estiverem lançadas.
          </p>
        </div>
      </div>
    </div>
  )
}
