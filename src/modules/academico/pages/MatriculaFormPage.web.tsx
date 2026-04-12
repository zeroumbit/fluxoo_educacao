import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Check,
  Loader2,
  User,
  GraduationCap,
  Calendar,
  Clock,
  CreditCard,
  Building2,
  ChevronRight,
  Search,
  X
} from 'lucide-react'
import { useAuth } from '@/modules/auth/AuthContext'
import {
  useMatriculas,
  useCriarMatricula,
  useMatriculaAtivaDoAluno,
  useAtualizarMatricula
} from '../hooks'
import { useAlunos } from '@/modules/alunos/hooks'
import { useTurmas } from '@/modules/turmas/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

const matriculaSchema = z.object({
  tipo: z.enum(['nova', 'rematricula']),
  alunos_ids: z.array(z.string()).min(1, 'Selecione pelo menos um aluno'),
  ano_letivo: z.coerce.number().min(2024),
  serie_ano: z.string().min(1, 'Série/Turma é obrigatória'),
  turma_id: z.string().optional(),
  turno: z.enum(['manhã', 'tarde', 'noite', 'integral (manhã e tarde)']),
  data_matricula: z.string().min(1),
  valor_matricula: z.coerce.number().min(0).optional(),
  status: z.string().optional(),
})

type MatriculaFormData = z.infer<typeof matriculaSchema>

export function MatriculaFormPageWeb() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const { authUser } = useAuth()
  const { data: matriculas } = useMatriculas()
  const { data: alunos } = useAlunos()
  const { data: turmas } = useTurmas()
  const criar = useCriarMatricula()
  const atualizar = useAtualizarMatricula()

  const form = useForm<MatriculaFormData>({
    resolver: zodResolver(matriculaSchema) as any,
    defaultValues: {
      tipo: 'nova',
      data_matricula: new Date().toISOString().split('T')[0],
      ano_letivo: new Date().getFullYear(),
      alunos_ids: [],
      serie_ano: '',
      turno: 'manhã',
      valor_matricula: undefined,
      status: 'ativa'
    }
  })

  useEffect(() => {
    if (editId && matriculas) {
      const m = (matriculas as any[]).find(x => x.id === editId)
      if (m) {
        form.reset({
          tipo: m.tipo,
          alunos_ids: [m.aluno_id],
          ano_letivo: m.ano_letivo,
          serie_ano: m.serie_ano,
          turma_id: m.turma_id,
          turno: m.turno,
          data_matricula: m.data_matricula,
          valor_matricula: m.valor_matricula,
          status: m.status
        })
      }
    }
  }, [editId, matriculas, form])

  const alunosSelecionados = useWatch({ control: form.control, name: 'alunos_ids' }) || []
  const tipoSelecionado = useWatch({ control: form.control, name: 'tipo' })
  const serieSelecionada = useWatch({ control: form.control, name: 'serie_ano' })
  const anoLetivoSelecionado = useWatch({ control: form.control, name: 'ano_letivo' })
  const { data: matriculaExistente } = useMatriculaAtivaDoAluno(alunosSelecionados[0])

  // Filtragem inteligente de alunos
  const alunosFiltrados = alunos?.filter((aluno: any) => {
    if (editId) return true
    
    const jaMatriculadoNoAno = matriculas?.some((m: any) => 
      m.aluno_id === aluno.id && 
      m.status === 'ativa' && 
      Number(m.ano_letivo) === Number(anoLetivoSelecionado)
    )

    if (tipoSelecionado === 'nova') {
      return !jaMatriculadoNoAno
    }
    
    if (tipoSelecionado === 'rematricula') {
      return !jaMatriculadoNoAno
    }

    return true
  })

  useEffect(() => {
    if (matriculaExistente && (tipoSelecionado as string) === 'rematricula' && !editId) {
      form.setValue('serie_ano', matriculaExistente.serie_ano)
      form.setValue('turno', matriculaExistente.turno)
      form.setValue('valor_matricula', matriculaExistente.valor_matricula)
      form.setValue('ano_letivo', new Date().getFullYear() + 1)
    }
  }, [matriculaExistente, tipoSelecionado, form, editId])

  const onSubmit = async (data: any) => {
    if (!authUser) return
    try {
      const alunosIds = data.alunos_ids || []
      if (editId) {
        const payload = { ...data, aluno_id: alunosIds[0] }
        delete payload.alunos_ids
        await atualizar.mutateAsync({ id: editId, data: payload })
        toast.success('Matrícula atualizada!')
      } else {
        const promises = alunosIds.map((id: string) => {
          const payload = { ...data, aluno_id: id, tenant_id: authUser.tenantId }
          delete payload.alunos_ids
          return criar.mutateAsync(payload)
        })
        await Promise.all(promises)
        toast.success(alunosIds.length > 1 ? `${alunosIds.length} Matrículas realizadas!` : 'Matrícula realizada!')
      }
      navigate('/matriculas')
    } catch (err: any) {
      console.error('Erro ao salvar matrícula:', err)
      toast.error('Erro ao salvar matrícula')
    }
  }

  const [popoverOpen, setPopoverOpen] = useState(false)

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/matriculas')} className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft size={16} /> Voltar para listagem
        </Button>
      </div>

      <Card className="border-0 shadow-md overflow-hidden bg-white">
        <CardHeader className="pt-[30px] px-8">
          <CardTitle className="text-xl font-bold text-slate-900">{editId ? 'Editar Matrícula' : 'Nova Matrícula'}</CardTitle>
          <CardDescription className="text-sm text-slate-500">Preencha os dados acadêmicos do aluno para finalizar o processo.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Tipo de Operação *</Label>
              <RadioGroup
                onValueChange={(v) => form.setValue('tipo', v as any)}
                className="flex gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 w-fit"
                value={form.getValues('tipo')}
                disabled={!!editId}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nova" id="nova" />
                  <Label htmlFor="nova" className="cursor-pointer font-medium text-slate-700">Nova Matrícula</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rematricula" id="rematricula" />
                  <Label htmlFor="rematricula" className="cursor-pointer font-medium text-slate-700">Rematrícula</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alunos_ids">Alunos *</Label>
              {editId ? (
                <div className="p-3 border rounded-md bg-slate-50 text-sm font-medium">
                  {alunosFiltrados?.find(a => a.id === alunosSelecionados[0])?.nome_completo || 'Aluno não encontrado'}
                </div>
              ) : (
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between font-normal min-h-[40px] h-auto text-left flex-wrap gap-1 py-2">
                      {alunosSelecionados.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {alunosSelecionados.map(id => {
                            const aluno = alunosFiltrados?.find(a => a.id === id)
                            return (
                              <Badge key={id} variant="secondary" className="mr-1">
                                {aluno?.nome_completo}
                                <X 
                                  className="ml-1 h-3 w-3 cursor-pointer" 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    form.setValue('alunos_ids', alunosSelecionados.filter(v => v !== id))
                                  }} 
                                />
                              </Badge>
                            )
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Selecione um ou mais alunos</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 z-[150]" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                    <Command className="w-full">
                      <CommandInput placeholder="Buscar aluno..." />
                      <CommandEmpty>Nenhum aluno encontrado.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {(alunosFiltrados || []).map((a: any) => (
                            <CommandItem
                              key={a.id}
                              value={a.nome_completo}
                              onSelect={() => {
                                const current = form.getValues('alunos_ids') || []
                                if (current.includes(a.id)) {
                                  form.setValue('alunos_ids', current.filter(id => id !== a.id))
                                } else {
                                  form.setValue('alunos_ids', [...current, a.id])
                                }
                              }}
                            >
                              <Checkbox 
                                checked={alunosSelecionados.includes(a.id)}
                                className="mr-2"
                              />
                              {a.nome_completo}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ano_letivo">Ano Letivo *</Label>
                <Input id="ano_letivo" type="number" {...form.register('ano_letivo')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serie_ano">Turma/Ano *</Label>
                <Select value={form.watch('serie_ano') || undefined} onValueChange={(v) => {
                  form.setValue('serie_ano', v)
                  const t = (turmas as any[])?.find(x => x.nome === v)
                  if (t) {
                    form.setValue('turma_id', t.id)
                    if (t.turno) {
                      form.setValue('turno', t.turno)
                    }

                    // Valor da matrícula vem automaticamente da mensalidade da turma
                    if (t.valor_mensalidade) {
                      form.setValue('valor_matricula', t.valor_mensalidade)
                      toast.info(`Valor da matrícula definido como R$ ${t.valor_mensalidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, {
                        description: `Baseado na mensalidade da turma ${t.nome}`
                      })
                    } else {
                      form.setValue('valor_matricula', 0)
                      toast.warning('A turma não possui valor de mensalidade definido. Preencha o valor da matrícula manualmente.', {
                        description: 'Configure o valor em Turmas > Editar'
                      })
                    }
                    
                    // Alerta de Capacidade
                    const matriculados = (t.alunos_ids || []).length
                    if (t.capacidade_maxima && matriculados >= t.capacidade_maxima) {
                      toast.warning(`A turma ${t.nome} atingiu a capacidade máxima (${t.capacidade_maxima}).`, {
                        description: 'Você pode matricular os alunos, mas o sistema emitirá um alerta no banco.'
                      })
                    }
                  }
                }}>
                  <SelectTrigger id="serie_ano">
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent className="z-[150]">
                    {(turmas || []).map((t: any) => {
                      const isFull = t.capacidade_maxima && (t.alunos_ids?.length || 0) >= t.capacidade_maxima;
                      return (
                        <SelectItem key={t.id} value={t.nome} className="font-medium">
                          <div className="flex items-center justify-between w-full gap-4">
                            <span>{t.nome} {t.valor_mensalidade ? `- R$ ${t.valor_mensalidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}</span>
                            {t.capacidade_maxima && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${isFull ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                                {t.alunos_ids?.length || 0}/{t.capacidade_maxima}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="turno">Turno *</Label>
                <Select value={form.watch('turno') || undefined} onValueChange={(v) => form.setValue('turno', v as any)}>
                  <SelectTrigger id="turno">
                    <SelectValue placeholder="Turno" />
                  </SelectTrigger>
                  <SelectContent className="z-[150]">
                    <SelectItem value="manhã">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                    <SelectItem value="noite">Noite</SelectItem>
                    <SelectItem value="integral (manhã e tarde)">Integral (Manhã e Tarde)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_matricula">Data da Matrícula</Label>
                <Input id="data_matricula" type="date" {...form.register('data_matricula')} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor_matricula">Valor da Matrícula (R$)</Label>
                <Input id="valor_matricula" type="number" step="0.01" {...form.register('valor_matricula')} className="font-bold" />
              </div>
              {editId && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={form.watch('status') || undefined} onValueChange={(v) => form.setValue('status', v)}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[150]">
                      <SelectItem value="ativa">Ativa</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/matriculas')} className="h-12 px-8 rounded-xl font-bold">Cancelar</Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="h-12 px-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white transition-all">
                {form.formState.isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                ) : (
                  <><Check className="mr-2 h-4 w-4" /> {editId ? 'Salvar Alterações' : 'Finalizar Matrícula'}</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
