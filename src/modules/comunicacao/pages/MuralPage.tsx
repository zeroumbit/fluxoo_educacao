import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useAvisos, useCriarAviso, useExcluirAviso, useEditarAviso } from '../hooks'
import { isAvisoAtivo } from '../service'
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
import { Plus, Loader2, Megaphone, Trash2, AlertTriangle, Edit2, Clock, CheckCircle2 } from 'lucide-react'
import { format, parseISO, isAfter, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const avisoSchema = z.object({
  titulo: z.string().min(3, 'Título é obrigatório'),
  conteudo: z.string().min(5, 'Conteúdo é obrigatório'),
  publico_alvo: z.string(),
  turma_id: z.string().optional().nullable(),
  data_fim: z.string().optional().nullable(),
})

type AvisoFormValues = z.infer<typeof avisoSchema>

// ---------------------------------------------------------------------------
// Helper de vigência (usada no front para split visual)
// ---------------------------------------------------------------------------
function avisoEstaAtivo(aviso: MuralAviso): boolean {
  if (!aviso.data_fim) return true
  const hoje = startOfDay(new Date())
  const fim = startOfDay(parseISO(aviso.data_fim))
  return isAfter(fim, hoje) || fim.getTime() === hoje.getTime()
}

// ---------------------------------------------------------------------------
// Formulário de aviso (cria e edita)
// ---------------------------------------------------------------------------
interface AvisoFormProps {
  modo: 'criar' | 'editar'
  aviso?: MuralAviso
  turmas?: { id: string; nome: string }[]
  onSubmit: (data: AvisoFormValues) => Promise<void>
  onCancel: () => void
}

function AvisoForm({ modo, aviso, turmas, onSubmit, onCancel }: AvisoFormProps) {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<AvisoFormValues>({
    resolver: zodResolver(avisoSchema),
    defaultValues: {
      titulo: aviso?.titulo ?? '',
      conteudo: aviso?.conteudo ?? '',
      publico_alvo: aviso?.publico_alvo ?? 'todos',
      turma_id: aviso?.turma_id ?? undefined,
      data_fim: aviso?.data_fim ?? '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor={`${modo}-titulo`}>Título *</Label>
        <Input id={`${modo}-titulo`} placeholder="Título do aviso" {...register('titulo')} />
        {errors.titulo && <p className="text-sm text-destructive">{errors.titulo.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${modo}-conteudo`}>Conteúdo *</Label>
        <Textarea id={`${modo}-conteudo`} rows={4} placeholder="Conteúdo do aviso..." {...register('conteudo')} />
        {errors.conteudo && <p className="text-sm text-destructive">{errors.conteudo.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${modo}-publico_alvo`}>Público alvo</Label>
          <Select defaultValue={aviso?.publico_alvo ?? 'todos'} onValueChange={(v) => setValue('publico_alvo', v)}>
            <SelectTrigger id={`${modo}-publico_alvo`} className="w-full">
              <SelectValue placeholder="Selecione o público" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="turma">Turma específica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${modo}-turma_id`}>Turma (opcional)</Label>
          <Select defaultValue={aviso?.turma_id ?? '_all'} onValueChange={(v) => setValue('turma_id', v === '_all' ? null : v)}>
            <SelectTrigger id={`${modo}-turma_id`} className="w-full">
              <SelectValue placeholder="Todas as turmas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todas as turmas</SelectItem>
              {turmas?.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${modo}-data_fim`}>
          Data de encerramento <span className="text-zinc-400 font-normal">(opcional)</span>
        </Label>
        <Input
          id={`${modo}-data_fim`}
          type="date"
          {...register('data_fim')}
        />
        <p className="text-[11px] text-zinc-400">
          Após esta data, o aviso some das dashboards mas permanece visível no histórico de avisos.
        </p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (modo === 'editar' ? 'Salvar alterações' : 'Publicar aviso')}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Card individual de aviso
// ---------------------------------------------------------------------------
interface AvisoCardProps {
  aviso: MuralAviso & { turmas?: { nome: string } | null }
  expirado?: boolean
  onEditar: (aviso: MuralAviso) => void
  onExcluir: (id: string) => void
}

function AvisoCard({ aviso, expirado = false, onEditar, onExcluir }: AvisoCardProps) {
  const turmaNome = (aviso as any).turmas?.nome ?? null

  return (
    <Card className={cn(
      'border shadow-sm transition-all duration-300',
      expirado
        ? 'bg-zinc-50/60 border-zinc-100 opacity-60 hover:opacity-80'
        : 'bg-white border-zinc-100 hover:shadow-md'
    )}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className={cn(
              'h-10 w-10 shrink-0 rounded-xl flex items-center justify-center',
              expirado ? 'bg-zinc-100' : 'bg-gradient-to-br from-indigo-50 to-blue-50'
            )}>
              {expirado
                ? <Clock className="h-5 w-5 text-zinc-400" />
                : <Megaphone className="h-5 w-5 text-indigo-600" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className={cn('font-semibold truncate', expirado ? 'text-zinc-500' : 'text-zinc-900')}>
                  {aviso.titulo}
                </h3>
                <Badge
                  variant="secondary"
                  className={cn('text-[10px] shrink-0', expirado ? 'bg-zinc-100 text-zinc-400' : '')}
                >
                  {turmaNome ?? 'Todos'}
                </Badge>
                {expirado && (
                  <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-200 shrink-0">
                    Expirado
                  </Badge>
                )}
              </div>
              <p className={cn('text-sm line-clamp-2', expirado ? 'text-zinc-400' : 'text-muted-foreground')}>
                {aviso.conteudo}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-zinc-400">
                <span>
                  Publicado em {format(new Date(aviso.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </span>
                {aviso.data_fim && (
                  <span className={cn('flex items-center gap-1', expirado ? 'text-red-400' : 'text-amber-500')}>
                    <Clock className="h-3 w-3" />
                    {expirado ? 'Encerrou em' : 'Encerra em'}{' '}
                    {format(parseISO(aviso.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700" onClick={() => onEditar(aviso)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onExcluir(aviso.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------
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

  const handleCriar = async (data: AvisoFormValues) => {
    if (!authUser) return
    await criarAviso.mutateAsync({
      tenant_id: authUser.tenantId,
      titulo: data.titulo,
      conteudo: data.conteudo,
      publico_alvo: data.publico_alvo,
      turma_id: data.turma_id || null,
      data_agendamento: null,
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: data.data_fim || null,
    })
    toast.success('Aviso publicado!')
    setDialogOpen(false)
  }

  const handleEditar = async (data: AvisoFormValues) => {
    if (!avisoParaEditar) return
    await editarAviso.mutateAsync({
      id: avisoParaEditar.id,
      data: {
        titulo: data.titulo,
        conteudo: data.conteudo,
        publico_alvo: data.publico_alvo,
        turma_id: data.turma_id || null,
        data_fim: data.data_fim || null,
      },
    })
    toast.success('Aviso atualizado!')
    setEditDialogOpen(false)
    setAvisoParaEditar(null)
  }

  const abrirEditar = (aviso: MuralAviso) => {
    setAvisoParaEditar(aviso)
    setEditDialogOpen(true)
  }

  const handleExcluir = (id: string) => {
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

  // Separação de avisos: ativos no topo, expirados embaixo
  const avisosAtivos = (avisos ?? []).filter(a => avisoEstaAtivo(a as MuralAviso))
  const avisosExpirados = (avisos ?? []).filter(a => !avisoEstaAtivo(a as MuralAviso))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
              <DialogDescription>Publique um comunicado para turmas específicas ou toda a escola.</DialogDescription>
            </DialogHeader>
            <AvisoForm
              modo="criar"
              turmas={turmas as any}
              onSubmit={handleCriar}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Editar Aviso</DialogTitle>
            <DialogDescription>Atualize as informações do comunicado.</DialogDescription>
          </DialogHeader>
          {avisoParaEditar && (
            <AvisoForm
              modo="editar"
              aviso={avisoParaEditar}
              turmas={turmas as any}
              onSubmit={handleEditar}
              onCancel={() => { setEditDialogOpen(false); setAvisoParaEditar(null) }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Exclusão */}
      <Dialog open={excluirDialogOpen} onOpenChange={setExcluirDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O aviso será removido permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExcluirDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarExclusao}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lista vazia */}
      {(!avisos || avisos.length === 0) && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p>Nenhum aviso publicado ainda.</p>
          </CardContent>
        </Card>
      )}

      {/* Avisos Ativos */}
      {avisosAtivos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide">
              Ativos ({avisosAtivos.length})
            </h2>
          </div>
          <div className="space-y-3">
            {avisosAtivos.map((aviso) => (
              <AvisoCard
                key={aviso.id}
                aviso={aviso as any}
                onEditar={abrirEditar}
                onExcluir={handleExcluir}
              />
            ))}
          </div>
        </div>
      )}

      {/* Avisos Expirados */}
      {avisosExpirados.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pt-2">
            <Clock className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wide">
              Histórico · Expirados ({avisosExpirados.length})
            </h2>
          </div>
          <div className="space-y-3">
            {avisosExpirados.map((aviso) => (
              <AvisoCard
                key={aviso.id}
                aviso={aviso as any}
                expirado
                onEditar={abrirEditar}
                onExcluir={handleExcluir}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
