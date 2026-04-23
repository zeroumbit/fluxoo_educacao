import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useEventos, useCriarEvento, useConfigRecados, useUpsertConfigRecados, useExcluirEvento } from '../hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Loader2, Calendar, MessageSquare, Pencil, Trash2, AlertTriangle, Megaphone, Clock, MapPin, Users, Globe, GraduationCap, User, X, Eye } from 'lucide-react'
import { muralService } from '@/modules/comunicacao/service'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const eventoSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  data_inicio: z.string().refine(
    date => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return new Date(date + 'T00:00:00') >= today
    },
    { message: "Data não pode ser retroativa" }
  ),
  data_termino: z.string().optional(),
  hora_inicio: z.string().optional(),
  hora_fim: z.string().optional(),
  local: z.string().optional(),
  publico_alvo: z.string().optional(),
  descricao: z.string().optional(),
  publicar_no_mural: z.boolean().default(false),
})

export function EventosPage() {
  const { authUser } = useAuth()
  const { data: eventos, isLoading } = useEventos()
  const criar = useCriarEvento()
  const excluir = useExcluirEvento()
  const { data: configRecados } = useConfigRecados()
  const upsertConfig = useUpsertConfigRecados()
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [eventoDeletar, setEventoDeletar] = useState<any | null>(null)
  const [eventoDetalhes, setEventoDetalhes] = useState<any | null>(null)
  const [horarioInicio, setHorarioInicio] = useState(configRecados?.horario_inicio || '08:00')
  const [horarioTermino, setHorarioTermino] = useState(configRecados?.horario_termino || '17:00')
  const [msgFora, setMsgFora] = useState(configRecados?.mensagem_fora_expediente || '')
  const form = useForm<z.infer<typeof eventoSchema>>({ resolver: zodResolver(eventoSchema) as any })

  const abrirNovo = () => {
    setEditando(null)
    form.reset({ nome: '', data_inicio: '', data_termino: '', hora_inicio: '', hora_fim: '', local: '', publico_alvo: 'toda_escola', descricao: '', publicar_no_mural: false })
    setOpen(true)
  }

  const abrirEdicao = (evento: any) => {
    setEditando(evento)
    form.reset({
      nome: evento.nome,
      data_inicio: evento.data_inicio,
      data_termino: evento.data_termino || '',
      hora_inicio: evento.hora_inicio || '',
      hora_fim: evento.hora_fim || '',
      local: evento.local || '',
      publico_alvo: evento.publico_alvo || 'toda_escola',
      descricao: evento.descricao || '',
      publicar_no_mural: evento.publicar_no_mural || false,
    })
    setOpen(true)
  }

  const abrirDetalhes = (evento: any) => {
    setEventoDetalhes(evento)
  }

  const confirmarExclusao = (evento: any) => {
    setEventoDeletar(evento)
  }

  const handleExcluir = async () => {
    if (!eventoDeletar) return
    try {
      await excluir.mutateAsync(eventoDeletar.id)
      toast.success('Evento excluído!')
      setEventoDeletar(null)
    } catch {
      toast.error('Erro ao excluir evento')
    }
  }

  const onSubmit = async (data: any) => {
    if (!authUser) return
    try {
      await criar.mutateAsync({ ...data, id: editando?.id, tenant_id: authUser.tenantId })
      
      if (data.publicar_no_mural && !editando) {
        await muralService.criar({
          tenant_id: authUser.tenantId,
          titulo: `AGENDA: ${data.nome}`,
          conteudo: `${data.descricao || ''}\n\n📍 Local: ${data.local || 'Não informado'}\n🕒 Início: ${data.data_inicio} ${data.hora_inicio || ''}`,
          publico_alvo: data.publico_alvo || 'toda_escola',
          data_fim: data.data_termino || data.data_inicio,
          data_inicio: data.data_inicio,
          turma_id: null,
          data_agendamento: null
        })
      }

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
                {form.formState.errors.nome && <p className="text-sm text-destructive">{String(form.formState.errors.nome.message)}</p>}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hora_inicio">Hora de Início</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input id="hora_inicio" type="time" className="pl-8" {...form.register('hora_inicio')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora_fim">Hora de Término</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input id="hora_fim" type="time" className="pl-8" {...form.register('hora_fim')} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="local">Local do Evento</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="local" placeholder="Ex: Quadra Coberta, Refeitório..." className="pl-9" {...form.register('local')} />
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
              <div className="space-y-4">
                <div className="flex items-center space-x-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <Checkbox 
                    id="mural" 
                    onCheckedChange={(v) => form.setValue('publicar_no_mural', !!v)}
                    checked={form.watch('publicar_no_mural')}
                  />
                  <Label htmlFor="mural" className="flex items-center gap-2 cursor-pointer font-medium text-amber-900">
                    <Megaphone className="h-4 w-4" />
                    Publicar automaticamente no Mural de Avisos?
                  </Label>
                </div>
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
                  <TableHead className="pl-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Evento</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Período</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Público</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Descrição</TableHead>
                  <TableHead className="w-[100px] text-right pr-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventos?.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="pl-8 font-bold">{e.nome}</TableCell>
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
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-indigo-600 hover:text-indigo-700" 
                          onClick={() => abrirDetalhes(e)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEdicao(e)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => confirmarExclusao(e)}>
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

      {/* Diálogo de Confirmação de Exclusão */}
      <Dialog open={!!eventoDeletar} onOpenChange={() => setEventoDeletar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir Evento
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o evento "{eventoDeletar?.nome}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventoDeletar(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleExcluir}
              disabled={excluir.isPending}
            >
              {excluir.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Detalhes do Evento */}
      <Dialog open={!!eventoDetalhes} onOpenChange={() => setEventoDetalhes(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
              {eventoDetalhes?.nome}
            </DialogTitle>
            <DialogDescription className="text-sm mt-1">
              Detalhes completos do evento
            </DialogDescription>
          </DialogHeader>

          {eventoDetalhes && (
            <div className="space-y-6 mt-4">
              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Data de Início</span>
                  </div>
                  <p className="text-lg font-black text-slate-900">
                    {format(parseISO(eventoDetalhes.data_inicio), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </p>
                  {eventoDetalhes.hora_inicio && (
                    <p className="text-sm font-medium text-slate-600 mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {eventoDetalhes.hora_inicio}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Data de Término</span>
                  </div>
                  {eventoDetalhes.data_termino ? (
                    <>
                      <p className="text-lg font-black text-slate-900">
                        {format(parseISO(eventoDetalhes.data_termino), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </p>
                      {eventoDetalhes.hora_fim && (
                        <p className="text-sm font-medium text-slate-600 mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {eventoDetalhes.hora_fim}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm font-medium text-slate-500">Evento de 1 dia</p>
                  )}
                </div>
              </div>

              {/* Local */}
              {eventoDetalhes.local && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Local</span>
                  </div>
                  <p className="text-base font-bold text-slate-900">{eventoDetalhes.local}</p>
                </div>
              )}

              {/* Público */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  {eventoDetalhes.publico_alvo === 'toda_escola' && <Globe className="h-4 w-4 text-slate-600" />}
                  {eventoDetalhes.publico_alvo === 'professores' && <Users className="h-4 w-4 text-slate-600" />}
                  {eventoDetalhes.publico_alvo === 'responsaveis' && <Users className="h-4 w-4 text-slate-600" />}
                  {eventoDetalhes.publico_alvo === 'alunos' && <GraduationCap className="h-4 w-4 text-slate-600" />}
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Público-Alvo</span>
                </div>
                <p className="text-base font-bold text-slate-900">
                  {publicoLabel(eventoDetalhes.publico_alvo) || 'Não especificado'}
                </p>
              </div>

              {/* Descrição */}
              {eventoDetalhes.descricao && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Descrição</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {eventoDetalhes.descricao}
                  </p>
                </div>
              )}

              {/* Informações adicionais */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <Badge variant={eventoDetalhes.publicar_no_mural ? 'default' : 'secondary'}>
                  {eventoDetalhes.publicar_no_mural ? 'Publicado no Mural' : 'Não publicado'}
                </Badge>
                <span className="text-xs text-slate-400">
                  Criado em {format(parseISO(eventoDetalhes.created_at), "dd/MM/yyyy 'às' HH:mm")}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEventoDetalhes(null)}>
              Fechar
            </Button>
            <Button 
              onClick={() => {
                setEventoDetalhes(null)
                abrirEdicao(eventoDetalhes)
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
