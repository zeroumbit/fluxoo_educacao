import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useAtividades, useCriarAtividade, useAtualizarAtividade, useExcluirAtividade } from '../hooks'
import { useTurmas } from '@/modules/turmas/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Loader2, FileText, ExternalLink, Pencil, Trash2, AlertTriangle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const schema = z.object({
  titulo: z.string().min(1, 'Título obrigatório'),
  filial_id: z.string().optional(),
  turmas: z.array(z.object({
    turma_id: z.string().min(1, 'Turma obrigatória'),
    turno: z.enum(['manha', 'tarde', 'integral', 'noturno']).optional(),
    horario: z.string().optional(),
  })).min(1, 'Vincule ao menos uma turma'),
  disciplina: z.string().optional(),
  tipo_material: z.string().optional(),
  anexo_url: z.string().optional(),
  descricao: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const tipoLabels: Record<string, string> = { pdf: 'PDF', link_video: 'Vídeo', imagem: 'Imagem', outro: 'Outro' }

export function AtividadesPage() {
  const { authUser } = useAuth()
  const { data: atividades, isLoading, refetch } = useAtividades()
  const { data: turmas } = useTurmas()
  const criar = useCriarAtividade()
  const atualizar = useAtualizarAtividade()
  const excluir = useExcluirAtividade()

  const [open, setOpen] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [excluirDialogOpen, setExcluirDialogOpen] = useState(false)
  const [atividadeParaExcluir, setAtividadeParaExcluir] = useState<string | null>(null)
  const [filiais, setFiliais] = useState<any[]>([])

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: '',
      turmas: [],
      disciplina: '',
      tipo_material: '',
      anexo_url: '',
      descricao: ''
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "turmas"
  })

  useEffect(() => {
    if (open && authUser?.tenantId) {
      supabase
        .from('filiais')
        .select('*')
        .eq('tenant_id', authUser.tenantId)
        .order('nome_unidade')
        .then(({ data }) => {
          if (data) setFiliais(data)
        })
    }
  }, [open, authUser?.tenantId])

  const abrirNovo = () => {
    setEditandoId(null)
    form.reset({ titulo: '', turmas: [], disciplina: '', tipo_material: '', anexo_url: '', descricao: '' })
    setOpen(true)
  }

  const abrirEdicao = (atividade: any) => {
    console.log('✏️ [Atividades] Editando atividade:', atividade)
    setEditandoId(atividade.id)
    form.reset({
      titulo: atividade.titulo,
      filial_id: atividade.filial_id || undefined,
      disciplina: atividade.disciplina || '',
      tipo_material: atividade.tipo_material || '',
      anexo_url: atividade.anexo_url || '',
      descricao: atividade.descricao || '',
      turmas: (atividade.atividades_turmas || []).map((t: any) => ({
        turma_id: t.turma_id,
        turno: t.turno || undefined,
        horario: t.horario || ''
      }))
    })
    setOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    if (!authUser) return
    const payload = { ...data, tenant_id: authUser.tenantId }
    if (!payload.filial_id) delete payload.filial_id

    try {
      if (editandoId) {
        await atualizar.mutateAsync({ id: editandoId, data: payload })
        toast.success('Atividade atualizada!')
      } else {
        await criar.mutateAsync(payload)
        toast.success('Atividade cadastrada!')
      }
      refetch()
      setOpen(false)
    } catch (error: any) {
      console.error('❌ [Atividades] Erro ao salvar:', error)
      toast.error('Erro ao salvar atividade')
    }
  }

  const handleExcluir = (id: string) => {
    setAtividadeParaExcluir(id)
    setExcluirDialogOpen(true)
  }

  const confirmarExclusao = async () => {
    if (!atividadeParaExcluir) return
    try {
      await excluir.mutateAsync(atividadeParaExcluir)
      toast.success('Atividade excluída!')
      refetch()
      setExcluirDialogOpen(false)
      setAtividadeParaExcluir(null)
    } catch {
      toast.error('Erro ao excluir.')
    }
  }

  const formatTurno = (turno: string) => {
    const map: any = { manha: 'Manhã', tarde: 'Tarde', integral: 'Integral', noturno: 'Noturno' }
    return map[turno] || turno
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Atividades & Materiais</h1>
          <p className="text-muted-foreground">Compartilhe conteúdos e materiais com as turmas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={abrirNovo} className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Nova Atividade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[800px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle className="text-xl">{editandoId ? 'Editar Atividade' : 'Nova Atividade / Material'}</DialogTitle>
              <DialogDescription>
                {editandoId ? 'Atualize as informações da atividade.' : 'Preencha os dados para criar uma nova atividade ou material.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <form id="atividade-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filiais.length > 1 && (
                    <div className="space-y-2">
                      <Label>Unidade</Label>
                      <Select value={form.watch('filial_id')} onValueChange={(v) => form.setValue('filial_id', v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                        <SelectContent>
                          {filiais.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome_unidade}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2 col-span-full">
                    <Label htmlFor="titulo" className="text-sm font-medium">Título *</Label>
                    <Input id="titulo" placeholder="Ex: Lista de exercícios - Capítulo 1" {...form.register('titulo')} />
                    {form.formState.errors.titulo && <p className="text-sm text-destructive">{form.formState.errors.titulo.message}</p>}
                  </div>
                </div>

                {/* Múltiplas Turmas */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Turmas Vinculadas</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ turma_id: '', turno: 'manha', horario: '' })} className="h-8 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
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
                      <div key={field.id} className="flex flex-col md:flex-row gap-3 p-3 bg-slate-50 rounded-lg border relative group">
                        <div className="flex-1 space-y-2">
                          <Label className="text-xs text-muted-foreground">Turma *</Label>
                          <Select value={form.watch(`turmas.${index}.turma_id`)} onValueChange={(v) => form.setValue(`turmas.${index}.turma_id`, v, { shouldValidate: true })}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                            <SelectContent>
                              {turmas?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-full md:w-32 space-y-2">
                          <Label className="text-xs text-muted-foreground">Turno</Label>
                          <Select value={form.watch(`turmas.${index}.turno`)} onValueChange={(v: any) => form.setValue(`turmas.${index}.turno`, v)}>
                            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manha">Manhã</SelectItem>
                              <SelectItem value="tarde">Tarde</SelectItem>
                              <SelectItem value="noturno">Noturno</SelectItem>
                              <SelectItem value="integral">Integral</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-full md:w-24 space-y-2">
                          <Label className="text-xs text-muted-foreground">Horário</Label>
                          <Input placeholder="08:00" className="bg-white h-9 text-xs" {...form.register(`turmas.${index}.horario`)} />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 self-end md:mt-6" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="disciplina" className="text-sm font-medium">Disciplina</Label>
                    <Input id="disciplina" placeholder="Ex: Matemática" {...form.register('disciplina')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo_material" className="text-sm font-medium">Tipo de Material</Label>
                    <Select value={form.watch('tipo_material')} onValueChange={(v) => form.setValue('tipo_material', v)}>
                      <SelectTrigger id="tipo_material" className="w-full">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="link_video">Link de Vídeo</SelectItem>
                        <SelectItem value="imagem">Imagem</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="anexo_url" className="text-sm font-medium">Anexo ou Link</Label>
                  <Input id="anexo_url" type="url" placeholder="https://exemplo.com/material.pdf" {...form.register('anexo_url')} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="descricao" className="text-sm font-medium">Descrição</Label>
                  <Textarea id="descricao" placeholder="Descreva a atividade ou material..." className="min-h-[80px]" {...form.register('descricao')} />
                </div>
              </form>
            </div>
            <DialogFooter className="px-6 py-4 border-t bg-slate-50/50">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" form="atividade-form" disabled={form.formState.isSubmitting} className="min-w-[100px]">
                {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={excluirDialogOpen} onOpenChange={setExcluirDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. A atividade será permanentemente removida do sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExcluirDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarExclusao}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-0 shadow-xl shadow-slate-200/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[30%]">Título</TableHead>
                <TableHead className="w-[30%]">Turma(s) / Turno</TableHead>
                <TableHead className="w-[15%]">Tipo</TableHead>
                <TableHead className="w-[15%]">Disciplina</TableHead>
                <TableHead className="text-right sr-only">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atividades?.map((a: any) => (
                <TableRow key={a.id} className="group hover:bg-slate-50/80 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{a.titulo}</span>
                      {a.descricao && <span className="text-[11px] text-muted-foreground line-clamp-1 font-normal">{a.descricao}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {(a.atividades_turmas || []).map((v: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[10px] font-semibold text-indigo-700">
                          <span>{v.turma?.nome}</span>
                          {v.turno && <><span className="w-1 h-1 bg-indigo-300 rounded-full" /><span>{formatTurno(v.turno)}</span></>}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {a.tipo_material && (
                      <Badge variant="outline" className="font-normal bg-white border-slate-200">
                        {tipoLabels[a.tipo_material] || a.tipo_material}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {a.disciplina || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {a.anexo_url && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" asChild>
                          <a href={a.anexo_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 hover:bg-indigo-50" onClick={() => abrirEdicao(a)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => handleExcluir(a.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!atividades || atividades.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-semibold text-slate-400">Nenhuma atividade cadastrada</p>
                    <p className="text-sm">Clique em "Nova Atividade" para começar.</p>
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
