import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useEventos, useCriarEvento, useConfigRecados, useUpsertConfigRecados } from '../hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Loader2, Calendar, MessageSquare, Pencil, Trash2, AlertTriangle } from 'lucide-react'

const eventoSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  data_inicio: z.string().min(1),
  data_termino: z.string().optional(),
  publico_alvo: z.string().optional(),
  descricao: z.string().optional(),
})

export function EventosPage() {
  const { authUser } = useAuth()
  const { data: eventos, isLoading } = useEventos()
  const criar = useCriarEvento()
  const { data: configRecados } = useConfigRecados()
  const upsertConfig = useUpsertConfigRecados()
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [horarioInicio, setHorarioInicio] = useState(configRecados?.horario_inicio || '08:00')
  const [horarioTermino, setHorarioTermino] = useState(configRecados?.horario_termino || '17:00')
  const [msgFora, setMsgFora] = useState(configRecados?.mensagem_fora_expediente || '')
  const form = useForm({ resolver: zodResolver(eventoSchema) })

  const abrirNovo = () => {
    setEditando(null)
    form.reset({ nome: '', data_inicio: '', data_termino: '', publico_alvo: '', descricao: '' })
    setOpen(true)
  }

  const abrirEdicao = (evento: any) => {
    setEditando(evento)
    form.reset({
      nome: evento.nome,
      data_inicio: evento.data_inicio,
      data_termino: evento.data_termino || '',
      publico_alvo: evento.publico_alvo || '',
      descricao: evento.descricao || '',
    })
    setOpen(true)
  }

  const onSubmit = async (data: any) => {
    if (!authUser) return
    try {
      await criar.mutateAsync({ ...data, tenant_id: authUser.tenantId })
      toast.success(editando ? 'Evento atualizado!' : 'Evento criado!')
      setOpen(false)
    } catch { 
      toast.error('Erro ao salvar evento') 
    }
  }

  const salvarConfigRecados = async () => {
    if (!authUser) return
    try {
      await upsertConfig.mutateAsync({ tenant_id: authUser.tenantId, horario_inicio: horarioInicio, horario_termino: horarioTermino, mensagem_fora_expediente: msgFora })
      toast.success('Configuração salva!')
    } catch { toast.error('Erro ao salvar') }
  }

  const publicoLabel = (publico: string) => {
    const labels: Record<string, string> = {
      toda_escola: 'Toda Escola',
      professores: 'Professores',
      responsaveis: 'Responsáveis',
      alunos: 'Alunos',
    }
    return labels[publico] || publico
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda Digital</h1>
          <p className="text-muted-foreground">Gerencie eventos e configurações de recados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={abrirNovo} className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[800px]">
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Evento *</Label>
                <Input id="nome" placeholder="Ex: Festa Junina" {...form.register('nome')} />
                {form.formState.errors.nome && <p className="text-sm text-destructive">{form.formState.errors.nome.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Data de Início *</Label>
                  <Input id="data_inicio" type="date" {...form.register('data_inicio')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_termino">Data de Término</Label>
                  <Input id="data_termino" type="date" {...form.register('data_termino')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="publico_alvo">Público-Alvo</Label>
                <Select defaultValue={form.watch('publico_alvo')} onValueChange={(v) => form.setValue('publico_alvo', v)}>
                  <SelectTrigger id="publico_alvo" className="w-full">
                    <SelectValue placeholder="Selecione o público-alvo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="toda_escola">Toda a Escola</SelectItem>
                    <SelectItem value="professores">Professores</SelectItem>
                    <SelectItem value="responsaveis">Responsáveis</SelectItem>
                    <SelectItem value="alunos">Alunos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea id="descricao" {...form.register('descricao')} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Seção de Eventos */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold">Eventos</h2>
        </div>
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Público</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventos?.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-bold">{e.nome}</TableCell>
                    <TableCell className="text-sm">
                      {e.data_inicio}
                      {e.data_termino && <span className="text-muted-foreground"> até {e.data_termino}</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{publicoLabel(e.publico_alvo) || '—'}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate text-muted-foreground">
                      {e.descricao || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEdicao(e)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!eventos || eventos.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                      Nenhum evento cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Configuração de Recados */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold">Configuração de Recados</h2>
        </div>
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="max-w-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horario_inicio">Horário de Início</Label>
                  <Input id="horario_inicio" type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horario_termino">Horário de Término</Label>
                  <Input id="horario_termino" type="time" value={horarioTermino} onChange={(e) => setHorarioTermino(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="msg_fora">Mensagem Fora do Expediente</Label>
                <Textarea 
                  id="msg_fora" 
                  value={msgFora} 
                  onChange={(e) => setMsgFora(e.target.value)} 
                  placeholder="Mensagem enviada automaticamente fora do horário..."
                  rows={4}
                />
              </div>
              <Button 
                onClick={salvarConfigRecados} 
                disabled={upsertConfig.isPending}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
              >
                {upsertConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar Configuração
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
