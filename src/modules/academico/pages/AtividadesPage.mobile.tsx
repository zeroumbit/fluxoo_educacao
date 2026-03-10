import { useState, useEffect, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  FileText,
  Edit2,
  Trash2,
  ExternalLink,
  Loader2,
  ArrowLeft,
  Video,
  Image as ImageIcon,
  FileDown,
  MoreVertical
} from 'lucide-react'
import { get, set } from 'idb-keyval'

import { useAuth } from '@/modules/auth/AuthContext'
import { useAtividades, useCriarAtividade, useAtualizarAtividade, useExcluirAtividade } from '../hooks'
import { useTurmas } from '@/modules/turmas/hooks'
import { supabase } from '@/lib/supabase'

// Components Mobile
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const CACHE_KEY_ATIVIDADES = 'mobile_atividades_cache'

const schema = z.object({
  titulo: z.string().min(1, 'Título obrigatório'),
  filial_id: z.string().optional(),
  turmas: z.array(z.object({
    turma_id: z.string().min(1, 'Turma obrigatória'),
    turno: z.enum(['manha', 'tarde', 'integral', 'noturno']).optional(),
    horario: z.string().optional(),
  })).min(1, 'Vincule ao menos uma turma'),
  disciplina: z.string().optional(),
  tipo_material: z.string().optional(),
  anexo_url: z.string().optional(),
  descricao: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const tipoLabels: Record<string, string> = { pdf: 'PDF', link_video: 'Vídeo', imagem: 'Imagem', outro: 'Outro' }

export function AtividadesPageMobile() {
  const { authUser } = useAuth()
  const { data: atividades, isLoading, refetch } = useAtividades()
  const { data: turmas } = useTurmas()
  const criar = useCriarAtividade()
  const atualizar = useAtualizarAtividade()
  const excluir = useExcluirAtividade()

  // UI States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>('all')
  const [filiais, setFiliais] = useState<any[]>([])

  // Offline Cache
  const [cached, setCached] = useState<any[]>([])
  useEffect(() => {
    get(CACHE_KEY_ATIVIDADES).then(v => { if (v) setCached(v) })
  }, [])

  useEffect(() => {
    if (atividades) set(CACHE_KEY_ATIVIDADES, atividades)
  }, [atividades])

  useEffect(() => {
    if (isFormOpen && authUser?.tenantId) {
      supabase
        .from('filiais')
        .select('*')
        .eq('tenant_id', authUser.tenantId)
        .order('nome_unidade')
        .then(({ data }) => {
          if (data) setFiliais(data)
        })
    }
  }, [isFormOpen, authUser?.tenantId])

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: '',
      turmas: [],
      disciplina: '',
      tipo_material: '',
      anexo_url: '',
      descricao: ''
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "turmas"
  })

  const onSubmit = async (data: FormData) => {
    if (!authUser) return
    try {
      const payload = { ...data, tenant_id: authUser.tenantId }
      if (!payload.filial_id) delete payload.filial_id

      if (editandoId) {
        await atualizar.mutateAsync({ id: editandoId, data: payload })
        toast.success('Atividade atualizada!')
      } else {
        await criar.mutateAsync(payload)
        toast.success('Atividade cadastrada!')
      }
      setIsFormOpen(false)
      setEditandoId(null)
      refetch()
    } catch {
      toast.error('Erro ao salvar atividade.')
    }
  }

  const handleEdit = (atividade: any) => {
    setEditandoId(atividade.id)
    form.reset({
      titulo: atividade.titulo,
      filial_id: atividade.filial_id || undefined,
      disciplina: atividade.disciplina || '',
      tipo_material: atividade.tipo_material || '',
      anexo_url: atividade.anexo_url || '',
      descricao: atividade.descricao || '',
      turmas: (atividade.atividades_turmas || []).map((t: any) => ({
        turma_id: t.turma_id,
        turno: t.turno || undefined,
        horario: t.horario || ''
      }))
    })
    setIsFormOpen(true)
  }

  const handleOpenNew = () => {
    setEditandoId(null)
    form.reset({
      titulo: '',
      turmas: selectedTurmaId !== 'all' ? [{ turma_id: selectedTurmaId, turno: 'manha', horario: '' }] : [],
      disciplina: '',
      tipo_material: '',
      anexo_url: '',
      descricao: ''
    })
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir esta atividade?')) return
    try {
      await excluir.mutateAsync(id)
      toast.success('Atividade removida')
      refetch()
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const getIcon = (tipo: string) => {
    switch(tipo) {
      case 'pdf': return <FileDown className="h-5 w-5" />
      case 'link_video': return <Video className="h-5 w-5" />
      case 'imagem': return <ImageIcon className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  // Filter Logic
  const displayAtividades = (atividades || cached || []) as any[]
  const filteredAtividades = useMemo(() => {
    return displayAtividades.filter(a => {
      if (selectedTurmaId === 'all') return true
      return a.atividades_turmas?.some((t: any) => t.turma_id === selectedTurmaId)
    })
  }, [displayAtividades, selectedTurmaId])

  const formatTurno = (turno: string) => {
    const map: any = { manha: 'Manhã', tarde: 'Tarde', integral: 'Integral', noturno: 'Noturno' }
    return map[turno] || turno
  }

  return (
    <MobilePageLayout
      title="Atividades & Materiais"
      leftAction={
        <button onClick={() => window.history.back()} className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </button>
      }
    >
      {/* Sticky Filters */}
      <div className="sticky top-16 -mx-4 px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-40 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          <button
             onClick={() => setSelectedTurmaId('all')}
             className={cn(
               "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
               selectedTurmaId === 'all'
                 ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                 : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500"
             )}
          >
            Todos
          </button>
          {turmas?.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTurmaId(t.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                selectedTurmaId === t.id
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                  : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500"
              )}
            >
              {t.nome}
            </button>
          ))}
        </div>
      </div>

      <PullToRefresh onRefresh={async () => { await refetch() }}>
        <div className="mt-4 space-y-4 pb-32">
          {isLoading && !cached.length ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm h-32 animate-pulse" />
              ))}
            </div>
          ) : filteredAtividades.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 text-slate-300">
                <FileText className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Nenhuma atividade encontrada</h3>
              <p className="text-slate-500 text-sm max-w-[240px] mt-2">
                Compartilhe materiais de estudo ou atividades para os alunos acessarem pelo portal.
              </p>
              <Button onClick={handleOpenNew} variant="outline" className="mt-8 rounded-2xl h-12 px-8 font-bold border-slate-200">
                Criar Nova Atividade
              </Button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredAtividades.map((atividade, idx) => (
                <motion.div
                  key={atividade.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <NativeCard
                    swipeable
                    onEdit={() => handleEdit(atividade)}
                    onDelete={() => handleDelete(atividade.id)}
                    onClick={() => atividade.anexo_url && window.open(atividade.anexo_url, '_blank')}
                    className="p-4"
                  >
                    <div className="flex flex-col gap-3">
                      {/* Header Card */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
                            {getIcon(atividade.tipo_material)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-900 dark:text-white leading-tight truncate">
                              {atividade.titulo}
                            </h4>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate">
                              {atividade.disciplina || 'Geral'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {atividade.anexo_url && (
                            <motion.a
                              whileTap={{ scale: 0.9 }}
                              href={atividade.anexo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </motion.a>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => e.stopPropagation()}
                                className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </motion.button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(atividade); }} className="gap-2">
                                <Edit2 className="h-4 w-4" />
                                <span>Editar</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(atividade.id); }} className="gap-2 text-red-600 dark:text-red-400">
                                <Trash2 className="h-4 w-4" />
                                <span>Excluir</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Content Summary */}
                      {atividade.descricao && (
                        <div className="space-y-2">
                           <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                             {atividade.descricao}
                           </p>
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-1">
                        {atividade.atividades_turmas?.map((t: any, i: number) => (
                           <Badge key={i} variant="outline" className="bg-slate-50 dark:bg-slate-900 border-none text-[9px] uppercase font-black text-slate-400 px-2 py-0.5">
                              {t.turma?.nome} {t.turno ? `· ${formatTurno(t.turno)}` : ''}
                           </Badge>
                        ))}
                        {atividade.tipo_material && (
                           <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 border-none text-[9px] uppercase font-black px-2 py-0.5">
                              {tipoLabels[atividade.tipo_material] || atividade.tipo_material}
                           </Badge>
                        )}
                      </div>
                    </div>
                  </NativeCard>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </PullToRefresh>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleOpenNew}
        className="fixed bottom-24 right-6 h-14 w-14 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center z-40 transition-transform active:scale-95"
      >
        <Plus className="h-7 w-7" />
      </motion.button>

      {/* Form Sheet */}
      <BottomSheet isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editandoId ? 'Editar Atividade' : 'Nova Atividade'} size="full">
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2 pb-24">
            <div className="space-y-4">
               {filiais.length > 1 && (
                  <div className="space-y-1.5">
                     <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Unidade</Label>
                     <Select value={form.watch('filial_id')} onValueChange={(v) => form.setValue('filial_id', v)}>
                        <SelectTrigger className="h-14 rounded-2xl border-slate-200">
                           <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                        <SelectContent>
                           {filiais.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome_unidade}</SelectItem>)}
                        </SelectContent>
                     </Select>
                  </div>
               )}

               <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Título da Atividade *</Label>
                  <Input placeholder="Ex: Exercícios de Geometria" className="h-14 rounded-2xl text-base border-slate-200" {...form.register('titulo')} />
                  {form.formState.errors.titulo && <span className="text-[10px] text-rose-500 font-bold ml-1">{form.formState.errors.titulo.message}</span>}
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Disciplina</Label>
                     <Input placeholder="Matemática" className="h-14 rounded-2xl text-base border-slate-200" {...form.register('disciplina')} />
                  </div>
                  <div className="space-y-1.5">
                     <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tipo de Material</Label>
                     <Select value={form.watch('tipo_material')} onValueChange={(v) => form.setValue('tipo_material', v)}>
                        <SelectTrigger className="h-14 rounded-2xl border-slate-200">
                           <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="pdf">PDF</SelectItem>
                           <SelectItem value="link_video">Vídeo</SelectItem>
                           <SelectItem value="imagem">Imagem</SelectItem>
                           <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>

               <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Link ou URL do Anexo</Label>
                  <Input type="url" placeholder="https://..." className="h-14 rounded-2xl text-base border-slate-200" {...form.register('anexo_url')} />
               </div>

               {/* Múltiplas Turmas */}
               <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center pr-1">
                     <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Turmas Atendidas *</Label>
                     <button 
                       type="button" 
                       onClick={() => append({ turma_id: '', turno: 'manha', horario: '' })}
                       className="text-[10px] font-black text-indigo-600"
                     >
                       + VINCULAR TURMA
                     </button>
                  </div>
                  
                  <div className="space-y-3">
                     {fields.map((field, index) => (
                        <div key={field.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vínculo #{index + 1}</span>
                              <button type="button" onClick={() => remove(index)} className="text-rose-500 font-bold text-xs">Remover</button>
                           </div>
                           
                           <div className="space-y-2">
                              <Select 
                                value={form.watch(`turmas.${index}.turma_id`)} 
                                onValueChange={(v) => form.setValue(`turmas.${index}.turma_id`, v, { shouldValidate: true })}
                              >
                                <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-slate-800"><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                                <SelectContent>
                                  {turmas?.map((t: any) => (
                                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                           </div>

                           <div className="grid grid-cols-2 gap-3">
                              <Select value={form.watch(`turmas.${index}.turno`)} onValueChange={(v: any) => form.setValue(`turmas.${index}.turno`, v)}>
                                <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-slate-800"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="manha">Manhã</SelectItem>
                                  <SelectItem value="tarde">Tarde</SelectItem>
                                  <SelectItem value="noturno">Noturno</SelectItem>
                                  <SelectItem value="integral">Integral</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input placeholder="Horário" className="h-12 rounded-xl bg-white dark:bg-slate-800 text-xs" {...form.register(`turmas.${index}.horario`)} />
                           </div>
                        </div>
                     ))}
                     {fields.length === 0 && (
                        <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center">
                           <p className="text-xs font-bold text-slate-400">Nenhuma turma vinculada.</p>
                        </div>
                     )}
                     {form.formState.errors.turmas && <span className="text-[10px] text-rose-500 font-bold ml-1">{form.formState.errors.turmas.message}</span>}
                  </div>
               </div>

               <div className="space-y-1.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Descrição</Label>
                  <Textarea placeholder="Instruções para os alunos..." className="rounded-2xl border-slate-200 text-base min-h-[100px]" {...form.register('descricao')} />
               </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 z-50">
               <div className="mx-auto max-w-[640px] flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} className="flex-1 h-14 rounded-2xl font-bold text-slate-400">
                     Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-[2] h-14 rounded-2xl font-bold bg-indigo-600 shadow-xl shadow-indigo-100"
                    disabled={form.formState.isSubmitting}
                  >
                     {form.formState.isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Salvar Atividade'}
                  </Button>
               </div>
            </div>
         </form>
      </BottomSheet>
    </MobilePageLayout>
  )
}
