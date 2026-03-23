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
  ArrowLeft,
  Package
} from 'lucide-react'
import { get, set } from 'idb-keyval'

import { useAuth } from '@/modules/auth/AuthContext'
import { useLivros, useCriarLivro, useExcluirLivro, useEditarLivro, useDisciplinas, useCriarDisciplina, useMateriais, useCriarMaterial, useEditarMaterial, useExcluirMaterial } from '../hooks'
import { useTurmas } from '@/modules/turmas/hooks'
import { CATEGORIAS_MATERIAIS, SUBCATEGORIAS_POR_CATEGORIA, UNIDADES_MEDIDA } from '../constants'
import type { Livro, MaterialEscolar } from '../types'
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

const CACHE_KEY_LIVROS = 'mobile_livros_cache_v2'

const livroSchema = z.object({
  titulo: z.string().min(2, 'Título é obrigatório'),
  autor: z.string().min(2, 'Autor é obrigatório'),
  editora: z.string().min(2, 'Editora é obrigatória'),
  disciplina_id: z.string().min(1, 'Selecione uma disciplina'),
  ano_letivo: z.coerce.number().min(2020, 'Ano letivo inválido'),
  isbn: z.string().nullable().optional(),
  estado: z.enum(['Novo', 'Usado', 'Indiferente']).nullable().optional(),
  descricao: z.string().nullable().optional(),
  link_referencia: z.string().url('URL inválida').or(z.string().length(0)).or(z.null()).optional(),
  turmasIds: z.array(z.string()).min(1, 'Selecione ao menos uma turma')
})

const materialSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  descricao: z.string().nullable().optional(),
  categoria: z.string().min(1, 'Selecione uma categoria'),
  subcategoria: z.string().nullable().optional(),
  quantidade_sugerida: z.coerce.number().min(1, 'Quantidade obrigatória'),
  unidade_medida: z.string().min(1, 'Unidade obrigatória'),
  marca_sugerida: z.string().nullable().optional(),
  disciplina_id: z.string().nullable().optional(),
  periodo_uso: z.enum(['Início do ano', 'Durante o ano', 'Específico']).default('Início do ano'),
  status: z.enum(['Ativo', 'Indiferente', 'Inativo', 'Descontinuado', 'Em breve']).default('Ativo'),
  obrigatoriedade: z.enum(['Obrigatório', 'Recomendado', 'Opcional']).default('Obrigatório'),
  link_referencia: z.string().url('URL inválida').or(z.string().length(0)).or(z.null()).optional(),
  turmasIds: z.array(z.string()).min(1, 'Selecione ao menos uma turma')
})

type LivroFormValues = z.infer<typeof livroSchema>
type MaterialFormValues = z.infer<typeof materialSchema>

export function LivrosPageMobile() {
  const { authUser } = useAuth()
  
  // States
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'livro' | 'material'>('livro')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDiscOpen, setIsDiscOpen] = useState(false)
  const [livroParaEditar, setLivroParaEditar] = useState<Livro | null>(null)
  const [materialParaEditar, setMaterialParaEditar] = useState<MaterialEscolar | null>(null)
  const [novaDisciplina, setNovaDisciplina] = useState('')
  const [livroCapaFile, setLivroCapaFile] = useState<File | null>(null)
  const [livroCapaPreview, setLivroCapaPreview] = useState<string | null>(null)
  const [materialCapaFile, setMaterialCapaFile] = useState<File | null>(null)
  const [materialCapaPreview, setMaterialCapaPreview] = useState<string | null>(null)
  
  const [isUploading, setIsUploading] = useState(false)

  // Hooks
  const { data: livros, isLoading: isLoadingLivros, refetch: refetchLivros } = useLivros()
  const { data: materiais, isLoading: isLoadingMateriais, refetch: refetchMateriais } = useMateriais()
  const { data: turmas } = useTurmas()
  const { data: disciplinas } = useDisciplinas()
  
  const criarLivro = useCriarLivro()
  const editarLivro = useEditarLivro()
  const excluirLivro = useExcluirLivro()
  
  const criarMaterial = useCriarMaterial()
  const editarMaterial = useEditarMaterial()
  const excluirMaterial = useExcluirMaterial()
  
  const criarDisciplina = useCriarDisciplina()

  const isLoading = isLoadingLivros || isLoadingMateriais

  // Cache
  const [cachedLivros, setCachedLivros] = useState<any[]>([])
  const [cachedMateriais, setCachedMateriais] = useState<any[]>([])
  
  useEffect(() => {
    get(CACHE_KEY_LIVROS + '_livros').then(v => { if (v) setCachedLivros(v) })
    get(CACHE_KEY_LIVROS + '_materiais').then(v => { if (v) setCachedMateriais(v) })
  }, [])

  useEffect(() => {
    if (livros) set(CACHE_KEY_LIVROS + '_livros', livros)
    if (materiais) set(CACHE_KEY_LIVROS + '_materiais', materiais)
  }, [livros, materiais])

  const livroForm = useForm<LivroFormValues>({
    resolver: zodResolver(livroSchema) as any,
    defaultValues: {
      ano_letivo: new Date().getFullYear(),
      turmasIds: [],
      estado: 'Novo'
    }
  })

  const materialForm = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema) as any,
    defaultValues: {
      turmasIds: [],
      quantidade_sugerida: 1,
      unidade_medida: 'unidade(s)',
      status: 'Ativo',
      obrigatoriedade: 'Obrigatório',
      periodo_uso: 'Início do ano'
    }
  })

  // Set initial filter
  useEffect(() => {
    if (turmas?.length && !selectedTurmaId) {
      setSelectedTurmaId(turmas[0].id)
    }
  }, [turmas, selectedTurmaId])

  // Count items per turma
  const itensPorTurma = useMemo(() => {
    const listLivros = (livros || cachedLivros || []) as any[]
    const listMateriais = (materiais || cachedMateriais || []) as any[]
    const mapa = new Map<string, any[]>()
    
    if (turmas) {
      turmas.forEach(t => mapa.set(t.id, []))
    }
    
    listLivros.forEach(l => {
      l.livros_turmas?.forEach((lt: any) => {
        if (mapa.has(lt.turma_id)) mapa.get(lt.turma_id)!.push({ ...l, tipo: 'livro' })
      })
    })
    
    listMateriais.forEach(m => {
      m.materiais_turmas?.forEach((mt: any) => {
        if (mapa.has(mt.turma_id)) mapa.get(mt.turma_id)!.push({ ...m, tipo: 'material' })
      })
    })
    
    return mapa
  }, [livros, materiais, cachedLivros, cachedMateriais, turmas])

  const handleSelectTurmaInForm = (id: string) => {
    const isLivro = activeTab === 'livro'
    const form = isLivro ? (livroForm as any) : (materialForm as any)
    const current = (form.getValues('turmasIds') || []) as string[]
    
    if (current.includes(id)) {
      form.setValue('turmasIds', current.filter(t => t !== id), { shouldValidate: true })
    } else {
      form.setValue('turmasIds', [...current, id], { shouldValidate: true })
    }
  }

  const handleOpenNew = () => {
    setLivroParaEditar(null)
    setMaterialParaEditar(null)
    
    const initialTurmas = selectedTurmaId && selectedTurmaId !== 'all' ? [selectedTurmaId] : []
    
    livroForm.reset({
      ano_letivo: new Date().getFullYear(),
      turmasIds: initialTurmas,
      estado: 'Novo'
    })
    
    materialForm.reset({
      turmasIds: initialTurmas,
      quantidade_sugerida: 1,
      unidade_medida: 'unidade(s)',
      status: 'Ativo',
      obrigatoriedade: 'Obrigatório',
      periodo_uso: 'Início do ano'
    })
    
    setLivroCapaPreview(null)
    setLivroCapaFile(null)
    setMaterialCapaPreview(null)
    setMaterialCapaFile(null)
    setIsFormOpen(true)
  }

  const handleEditar = (item: any) => {
    const isLivro = item.tipo === 'livro'
    setActiveTab(isLivro ? 'livro' : 'material')
    
    if (isLivro) {
      setLivroParaEditar(item)
      setMaterialParaEditar(null)
      livroForm.reset({
        ...item,
        turmasIds: item.turmas?.map((t: any) => t.id) || []
      })
      setLivroCapaPreview(item.capa_url || null)
      setLivroCapaFile(null) // Reset file when editing
    } else {
      setMaterialParaEditar(item)
      setLivroParaEditar(null)
      materialForm.reset({
        ...item,
        turmasIds: item.turmas?.map((t: any) => t.id) || []
      })
      setMaterialCapaPreview(item.imagem_url || null)
      setMaterialCapaFile(null) // Reset file when editing
    }
    
    setIsFormOpen(true)
  }

  const handleExcluir = async (item: any) => {
    if (window.confirm('Tem certeza que deseja excluir?')) {
      try {
        if (item.tipo === 'livro') {
          await excluirLivro.mutateAsync(item.id)
        } else {
          await excluirMaterial.mutateAsync(item.id)
        }
        toast.success('Excluído com sucesso')
      } catch (error) {
        toast.error('Erro ao excluir')
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
      
      const reader = new FileReader()
      reader.onloadend = () => {
        if (activeTab === 'livro') {
          setLivroCapaFile(file)
          setLivroCapaPreview(reader.result as string)
        } else {
          setMaterialCapaFile(file)
          setMaterialCapaPreview(reader.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async () => {
    if (!authUser) return
    const isLivro = activeTab === 'livro'
    const data = isLivro ? livroForm.getValues() : materialForm.getValues()
    
    // Validate manually to ensure types
    const isValid = await (isLivro ? livroForm.trigger() : materialForm.trigger())
    if (!isValid) return

    try {
      setIsUploading(true)
      
      // Image handling logic
      const isLivro = activeTab === 'livro'
      const currentCapaPreview = isLivro ? livroCapaPreview : materialCapaPreview
      const currentCapaFile = isLivro ? livroCapaFile : materialCapaFile

      let finalImageUrl = currentCapaPreview?.startsWith('http') ? currentCapaPreview : (
        isLivro ? (livroParaEditar?.capa_url || null) : (materialParaEditar?.imagem_url || null)
      )

      if (currentCapaFile) {
        finalImageUrl = isLivro 
          ? await livrosService.uploadCapa(currentCapaFile) 
          : await livrosService.uploadImagemMaterial(currentCapaFile)
      } else if (!currentCapaPreview) {
        finalImageUrl = null
      }

      if (isLivro) {
        const payload = {
          tenant_id: authUser.tenantId,
          ...data,
          capa_url: finalImageUrl
        }
        
        // Deep clean
        const cleanData = Object.fromEntries(
          Object.entries(payload).filter(([k]) => !['id', 'created_at', 'updated_at', 'disciplina', 'turmas', 'livros_turmas', 'turmasIds'].includes(k))
        )

        if (livroParaEditar) {
          await editarLivro.mutateAsync({ id: livroParaEditar.id, livro: cleanData as any, turmasIds: (data as any).turmasIds })
        } else {
          await criarLivro.mutateAsync({ livro: cleanData as any, turmasIds: (data as any).turmasIds })
        }
      } else {
        const payload = {
          tenant_id: authUser.tenantId,
          ...data,
          imagem_url: finalImageUrl
        }
        
        // Deep clean
        const cleanData = Object.fromEntries(
          Object.entries(payload).filter(([k]) => !['id', 'created_at', 'updated_at', 'disciplina', 'turmas', 'materiais_turmas', 'turmasIds'].includes(k))
        )

        if (materialParaEditar) {
          await editarMaterial.mutateAsync({ id: materialParaEditar.id, material: cleanData as any, turmasIds: (data as any).turmasIds })
        } else {
          await criarMaterial.mutateAsync({ material: cleanData as any, turmasIds: (data as any).turmasIds })
        }
      }

      toast.success('Salvo com sucesso!')
      setIsFormOpen(false)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar.')
    } finally {
      setIsUploading(false)
    }
  }

  const filteredItems = selectedTurmaId === 'all' 
    ? [...(livros || cachedLivros || []).map(l => ({ ...l, tipo: 'livro' })), ...(materiais || cachedMateriais || []).map(m => ({ ...m, tipo: 'material' }))]
    : itensPorTurma.get(selectedTurmaId) || []

  return (
    <MobilePageLayout
      title="Livros e Materiais"
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
               "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2",
               selectedTurmaId === 'all'
                 ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                 : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500"
             )}
          >
            Todos
          </button>
          {turmas?.map(t => {
            const count = itensPorTurma.get(t.id)?.length || 0
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

      <PullToRefresh onRefresh={async () => { await refetchLivros(); await refetchMateriais(); }}>
        <div className="mt-4 space-y-4 pb-24">
          {isLoading && !cachedLivros.length ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-50 rounded-2xl animate-pulse" />)}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <Package size={48} className="text-slate-200 mb-4" />
              <h3 className="text-lg font-black text-slate-900">Nada encontrado</h3>
              <p className="text-slate-500 text-sm max-w-[240px] mt-2">Toque no + para adicionar.</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, idx) => (
                <motion.div key={`${item.tipo}-${item.id}`} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                  <NativeCard onClick={() => handleEditar(item)} onEdit={() => handleEditar(item)} onDelete={() => handleExcluir(item)}>
                    <div className="flex gap-4">
                       <div className="w-20 aspect-[3/4] bg-slate-50 dark:bg-slate-900 flex items-center justify-center rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shrink-0">
                          {(item.capa_url || item.imagem_url) ? (
                             <img src={item.capa_url || item.imagem_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                             item.tipo === 'livro' ? <BookOpen className="h-8 w-8 text-slate-200" /> : <Package className="h-8 w-8 text-slate-200" />
                          )}
                       </div>
                       <div className="flex-1 py-1 min-w-0 flex flex-col justify-between">
                          <div>
                             <div className="flex items-center gap-2 mb-1">
                                <Badge className={cn("text-[8px] font-black tracking-widest px-2 py-0 border-0", item.tipo === 'livro' ? "bg-indigo-600" : "bg-emerald-500")}>
                                  {item.tipo === 'livro' ? 'LIVRO' : 'MATERIAL'}
                                </Badge>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase truncate">
                                  {item.tipo === 'livro' ? ((disciplinas as any[])?.find(d => d.id === item.disciplina_id)?.nome || 'Paradidático') : item.categoria}
                                </span>
                             </div>
                             <h4 className="font-bold text-slate-900 dark:text-white leading-tight text-base line-clamp-2">
                               {item.tipo === 'livro' ? item.titulo : item.nome}
                             </h4>
                             <p className="text-[13px] font-medium text-slate-500 mt-1 truncate">
                               {item.tipo === 'livro' ? `${item.autor} · ${item.editora}` : `${item.quantidade_sugerida} ${item.unidade_medida}`}
                             </p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] font-black text-indigo-600 uppercase italic">
                                {item.ano_letivo || 'Permanente'}
                              </span>
                              <div className="flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); handleExcluir(item); }} className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600"><Trash2 size={16} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleEditar(item); }} className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500"><Edit2 size={16} /></button>
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
        className="fixed bottom-24 right-6 h-14 w-14 rounded-2xl bg-indigo-600 text-white shadow-xl flex items-center justify-center z-40"
      >
        <Plus className="h-7 w-7" />
      </motion.button>

      {/* Form Sheet */}
      <BottomSheet isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={itemParaEditar() ? 'Editar Registro' : 'Novo Registro'} size="full">
        <div className="flex justify-center mb-6">
           <div className="flex bg-slate-100 p-1 rounded-2xl w-full max-w-[300px]">
              <button onClick={() => setActiveTab('livro')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all", activeTab === 'livro' ? "bg-white shadow-sm text-indigo-600" : "text-slate-400")}>LIVROS</button>
              <button onClick={() => setActiveTab('material')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all", activeTab === 'material' ? "bg-white shadow-sm text-emerald-600" : "text-slate-400")}>MATERIAIS</button>
           </div>
        </div>

        <div className="space-y-6 pt-2 pb-24">
           {/* Image Picker */}
           <div className="flex justify-center">
              <div className="relative group">
                <label className="block w-32 aspect-[3/4] rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden active:scale-95 transition-transform cursor-pointer">
                  {activeTab === 'livro' ? (
                    livroCapaPreview ? (
                      <img src={livroCapaPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <Upload className="h-8 w-8 mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-widest text center">Capa</span>
                      </div>
                    )
                  ) : (
                    materialCapaPreview ? (
                      <img src={materialCapaPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <Upload className="h-8 w-8 mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-widest text center">Foto</span>
                      </div>
                    )
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
                
                {((activeTab === 'livro' && livroCapaPreview) || (activeTab === 'material' && materialCapaPreview)) && (
                  <button 
                    type="button" 
                    onClick={() => { 
                      if (activeTab === 'livro') {
                        setLivroCapaFile(null); 
                        setLivroCapaPreview(null); 
                      } else {
                        setMaterialCapaFile(null); 
                        setMaterialCapaPreview(null); 
                      }
                    }}
                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg border-2 border-white z-10"
                  >
                    <X size={14} />
                  </button>
                )}
                               {!((activeTab === 'livro' && livroCapaPreview) || (activeTab === 'material' && materialCapaPreview)) && (
                  <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg pointer-events-none">
                    <Plus size={20} />
                  </div>
                )}
              </div>
           </div>

           {activeTab === 'livro' ? (
              <form key="livro-form" className="space-y-4">
                 <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Título *</Label><Input placeholder="Título oficial" {...livroForm.register('titulo')} className="h-11 rounded-2xl" /></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Autor *</Label><Input placeholder="Autor" {...livroForm.register('autor')} className="h-11 rounded-2xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Editora *</Label><Input placeholder="Editora" {...livroForm.register('editora')} className="h-11 rounded-2xl" /></div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Disciplina *</Label>
                       <Select onValueChange={(v) => livroForm.setValue('disciplina_id', v)} value={livroForm.watch('disciplina_id')}>
                          <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                          {(disciplinas as any[])?.map((d: any) => (
                             <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                          ))}
                        </SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ano Letivo *</Label><Input type="number" {...livroForm.register('ano_letivo')} className="h-11 rounded-2xl" /></div>
                 </div>
              </form>
           ) : (
              <form key="material-form" className="space-y-4">
                 <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nome do Material *</Label><Input placeholder="Ex: Caderno" {...materialForm.register('nome')} className="h-11 rounded-2xl" /></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Categoria *</Label>
                      <Select onValueChange={(v) => materialForm.setValue('categoria', v)} value={materialForm.watch('categoria')}>
                        <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{CATEGORIAS_MATERIAIS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Und. Medida *</Label>
                      <Select onValueChange={(v) => materialForm.setValue('unidade_medida', v)} value={materialForm.watch('unidade_medida')}>
                        <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Ex: unid" /></SelectTrigger>
                        <SelectContent>{UNIDADES_MEDIDA.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Qtd Sugerida *</Label><Input type="number" {...materialForm.register('quantidade_sugerida')} className="h-11 rounded-2xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Marca Sugerida</Label><Input placeholder="Ex: Faber" {...materialForm.register('marca_sugerida')} className="h-11 rounded-2xl" /></div>
                 </div>
              </form>
           )}

           <div className="space-y-3 pt-4 border-t border-slate-100">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Vincular às Turmas *</Label>
              <div className="grid grid-cols-2 gap-2">
                 {turmas?.map(t => {
                    const currentTurmas = activeTab === 'livro' ? livroForm.watch('turmasIds') : materialForm.watch('turmasIds')
                    const isSelected = (currentTurmas || []).includes(t.id)
                    return (
                       <button key={t.id} type="button" onClick={() => handleSelectTurmaInForm(t.id)} className={cn("h-12 px-3 rounded-xl text-[10px] font-bold flex items-center justify-between border transition-all", isSelected ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-100 text-slate-500")}>
                          <span className="truncate">{t.nome}</span>
                          {isSelected && <CheckCircle size={14} className="text-indigo-600" />}
                       </button>
                    )
                 })}
              </div>
           </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 z-50">
           <div className="flex gap-3">
              <Button onClick={() => setIsFormOpen(false)} variant="ghost" className="flex-1 h-14 rounded-2xl font-bold text-slate-400">Cancelar</Button>
              <Button onClick={onSubmit} disabled={isUploading} className="flex-[2] h-14 rounded-2xl font-bold bg-indigo-600 shadow-xl shadow-indigo-100">
                 {isUploading ? <Loader2 size={20} className="animate-spin" /> : 'Salvar Registro'}
              </Button>
           </div>
        </div>
      </BottomSheet>
    </MobilePageLayout>
  )

  function itemParaEditar() {
    return livroParaEditar || materialParaEditar
  }
}
