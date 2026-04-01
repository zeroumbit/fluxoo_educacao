import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Pencil, 
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Clock,
  Globe,
  Users,
  GraduationCap,
  Sparkles,
  Timer,
  X,
  Save,
  Megaphone,
  MapPin,
  Eye
} from 'lucide-react'
import { muralService } from '@/modules/comunicacao/service'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { useAuth } from '@/modules/auth/AuthContext'
import { useEventos, useCriarEvento, useConfigRecados, useUpsertConfigRecados, useExcluirEvento } from '../hooks'

// Components Mobile
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

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

type EventoFormValues = z.infer<typeof eventoSchema>

export function EventosPageMobile() {
  const { authUser } = useAuth()
  const { data: eventos, isLoading, refetch } = useEventos()
  const criar = useCriarEvento()
  const excluir = useExcluirEvento()
  const { data: configRecados } = useConfigRecados()
  const upsertConfig = useUpsertConfigRecados()

  const [activeTab, setActiveTab] = useState<'agenda' | 'config'>('agenda')
  const [formOpen, setFormOpen] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [eventoDetalhes, setEventoDetalhes] = useState<any | null>(null)

  // Config Recados State
  const [horarioInicio, setHorarioInicio] = useState('08:00')
  const [horarioTermino, setHorarioTermino] = useState('17:00')
  const [msgFora, setMsgFora] = useState('')

  useEffect(() => {
    if (configRecados) {
      setHorarioInicio(configRecados.horario_inicio || '08:00')
      setHorarioTermino(configRecados.horario_termino || '17:00')
      setMsgFora(configRecados.mensagem_fora_expediente || '')
    }
  }, [configRecados])

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<EventoFormValues>({
    resolver: zodResolver(eventoSchema),
  })

  const formPublicoAlvo = watch('publico_alvo')

  const abrirNovo = () => {
    setEditando(null)
    reset({
      nome: '',
      data_inicio: '',
      data_termino: '',
      publico_alvo: 'toda_escola',
      descricao: '',
      publicar_no_mural: false,
      hora_inicio: '',
      hora_fim: '',
      local: '',
    })
    setFormOpen(true)
  }

  const abrirEdicao = (evento: any) => {
    setEditando(evento)
    reset({
      nome: evento.nome,
      data_inicio: evento.data_inicio,
      data_termino: evento.data_termino || '',
      publico_alvo: evento.publico_alvo || 'toda_escola',
      descricao: evento.descricao || '',
      publicar_no_mural: evento.publicar_no_mural || false,
      hora_inicio: evento.hora_inicio || '',
      hora_fim: evento.hora_fim || '',
      local: evento.local || '',
    })
    setFormOpen(true)
  }

  const abrirDetalhes = (evento: any) => {
    setEventoDetalhes(evento)
  }

  const onSubmit = async (data: EventoFormValues) => {
    if (!authUser) return
    try {
      await criar.mutateAsync({ 
        ...data, 
        id: editando?.id,
        tenant_id: authUser.tenantId 
      })

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
      setFormOpen(false)
      refetch()
    } catch {
      toast.error('Erro ao salvar evento')
    }
  }

  const handleExcluir = async (id: string) => {
    setIsDeleting(id)
    try {
      await excluir.mutateAsync(id)
      toast.success('Evento excluído')
      refetch()
    } catch {
      toast.error('Erro ao excluir')
    } finally {
      setIsDeleting(null)
    }
  }

  const salvarConfigRecados = async () => {
    if (!authUser) return
    try {
      await upsertConfig.mutateAsync({ 
        tenant_id: authUser.tenantId, 
        horario_inicio: horarioInicio, 
        horario_termino: horarioTermino, 
        mensagem_fora_expediente: msgFora 
      })
      toast.success('Configuração de recados salva!')
    } catch {
      toast.error('Erro ao salvar configuração')
    }
  }

  const handleRefresh = async () => {
    await refetch()
  }

  const publicoIcon = (publico: string) => {
    switch (publico) {
      case 'toda_escola': return <Globe className="h-4 w-4" />
      case 'professores': return <Users className="h-4 w-4" />
      case 'responsaveis': return <Users className="h-4 w-4" />
      case 'alunos': return <GraduationCap className="h-4 w-4" />
      default: return <Globe className="h-4 w-4" />
    }
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

  return (
    <MobilePageLayout
      title="Agenda Digital"
      leftAction={
        <button onClick={() => window.history.back()} className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </button>
      }
    >
      {/* Dynamic Header Info */}
      <div className="mb-6 pt-4">
        <div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-100 dark:shadow-none overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-2xl font-black tracking-tight mb-1">Fique em dia</h2>
            <p className="text-indigo-100 text-xs font-medium opacity-80">Gerencie o calendário e recados automáticos.</p>
          </div>
          <Sparkles className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 rotate-12" />
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl mb-6">
        <button 
          onClick={() => setActiveTab('agenda')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'agenda' ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-400"
          )}
        >
          <Calendar className="h-4 w-4" /> Calendário
        </button>
        <button 
          onClick={() => setActiveTab('config')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'config' ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-400"
          )}
        >
          <MessageSquare className="h-4 w-4" /> Recados
        </button>
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-4 pb-32">
          {activeTab === 'agenda' ? (
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-xs font-black uppercase tracking-widest">Carregando eventos...</p>
                </div>
              ) : eventos && eventos.length > 0 ? (
                eventos.map((evento: any, idx: number) => (
                  <motion.div
                    key={evento.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <NativeCard className="p-0 overflow-hidden border-none shadow-sm dark:bg-slate-900">
                      <div className="p-5 flex gap-4">
                        <div className="flex flex-col items-center justify-center h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-2xl shrink-0 border border-slate-100 dark:border-slate-700/50">
                          <span className="text-[10px] font-black uppercase text-indigo-600 tracking-tighter">
                            {format(parseISO(evento.data_inicio), 'MMM', { locale: ptBR })}
                          </span>
                          <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                            {format(parseISO(evento.data_inicio), 'dd')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight truncate">
                            {evento.nome}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                             <div className="flex items-center gap-1.5 text-slate-400">
                               {publicoIcon(evento.publico_alvo)}
                               <span className="text-[10px] font-bold uppercase tracking-widest">{publicoLabel(evento.publico_alvo)}</span>
                             </div>
                          </div>
                        </div>
                      </div>

                      {evento.descricao && (
                        <div className="px-5 pb-4">
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed italic">
                            "{evento.descricao}"
                          </p>
                        </div>
                      )}

                      <div className="px-5 py-3 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between border-t border-slate-50 dark:border-slate-800/50">
                         <div className="flex items-center gap-1.5">
                            <Timer className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              {evento.data_termino ? `Até ${format(parseISO(evento.data_termino), 'dd/MM/yyyy')}` : 'Evento de 1 dia'}
                            </span>
                         </div>
                         <div className="flex gap-2">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => abrirDetalhes(evento)}
                              className="h-9 w-9 bg-white dark:bg-slate-800 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700"
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => abrirEdicao(evento)}
                              className="h-9 w-9 bg-white dark:bg-slate-800 text-blue-600 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleExcluir(evento.id)}
                              disabled={isDeleting === evento.id}
                              className="h-9 w-9 bg-white dark:bg-slate-800 text-rose-600 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700"
                            >
                              {isDeleting === evento.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </motion.button>
                         </div>
                      </div>
                    </NativeCard>
                  </motion.div>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center text-center px-10">
                  <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <Calendar className="h-10 w-10 text-slate-200" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Sem Eventos</h3>
                  <p className="text-slate-500 text-sm mt-3 font-medium">Nenhum evento agendado para os próximos dias.</p>
                </div>
              )}
            </AnimatePresence>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
               <NativeCard className="p-6 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-50 dark:border-slate-800/10">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                       <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Horário de Atendimento</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Defina quando a agenda está ativa</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Início</Label>
                       <Input 
                        type="time" 
                        value={horarioInicio} 
                        onChange={(e) => setHorarioInicio(e.target.value)}
                        className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-5 text-base font-bold shadow-sm"
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Término</Label>
                       <Input 
                        type="time" 
                        value={horarioTermino} 
                        onChange={(e) => setHorarioTermino(e.target.value)}
                        className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-5 text-base font-bold shadow-sm"
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mensagem Automática</Label>
                    <Textarea 
                      value={msgFora}
                      onChange={(e) => setMsgFora(e.target.value)}
                      placeholder="Olá, estamos fora do horário de atendimento. Retornaremos em breve!"
                      rows={5}
                      className="rounded-3xl bg-slate-50 dark:bg-slate-900 border-none px-5 py-4 text-base font-medium shadow-sm resize-none"
                    />
                    <p className="text-[10px] text-slate-400 font-bold ml-1">Enviada quando um responsável tenta contato via agenda fora do horário.</p>
                  </div>

                  <Button 
                    onClick={salvarConfigRecados}
                    disabled={upsertConfig.isPending}
                    className="w-full h-16 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none"
                  >
                    {upsertConfig.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        SALVAR CONFIGURAÇÃO
                      </>
                    )}
                  </Button>
               </NativeCard>

               <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-5 rounded-3xl flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
                    As mensagens automáticas ajudam a gerenciar as expectativas dos pais. Certifique-se de que os horários coincidem com o expediente da secretaria.
                  </p>
               </div>
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* FAB (Only for Agenda) */}
      {activeTab === 'agenda' && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={abrirNovo}
          className="fixed bottom-24 right-6 h-16 w-16 rounded-3xl bg-indigo-600 text-white shadow-2xl shadow-indigo-100 dark:shadow-none flex items-center justify-center z-50 transition-all active:bg-indigo-700"
        >
          <Plus className="h-8 w-8" />
        </motion.button>
      )}

      {/* Form BottomSheet */}
      <BottomSheet
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editando ? "Editar Evento" : "Novo Evento"}
        size="full"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2 pb-12 px-1">
          <div className="space-y-6">
            <div className="bg-indigo-50 dark:bg-indigo-500/10 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-500/20 flex gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-100 leading-tight">Calendário Escolar</h4>
                <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-1 leading-relaxed">Eventos aparecem sincronizados na agenda dos pais e professores.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nome do Evento</Label>
              <Input 
                {...register('nome')}
                className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-5 text-base font-bold shadow-sm"
                placeholder="Ex: Festa da Família"
              />
              {errors.nome && <p className="text-[10px] text-rose-500 font-bold ml-2">{errors.nome.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Data Início</Label>
                <Input 
                  type="date"
                  {...register('data_inicio')}
                  className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-5 font-bold shadow-sm"
                />
                {errors.data_inicio && <p className="text-[10px] text-rose-500 font-bold ml-2">{errors.data_inicio.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Data Término</Label>
                <Input 
                  type="date"
                  {...register('data_termino')}
                  className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-5 font-bold shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Hora Início</Label>
                <Input 
                  type="time"
                  {...register('hora_inicio')}
                  className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-5 font-bold shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Hora Término</Label>
                <Input 
                  type="time"
                  {...register('hora_fim')}
                  className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-5 font-bold shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Local do Evento</Label>
              <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 shadow-sm">
                <MapPin className="h-5 w-5 text-slate-400" />
                <Input 
                  {...register('local')}
                  placeholder="Ex: Sala de Reunião, Quadra..."
                  className="h-14 bg-transparent border-none font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Público Atendido</Label>
              <Select value={formPublicoAlvo} onValueChange={(v) => setValue('publico_alvo', v)}>
                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none font-bold">
                  <SelectValue placeholder="Selecione o público" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="toda_escola">Toda a Escola</SelectItem>
                  <SelectItem value="professores">Professores</SelectItem>
                  <SelectItem value="responsaveis">Responsáveis</SelectItem>
                  <SelectItem value="alunos">Alunos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Breve Descrição</Label>
              <Textarea 
                {...register('descricao')}
                className="rounded-3xl bg-slate-50 dark:bg-slate-900 border-none px-5 py-4 text-base font-medium shadow-sm min-h-[100px]"
                placeholder="Detalhes sobre o evento..."
              />
            </div>

            <div 
              className={cn(
                "p-5 rounded-3xl border transition-all flex items-center justify-between cursor-pointer",
                watch('publicar_no_mural') 
                  ? "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/20" 
                  : "bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800"
              )}
              onClick={() => setValue('publicar_no_mural', !watch('publicar_no_mural'))}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm",
                  watch('publicar_no_mural') ? "bg-amber-100 text-amber-600" : "bg-white text-slate-400"
                )}>
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <h4 className={cn("text-xs font-black uppercase tracking-widest", watch('publicar_no_mural') ? "text-amber-900" : "text-slate-500")}>
                    Mural de Avisos
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Publicar automaticamente?</p>
                </div>
              </div>
              <div className={cn(
                "w-12 h-6 rounded-full relative transition-all",
                watch('publicar_no_mural') ? "bg-amber-500" : "bg-slate-200"
              )}>
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  watch('publicar_no_mural') ? "left-7" : "left-1"
                )} />
              </div>
            </div>
          </div>

          <div className="pt-8">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-16 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (editando ? 'ATUALIZAR EVENTO' : 'CRIAR EVENTO AGORA')}
            </Button>
            <Button 
              type="button"
              variant="ghost"
              onClick={() => setFormOpen(false)}
              className="w-full h-12 mt-2 font-bold text-slate-400"
            >
              FECHAR
            </Button>
          </div>
        </form>
      </BottomSheet>

      {/* BottomSheet de Detalhes do Evento */}
      <BottomSheet
        isOpen={!!eventoDetalhes}
        onClose={() => setEventoDetalhes(null)}
        title="Detalhes do Evento"
        size="full"
      >
        {eventoDetalhes && (
          <div className="space-y-6 pt-2 pb-12">
            {/* Cabeçalho */}
            <div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-100 dark:shadow-none overflow-hidden relative">
              <div className="relative z-10">
                <h2 className="text-2xl font-black tracking-tight mb-2">{eventoDetalhes.nome}</h2>
                <div className="flex items-center gap-2 text-indigo-100 text-xs font-medium">
                  <Calendar className="h-4 w-4" />
                  {format(parseISO(eventoDetalhes.data_inicio), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </div>
              </div>
              <Sparkles className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 rotate-12" />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Início</span>
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {format(parseISO(eventoDetalhes.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                </p>
                {eventoDetalhes.hora_inicio && (
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {eventoDetalhes.hora_inicio}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Término</span>
                </div>
                {eventoDetalhes.data_termino ? (
                  <>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {format(parseISO(eventoDetalhes.data_termino), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    {eventoDetalhes.hora_fim && (
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {eventoDetalhes.hora_fim}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs font-bold text-slate-400">Evento de 1 dia</p>
                )}
              </div>
            </div>

            {/* Local */}
            {eventoDetalhes.local && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Local</span>
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white">{eventoDetalhes.local}</p>
              </div>
            )}

            {/* Público */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                {eventoDetalhes.publico_alvo === 'toda_escola' && <Globe className="h-4 w-4 text-slate-600 dark:text-slate-400" />}
                {eventoDetalhes.publico_alvo === 'professores' && <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />}
                {eventoDetalhes.publico_alvo === 'responsaveis' && <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />}
                {eventoDetalhes.publico_alvo === 'alunos' && <GraduationCap className="h-4 w-4 text-slate-600 dark:text-slate-400" />}
                <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Público-Alvo</span>
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {publicoLabel(eventoDetalhes.publico_alvo) || 'Não especificado'}
              </p>
            </div>

            {/* Descrição */}
            {eventoDetalhes.descricao && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">Descrição</span>
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {eventoDetalhes.descricao}
                </p>
              </div>
            )}

            {/* Ações */}
            <div className="flex flex-col gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button
                onClick={() => {
                  setEventoDetalhes(null)
                  abrirEdicao(eventoDetalhes)
                }}
                className="w-full h-16 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none"
              >
                <Pencil className="h-5 w-5 mr-2" />
                EDITAR EVENTO
              </Button>
              <Button
                variant="outline"
                onClick={() => setEventoDetalhes(null)}
                className="w-full h-14 rounded-2xl border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold"
              >
                FECHAR
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </MobilePageLayout>
  )
}
