import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Megaphone, 
  Clock, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  Users,
  Building2,
  X
} from 'lucide-react'
import { format, parseISO, isAfter, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { useAuth } from '@/modules/auth/AuthContext'
import { useAvisos, useCriarAviso, useExcluirAviso, useEditarAviso } from '../hooks'
import { useTurmas } from '@/modules/turmas/hooks'
import type { MuralAviso } from '@/lib/database.types'

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

const avisoSchema = z.object({
  titulo: z.string().min(3, 'Título é obrigatório'),
  conteudo: z.string().min(5, 'Conteúdo é obrigatório'),
  publico_alvo: z.string(),
  turma_id: z.string().optional().nullable(),
  data_fim: z.string().optional().nullable(),
})

type AvisoFormValues = z.infer<typeof avisoSchema>

function avisoEstaAtivo(aviso: MuralAviso): boolean {
  if (!aviso.data_fim) return true
  const hoje = startOfDay(new Date())
  const fim = startOfDay(parseISO(aviso.data_fim))
  return isAfter(fim, hoje) || fim.getTime() === hoje.getTime()
}

export function MuralPageMobile() {
  const { authUser } = useAuth()
  const { data: avisos, isLoading, refetch } = useAvisos()
  const { data: turmas } = useTurmas()
  const criarAviso = useCriarAviso()
  const excluirAviso = useExcluirAviso()
  const editarAviso = useEditarAviso()

  const [activeTab, setActiveTab] = useState<'ativos' | 'expirados'>('ativos')
  const [formOpen, setFormOpen] = useState(false)
  const [avisoParaEditar, setAvisoParaEditar] = useState<MuralAviso | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<AvisoFormValues>({
    resolver: zodResolver(avisoSchema),
    defaultValues: {
      titulo: '',
      conteudo: '',
      publico_alvo: 'todos',
      turma_id: null,
      data_fim: '',
    },
  })

  const formPublicoAlvo = watch('publico_alvo')

  const handleOpenCreate = () => {
    setAvisoParaEditar(null)
    reset({
      titulo: '',
      conteudo: '',
      publico_alvo: 'todos',
      turma_id: null,
      data_fim: '',
    })
    setFormOpen(true)
  }

  const handleOpenEdit = (aviso: MuralAviso) => {
    setAvisoParaEditar(aviso)
    reset({
      titulo: aviso.titulo,
      conteudo: aviso.conteudo,
      publico_alvo: aviso.publico_alvo,
      turma_id: aviso.turma_id || null,
      data_fim: aviso.data_fim || '',
    })
    setFormOpen(true)
  }

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
            turma_id: data.turma_id || null,
            data_fim: data.data_fim || null,
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
          data_inicio: new Date().toISOString().split('T')[0],
          data_fim: data.data_fim || null,
        })
        toast.success('Aviso publicado!')
      }
      setFormOpen(false)
      refetch()
    } catch {
      toast.error('Erro ao salvar aviso')
    }
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      await excluirAviso.mutateAsync(id)
      toast.success('Aviso removido')
      refetch()
    } catch {
      toast.error('Erro ao remover')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleRefresh = async () => {
    await refetch()
  }

  const avisosAtivos = useMemo(() => (avisos ?? []).filter(a => avisoEstaAtivo(a as MuralAviso)), [avisos])
  const avisosExpirados = useMemo(() => (avisos ?? []).filter(a => !avisoEstaAtivo(a as MuralAviso)), [avisos])

  return (
    <MobilePageLayout
      title="Mural de Avisos"
      leftAction={
        <button onClick={() => window.history.back()} className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </button>
      }
    >
      {/* Tabs Navigation */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl mb-6 mt-4">
        <button 
          onClick={() => setActiveTab('ativos')}
          className={cn(
            "flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
            activeTab === 'ativos' ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-400"
          )}
        >
          Ativos ({avisosAtivos.length})
        </button>
        <button 
          onClick={() => setActiveTab('expirados')}
          className={cn(
            "flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
            activeTab === 'expirados' ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-400"
          )}
        >
          Histórico ({avisosExpirados.length})
        </button>
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-4 pb-32">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest">Carregando mural...</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {(activeTab === 'ativos' ? avisosAtivos : avisosExpirados).length > 0 ? (
                (activeTab === 'ativos' ? avisosAtivos : avisosExpirados).map((aviso: any, idx) => (
                  <motion.div
                    key={aviso.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <NativeCard className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                            activeTab === 'expirados' ? "bg-slate-100 text-slate-400" : "bg-indigo-50 text-indigo-600"
                          )}>
                             {activeTab === 'expirados' ? <Clock className="h-6 w-6" /> : <Megaphone className="h-6 w-6" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={cn(
                              "text-lg font-black leading-tight mb-1 truncate",
                              activeTab === 'expirados' ? "text-slate-500" : "text-slate-900 dark:text-white"
                            )}>
                              {aviso.titulo}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200 text-slate-400">
                                {aviso.publico_alvo === 'todos' ? 'Todos' : (aviso.turmas?.nome || 'Turma')}
                              </Badge>
                              {activeTab === 'expirados' && (
                                <Badge className="text-[9px] bg-slate-50 text-slate-400 border-none font-black uppercase">Expirado</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className={cn(
                        "text-sm leading-relaxed",
                        activeTab === 'expirados' ? "text-slate-400" : "text-slate-600 dark:text-slate-300"
                      )}>
                        {aviso.conteudo}
                      </p>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-50 dark:border-slate-800/10">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Publicado em</p>
                          <p className="text-[11px] font-black text-slate-600 dark:text-slate-400">
                            {format(new Date(aviso.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleOpenEdit(aviso)}
                            className="h-10 w-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center"
                          >
                            <Edit2 className="h-4 w-4" />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(aviso.id)}
                            disabled={isDeleting === aviso.id}
                            className="h-10 w-10 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center"
                          >
                            {isDeleting === aviso.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </motion.button>
                        </div>
                      </div>
                    </NativeCard>
                  </motion.div>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center text-center px-10">
                   <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                      <Megaphone className="h-10 w-10 text-slate-200" />
                   </div>
                   <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Mural Vazio</h3>
                   <p className="text-slate-500 text-sm mt-3 font-medium">Nenhum aviso encontrado nesta seção.</p>
                </div>
              )}
            </AnimatePresence>
          )}
        </div>
      </PullToRefresh>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleOpenCreate}
        className="fixed bottom-24 right-6 h-16 w-16 rounded-3xl bg-indigo-600 text-white shadow-2xl shadow-indigo-100 dark:shadow-none flex items-center justify-center z-50 transition-all active:bg-indigo-700"
      >
        <Plus className="h-8 w-8" />
      </motion.button>

      {/* Form BottomSheet */}
      <BottomSheet
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={avisoParaEditar ? "Editar Aviso" : "Novo Aviso"}
        size="full"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2 pb-12 px-1">
          <div className="space-y-6">
            <div className="bg-indigo-50 dark:bg-indigo-500/10 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-500/20 flex gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100">
                <Megaphone className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-100 leading-tight">Comunicação Instantânea</h4>
                <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-1 leading-relaxed">Este aviso será exibido no portal dos responsáveis imediatamente.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Título do Aviso</Label>
              <Input 
                {...register('titulo')}
                className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-5 text-base font-bold shadow-sm"
                placeholder="Ex: Reunião de Pais e Mestres"
              />
              {errors.titulo && <p className="text-[10px] text-rose-500 font-bold ml-2">{errors.titulo.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mensagem</Label>
              <Textarea 
                {...register('conteudo')}
                className="rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-5 py-4 text-base font-medium shadow-sm min-h-[120px]"
                placeholder="Escreva aqui o conteúdo do aviso..."
              />
              {errors.conteudo && <p className="text-[10px] text-rose-500 font-bold ml-2">{errors.conteudo.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Público</Label>
                <Select value={watch('publico_alvo')} onValueChange={(v) => setValue('publico_alvo', v)}>
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="todos">Toda a Escola</SelectItem>
                    <SelectItem value="turma">Turma Específica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Encerra em</Label>
                <div className="relative">
                  <Input 
                    type="date"
                    {...register('data_fim')}
                    className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-5 font-bold shadow-sm pr-12"
                  />
                  <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {formPublicoAlvo === 'turma' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Selecionar Turma</Label>
                <Select value={watch('turma_id') || '_all'} onValueChange={(v) => setValue('turma_id', v === '_all' ? null : v)}>
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none font-bold">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="_all">Todas as turmas</SelectItem>
                    {turmas?.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </div>

          <div className="pt-8">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-16 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (avisoParaEditar ? 'SALVAR ALTERAÇÕES' : 'PUBLICAR NO MURAL')}
            </Button>
            <Button 
              type="button"
              variant="ghost"
              onClick={() => setFormOpen(false)}
              className="w-full h-12 mt-2 font-bold text-slate-400"
            >
              CANCELAR
            </Button>
          </div>
        </form>
      </BottomSheet>
    </MobilePageLayout>
  )
}
