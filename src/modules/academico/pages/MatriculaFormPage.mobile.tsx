import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
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
  useCriarMatricula, 
  useMatriculaAtivaDoAluno,
  useMatricula,
  useAtualizarMatricula 
} from '../hooks'
import { useAlunos } from '@/modules/alunos/hooks'
import { useTurmas } from '@/modules/turmas/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

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

export function MatriculaFormPageMobile() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')
  const { authUser } = useAuth()
  const { data: alunos } = useAlunos()
  const { data: turmas } = useTurmas()
  const { data: mData, isLoading: isLoadingM } = useMatricula(editId)
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
    if (mData) {
      form.reset({
        tipo: mData.tipo,
        aluno_id: mData.aluno_id,
        ano_letivo: mData.ano_letivo,
        serie_ano: mData.serie_ano,
        turma_id: mData.turma_id,
        turno: mData.turno,
        data_matricula: mData.data_matricula,
        valor_matricula: mData.valor_matricula,
        status: mData.status
      })
    }
  }, [mData, form])

  const alunoIdSelecionado = useWatch({ control: form.control, name: 'aluno_id' })
  const tipoSelecionado = useWatch({ control: form.control, name: 'tipo' })
  const serieSelecionada = useWatch({ control: form.control, name: 'serie_ano' })
  const { data: matriculaExistente } = useMatriculaAtivaDoAluno(alunoIdSelecionado)

  useEffect(() => {
    if (matriculaExistente && (tipoSelecionado as string) === 'rematricula' && !editId) {
      form.setValue('serie_ano', matriculaExistente.serie_ano)
      form.setValue('turno', matriculaExistente.turno)
      form.setValue('valor_matricula', matriculaExistente.valor_matricula)
      form.setValue('ano_letivo', new Date().getFullYear() + 1)
    }
  }, [matriculaExistente, tipoSelecionado, form, editId])

  useEffect(() => {
    if (tipoSelecionado === 'nova' && serieSelecionada && turmas && !editId) {
      const turma = (turmas as any[])?.find(t => t.nome === serieSelecionada)
      if (turma) {
        const turnoMap: Record<string, string> = {
          matutino: 'manha', vespertino: 'tarde', integral: 'integral', noturno: 'noturno'
        }
        form.setValue('turno', (turnoMap[turma.turno] || turma.turno) as any)
        form.setValue('turma_id', turma.id)
        if (turma.valor_mensalidade) form.setValue('valor_matricula', turma.valor_mensalidade)
      }
    }
  }, [serieSelecionada, tipoSelecionado, turmas, form, editId])

  const onSubmit = async (data: any) => {
    if (!authUser) return
    try {
      if (editId) {
        await atualizar.mutateAsync({ id: editId, data })
        toast.success('Alterações salvas!')
      } else {
        await criar.mutateAsync({ ...data, tenant_id: authUser.tenantId })
        toast.success('Matrícula realizada!')
      }
      navigate('/matriculas')
    } catch {
      toast.error('Erro ao salvar matrícula')
    }
  }

  if (editId && isLoadingM) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-32">
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="mx-auto w-full max-w-[640px] px-4 py-4 flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/matriculas')} className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
            <ArrowLeft className="h-4 w-4 text-slate-500" />
          </motion.button>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{editId ? 'Editar Matrícula' : 'Nova Matrícula'}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Processo Acadêmico</p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[640px] px-4 pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo de Operação</Label>
            <RadioGroup
              onValueChange={(v) => form.setValue('tipo', v as any)}
              className="grid grid-cols-2 gap-3"
              value={form.getValues('tipo')}
              disabled={!!editId}
            >
              <div className={cn(
                "flex items-center justify-center p-4 rounded-2xl border-2 transition-all",
                form.getValues('tipo') === 'nova' ? "bg-indigo-50 border-indigo-600" : "bg-white border-slate-100"
              )}>
                <RadioGroupItem value="nova" id="nova" className="sr-only" />
                <Label htmlFor="nova" className="cursor-pointer font-black text-sm text-center">NOVA MATRÍCULA</Label>
              </div>
              <div className={cn(
                "flex items-center justify-center p-4 rounded-2xl border-2 transition-all",
                form.getValues('tipo') === 'rematricula' ? "bg-indigo-50 border-indigo-600" : "bg-white border-slate-100"
              )}>
                <RadioGroupItem value="rematricula" id="rematricula" className="sr-only" />
                <Label htmlFor="rematricula" className="cursor-pointer font-black text-sm text-center">REMATRÍCULA</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Aluno *</Label>
            <Select disabled={!!editId} value={form.getValues('aluno_id')} onValueChange={(v) => form.setValue('aluno_id', v)}>
              <SelectTrigger className="h-14 rounded-2xl text-base font-bold bg-white border-slate-100">
                <SelectValue placeholder="Selecione o aluno" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {alunos?.map((a: any) => (
                  <SelectItem key={a.id} value={a.id} className="font-bold py-3">{a.nome_completo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ano Letivo *</Label>
              <Input type="number" {...form.register('ano_letivo')} inputMode="numeric" className="h-14 rounded-2xl text-base font-medium" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Turma/Ano *</Label>
              <Select value={form.getValues('serie_ano')} onValueChange={(v) => form.setValue('serie_ano', v)}>
                <SelectTrigger className="h-14 rounded-2xl text-base font-bold bg-white border-slate-100">
                  <SelectValue placeholder="Série" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {(turmas as any[])?.map((t: any) => (
                    <SelectItem key={t.id} value={t.nome} className="font-bold py-3">{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Turno *</Label>
              <Select value={form.getValues('turno')} onValueChange={(v) => form.setValue('turno', v as any)}>
                <SelectTrigger className="h-14 rounded-2xl text-base font-bold bg-white border-slate-100">
                  <SelectValue placeholder="Turno" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="manha" className="py-3">Manhã</SelectItem>
                  <SelectItem value="tarde" className="py-3">Tarde</SelectItem>
                  <SelectItem value="integral" className="py-3">Integral</SelectItem>
                  <SelectItem value="noturno" className="py-3">Noturno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data Matrícula</Label>
              <Input type="date" {...form.register('data_matricula')} className="h-14 rounded-2xl text-base font-medium" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Valor Matrícula</Label>
              <Input type="number" step="0.01" {...form.register('valor_matricula')} inputMode="decimal" className="h-14 rounded-2xl text-base font-bold" />
            </div>
            {editId && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</Label>
                <Select value={form.getValues('status')} onValueChange={(v) => form.setValue('status', v)}>
                  <SelectTrigger className="h-14 rounded-2xl text-base font-bold bg-white border-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="ativa" className="py-3">Ativa</SelectItem>
                    <SelectItem value="concluida" className="py-3">Concluída</SelectItem>
                    <SelectItem value="cancelada" className="py-3">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 pb-safe">
            <div className="mx-auto w-full max-w-[640px] px-4 py-4 flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/matriculas')} className="flex-1 h-14 rounded-2xl font-bold text-base bg-white border-slate-200">
                Voltar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="flex-1 h-14 rounded-2xl bg-indigo-600 font-bold text-base">
                {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : <><Check className="mr-2 h-4 w-4" /> Salvar</>}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
