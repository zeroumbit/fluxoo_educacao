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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Loader2, Calendar, MessageSquare } from 'lucide-react'

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
  const form = useForm({ resolver: zodResolver(eventoSchema) })
  const [horarioInicio, setHorarioInicio] = useState(configRecados?.horario_inicio || '08:00')
  const [horarioTermino, setHorarioTermino] = useState(configRecados?.horario_termino || '17:00')
  const [msgFora, setMsgFora] = useState(configRecados?.mensagem_fora_expediente || '')

  const onSubmit = async (data: any) => {
    if (!authUser) return
    try {
      await criar.mutateAsync({ ...data, tenant_id: authUser.tenantId })
      toast.success('Evento criado!')
      form.reset(); setOpen(false)
    } catch { toast.error('Erro ao criar evento') }
  }

  const salvarConfigRecados = async () => {
    if (!authUser) return
    try {
      await upsertConfig.mutateAsync({ tenant_id: authUser.tenantId, horario_inicio: horarioInicio, horario_termino: horarioTermino, mensagem_fora_expediente: msgFora })
      toast.success('Configuração salva!')
    } catch { toast.error('Erro ao salvar') }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Agenda Digital</h1>
      <Tabs defaultValue="eventos">
        <TabsList><TabsTrigger value="eventos"><Calendar className="h-4 w-4 mr-1" />Eventos</TabsTrigger><TabsTrigger value="recados"><MessageSquare className="h-4 w-4 mr-1" />Config. Recados</TabsTrigger></TabsList>
        <TabsContent value="eventos">
          <div className="flex justify-end mb-4">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md"><Plus className="mr-2 h-4 w-4" />Novo Evento</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Evento</DialogTitle></DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2"><Label>Nome do Evento *</Label><Input {...form.register('nome')} placeholder="Ex: Festa Junina" />{form.formState.errors.nome && <p className="text-sm text-destructive">{form.formState.errors.nome.message}</p>}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Data de Início *</Label><Input type="date" {...form.register('data_inicio')} /></div>
                    <div className="space-y-2"><Label>Data de Término</Label><Input type="date" {...form.register('data_termino')} /></div>
                  </div>
                  <div className="space-y-2"><Label>Público-Alvo</Label>
                    <Select onValueChange={(v) => form.setValue('publico_alvo', v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="toda_escola">Toda a Escola</SelectItem><SelectItem value="professores">Professores</SelectItem><SelectItem value="responsaveis">Responsáveis</SelectItem><SelectItem value="alunos">Alunos</SelectItem></SelectContent></Select>
                  </div>
                  <div className="space-y-2"><Label>Descrição</Label><Textarea {...form.register('descricao')} /></div>
                  <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}</Button></div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventos?.map((e: any) => (
              <Card key={e.id} className="border-0 shadow-md"><CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between"><h3 className="font-bold">{e.nome}</h3><Badge variant="outline">{e.publico_alvo === 'toda_escola' ? 'Toda Escola' : e.publico_alvo}</Badge></div>
                <p className="text-xs text-muted-foreground">{e.data_inicio}{e.data_termino ? ` até ${e.data_termino}` : ''}</p>
                {e.descricao && <p className="text-sm text-zinc-600">{e.descricao}</p>}
              </CardContent></Card>
            ))}
            {(!eventos || eventos.length === 0) && <div className="col-span-full text-center py-12 text-muted-foreground"><Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />Nenhum evento cadastrado.</div>}
          </div>
        </TabsContent>
        <TabsContent value="recados">
          <Card className="border-0 shadow-md max-w-lg"><CardHeader><CardTitle>Configuração de Recados</CardTitle><CardDescription>Defina os horários de atendimento e mensagem automática.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Horário de Início</Label><Input type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} /></div>
                <div className="space-y-2"><Label>Horário de Término</Label><Input type="time" value={horarioTermino} onChange={(e) => setHorarioTermino(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Mensagem Fora do Expediente</Label><Textarea value={msgFora} onChange={(e) => setMsgFora(e.target.value)} placeholder="Mensagem enviada automaticamente fora do horário..." /></div>
              <Button onClick={salvarConfigRecados} disabled={upsertConfig.isPending}>{upsertConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Salvar Configuração</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
