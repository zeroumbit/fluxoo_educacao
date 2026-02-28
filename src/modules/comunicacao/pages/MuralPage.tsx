import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '@/modules/auth/AuthContext'
import { useAvisos, useCriarAviso, useExcluirAviso } from '../hooks'
import { useTurmas } from '@/modules/turmas/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2, Megaphone, Trash2 } from 'lucide-react'

const avisoSchema = z.object({
  titulo: z.string().min(3, 'Título é obrigatório'),
  conteudo: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres'),
  turma_id: z.string().optional(),
})

type AvisoFormValues = z.infer<typeof avisoSchema>

export function MuralPage() {
  const { authUser } = useAuth()
  const { data: avisos, isLoading } = useAvisos()
  const { data: turmas } = useTurmas()
  const criarAviso = useCriarAviso()
  const excluirAviso = useExcluirAviso()
  const [dialogOpen, setDialogOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AvisoFormValues>({
    resolver: zodResolver(avisoSchema),
  })

  const onSubmit = async (data: AvisoFormValues) => {
    if (!authUser) return
    try {
      await criarAviso.mutateAsync({
        tenant_id: authUser.tenantId,
        titulo: data.titulo,
        conteudo: data.conteudo,
        turma_id: data.turma_id && data.turma_id !== 'todos' ? data.turma_id : null,
      })
      toast.success('Aviso publicado!')
      reset()
      setDialogOpen(false)
    } catch {
      toast.error('Erro ao publicar aviso')
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Excluir este aviso?')) return
    try {
      await excluirAviso.mutateAsync(id)
      toast.success('Aviso excluído!')
    } catch {
      toast.error('Erro ao excluir aviso')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mural de Avisos</h1>
          <p className="text-muted-foreground">Publique avisos para a comunidade escolar</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              Novo Aviso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publicar Aviso</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input id="titulo" placeholder="Título do aviso" {...register('titulo')} />
                {errors.titulo && (
                  <p className="text-sm text-destructive">{errors.titulo.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="conteudo">Conteúdo *</Label>
                <Textarea
                  id="conteudo"
                  placeholder="Escreva o conteúdo do aviso..."
                  rows={5}
                  {...register('conteudo')}
                />
                {errors.conteudo && (
                  <p className="text-sm text-destructive">{errors.conteudo.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Público</Label>
                <Select onValueChange={(v) => setValue('turma_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {turmas?.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publicar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {avisos?.map((aviso) => (
          <Card key={aviso.id} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center shrink-0">
                    <Megaphone className="h-6 w-6 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{aviso.titulo}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {(aviso as Record<string, unknown>).turmas
                          ? ((aviso as Record<string, unknown>).turmas as { nome: string }).nome
                          : 'Todos'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {aviso.conteudo}
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">
                      {format(new Date(aviso.criado_em), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleExcluir(aviso.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!avisos || avisos.length === 0) && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p>Nenhum aviso publicado.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
