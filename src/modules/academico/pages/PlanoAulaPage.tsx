import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { usePlanosAula, useCriarPlanoAula, useAtualizarPlanoAula, useExcluirPlanoAula } from '../hooks'
import { useTurmas } from '@/modules/turmas/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Loader2, BookOpen, Trash2, Calendar, Clock, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const schema = z.object({
  turmas: z.array(z.object({
    turma_id: z.string().min(1, 'Turma obrigatória'),
    turno: z.enum(['manha', 'tarde', 'integral', 'noturno']),
    horario: z.string().optional(),
  })).min(1, 'Vincule ao menos uma turma'),
  disciplina: z.string().min(1, 'Disciplina obrigatória'),
  data_aula: z.string().min(1, 'Data obrigatória'),
  conteudo_previsto: z.string().optional(),
  conteudo_realizado: z.string().optional(),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function PlanoAulaPage() {
  const { authUser } = useAuth()
  const { data: planos, isLoading, refetch } = usePlanosAula()
  const { data: turmas } = useTurmas()
  const criar = useCriarPlanoAula()
  const atualizar = useAtualizarPlanoAula()
  const excluir = useExcluirPlanoAula()

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      data_aula: new Date().toISOString().split('T')[0],
      turmas: [],
      disciplina: '',
      conteudo_previsto: '',
      conteudo_realizado: '',
      observacoes: ''
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "turmas"
  })

  const onSubmit = async (data: FormData) => {
    if (!authUser) {
      toast.error('Usuário não autenticado')
      return
    }

    const payload = { ...data, tenant_id: authUser.tenantId }
    console.log('📝 [PlanoAula] Salvando plano de aula:', payload)

    try {
      if (editingId) {
        console.log('✏️ [PlanoAula] Atualizando plano existente:', editingId)
        await atualizar.mutateAsync({ id: editingId, data: payload })
        toast.success('Plano de aula atualizado com sucesso!')
      } else {
        console.log('➕ [PlanoAula] Criando novo plano')
        await criar.mutateAsync(payload)
        toast.success('Plano de aula registrado com sucesso!')
      }
      handleClose()
      refetch()
    } catch (error: any) {
      console.error('❌ [PlanoAula] Erro ao salvar:', error)
      toast.error(`Erro ao salvar: ${error.message || 'Tente novamente'}`)
    }
  }

  const handleEdit = (plano: any) => {
    console.log('✏️ [PlanoAula] Editando plano:', plano)
    setEditingId(plano.id)
    form.reset({
      disciplina: plano.disciplina,
      data_aula: plano.data_aula,
      conteudo_previsto: plano.conteudo_previsto || '',
      conteudo_realizado: plano.conteudo_realizado || '',
      observacoes: plano.observacoes || '',
      turmas: (plano.planos_aula_turmas || []).map((t: any) => ({
        turma_id: t.turma_id,
        turno: t.turno,
        horario: t.horario || ''
      }))
    })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este plano de aula?')) return

    try {
      console.log('🗑️ [PlanoAula] Excluindo plano:', id)
      await excluir.mutateAsync(id)
      toast.success('Plano de aula excluído com sucesso!')
      refetch()
    } catch (error: any) {
      console.error('❌ [PlanoAula] Erro ao excluir:', error)
      toast.error('Erro ao excluir plano de aula')
    }
  }

  const handleClose = () => {
    setOpen(false)
    setEditingId(null)
    form.reset({
      data_aula: new Date().toISOString().split('T')[0],
      turmas: []
    })
  }

  const formatTurno = (turno: string) => {
    const map: any = { manha: 'Manhã', tarde: 'Tarde', integral: 'Integral', noturno: 'Noturno' }
    return map[turno] || turno
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planos de Aula</h1>
          <p className="text-muted-foreground">Registre e acompanhe os conteúdos ministrados</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md" onClick={() => { setEditingId(null); form.reset(); }}>
              <Plus className="mr-2 h-4 w-4" /> Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[800px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
              <DialogTitle>{editingId ? 'Editar Plano de Aula' : 'Registrar Plano de Aula'}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <form id="plano-aula-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Disciplina *</Label>
                    <Input placeholder="Ex: Matemática" {...form.register('disciplina')} />
                    {form.formState.errors.disciplina && <p className="text-sm text-red-500">{form.formState.errors.disciplina.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Data da Aula *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="date" className="pl-9" {...form.register('data_aula')} />
                    </div>
                    {form.formState.errors.data_aula && <p className="text-sm text-red-500">{form.formState.errors.data_aula.message}</p>}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Turmas e Horários</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => append({ turma_id: '', turno: 'manha', horario: '' })}
                      className="h-8 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    >
                      <Plus className="mr-1 h-3 w-3" /> Vincular Turma
                    </Button>
                  </div>

                  {fields.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg bg-slate-50/50">
                      <p className="text-sm text-muted-foreground">Nenhuma turma vinculada ainda.</p>
                      {form.formState.errors.turmas && <p className="text-xs text-red-500 mt-1">{form.formState.errors.turmas.message}</p>}
                    </div>
                  )}

                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex flex-col md:flex-row gap-3 p-3 bg-slate-50 rounded-lg border relative group animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex-1 space-y-2">
                          <Label className="text-xs text-muted-foreground">Turma</Label>
                          <Select 
                            onValueChange={(v) => form.setValue(`turmas.${index}.turma_id`, v, { shouldValidate: true })} 
                            value={form.watch(`turmas.${index}.turma_id`)}
                          >
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                            <SelectContent>
                              {turmas?.map((t: any) => (
                                <SelectItem key={t.id} value={t.id}>{t.nome} {t.sala ? `- Sala ${t.sala}` : ''}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-full md:w-40 space-y-2">
                          <Label className="text-xs text-muted-foreground">Turno</Label>
                          <Select onValueChange={(v: any) => form.setValue(`turmas.${index}.turno`, v)} value={form.watch(`turmas.${index}.turno`)}>
                            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manha">Manhã</SelectItem>
                              <SelectItem value="tarde">Tarde</SelectItem>
                              <SelectItem value="noturno">Noturno</SelectItem>
                              <SelectItem value="integral">Integral</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-full md:w-32 space-y-2">
                          <Label className="text-xs text-muted-foreground">Horário</Label>
                          <div className="relative">
                            <Clock className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                            <Input placeholder="08:00" className="pl-7 bg-white h-9 text-xs" {...form.register(`turmas.${index}.horario`)} />
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 self-end md:mt-6" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Conteúdo Previsto</Label>
                    <Textarea placeholder="O que será ensinado..." className="min-h-[80px]" {...form.register('conteudo_previsto')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Conteúdo Realizado</Label>
                    <Textarea placeholder="O que foi efetivamente ensinado..." className="min-h-[80px]" {...form.register('conteudo_realizado')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea placeholder="Detalhes adicionais..." className="min-h-[60px]" {...form.register('observacoes')} />
                  </div>
                </div>
              </form>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-slate-50/50">
              <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" form="plano-aula-form" disabled={form.formState.isSubmitting} className="min-w-[100px]">
                {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Plano'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-xl shadow-indigo-500/5 ring-1 ring-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[120px]">Data</TableHead>
                <TableHead>Turma(s) / Turno</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Conteúdo</TableHead>
                <TableHead className="text-right sr-only">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planos?.map((p: any) => (
                <TableRow key={p.id} className="group hover:bg-indigo-50/30 transition-colors">
                  <TableCell className="font-medium text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                      {new Date(p.data_aula).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {(p.planos_aula_turmas || []).map((v: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-indigo-100 rounded-full text-xs font-semibold text-indigo-700 shadow-sm">
                          <span className="truncate max-w-[120px]">{v.turma?.nome || 'Turma'}</span>
                          <span className="h-1 w-1 bg-indigo-300 rounded-full" />
                          <span className="text-indigo-500 font-medium">{formatTurno(v.turno)}</span>
                          {v.horario && <span className="text-[10px] text-indigo-400 bg-indigo-50 px-1 rounded">{v.horario}</span>}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-indigo-50/50 text-indigo-700 border-indigo-100">{p.disciplina}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <div>
                      <p className="text-sm font-medium line-clamp-1 text-slate-700">{p.conteudo_previsto || '—'}</p>
                      {p.conteudo_realizado && <p className="text-[11px] text-emerald-600 font-medium line-clamp-1 mt-0.5">Realizado: {p.conteudo_realizado}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => handleEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!planos || planos.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center"><BookOpen className="h-8 w-8 text-slate-400" /></div>
                      <div>
                        <p className="text-lg font-semibold text-slate-600">Nenhum plano de aula</p>
                        <p className="text-sm">Comece clicando em "Novo Plano de Aula" para registrar.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
