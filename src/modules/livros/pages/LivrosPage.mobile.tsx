import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Library, 
  Plus, 
  BookOpen, 
  Edit2, 
  Trash2, 
  Loader2, 
  ChevronRight, 
  X, 
  Upload, 
  CheckCircle,
  GraduationCap,
  Image as ImageIcon,
  MoreVertical,
  ArrowLeft
} from 'lucide-react'
import { get, set } from 'idb-keyval'

import { useAuth } from '@/modules/auth/AuthContext'
import { useLivros, useCriarLivro, useExcluirLivro, useEditarLivro, useDisciplinas, useCriarDisciplina } from '../hooks'
import { useTurmas } from '@/modules/turmas/hooks'
import type { Livro } from '../types'
import { livrosService } from '../service'

// Components Mobile
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const CACHE_KEY_LIVROS = 'mobile_livros_cache'

const livroSchema = z.object({
  titulo: z.string().min(2, 'Título é obrigatório'),
  autor: z.string().min(2, 'Autor é obrigatório'),
  editora: z.string().min(2, 'Editora é obrigatória'),
  disciplina_id: z.string().min(1, 'Selecione uma disciplina'),
  ano_letivo: z.coerce.number().min(2020, 'Ano letivo inválido'),
  isbn: z.string().optional(),
  estado: z.enum(['Novo', 'Usado', 'Indiferente']).optional(),
  descricao: z.string().optional(),
  link_referencia: z.string().url('URL inválida').or(z.string().length(0)).optional(),
  turmasIds: z.array(z.string()).min(1, 'Selecione ao menos uma turma')
})

type LivroFormValues = z.infer<typeof livroSchema>

export function LivrosPageMobile() {
  const { authUser } = useAuth()
  
  // States
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDiscOpen, setIsDiscOpen] = useState(false)
  const [livroParaEditar, setLivroParaEditar] = useState<Livro | null>(null)
  const [novaDisciplina, setNovaDisciplina] = useState('')
  const [capaFile, setCapaFile] = useState<File | null>(null)
  const [capaPreview, setCapaPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Hooks
  const { data: livros, isLoading, refetch } = useLivros()
  const { data: turmas } = useTurmas()
  const { data: disciplinas } = useDisciplinas()
  const criarLivro = useCriarLivro()
  const editarLivro = useEditarLivro()
  const excluirLivro = useExcluirLivro()
  const criarDisciplina = useCriarDisciplina()

  // Cache
  const [cached, setCached] = useState<any[]>([])
  useEffect(() => {
    get(CACHE_KEY_LIVROS).then(v => { if (v) setCached(v) })
  }, [])

  useEffect(() => {
    if (livros) set(CACHE_KEY_LIVROS, livros)
  }, [livros])

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<LivroFormValues>({
    resolver: zodResolver(livroSchema) as any,
    defaultValues: {
      ano_letivo: new Date().getFullYear(),
      turmasIds: [],
      estado: 'Novo'
    }
  })

  // Set initial filter - replicate web logic for initial tab
  useEffect(() => {
    if (turmas?.length && !selectedTurmaId) {
      setSelectedTurmaId(turmas[0].id)
    }
  }, [turmas, selectedTurmaId])

  // Replicate web logic for book counts grouping
  const livrosPorTurma = useMemo(() => {
    const data = (livros || cached || []) as any[]
    const mapa = new Map<string, any[]>()
    
    if (turmas) {
      turmas.forEach(t => mapa.set(t.id, []))
    }
    
    data.forEach(livro => {
      const ltList = livro.livros_turmas || []
      ltList.forEach((lt: any) => {
        if (mapa.has(lt.turma_id)) {
          mapa.get(lt.turma_id)!.push(livro)
        }
      })
    })
    return mapa
  }, [livros, cached, turmas])

  const totalLivrosGeral = (livros || cached || []).length

  const selectedTurmasIds = watch('turmasIds') || []

  const handleSelectTurmaInForm = (id: string) => {
    if (selectedTurmasIds.includes(id)) {
      setValue('turmasIds', selectedTurmasIds.filter(t => t !== id), { shouldValidate: true })
    } else {
      setValue('turmasIds', [...selectedTurmasIds, id], { shouldValidate: true })
    }
  }

  const handleOpenNew = () => {
    setLivroParaEditar(null)
    reset({
      ano_letivo: new Date().getFullYear(),
      turmasIds: selectedTurmaId && selectedTurmaId !== 'all' ? [selectedTurmaId] : [],
      estado: 'Novo'
    })
    setCapaPreview(null)
    setCapaFile(null)
    setIsFormOpen(true)
  }

  const handleEditar = (livro: any) => {
    setLivroParaEditar(livro)
    setValue('titulo', livro.titulo)
    setValue('autor', livro.autor)
    setValue('editora', livro.editora)
    setValue('disciplina_id', livro.disciplina_id)
    setValue('ano_letivo', livro.ano_letivo || new Date().getFullYear())
    setValue('isbn', livro.isbn || '')
    setValue('estado', (livro.estado as any) || 'Novo')
    setValue('descricao', livro.descricao || '')
    setValue('link_referencia', livro.link_referencia || '')
    setValue('turmasIds', livro.turmas?.map((t: any) => t.id) || [])
    
    setCapaPreview(livro.capa_url || null)
    setCapaFile(null)
    setIsFormOpen(true)
  }

  const handleExcluir = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este livro?')) {
      try {
        await excluirLivro.mutateAsync(id)
        toast.success('Livro removido com sucesso')
      } catch (error) {
        toast.error('Erro ao excluir livro')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 5MB.')
        return
      }
      setCapaFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setCapaPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: LivroFormValues) => {
    if (!authUser) return
    try {
      setIsUploading(true)
      let finalCapaUrl = livroParaEditar?.capa_url || null

      if (capaFile) {
        finalCapaUrl = await livrosService.uploadCapa(capaFile)
      }

      const payload = {
        tenant_id: authUser.tenantId,
        ...data,
        capa_url: finalCapaUrl
      }

      if (livroParaEditar) {
        await editarLivro.mutateAsync({
          id: livroParaEditar.id,
          livro: payload,
          turmasIds: data.turmasIds
        })
        toast.success('Livro atualizado!')
      } else {
        await criarLivro.mutateAsync({
          livro: payload,
          turmasIds: data.turmasIds
        })
        toast.success('Livro cadastrado!')
      }
      setIsFormOpen(false)
      refetch()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar livro.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreateDisciplina = async () => {
    if (!authUser || !novaDisciplina.trim()) return
    try {
      await criarDisciplina.mutateAsync({ tenantId: authUser.tenantId, nome: novaDisciplina })
      toast.success('Disciplina criada!')
      setNovaDisciplina('')
      setIsDiscOpen(false)
    } catch {
      toast.error('Erro ao adicionar disciplina.')
    }
  }

  // Current list based on filter
  const filteredLivros = selectedTurmaId === 'all' 
    ? (livros || cached || []) as any[]
    : livrosPorTurma.get(selectedTurmaId) || []

  return (
    <MobilePageLayout
      title="Materiais e Livros Didáticos"
      leftAction={
        <button onClick={() => window.history.back()} className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </button>
      }
    >
      {/* Sticky Filters with Book Counts */}
      <div className="sticky top-16 -mx-4 px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-40 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          <button
             onClick={() => setSelectedTurmaId('all')}
             className={cn(
               "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2",
               selectedTurmaId === 'all'
                 ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                 : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500"
             )}
          >
            Todos
            <Badge variant={selectedTurmaId === 'all' ? 'outline' : 'secondary'} className={cn("h-4 min-w-[18px] px-1 border-white/20 text-[9px]", selectedTurmaId === 'all' ? "text-white" : "text-slate-400")}>
              {totalLivrosGeral}
            </Badge>
          </button>
          {turmas?.map(t => {
            const count = livrosPorTurma.get(t.id)?.length || 0
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTurmaId(t.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2",
                  selectedTurmaId === t.id
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                    : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500"
                )}
              >
                {t.nome}
                <Badge variant={selectedTurmaId === t.id ? 'outline' : 'secondary'} className={cn("h-4 min-w-[18px] px-1 border-white/20 text-[9px]", selectedTurmaId === t.id ? "text-white" : "text-slate-400")}>
                  {count}
                </Badge>
              </button>
            )
          })}
        </div>
      </div>

      <PullToRefresh onRefresh={async () => { await refetch() }}>
        <div className="mt-4 space-y-4 pb-20">
          {isLoading && !cached.length ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                 <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm h-32" />
              ))}
            </div>
          ) : filteredLivros.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 text-slate-300">
                <BookOpen className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Nenhum livro cadastrado</h3>
              <p className="text-slate-500 text-sm max-w-[240px] mt-2">
                Comece adicionando os materiais exigidos para esta turma.
              </p>
              <Button onClick={handleOpenNew} variant="outline" className="mt-8 rounded-2xl h-12 px-8 font-bold border-slate-200">
                Adicionar Primeiro Livro
              </Button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredLivros.map((livro, idx) => (
                <motion.div
                  key={livro.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <NativeCard
                    swipeable
                    onEdit={() => handleEditar(livro)}
                    onDelete={() => handleExcluir(livro.id)}
                    onClick={() => handleEditar(livro)}
                  >
                    <div className="flex gap-4">
                       <div className="w-20 aspect-[3/4] bg-slate-50 dark:bg-slate-900 flex items-center justify-center rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shrink-0">
                          {livro.capa_url ? (
                             <img src={livro.capa_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                             <ImageIcon className="h-8 w-8 text-slate-200" />
                          )}
                       </div>

                       <div className="flex-1 py-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                               <h4 className="font-bold text-slate-900 dark:text-white leading-tight text-base line-clamp-2">
                                 {livro.titulo}
                               </h4>
                            </div>
                            <p className="text-[13px] font-medium text-slate-500 mt-1 truncate">
                              {livro.autor} · {livro.editora}
                            </p>
                            <Badge variant="secondary" className="mt-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none text-[9px] uppercase font-black px-2 py-0.5">
                                {livro.disciplina?.nome || 'Geral'}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider leading-none">Status</span>
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">{livro.estado || 'Indiferente'}</span>
                                </div>
                             </div>
                             
                             {/* Action Buttons - Adding explicit delete after user request */}
                             <div className="flex items-center gap-1">
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleExcluir(livro.id); }}
                                 className="h-9 w-9 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 transition-colors active:bg-red-100"
                               >
                                 <Trash2 className="h-4 w-4" />
                               </button>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleEditar(livro); }}
                                 className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors active:bg-slate-100"
                               >
                                 <Edit2 className="h-4 w-4" />
                               </button>
                             </div>
                          </div>
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
      <BottomSheet 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        title={livroParaEditar ? 'Editar Livro' : 'Cadastro de Livro'} 
        size="full"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2 pb-24">
           {/* Image Picker */}
           <div className="flex justify-center">
              <label className="relative cursor-pointer group">
                  <div className="w-32 aspect-[3/4] rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden transition-all active:scale-95">
                    {capaPreview ? (
                      <img src={capaPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <Upload className="h-8 w-8 mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Enviar Capa</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg transform transition-transform group-active:scale-90">
                    <Plus className="h-5 w-5" />
                  </div>
                  <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
              </label>
           </div>

           <div className="space-y-4">
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Título do Livro *</Label>
                 <Input placeholder="Título completo" className="h-11 rounded-2xl text-base border-slate-200" {...register('titulo')} />
                 {errors.titulo && <span className="text-[10px] text-rose-500 font-bold ml-1">{errors.titulo.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Autor/Autores *</Label>
                    <Input placeholder="Autor" className="h-11 rounded-2xl text-base border-slate-200" {...register('autor')} />
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Editora *</Label>
                    <Input placeholder="Editora" className="h-11 rounded-2xl text-base border-slate-200" {...register('editora')} />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <div className="flex justify-between items-center pr-1">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Disciplina *</Label>
                      <button type="button" onClick={() => setIsDiscOpen(true)} className="text-[10px] font-black text-indigo-600">+ DISCIPLINA</button>
                    </div>
                    <Select onValueChange={(v) => setValue('disciplina_id', v)} defaultValue={watch('disciplina_id')}>
                       <SelectTrigger className="h-11 rounded-2xl border-slate-200">
                          <SelectValue placeholder="Selecione" />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="paradidatico">Paradidático</SelectItem>
                          {disciplinas?.map((d: any) => (
                             <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                          ))}
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Ano Letivo *</Label>
                    <Input type="number" className="h-11 rounded-2xl text-base border-slate-200" {...register('ano_letivo')} />
                 </div>
              </div>

              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Estado de Uso Sugerido</Label>
                 <div className="grid grid-cols-3 gap-2">
                    {['Novo', 'Usado', 'Indiferente'].map((st) => {
                       const isActive = watch('estado') === st
                       return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setValue('estado', st as any)}
                            className={cn(
                               "h-12 rounded-xl text-xs font-bold border transition-all",
                               isActive 
                                 ? "bg-indigo-600 border-indigo-600 text-white" 
                                 : "bg-white dark:bg-slate-800 border-slate-100 text-slate-500"
                            )}
                          >
                             {st === 'Usado' ? 'Permite Usado' : st}
                          </button>
                       )
                    })}
                 </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vincular às Turmas</Label>
                 <div className="grid grid-cols-2 gap-2">
                    {turmas?.map(t => {
                       const isSelected = selectedTurmasIds.includes(t.id)
                       return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleSelectTurmaInForm(t.id)}
                            className={cn(
                               "h-12 px-3 rounded-xl text-xs font-bold flex items-center justify-between border transition-all",
                               isSelected 
                                 ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                                 : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500"
                            )}
                          >
                             <span className="truncate">{t.nome}</span>
                             {isSelected && <CheckCircle className="h-4 w-4 shrink-0 text-indigo-600" />}
                          </button>
                       )
                    })}
                 </div>
              </div>
           </div>

           {/* Sticky Bottom Actions */}
           <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 z-50">
              <div className="mx-auto max-w-[640px] flex gap-3">
                 <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} className="flex-1 h-14 rounded-2xl font-bold text-slate-400">
                    Cancelar
                 </Button>
                 <Button 
                   type="submit" 
                   disabled={isSubmitting || isUploading} 
                   className="flex-[2] h-14 rounded-2xl font-bold bg-indigo-600 shadow-xl shadow-indigo-100"
                 >
                    {isSubmitting || isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Salvar Livro'}
                 </Button>
              </div>
           </div>
        </form>
      </BottomSheet>

      {/* Disciplina Sheet */}
      <BottomSheet isOpen={isDiscOpen} onClose={() => setIsDiscOpen(false)} title="Nova Disciplina" size="peek">
         <div className="pt-2 space-y-4">
            <div className="space-y-2">
               <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nome da Disciplina</Label>
               <Input 
                 value={novaDisciplina} 
                 onChange={e => setNovaDisciplina(e.target.value)} 
                 placeholder="Ex: Matemática, Literatura..." 
                 className="h-11 rounded-2xl text-base border-slate-200"
               />
            </div>
            <Button onClick={handleCreateDisciplina} className="w-full h-14 rounded-2xl bg-indigo-600 font-bold shadow-lg shadow-indigo-100">Salvar Disciplina</Button>
         </div>
      </BottomSheet>
    </MobilePageLayout>
  )
}
