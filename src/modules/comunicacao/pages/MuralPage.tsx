import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useAvisos, useCriarAviso, useExcluirAviso, useEditarAviso } from '../hooks'
import type { MuralAviso } from '@/lib/database.types'
import { useTurmas } from '@/modules/turmas/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Loader2, Megaphone, Trash2, AlertTriangle, Edit2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const avisoSchema = z.object({
  titulo: z.string().min(3, 'Título é obrigatório'),
  conteudo: z.string().min(5, 'Conteúdo é obrigatório'),
  publico_alvo: z.string(),
  turma_id: z.string().optional().nullable(),
})

type AvisoFormValues = z.infer<typeof avisoSchema>

export function MuralPage() {
  const { authUser } = useAuth()
  const { data: avisos, isLoading } = useAvisos()
  const { data: turmas } = useTurmas()
  const criarAviso = useCriarAviso()
  const excluirAviso = useExcluirAviso()
  const editarAviso = useEditarAviso()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [excluirDialogOpen, setExcluirDialogOpen] = useState(false)
  const [avisoParaExcluir, setAvisoParaExcluir] = useState<string | null>(null)
  const [avisoParaEditar, setAvisoParaEditar] = useState<MuralAviso | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<AvisoFormValues>({
    resolver: zodResolver(avisoSchema),
    defaultValues: { publico_alvo: 'todos', turma_id: undefined },
  })

  const onSubmit = async (data: AvisoFormValues) => {
    if (!authUser) return
    try {
      if (avisoParaEditar) {
        await editarAviso.mutateAsync({
          id: avisoParaEditar.id,
          data: {
            titulo: data.titulo,
            conteudo: data.conteudo,
            publico_alvo: data.publico_alvo,
            turma_id: data.turma_id,
          },
        })
        toast.success('Aviso atualizado!')
      } else {
        await criarAviso.mutateAsync({
          tenant_id: authUser.tenantId,
          titulo: data.titulo,
          conteudo: data.conteudo,
          publico_alvo: data.publico_alvo,
          turma_id: data.turma_id || null,
          data_agendamento: null,
        })
        toast.success('Aviso publicado!')
      }
      reset()
      setDialogOpen(false)
      setEditDialogOpen(false)
      setAvisoParaEditar(null)
    } catch {
      toast.error('Erro ao salvar')
    }
  }

  const handleEditar = (aviso: MuralAviso) => {
    setAvisoParaEditar(aviso)
    setValue('titulo', aviso.titulo)
    setValue('conteudo', aviso.conteudo)
    setValue('publico_alvo', aviso.publico_alvo || 'todos')
    if (aviso.turma_id) {
      setValue('turma_id', aviso.turma_id)
    }
    setEditDialogOpen(true)
  }

  const handleExcluir = async (id: string) => {
    setAvisoParaExcluir(id)
    setExcluirDialogOpen(true)
  }

  const confirmarExclusao = async () => {
    if (!avisoParaExcluir) return
    try {
      await excluirAviso.mutateAsync(avisoParaExcluir)
      toast.success('Aviso excluído!')
      setExcluirDialogOpen(false)
      setAvisoParaExcluir(null)
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mural de Avisos</h1>
          <p className="text-muted-foreground">Publique avisos para turmas ou toda a escola</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Novo Aviso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Novo Aviso</DialogTitle>
              <DialogDescription>
                Publique um aviso para turmas específicas ou toda a escola.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input 
                  id="titulo" 
                  placeholder="Digite o título do aviso" 
                  {...register('titulo')} 
                />
                {errors.titulo && (
                  <p className="text-sm text-destructive">{errors.titulo.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="conteudo">Conteúdo *</Label>
                <Textarea 
                  id="conteudo" 
                  rows={4} 
                  placeholder="Digite o conteúdo do aviso..." 
                  {...register('conteudo')} 
                />
                {errors.conteudo && (
                  <p className="text-sm text-destructive">{errors.conteudo.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="publico_alvo">Público alvo</Label>
                <Select defaultValue="todos" onValueChange={(v) => setValue('publico_alvo', v)}>
                  <SelectTrigger id="publico_alvo" className="w-full">
                    <SelectValue placeholder="Selecione o público" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="turma">Turma específica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="turma_id">Turma (opcional)</Label>
                <Select onValueChange={(v) => setValue('turma_id', v)}>
                  <SelectTrigger id="turma_id" className="w-full">
                    <SelectValue placeholder="Selecione uma turma (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {turmas?.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publicar'}
                </Button>
              </DialogFooter>
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
              Esta ação não pode ser desfeita. O aviso será permanentemente removido do sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExcluirDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarExclusao}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Editar Aviso</DialogTitle>
            <DialogDescription>
              Atualize as informações do aviso.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-titulo">Título *</Label>
              <Input
                id="edit-titulo"
                placeholder="Digite o título do aviso"
                {...register('titulo')}
              />
              {errors.titulo && (
                <p className="text-sm text-destructive">{errors.titulo.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-conteudo">Conteúdo *</Label>
              <Textarea
                id="edit-conteudo"
                rows={4}
                placeholder="Digite o conteúdo do aviso..."
                {...register('conteudo')}
              />
              {errors.conteudo && (
                <p className="text-sm text-destructive">{errors.conteudo.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-publico_alvo">Público alvo</Label>
              <Select defaultValue="todos" onValueChange={(v) => setValue('publico_alvo', v)}>
                <SelectTrigger id="edit-publico_alvo" className="w-full">
                  <SelectValue placeholder="Selecione o público" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="turma">Turma específica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-turma_id">Turma (opcional)</Label>
              <Select onValueChange={(v) => setValue('turma_id', v)}>
                <SelectTrigger id="edit-turma_id" className="w-full">
                  <SelectValue placeholder="Selecione uma turma (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {turmas?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {avisos?.map((aviso) => (
          <Card key={aviso.id} className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                    <Megaphone className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{aviso.titulo}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {(aviso as Record<string, unknown>).turmas
                          ? ((aviso as Record<string, unknown>).turmas as { nome: string }).nome
                          : 'Todos'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{aviso.conteudo}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(aviso.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleEditar(aviso)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleExcluir(aviso.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!avisos || avisos.length === 0) && (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p>Nenhum aviso publicado ainda.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
