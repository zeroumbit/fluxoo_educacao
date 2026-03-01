import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useTurmas, useCriarTurma, useAtualizarTurma, useExcluirTurma } from '../hooks'
import { useFiliais } from '@/modules/filiais/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Loader2, BookOpen, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import type { Turma } from '@/lib/database.types'

const turmaSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  turno: z.string().min(1, 'Turno é obrigatório'),
  sala: z.string().optional().or(z.literal('')),
  capacidade_maxima: z.coerce.number().min(1, 'Capacidade mínima de 1'),
  filial_id: z.string().optional().or(z.literal('')),
})

type TurmaFormValues = z.infer<typeof turmaSchema>

export function TurmasPage() {
  const { authUser } = useAuth()
  const { data: turmas, isLoading, error, refetch } = useTurmas()
  const { data: filiais } = useFiliais()
  const criarTurma = useCriarTurma()
  const atualizarTurma = useAtualizarTurma()
  const excluirTurma = useExcluirTurma()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Turma | null>(null)
  const [excluirDialogOpen, setExcluirDialogOpen] = useState(false)
  const [turmaParaExcluir, setTurmaParaExcluir] = useState<string | null>(null)

  // Logs de debug
  console.log('🔍 [TurmasPage] Renderizou')
  console.log('🔍 [TurmasPage] authUser:', authUser)
  console.log('🔍 [TurmasPage] turmas:', turmas)
  console.log('🔍 [TurmasPage] isLoading:', isLoading)
  console.log('🔍 [TurmasPage] error:', error)
  console.log('🔍 [TurmasPage] tenantId:', authUser?.tenantId)

  useEffect(() => {
    console.log('🔍 [TurmasPage] useEffect - turmas mudou:', turmas)
    console.log('🔍 [TurmasPage] useEffect - length:', turmas?.length)
  }, [turmas])

  useEffect(() => {
    console.log('🔍 [TurmasPage] useEffect - authUser mudou:', authUser)
    console.log('🔍 [TurmasPage] useEffect - tenantId:', authUser?.tenantId)
  }, [authUser])

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<TurmaFormValues>({
    resolver: zodResolver(turmaSchema),
  })

  const abrirNovo = () => {
    setEditando(null)
    reset({ nome: '', turno: '', sala: '', capacidade_maxima: 30, filial_id: '' })
    setDialogOpen(true)
  }

  const abrirEdicao = (turma: Turma) => {
    setEditando(turma)
    reset({ nome: turma.nome, turno: turma.turno || '', sala: turma.sala || '', capacidade_maxima: turma.capacidade_maxima || 30, filial_id: turma.filial_id || '' })
    setDialogOpen(true)
  }

  const onSubmit = async (data: TurmaFormValues) => {
    if (!authUser) return
    try {
      const payload = {
        nome: data.nome,
        turno: data.turno,
        sala: data.sala || null,
        capacidade_maxima: data.capacidade_maxima ? Number(data.capacidade_maxima) : null,
        filial_id: data.filial_id && data.filial_id !== '' ? data.filial_id : null,
      }

      if (editando) {
        await atualizarTurma.mutateAsync({ id: editando.id, turma: payload })
        toast.success('Turma atualizada!')
      } else {
        await criarTurma.mutateAsync({ ...payload, tenant_id: authUser.tenantId })
        toast.success('Turma criada!')
      }
      setDialogOpen(false)
    } catch (error: any) {
      console.error('Erro ao salvar turma:', error)
      toast.error(error.message || 'Erro ao salvar turma')
    }
  }

  const handleExcluir = async (id: string) => {
    setTurmaParaExcluir(id)
    setExcluirDialogOpen(true)
  }

  const confirmarExclusao = async () => {
    if (!turmaParaExcluir) return
    try {
      await excluirTurma.mutateAsync(turmaParaExcluir)
      toast.success('Turma excluída!')
      setExcluirDialogOpen(false)
      setTurmaParaExcluir(null)
    } catch {
      toast.error('Erro ao excluir.')
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
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
            <Button onClick={abrirNovo} className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[800px]">
            <DialogHeader><DialogTitle>{editando ? 'Editar Turma' : 'Nova Turma'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" placeholder="Ex: 1º Ano A" {...register('nome')} />
                {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="turno">Turno *</Label>
                  <Select defaultValue={editando?.turno || ''} onValueChange={(v) => setValue('turno', v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o turno" /></SelectTrigger>
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
                  <Label htmlFor="sala">Sala</Label>
                  <Input id="sala" placeholder="Ex: Sala 3" {...register('sala')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacidade_maxima">Capacidade Máxima</Label>
                  <Input id="capacidade_maxima" type="number" placeholder="30" {...register('capacidade_maxima')} />
                  {errors.capacidade_maxima && <p className="text-sm text-destructive">{errors.capacidade_maxima.message}</p>}
                </div>
                {filiais && filiais.length > 0 && (
                  <div className="space-y-2">
                    <Label>Filial</Label>
                    <Select defaultValue={editando?.filial_id || ''} onValueChange={(v) => setValue('filial_id', v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Selecione a filial" /></SelectTrigger>
                      <SelectContent>
                        {(filiais as any[]).map((f) => (
                          <SelectItem key={f.id} value={f.id}>{f.nome_unidade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter className="sm:justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}</Button>
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
              Esta ação não pode ser desfeita. A turma será permanentemente removida do sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExcluirDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarExclusao}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(turmas as any[])?.map((turma) => (
          <Card key={turma.id} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 group">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center group-hover:from-indigo-200 group-hover:to-blue-200 transition-colors">
                    <BookOpen className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{turma.nome}</h3>
                    <div className="flex gap-1 mt-0.5">
                      {turma.turno && <Badge variant="secondary" className="text-xs capitalize">{turma.turno}</Badge>}
                      {turma.sala && <Badge variant="outline" className="text-xs">{turma.sala}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEdicao(turma)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleExcluir(turma.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Capacidade: <span className="font-medium text-foreground">{turma.capacidade_maxima || '—'} alunos</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(() => {
        console.log('🔍 [TurmasPage] Verificando lista vazia:', { turmas, isEmpty: !turmas || turmas.length === 0 })
        return null
      })()}

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
