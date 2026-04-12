import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Plus,
  ArrowLeft,
  LayoutGrid,
  Search,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useTurmaStore } from '../store'
import { TurmaDetail } from '../components/TurmaDetail'
import { TurmaCard } from '../components/TurmaCard'
import { useTurmas, useCriarTurma, useDisciplinas, useProfessoresTurma, useAlunosCountByTurmas } from '../hooks'
import { useAuth } from '@/modules/auth/AuthContext'
import { useAlunos } from '@/modules/alunos/hooks'
import { useEffect } from 'react'

const turmaSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  turno: z.enum(['matutino', 'vespertino', 'noturno', 'integral']),
  horario_inicio: z.string().min(5, 'Obrigatório'),
  horario_fim: z.string().min(5, 'Obrigatório'),
  capacidade: z.coerce.number().min(1, 'Capacidade mínima de 1'),
  valor_mensalidade: z.coerce.number().min(0, 'Valor inválido'),
})

type TurmaFormValues = z.infer<typeof turmaSchema>

export function TurmasPageWeb() {
  const {
    turmas: storeTurmas,
    alunos: storeAlunos,
    setTurmas,
    setAlunos,
    setProfessores,
    setDisciplinas
  } = useTurmaStore()
  
  const { authUser } = useAuth()

  const { data: dbTurmas, isLoading: loadingTurmas } = useTurmas()
  const { data: dbAlunos } = useAlunos()
  const { data: dbDisciplinas } = useDisciplinas(authUser!.tenantId)
  const { data: dbProfessores } = useProfessoresTurma()
  const criarTurmaMutation = useCriarTurma()

  // Busca contagem dinâmica de alunos por turma
  const turmaIds = useMemo(() => dbTurmas?.map((t: any) => t.id) || [], [dbTurmas])
  const { data: alunosCountMap } = useAlunosCountByTurmas(turmaIds)

  const [busca, setBusca] = useState('')
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('dados')

  // Sync real data with Zustand store
  useEffect(() => {
    if (dbTurmas) setTurmas(dbTurmas as any)
  }, [dbTurmas, setTurmas])

  useEffect(() => {
    if (dbAlunos) setAlunos(dbAlunos as any)
  }, [dbAlunos, setAlunos])

  useEffect(() => {
    if (dbDisciplinas) setDisciplinas(dbDisciplinas)
  }, [dbDisciplinas, setDisciplinas])

  useEffect(() => {
    if (dbProfessores) setProfessores(dbProfessores)
  }, [dbProfessores, setProfessores])

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TurmaFormValues>({
    resolver: zodResolver(turmaSchema),
    defaultValues: {
      turno: 'matutino',
      horario_inicio: '07:30',
      horario_fim: '11:30',
      capacidade: 32,
      valor_mensalidade: undefined
    }
  })

  const onSubmit = async (data: TurmaFormValues) => {
    try {
      await criarTurmaMutation.mutateAsync({
        nome: data.nome,
        turno: data.turno,
        horario: `${data.horario_inicio} - ${data.horario_fim}`,
        capacidade_maxima: data.capacidade,
        valor_mensalidade: data.valor_mensalidade,
        status: 'ativa',
        tenant_id: authUser?.tenantId
      } as any)

      toast.success('Turma criada com sucesso!')
      setIsNewModalOpen(false)
      reset()
    } catch (error) {
      console.error('Erro na criação de turma:', error)
      toast.error('Erro ao criar turma')
    }
  }

  const handleGerir = (id: string, tab = 'dados') => {
    setSelectedTurmaId(id)
    setActiveTab(tab)
    setView('detail')
  }

  const selectedTurma = storeTurmas.find(t => t.id === selectedTurmaId)

  const turmasFiltradas = storeTurmas.filter((turma: any) =>
    turma.nome.toLowerCase().includes(busca.toLowerCase())
  )

  if (view === 'detail' && selectedTurma) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView('list')}
            className="h-10 w-10 rounded-lg bg-white shadow-sm border border-slate-100 hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{selectedTurma.nome}</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gerenciamento Acadêmico</p>
          </div>
        </div>

        <TurmaDetail
          turmaId={selectedTurma.id}
          initialTab={activeTab}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 px-6">
      {/* Título da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            {loadingTurmas ? <Loader2 className="h-6 w-6 animate-spin" /> : <LayoutGrid className="h-6 w-6" />}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Turmas</h1>
            <p className="text-slate-500 font-medium text-sm">{storeTurmas.length} turmas cadastradas</p>
          </div>
        </div>

        {!authUser?.isProfessor && (
          <Button
            disabled={loadingTurmas}
            onClick={() => {
              reset()
              setIsNewModalOpen(true)
            }}
            className="h-11 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm gap-2"
          >
            <Plus className="h-5 w-5" />
            Nova Turma
          </Button>
        )}
      </div>

      {/* Busca */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar turma..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10 h-11 rounded-lg border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 font-medium"
        />
      </div>

      {/* Grid de Cards de Turmas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loadingTurmas ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-300" />
            <p className="text-slate-400 font-bold mt-3 text-sm">Carregando turmas...</p>
          </div>
        ) : turmasFiltradas.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-lg border border-slate-100">
            <LayoutGrid className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <h3 className="text-base font-bold text-slate-600">Nenhuma turma encontrada</h3>
            <p className="text-slate-400 text-sm mt-1">Comece criando sua primeira turma acadêmica.</p>
          </div>
        ) : (
          turmasFiltradas.map((turma: any) => (
            <TurmaCard
              key={turma.id}
              turma={turma}
              alunosCount={alunosCountMap?.[turma.id] || 0}
              onViewAlunos={() => handleGerir(turma.id, 'alunos')}
              onViewGrade={() => handleGerir(turma.id, 'grade')}
              onManage={() => handleGerir(turma.id, 'dados')}
            />
          ))
        )}
      </div>

      {/* Modal Nova Turma */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="max-w-[500px] rounded-lg border-0 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Nova Turma</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nome da Turma</label>
              <Input
                {...register('nome')}
                placeholder="Ex: 5º Ano A"
                className="h-11 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              {errors.nome && <p className="text-[10px] font-bold text-red-500">{errors.nome.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Turno</label>
              <Select value={watch('turno')} onValueChange={(v: any) => setValue('turno', v)}>
                <SelectTrigger className="h-11 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium">
                  <SelectValue placeholder="Selecione o turno" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-slate-200 shadow-lg font-medium">
                  <SelectItem value="matutino">Matutino</SelectItem>
                  <SelectItem value="vespertino">Vespertino</SelectItem>
                  <SelectItem value="noturno">Noturno</SelectItem>
                  <SelectItem value="integral">Integral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Horário Início</label>
                <Input
                  type="time"
                  {...register('horario_inicio')}
                  className="h-11 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                {errors.horario_inicio && <p className="text-[10px] font-bold text-red-500">{errors.horario_inicio.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Horário Término</label>
                <Input
                  type="time"
                  {...register('horario_fim')}
                  className="h-11 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                {errors.horario_fim && <p className="text-[10px] font-bold text-red-500">{errors.horario_fim.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Capacidade</label>
                <Input
                  type="number"
                  {...register('capacidade')}
                  placeholder="32"
                  className="h-11 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                {errors.capacidade && <p className="text-[10px] font-bold text-red-500">{errors.capacidade.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Valor Mensalidade</label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('valor_mensalidade')}
                  placeholder="550,00"
                  className="h-11 rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                {errors.valor_mensalidade && <p className="text-[10px] font-bold text-red-500">{errors.valor_mensalidade.message}</p>}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsNewModalOpen(false)}
                className="flex-1 h-11 rounded-lg font-bold text-slate-400 hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={criarTurmaMutation.isPending}
                className="flex-1 h-11 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
              >
                {criarTurmaMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Criar Turma'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
