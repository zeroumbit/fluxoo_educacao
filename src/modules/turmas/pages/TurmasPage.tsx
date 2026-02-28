import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useTurmas, useCriarTurma, useAtualizarTurma, useExcluirTurma } from '../hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Plus, Loader2, BookOpen, Pencil, Trash2 } from 'lucide-react'
import type { Turma } from '../types'

const turmaSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  turno: z.string().min(1, 'Turno é obrigatório'),
  capacidade: z.coerce.number().min(1, 'Capacidade mínima de 1'),
})

type TurmaFormValues = z.infer<typeof turmaSchema>

export function TurmasPage() {
  const { authUser } = useAuth()
  const { data: turmas, isLoading } = useTurmas()
  const criarTurma = useCriarTurma()
  const atualizarTurma = useAtualizarTurma()
  const excluirTurma = useExcluirTurma()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Turma | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TurmaFormValues>({
    resolver: zodResolver(turmaSchema),
  })

  const abrirNovo = () => {
    setEditando(null)
    reset({ nome: '', turno: '', capacidade: 30 })
    setDialogOpen(true)
  }

  const abrirEdicao = (turma: Turma) => {
    setEditando(turma)
    reset({
      nome: turma.nome,
      turno: turma.turno,
      capacidade: turma.capacidade,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data: TurmaFormValues) => {
    if (!authUser) return
    try {
      if (editando) {
        await atualizarTurma.mutateAsync({
          id: editando.id,
          turma: data,
        })
        toast.success('Turma atualizada!')
      } else {
        await criarTurma.mutateAsync({
          ...data,
          tenant_id: authUser.tenantId,
        })
        toast.success('Turma criada!')
      }
      setDialogOpen(false)
    } catch {
      toast.error('Erro ao salvar turma')
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Deseja excluir esta turma?')) return
    try {
      await excluirTurma.mutateAsync(id)
      toast.success('Turma excluída!')
    } catch {
      toast.error('Erro ao excluir. Verifique se não há alunos vinculados.')
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
          <h1 className="text-2xl font-bold tracking-tight">Turmas</h1>
          <p className="text-muted-foreground">Gerencie as turmas da escola</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={abrirNovo}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar Turma' : 'Nova Turma'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" placeholder="Ex: 1º Ano A" {...register('nome')} />
                {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="turno">Turno *</Label>
                <Select
                  defaultValue={editando?.turno}
                  onValueChange={(v) => setValue('turno', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matutino">Matutino</SelectItem>
                    <SelectItem value="vespertino">Vespertino</SelectItem>
                    <SelectItem value="noturno">Noturno</SelectItem>
                    <SelectItem value="integral">Integral</SelectItem>
                  </SelectContent>
                </Select>
                {errors.turno && <p className="text-sm text-destructive">{errors.turno.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacidade">Capacidade</Label>
                <Input id="capacidade" type="number" {...register('capacidade')} />
                {errors.capacidade && (
                  <p className="text-sm text-destructive">{errors.capacidade.message}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {turmas?.map((turma) => (
          <Card key={turma.id} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 group">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center group-hover:from-indigo-200 group-hover:to-blue-200 transition-colors">
                    <BookOpen className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{turma.nome}</h3>
                    <Badge variant="secondary" className="text-xs capitalize mt-0.5">
                      {turma.turno}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEdicao(turma)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleExcluir(turma.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Capacidade: <span className="font-medium text-foreground">{turma.capacidade} alunos</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!turmas || turmas.length === 0) && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p>Nenhuma turma cadastrada.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
