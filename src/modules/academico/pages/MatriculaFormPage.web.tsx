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
  ChevronRight
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

const matriculaSchema = z.object({
  tipo: z.enum(['nova', 'rematricula']),
  aluno_id: z.string().min(1, 'Selecione um aluno'),
  ano_letivo: z.coerce.number().min(2024),
  serie_ano: z.string().min(1, 'Série é obrigatória'),
  turma_id: z.string().optional(),
  turno: z.enum(['manha', 'tarde', 'integral', 'noturno']),
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
      aluno_id: '',
      serie_ano: '',
      turno: 'integral',
      valor_matricula: 450,
      status: 'ativa'
    }
  })

  useEffect(() => {
    if (editId && matriculas) {
      const m = (matriculas as any[]).find(x => x.id === editId)
      if (m) {
        form.reset({
          tipo: m.tipo,
          aluno_id: m.aluno_id,
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

  const alunoIdSelecionado = useWatch({ control: form.control, name: 'aluno_id' })
  const tipoSelecionado = useWatch({ control: form.control, name: 'tipo' })
  const serieSelecionada = useWatch({ control: form.control, name: 'serie_ano' })
  const anoLetivoSelecionado = useWatch({ control: form.control, name: 'ano_letivo' })
  const { data: matriculaExistente } = useMatriculaAtivaDoAluno(alunoIdSelecionado)

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
      if (editId) {
        await atualizar.mutateAsync({ id: editId, data })
        toast.success('Matrícula atualizada!')
      } else {
        const result = await criar.mutateAsync({ ...data, tenant_id: authUser.tenantId })
        toast.success('Matrícula realizada!')
      }
      navigate('/matriculas')
    } catch (err: any) {
      console.error('Erro ao salvar matrícula:', err)
      toast.error('Erro ao salvar matrícula')
    }
  }

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
              <Label htmlFor="aluno_id">Aluno *</Label>
              <Select disabled={!!editId} value={form.getValues('aluno_id')} onValueChange={(v) => form.setValue('aluno_id', v)}>
                <SelectTrigger id="aluno_id">
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {alunosFiltrados?.map((a: any) => (
                    <SelectItem key={a.id} value={a.id} className="font-medium">{a.nome_completo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ano_letivo">Ano Letivo *</Label>
                <Input id="ano_letivo" type="number" {...form.register('ano_letivo')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serie_ano">Turma/Ano *</Label>
                <Select value={form.getValues('serie_ano')} onValueChange={(v) => {
                  form.setValue('serie_ano', v)
                  const t = (turmas as any[])?.find(x => x.nome === v)
                  if (t) {
                    form.setValue('turma_id', t.id)
                    // Atualizar automaticamente o valor da mensalidade baseado na turma
                    if (t.valor_mensalidade) {
                      form.setValue('valor_matricula', t.valor_mensalidade)
                      toast.info(`Mensalidade atualizada para R$ ${t.valor_mensalidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, {
                        description: `Valor baseado na turma ${t.nome}`
                      })
                    }
                  }
                }}>
                  <SelectTrigger id="serie_ano">
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {(turmas as any[])?.map((t: any) => (
                      <SelectItem key={t.id} value={t.nome} className="font-medium">{t.nome} {t.valor_mensalidade ? `- R$ ${t.valor_mensalidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="turno">Turno *</Label>
                <Select value={form.getValues('turno')} onValueChange={(v) => form.setValue('turno', v as any)}>
                  <SelectTrigger id="turno">
                    <SelectValue placeholder="Turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manha">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                    <SelectItem value="integral">Integral</SelectItem>
                    <SelectItem value="noturno">Noturno</SelectItem>
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
                  <Select value={form.getValues('status')} onValueChange={(v) => form.setValue('status', v)}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
