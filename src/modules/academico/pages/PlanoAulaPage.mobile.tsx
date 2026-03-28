import { useState, useEffect, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  BookOpen, 
  Edit2, 
  Trash2, 
  Calendar, 
  Clock, 
  Eye, 
  Loader2, 
  ArrowLeft,
  Search,
  CheckCircle,
  X,
  Printer,
  ChevronRight,
  MoreVertical,
  ClipboardList
} from 'lucide-react'
import { get, set } from 'idb-keyval'

import { useAuth } from '@/modules/auth/AuthContext'
import { usePlanosAula, useCriarPlanoAula, useAtualizarPlanoAula, useExcluirPlanoAula } from '../hooks'
import { useTurmas } from '@/modules/turmas/hooks'

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
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const CACHE_KEY_PLANOS = 'mobile_planos_aula_cache'

const schema = z.object({
  turmas: z.array(z.object({
    turma_id: z.string().min(1, 'Turma obrigatória'),
    turno: z.enum(['manha', 'tarde', 'integral', 'noturno']),
    horario: z.string().optional(),
  })).min(1, 'Vincule ao menos uma turma'),
  disciplina: z.string().min(1, 'Disciplina obrigatória'),
  data_aula: z.string().min(1, 'Data obrigatória'),
  conteudo_previsto: z.string().optional(),
  conteudo_realizado: z.string().optional(),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function PlanoAulaPageMobile() {
  const { authUser } = useAuth()
  const { data: planos, isLoading, refetch } = usePlanosAula()
  const { data: turmas } = useTurmas()
  const criar = useCriarPlanoAula()
  const atualizar = useAtualizarPlanoAula()
  const excluir = useExcluirPlanoAula()

  // UI States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingPlano, setViewingPlano] = useState<any | null>(null)
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>('all')

  // Offline Cache
  const [cached, setCached] = useState<any[]>([])
  useEffect(() => {
    get(CACHE_KEY_PLANOS).then(v => { if (v) setCached(v) })
  }, [])

  useEffect(() => {
    if (planos) set(CACHE_KEY_PLANOS, planos)
  }, [planos])

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      data_aula: new Date().toISOString().split('T')[0],
      turmas: [],
      disciplina: '',
      conteudo_previsto: '',
      conteudo_realizado: '',
      observacoes: ''
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
      if (editingId) {
        await atualizar.mutateAsync({ id: editingId, data: payload })
        toast.success('Plano atualizado!')
      } else {
        await criar.mutateAsync(payload)
        toast.success('Plano registrado!')
      }
      setIsFormOpen(false)
      setEditingId(null)
      refetch()
    } catch {
      toast.error('Erro ao salvar plano.')
    }
  }

  const handleEdit = (plano: any) => {
    setEditingId(plano.id)
    form.reset({
      disciplina: plano.disciplina,
      data_aula: plano.data_aula,
      conteudo_previsto: plano.conteudo_previsto || '',
      conteudo_realizado: plano.conteudo_realizado || '',
      observacoes: plano.observacoes || '',
      turmas: (plano.planos_aula_turmas || []).map((t: any) => ({
        turma_id: t.turma_id,
        turno: t.turno,
        horario: t.horario || ''
      }))
    })
    setIsFormOpen(true)
  }

  const handleOpenNew = () => {
    setEditingId(null)
    form.reset({
      data_aula: new Date().toISOString().split('T')[0],
      turmas: selectedTurmaId !== 'all' ? [{ turma_id: selectedTurmaId, turno: 'manha', horario: '' }] : [],
      disciplina: '',
      conteudo_previsto: '',
      conteudo_realizado: '',
      observacoes: ''
    })
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este plano de aula?')) return
    try {
      await excluir.mutateAsync(id)
      toast.success('Plano removido')
      refetch()
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const handleView = (plano: any) => {
    setViewingPlano(plano)
    setIsViewOpen(true)
  }

  // Filter Logic
  const displayPlanos = (planos || cached || []) as any[]
  const filteredPlanos = useMemo(() => {
    return displayPlanos.filter(p => {
      if (selectedTurmaId === 'all') return true
      return p.planos_aula_turmas?.some((t: any) => t.turma_id === selectedTurmaId)
    })
  }, [displayPlanos, selectedTurmaId])

  const formatTurno = (turno: string) => {
    const map: any = { manha: 'Manhã', tarde: 'Tarde', integral: 'Integral', noturno: 'Noturno' }
    return map[turno] || turno
  }

  return (
    <MobilePageLayout
      title="Planos de Aula"
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
          ) : filteredPlanos.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 text-slate-300">
                <ClipboardList className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Nenhum plano para esta turma</h3>
              <p className="text-slate-500 text-sm max-w-[240px] mt-2">
                Registre o que foi ensinado hoje para manter o histórico atualizado.
              </p>
              <Button onClick={handleOpenNew} variant="outline" className="mt-8 rounded-2xl h-12 px-8 font-bold border-slate-200">
                Criar Plano de Aula
              </Button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredPlanos.map((plano, idx) => (
                <motion.div
                  key={plano.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <NativeCard
                    swipeable
                    onEdit={() => handleEdit(plano)}
                    onDelete={() => handleDelete(plano.id)}
                    onClick={() => handleView(plano)}
                    className="p-4"
                  >
                    <div className="flex flex-col gap-3">
                      {/* Header Card */}
                      <div className="flex items-start justify-between gap-3">
                         <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                               <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                               <h4 className="font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[200px]">
                                 {plano.disciplina}
                               </h4>
                               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                 {(() => {
                                   const [ano, mes, dia] = plano.data_aula.split('-')
                                   const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
                                   return `${dia} ${meses[parseInt(mes) - 1]}`
                                 })()}
                               </p>
                            </div>
                         </div>
                         <div className="flex items-center gap-1">
                            {/* Professor só vê editar/excluir se for o autor do plano */}
                            {(!authUser?.isProfessor || plano.professor_id === authUser.funcionarioId) && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(plano.id); }}
                                  className="h-9 w-9 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEdit(plano); }}
                                  className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                         </div>
                      </div>

                      {/* Content Summary */}
                      <div className="space-y-2">
                         <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                           {plano.conteudo_previsto || 'Nenhum conteúdo descrito.'}
                         </p>
                      </div>

                      {/* Footer Info */}
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 mt-1 pt-3">
                        {plano.planos_aula_turmas?.map((t: any, i: number) => (
                           <Badge key={i} variant="outline" className="bg-slate-50 dark:bg-slate-900 border-none text-[10px] uppercase font-bold text-slate-500 px-2 py-1">
                              {t.turma?.nome} · {formatTurno(t.turno)}
                           </Badge>
                        ))}
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

      {/* View Detail Sheet */}
      <BottomSheet isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Detalhes do Plano" size="full">
         {viewingPlano && (
            <div className="space-y-6 pt-2 pb-20">
               <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl p-6 flex flex-col items-center text-center">
                  <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm text-indigo-600 mb-4">
                     <BookOpen className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{viewingPlano.disciplina}</h2>
                  <div className="flex items-center gap-2 mt-2 text-indigo-600 font-bold text-sm">
                     <Calendar className="h-4 w-4" />
                     {(() => {
                       const [ano, mes, dia] = viewingPlano.data_aula.split('-')
                       return `${dia}/${mes}/${ano}`
                     })()}
                  </div>
               </div>

               <div className="space-y-5">
                  <div className="space-y-2">
                     <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Turmas Vinculadas</h3>
                     <div className="flex flex-wrap gap-2">
                        {viewingPlano.planos_aula_turmas?.map((v: any, idx: number) => (
                           <div key={idx} className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
                              {v.turma?.nome} · {formatTurno(v.turno)}
                              {v.horario && <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded text-[10px] text-indigo-500">{v.horario}</span>}
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-2">
                     <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Conteúdo Previsto</h3>
                     <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 min-h-[60px]">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{viewingPlano.conteudo_previsto || 'Nenhum detalhe informado.'}</p>
                     </div>
                  </div>

                  {viewingPlano.conteudo_realizado && (() => {
                    // Só mostra "Conteúdo Realizado" se a data da aula já passou
                    const dataAula = new Date(viewingPlano.data_aula + 'T00:00:00')
                    const hoje = new Date()
                    hoje.setHours(0, 0, 0, 0)
                    const dataJaPassou = dataAula <= hoje
                    
                    if (!dataJaPassou) return null
                    
                    return (
                      <div className="space-y-2">
                         <h3 className="text-[10px] font-black uppercase text-teal-600 tracking-widest ml-1">Conteúdo Realizado</h3>
                         <div className="p-4 bg-teal-50 dark:bg-teal-500/10 rounded-2xl border border-teal-100 dark:border-teal-900/50">
                            <p className="text-sm font-bold text-teal-800 dark:text-teal-400 leading-relaxed whitespace-pre-wrap">{viewingPlano.conteudo_realizado}</p>
                         </div>
                      </div>
                    )
                  })()}

                  {viewingPlano.observacoes && (
                    <div className="space-y-2">
                       <h3 className="text-[10px] font-black uppercase text-amber-600 tracking-widest ml-1">Observações</h3>
                       <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                          <p className="text-sm font-bold text-amber-800 dark:text-amber-400 leading-relaxed whitespace-pre-wrap">{viewingPlano.observacoes}</p>
                       </div>
                    </div>
                  )}
               </div>

               {/* Professor só vê botão de editar se for o autor do plano */}
               {(!authUser?.isProfessor || viewingPlano.professor_id === authUser.funcionarioId) && (
                 <Button onClick={() => handleEdit(viewingPlano)} className="w-full h-14 rounded-2xl bg-indigo-600 font-bold shadow-lg shadow-indigo-100">
                    Editar este Plano
                 </Button>
               )}
            </div>
         )}
      </BottomSheet>

      {/* Form Sheet */}
      <BottomSheet isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingId ? 'Editar Plano' : 'Novo Plano de Aula'} size="full">
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2 pb-24">
            <div className="space-y-4">
               <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Disciplina *</Label>
                  <Input placeholder="Ex: Matemática" className="h-14 rounded-2xl text-base border-slate-200" {...form.register('disciplina')} />
                  {form.formState.errors.disciplina && <span className="text-[10px] text-rose-500 font-bold ml-1">{form.formState.errors.disciplina.message}</span>}
               </div>

               <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Data da Aula *</Label>
                  <Input type="date" className="h-14 rounded-2xl text-base border-slate-200" {...form.register('data_aula')} />
               </div>

               <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center pr-1">
                     <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Turmas e Horários *</Label>
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
                                onValueChange={(v) => form.setValue(`turmas.${index}.turma_id`, v, { shouldValidate: true })} 
                                value={form.watch(`turmas.${index}.turma_id`)}
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
                              <Select onValueChange={(v: any) => form.setValue(`turmas.${index}.turno`, v)} value={form.watch(`turmas.${index}.turno`)}>
                                <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-slate-800"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="manha">Manhã</SelectItem>
                                  <SelectItem value="tarde">Tarde</SelectItem>
                                  <SelectItem value="noturno">Noturno</SelectItem>
                                  <SelectItem value="integral">Integral</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input placeholder="Horário (ex: 08:00)" className="h-12 rounded-xl bg-white dark:bg-slate-800 text-xs" {...form.register(`turmas.${index}.horario`)} />
                           </div>
                        </div>
                     ))}
                     {fields.length === 0 && (
                        <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center">
                           <p className="text-xs font-bold text-slate-400">Nenhuma turma adicionada.</p>
                           <button type="button" onClick={() => append({ turma_id: '', turno: 'manha', horario: '' })} className="mt-2 text-xs font-black text-indigo-600">ADCIONAR AGORA</button>
                        </div>
                     )}
                  </div>
               </div>

               <div className="space-y-1.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Conteúdo Previsto</Label>
                  <Textarea placeholder="Descreva o que será ensinado..." className="rounded-2xl border-slate-200 text-base min-h-[100px]" {...form.register('conteudo_previsto')} />
               </div>

               <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Conteúdo Realizado</Label>
                  <Textarea placeholder="O que foi efetivamente ensinado..." className="rounded-2xl border-slate-200 text-base min-h-[100px]" {...form.register('conteudo_realizado')} />
               </div>

               <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Observações Gerais</Label>
                  <Textarea placeholder="Incidentes, notas sobre alunos..." className="rounded-2xl border-slate-200 text-base" {...form.register('observacoes')} />
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
                     {form.formState.isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Salvar Plano'}
                  </Button>
               </div>
            </div>
         </form>
      </BottomSheet>
    </MobilePageLayout>
  )
}
