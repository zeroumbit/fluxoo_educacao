import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { 
  Plus, 
  ArrowLeft,
  LayoutGrid
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTurmaStore } from '../store'
import { TurmaCard } from '../components/TurmaCard'
import { TurmaDetail } from '../components/TurmaDetail'
import { useTurmas, useCriarTurma } from '../hooks'
import { useAlunos } from '@/modules/alunos/hooks'
import { useFuncionarios } from '@/modules/funcionarios/hooks'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

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

  // Hooks Reais (React Query)
  const { data: dbTurmas, isLoading: loadingTurmas } = useTurmas()
  const { data: dbAlunos, isLoading: loadingAlunos } = useAlunos()
  const { data: dbFuncionarios } = useFuncionarios()
  const criarTurmaMutation = useCriarTurma()

  // Sincronização com a Store
  useEffect(() => {
    if (dbTurmas) setTurmas(dbTurmas as any)
  }, [dbTurmas, setTurmas])

  useEffect(() => {
    if (dbAlunos) setAlunos(dbAlunos as any)
  }, [dbAlunos, setAlunos])

  useEffect(() => {
    // Filtra funcionários que são professores (conforme regra do usuário)
    if (dbFuncionarios) {
      const professores = dbFuncionarios
        .filter((f: any) => f.areas_acesso?.includes('Pedagógico') || f.funcao?.toLowerCase().includes('professor'))
        .map((f: any) => ({
          id: f.id,
          nome: f.nome_completo,
          especialidades: [],
          carga_horaria_maxima: 40,
          ativo: f.status === 'ativo',
          avatar_url: f.foto_url
        }))
      setProfessores(professores)
    }
  }, [dbFuncionarios, setProfessores])

  // Mock de disciplinas (já que não há módulo específico ainda)
  useEffect(() => {
    setDisciplinas([
      { id: 'd1', nome: 'Matemática', codigo: 'MAT', carga_horaria_total: 80, cor: '#4f46e5', ativa: true },
      { id: 'd2', nome: 'Português', codigo: 'POR', carga_horaria_total: 80, cor: '#ec4899', ativa: true },
      { id: 'd3', nome: 'Ciências', codigo: 'CIE', carga_horaria_total: 40, cor: '#10b981', ativa: true },
    ])
  }, [setDisciplinas])

  const [view, setView] = useState<'list' | 'detail'>('list')
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dados')

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TurmaFormValues>({
    resolver: zodResolver(turmaSchema),
    defaultValues: {
      turno: 'matutino',
      horario_inicio: '07:30',
      horario_fim: '11:30',
      capacidade: 32,
      valor_mensalidade: 550
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
        tenant_id: (window as any).tenantId || 'tenant-default' // Fallback se não vier do auth
      } as any)
      
      toast.success('Turma criada com sucesso!')
      setIsNewModalOpen(false)
      reset()
    } catch (error) {
      toast.error('Erro ao criar turma')
    }
  }

  const handleGerir = (id: string, tab = 'dados') => {
    setSelectedTurmaId(id)
    setActiveTab(tab)
    setView('detail')
  }

  const selectedTurma = storeTurmas.find(t => t.id === selectedTurmaId)

  if (view === 'detail' && selectedTurma) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setView('list')}
            className="rounded-xl bg-white shadow-sm border border-slate-100 hover:bg-slate-50"
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            {loadingTurmas ? <Loader2 className="h-6 w-6 animate-spin" /> : <LayoutGrid className="h-6 w-6" />}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Turmas</h1>
            <p className="text-slate-500 font-medium">{storeTurmas.length} turmas reais do sistema</p>
          </div>
        </div>

        <Button 
          disabled={loadingTurmas}
          onClick={() => {
            reset()
            setIsNewModalOpen(true)
          }} 
          className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95 gap-3"
        >
          <Plus className="h-5 w-5" />
          Nova Turma
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {storeTurmas.map((turma) => (
          <TurmaCard 
            key={turma.id} 
            turma={turma} 
            alunosCount={storeAlunos.filter(a => a.turma_id === turma.id).length}
            onViewAlunos={() => handleGerir(turma.id, 'alunos')}
            onViewGrade={() => handleGerir(turma.id, 'grade')}
            onManage={() => handleGerir(turma.id, 'dados')}
          />
        ))}
      </div>

      {storeTurmas.length === 0 && !loadingTurmas && (
        <div className="py-20 text-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
          <LayoutGrid className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-600">Nenhuma turma encontrada</h3>
          <p className="text-slate-400">Comece criando sua primeira turma acadêmica.</p>
        </div>
      )}

      {/* Modal Nova Turma */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="max-w-[500px] p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Nova Turma</DialogTitle>
              <p className="text-slate-500 font-medium italic mt-1">Cadastramento rápido para abertura de turma</p>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome da Turma</label>
                <Input 
                  {...register('nome')}
                  placeholder="Ex: 5º Ano A" 
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 border-2 font-bold px-5"
                />
                {errors.nome && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide ml-1">{errors.nome.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Turno</label>
                <Select defaultValue="matutino" onValueChange={(v: any) => setValue('turno', v)}>
                  <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 border-2 font-bold px-5">
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-xl font-bold">
                    <SelectItem value="matutino">Matutino</SelectItem>
                    <SelectItem value="vespertino">Vespertino</SelectItem>
                    <SelectItem value="noturno">Noturno</SelectItem>
                    <SelectItem value="integral">Integral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Início</label>
                  <Input 
                    type="time" 
                    {...register('horario_inicio')}
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 border-2 font-bold px-5"
                  />
                  {errors.horario_inicio && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide ml-1">{errors.horario_inicio.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Término</label>
                  <Input 
                    type="time" 
                    {...register('horario_fim')}
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 border-2 font-bold px-5"
                  />
                  {errors.horario_fim && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide ml-1">{errors.horario_fim.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Capacidade</label>
                  <Input 
                    type="number" 
                    {...register('capacidade')}
                    placeholder="32"
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 border-2 font-bold px-5"
                  />
                  {errors.capacidade && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide ml-1">{errors.capacidade.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Valor Mensalidade</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    {...register('valor_mensalidade')}
                    placeholder="550,00"
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 border-2 font-bold px-5"
                  />
                  {errors.valor_mensalidade && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide ml-1">{errors.valor_mensalidade.message}</p>}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsNewModalOpen(false)}
                  className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={criarTurmaMutation.isPending}
                  className="flex-1 h-14 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-100"
                >
                  {criarTurmaMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Criar Turma'}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
