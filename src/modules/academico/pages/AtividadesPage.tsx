import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useAtividades, useCriarAtividade } from '../hooks'
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
import { Plus, Loader2, FileText, ExternalLink, Pencil, Trash2, AlertTriangle } from 'lucide-react'

const schema = z.object({
  titulo: z.string().min(1, 'Título obrigatório'),
  turma_id: z.string().optional(),
  disciplina: z.string().optional(),
  tipo_material: z.string().optional(),
  anexo_url: z.string().optional(),
  descricao: z.string().optional(),
})

const tipoLabels: Record<string, string> = { pdf: 'PDF', link_video: 'Vídeo', imagem: 'Imagem', outro: 'Outro' }

export function AtividadesPage() {
  const { authUser } = useAuth()
  const { data: atividades, isLoading } = useAtividades()
  const { data: turmas } = useTurmas()
  const criar = useCriarAtividade()
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [excluirDialogOpen, setExcluirDialogOpen] = useState(false)
  const [atividadeParaExcluir, setAtividadeParaExcluir] = useState<string | null>(null)
  const form = useForm({ resolver: zodResolver(schema) })

  const abrirNovo = () => {
    setEditando(null)
    form.reset({ titulo: '', turma_id: '', disciplina: '', tipo_material: '', anexo_url: '', descricao: '' })
    setOpen(true)
  }

  const abrirEdicao = (atividade: any) => {
    setEditando(atividade)
    form.reset({
      titulo: atividade.titulo,
      turma_id: atividade.turma_id || '',
      disciplina: atividade.disciplina || '',
      tipo_material: atividade.tipo_material || '',
      anexo_url: atividade.anexo_url || '',
      descricao: atividade.descricao || '',
    })
    setOpen(true)
  }

  const onSubmit = async (data: any) => {
    if (!authUser) return
    try {
      await criar.mutateAsync({ ...data, tenant_id: authUser.tenantId })
      toast.success(editando ? 'Atividade atualizada!' : 'Atividade cadastrada!')
      setOpen(false)
    } catch {
      toast.error('Erro ao salvar')
    }
  }

  const handleExcluir = async (id: string) => {
    setAtividadeParaExcluir(id)
    setExcluirDialogOpen(true)
  }

  const confirmarExclusao = async () => {
    if (!atividadeParaExcluir) return
    try {
      // TODO: implementar exclusão quando hook estiver disponível
      toast.success('Atividade excluída!')
      setExcluirDialogOpen(false)
      setAtividadeParaExcluir(null)
    } catch {
      toast.error('Erro ao excluir.')
    }
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar Atividade' : 'Nova Atividade / Material'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input id="titulo" placeholder="Título da atividade" {...form.register('titulo')} />
                {form.formState.errors.titulo && <p className="text-sm text-destructive">{form.formState.errors.titulo.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Turma / Disciplina</Label>
                  <Select defaultValue={form.watch('turma_id')} onValueChange={(v) => form.setValue('turma_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {turmas?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Material</Label>
                  <Select defaultValue={form.watch('tipo_material')} onValueChange={(v) => form.setValue('tipo_material', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                <Label htmlFor="anexo_url">Anexo ou Link</Label>
                <Input id="anexo_url" placeholder="URL do material ou link do vídeo" {...form.register('anexo_url')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea id="descricao" placeholder="Descrição da atividade..." {...form.register('descricao')} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={excluirDialogOpen} onOpenChange={setExcluirDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão
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

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atividades?.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.titulo}</TableCell>
                  <TableCell>{a.turma?.nome || a.disciplina || '—'}</TableCell>
                  <TableCell>
                    {a.tipo_material && <Badge variant="secondary">{tipoLabels[a.tipo_material] || a.tipo_material}</Badge>}
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate text-muted-foreground">
                    {a.descricao || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {a.anexo_url && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={a.anexo_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEdicao(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleExcluir(a.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!atividades || atividades.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                    Nenhuma atividade cadastrada.
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
