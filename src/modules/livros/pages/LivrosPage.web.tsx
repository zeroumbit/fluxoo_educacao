import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useLivros, useCriarLivro, useExcluirLivro, useEditarLivro, useDisciplinas, useCriarDisciplina, useMateriais, useCriarMaterial, useEditarMaterial, useExcluirMaterial } from '../hooks'
import { useTurmas } from '@/modules/turmas/hooks'
import type { Livro, Disciplina, MaterialEscolar } from '../types'
import { CATEGORIAS_MATERIAIS, SUBCATEGORIAS_POR_CATEGORIA, UNIDADES_MEDIDA, PERIODOS_USO, STATUS_MATERIAL, OBRIGATORIEDADE_MATERIAL } from '../constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Plus, Loader2, Edit2, Trash2, Library, CheckCircle, Upload, X, Image as ImageIcon, User, Building2, ExternalLink, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { livrosService } from '../service'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

type LivroFormValues = z.infer<typeof livroSchema>

const materialSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  descricao: z.string().nullable().optional(),
  codigo_sku: z.string().nullable().optional(),
  categoria: z.string().min(1, 'Selecione uma categoria'),
  subcategoria: z.string().nullable().optional(),
  quantidade_sugerida: z.coerce.number().min(1, 'Quantidade obrigatória'),
  unidade_medida: z.string().min(1, 'Unidade obrigatória'),
  especificacoes: z.string().nullable().optional(),
  tamanho: z.string().nullable().optional(),
  cor: z.string().nullable().optional(),
  tipo: z.string().nullable().optional(),
  marca_sugerida: z.string().nullable().optional(),
  disciplina_id: z.string().nullable().optional(),
  periodo_uso: z.enum(['Início do ano', 'Durante o ano', 'Específico']),
  status: z.enum(['Ativo', 'Indiferente', 'Inativo', 'Descontinuado', 'Em breve']),
  obrigatoriedade: z.enum(['Obrigatório', 'Recomendado', 'Opcional']),
  onde_encontrar: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
  link_referencia: z.string().url('URL inválida').or(z.string().length(0)).or(z.null()).optional(),
  preco_sugerido: z.coerce.number().nullable().optional(),
  estoque_atual: z.coerce.number().nullable().optional(),
  estoque_minimo: z.coerce.number().nullable().optional(),
  fornecedor: z.string().nullable().optional(),
  preco_unitario: z.coerce.number().nullable().optional(),
  codigo_barras: z.string().nullable().optional(),
  codigo_interno: z.string().nullable().optional(),
  quantidade_por_aluno: z.coerce.number().nullable().optional(),
  incluir_na_lista_oficial: z.boolean().default(true),
  posicao_lista: z.coerce.number().nullable().optional(),
  observacao_especifica_lista: z.string().nullable().optional(),
  imagem_url: z.string().nullable().optional(),
  is_uso_coletivo: z.boolean().default(false),
  turmasIds: z.array(z.string()).min(1, 'Selecione ao menos uma turma')
})

type MaterialFormValues = z.infer<typeof materialSchema>

export function LivrosPage() {
  const { authUser } = useAuth()
  const { data: livros, isLoading: loadingLivros } = useLivros()
  const { data: materiais, isLoading: loadingMateriais } = useMateriais()
  const isLoading = loadingLivros || loadingMateriais
  const { data: turmas } = useTurmas()
  const { data: disciplinas } = useDisciplinas()

  const criarLivro = useCriarLivro()
  const editarLivro = useEditarLivro()
  const excluirLivro = useExcluirLivro()
  const criarMaterial = useCriarMaterial()
  const editarMaterial = useEditarMaterial()
  const excluirMaterial = useExcluirMaterial()
  const criarDisciplina = useCriarDisciplina()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogDiscOpen, setDialogDiscOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'livro' | 'material'>('livro')
  const [livroParaEditar, setLivroParaEditar] = useState<Livro | null>(null)
  const [materialParaEditar, setMaterialParaEditar] = useState<MaterialEscolar | null>(null)
  const [itemParaExcluir, setItemParaExcluir] = useState<{ id: string; titulo: string; tipo: 'livro' | 'material' } | null>(null)
  const [novaDisciplina, setNovaDisciplina] = useState('')
  const [livroCapaFile, setLivroCapaFile] = useState<File | null>(null)
  const [livroCapaPreview, setLivroCapaPreview] = useState<string | null>(null)
  const [materialCapaFile, setMaterialCapaFile] = useState<File | null>(null)
  const [materialCapaPreview, setMaterialCapaPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const livroForm = useForm<LivroFormValues>({
    resolver: zodResolver(livroSchema) as any,
    defaultValues: {
      ano_letivo: new Date().getFullYear(),
      turmasIds: [],
      estado: 'Novo',
      disciplina_id: ''
    }
  })

  const materialForm = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema) as any,
    defaultValues: {
      turmasIds: [],
      incluir_na_lista_oficial: true,
      is_uso_coletivo: false,
      quantidade_sugerida: 1,
      unidade_medida: 'unidade(s)',
      categoria: '',
      subcategoria: '',
      disciplina_id: '',
      periodo_uso: 'Início do ano',
      status: 'Ativo',
      obrigatoriedade: 'Obrigatório'
    }
  })

  const handleSelectTurma = (id: string, formType: 'livro' | 'material') => {
    if (formType === 'livro') {
      const selected = (livroForm.getValues('turmasIds') || []) as string[]
      if (selected.includes(id)) {
        livroForm.setValue('turmasIds', selected.filter((t: string) => t !== id), { shouldValidate: true })
      } else {
        livroForm.setValue('turmasIds', [...selected, id], { shouldValidate: true })
      }
    } else {
      const selected = (materialForm.getValues('turmasIds') || []) as string[]
      if (selected.includes(id)) {
        materialForm.setValue('turmasIds', selected.filter((t: string) => t !== id), { shouldValidate: true })
      } else {
        materialForm.setValue('turmasIds', [...selected, id], { shouldValidate: true })
      }
    }
  }

  const onInvalid = (errors: any) => {
    console.error('Validation Errors:', errors)
    const firstError = Object.values(errors)[0] as any
    if (firstError?.message) {
      toast.error(`Erro no formulário: ${firstError.message}`)
    } else {
      toast.error('Por favor, preencha todos os campos obrigatórios corretamente.')
    }
  }

  const handleEditar = (livro: Livro) => {
    setLivroParaEditar(livro)
    setMaterialParaEditar(null)
    setActiveTab('livro')
    
    livroForm.reset({
      titulo: livro.titulo,
      autor: livro.autor,
      editora: livro.editora,
      disciplina_id: livro.disciplina_id,
      ano_letivo: livro.ano_letivo || new Date().getFullYear(),
      isbn: livro.isbn || '',
      estado: (livro.estado as any) || 'Novo',
      descricao: livro.descricao || '',
      link_referencia: livro.link_referencia || '',
      turmasIds: livro.turmas?.map(t => t.id) || []
    })
    
    setLivroCapaPreview(livro.capa_url || null)
    setLivroCapaFile(null)
    setDialogOpen(true)
  }

  const handleEditarMaterial = (material: MaterialEscolar) => {
    setMaterialParaEditar(material)
    setLivroParaEditar(null)
    setActiveTab('material')
    
    materialForm.reset({
      ...material,
      turmasIds: material.turmas?.map(t => t.id) || []
    } as any)
    
    setMaterialCapaPreview(material.imagem_url || null)
    setMaterialCapaFile(null)
    setDialogOpen(true)
  }

  const handleOpenNew = () => {
    setLivroParaEditar(null)
    setMaterialParaEditar(null)
    setActiveTab('material')
    
    livroForm.reset({
      ano_letivo: new Date().getFullYear(),
      turmasIds: [],
      estado: 'Novo'
    })
    
    materialForm.reset({
      turmasIds: [],
      status: 'Ativo',
      obrigatoriedade: 'Obrigatório',
      periodo_uso: 'Início do ano',
      incluir_na_lista_oficial: true,
      is_uso_coletivo: false,
      quantidade_sugerida: 1,
      unidade_medida: 'unidade(s)'
    })
    
    setLivroCapaPreview(null)
    setLivroCapaFile(null)
    setMaterialCapaPreview(null)
    setMaterialCapaFile(null)
    setDialogOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'livro' | 'material') => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 5MB.')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === 'livro') {
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

  const onSubmitLivro = async (data: LivroFormValues) => {
    if (!authUser) return
    try {
      setIsUploading(true)
      let finalCapaUrl = livroCapaPreview?.startsWith('http') ? livroCapaPreview : (livroParaEditar?.capa_url || null)

      if (livroCapaFile) {
        finalCapaUrl = await livrosService.uploadCapa(livroCapaFile)
      } else if (!livroCapaPreview) {
        finalCapaUrl = null
      }

      const livroData = {
        tenant_id: authUser.tenantId,
        titulo: data.titulo,
        autor: data.autor,
        editora: data.editora,
        disciplina_id: data.disciplina_id,
        ano_letivo: data.ano_letivo,
        isbn: data.isbn || null,
        estado: data.estado || null,
        descricao: data.descricao || null,
        link_referencia: data.link_referencia || null,
        capa_url: finalCapaUrl
      }

      // Limpeza profunda para evitar erros de colunas inexistentes no Supabase
      const cleanLivroData = Object.fromEntries(
        Object.entries(livroData).filter(([key]) => 
          !['id', 'created_at', 'updated_at', 'disciplina', 'turmas', 'livros_turmas'].includes(key)
        )
      )

      if (livroParaEditar) {
        await editarLivro.mutateAsync({
          id: livroParaEditar.id,
          livro: cleanLivroData as any,
          turmasIds: data.turmasIds
        })
        toast.success('Livro atualizado com sucesso!')
      } else {
        await criarLivro.mutateAsync({
          livro: cleanLivroData as any,
          turmasIds: data.turmasIds
        })
        toast.success('Livro cadastrado com sucesso!')
      }
      setDialogOpen(false)
    } catch (error) {
      console.error(error)
      toast.error('Ocorreu um erro ao salvar o livro.')
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmitMaterial = async (data: MaterialFormValues) => {
    if (!authUser) return
    try {
      setIsUploading(true)
      let finalImagemUrl = materialCapaPreview?.startsWith('http') ? materialCapaPreview : (materialParaEditar?.imagem_url || null)

      if (materialCapaFile) {
        finalImagemUrl = await livrosService.uploadImagemMaterial(materialCapaFile)
      } else if (!materialCapaPreview) {
        finalImagemUrl = null
      }

      const materialData = {
        ...data,
        tenant_id: authUser.tenantId,
        imagem_url: finalImagemUrl
      }
      
      // Limpeza profunda para evitar erros de colunas inexistentes no Supabase
      // Remove turmasIds e qualquer campo que venha do spread de 'data' que não seja coluna do banco
      const cleanMaterialData = Object.fromEntries(
        Object.entries(materialData).filter(([key]) => 
          !['id', 'created_at', 'updated_at', 'disciplina', 'turmas', 'materiais_turmas', 'turmasIds'].includes(key)
        )
      )

      if (materialParaEditar) {
        await editarMaterial.mutateAsync({
          id: materialParaEditar.id,
          material: cleanMaterialData as any,
          turmasIds: data.turmasIds
        })
        toast.success('Material atualizado com sucesso!')
      } else {
        await criarMaterial.mutateAsync({
          material: cleanMaterialData as any,
          turmasIds: data.turmasIds
        })
        toast.success('Material cadastrado com sucesso!')
      }
      setDialogOpen(false)
    } catch (error) {
      console.error(error)
      toast.error('Ocorreu um erro ao salvar o material.')
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
      setDialogDiscOpen(false)
    } catch {
      toast.error('Erro ao adicionar disciplina.')
    }
  }

  const handleExcluirLivro = (livro: Livro) => {
    setItemParaExcluir({ id: livro.id, titulo: livro.titulo, tipo: 'livro' })
    setShowDeleteDialog(true)
  }

  const handleExcluirMaterial = (material: MaterialEscolar) => {
    setItemParaExcluir({ id: material.id, titulo: material.nome, tipo: 'material' })
    setShowDeleteDialog(true)
  }

  const confirmarExclusao = async () => {
    if (!itemParaExcluir) return
    try {
      if (itemParaExcluir.tipo === 'livro') {
        await excluirLivro.mutateAsync(itemParaExcluir.id)
        toast.success('Livro excluído com sucesso!')
      } else {
        await excluirMaterial.mutateAsync(itemParaExcluir.id)
        toast.success('Material excluído com sucesso!')
      }
      setShowDeleteDialog(false)
      setItemParaExcluir(null)
    } catch (error) {
      console.error(error)
      toast.error('Ocorreu um erro ao excluir o item.')
    }
  }

  const itensPorTurma = useMemo(() => {
    const map = new Map<string, any[]>()
    if (turmas) {
      turmas.forEach(t => map.set(t.id, []))
    }
    if (livros) {
      livros.forEach(l => {
        if (l.turmas) {
          l.turmas.forEach((t: any) => {
            const id = t.id || t.turma_id
            const current = map.get(id) || []
            map.set(id, [...current, { ...l, tipo: 'livro' }])
          })
        }
      })
    }
    if (materiais) {
      materiais.forEach(m => {
        if (m.turmas) {
          m.turmas.forEach((t: any) => {
            const id = t.id || t.turma_id
            const current = map.get(id) || []
            map.set(id, [...current, { ...m, tipo: 'material' }])
          })
        }
      })
    }
    return map
  }, [livros, materiais, turmas])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1 transform transition-all hover:translate-x-1 duration-300">
           <div className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-[0.3em] text-[10px] mb-1">
              <span className="w-8 h-[2px] bg-indigo-600 rounded-full" />
              Gestão Acadêmica
           </div>
           <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Livros e Materiais
           </h1>
           <p className="text-muted-foreground">Controle de bibliotecas e kits escolares por turma.</p>
        </div>

        <div className="flex items-center gap-3">
           <Button variant="outline" onClick={() => setDialogDiscOpen(true)} className="flex shadow-sm">
              <Plus className="h-4 w-4 mr-2" /> Matéria
           </Button>
           <Button 
              onClick={handleOpenNew} 
              className="flex bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md"
           >
              <Plus className="h-4 w-4 mr-2" /> Novo Material
           </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[850px] border-0 flex flex-col p-0 overflow-hidden rounded-[32px] shadow-2xl max-h-[95vh]">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex flex-col h-full overflow-hidden bg-white">
            <DialogHeader className="p-10 pb-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white shrink-0">
               <div className="space-y-1">
                  <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">
                    {livroParaEditar || materialParaEditar ? 'Editar Registro' : 'Novo Registro'}
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                    PREENCHA OS DADOS ABAIXO PARA DISPONIBILIZAR O ITEM AOS ALUNOS.
                  </DialogDescription>
               </div>
               <TabsList className="bg-slate-100 p-1.5 rounded-xl h-[44px] self-start sm:self-center">
                  <TabsTrigger value="livro" className="rounded-lg px-6 font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">Livros</TabsTrigger>
                  <TabsTrigger value="material" className="rounded-lg px-6 font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">Materiais</TabsTrigger>
               </TabsList>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <TabsContent value="livro" className="m-0 focus-visible:ring-0">
                <form id="livro-form" onSubmit={livroForm.handleSubmit(onSubmitLivro, onInvalid)} className="space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[13px] font-bold text-slate-700 mb-1.5">Título do Livro *</Label>
                        <Input placeholder="Título oficial do livro" {...livroForm.register('titulo')} className="h-[44px] rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-medium text-slate-600" />
                        {livroForm.formState.errors.titulo && <span className="text-xs text-red-500 font-bold">{livroForm.formState.errors.titulo.message}</span>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[13px] font-bold text-slate-700 mb-1.5">Autor *</Label>
                          <Input placeholder="Nome do autor" {...livroForm.register('autor')} className="h-[44px] rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-medium text-slate-600" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[13px] font-bold text-slate-700 mb-1.5">Editora *</Label>
                          <Input placeholder="Nome da editora" {...livroForm.register('editora')} className="h-[44px] rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-medium text-slate-600" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[13px] font-bold text-slate-700 mb-1.5">Disciplina *</Label>
                        <Select value={livroForm.watch('disciplina_id')} onValueChange={(v) => livroForm.setValue('disciplina_id', v)}>
                          <SelectTrigger className="h-[44px] rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-medium text-slate-600 w-full">
                            <SelectValue placeholder="Selecione a matéria" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                            {(disciplinas as any[])?.map(d => (
                              <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[13px] font-bold text-slate-700 mb-1.5">Ano Letivo *</Label>
                          <Input type="number" {...livroForm.register('ano_letivo')} className="h-[44px] rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-medium text-slate-600" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[13px] font-bold text-slate-700 mb-1.5">Estado Conservação</Label>
                          <Select value={livroForm.watch('estado')} onValueChange={(v: any) => livroForm.setValue('estado', v)}>
                            <SelectTrigger className="h-[44px] rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-medium text-slate-600 w-full">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                              <SelectItem value="Novo">Novo</SelectItem>
                              <SelectItem value="Usado">Usado</SelectItem>
                              <SelectItem value="Indiferente">Indiferente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[13px] font-bold text-slate-700 mb-1.5">Link de Referência</Label>
                        <Input placeholder="URL para compra ou detalhes" {...livroForm.register('link_referencia')} className="h-[44px] rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-medium text-slate-600" />
                      </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[13px] font-bold text-slate-700 mb-1.5">Capa do Livro</Label>
                        <div className="h-[280px] bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group hover:border-indigo-600/30 transition-all">
                          <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full gap-2">
                            {livroCapaPreview ? (
                              <div className="relative w-full h-full">
                                <img src={livroCapaPreview} alt="Preview" className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-white text-[10px] font-bold uppercase tracking-widest">Trocar Capa</span>
                                </div>
                              </div>
                            ) : (
                              <>
                                <ImageIcon className="h-10 w-10 text-slate-300" />
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Enviar Capa</span>
                              </>
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'livro')} />
                          </label>
                          
                          {livroCapaPreview && (
                            <Button 
                              type="button" 
                              size="icon" 
                              variant="destructive" 
                              className="absolute top-2 right-2 rounded-full h-8 w-8 scale-0 group-hover:scale-100 transition-transform shadow-lg z-10" 
                              onClick={(e) => { 
                                e.preventDefault();
                                e.stopPropagation();
                                setLivroCapaFile(null); 
                                setLivroCapaPreview(null); 
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Label className="text-[13px] font-bold text-slate-700 mb-1.5">Séries / Turmas Disponíveis *</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {turmas?.map(turma => {
                        const isSelected = (livroForm.watch('turmasIds') || []).includes(turma.id)
                        return (
                          <div key={turma.id} onClick={() => handleSelectTurma(turma.id, 'livro')} className={`p-5 border border-slate-200 rounded-2xl cursor-pointer transition-all flex flex-col gap-1 active:scale-95 ${isSelected ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100 translate-y-[-2px]' : 'bg-white hover:border-indigo-200'}`}>
                             <span className={`text-[8px] font-bold uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>Turma</span>
                             <span className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-600'}`}>{turma.nome}</span>
                          </div>
                        )
                      })}
                    </div>
                    {livroForm.formState.errors.turmasIds && (
                       <span className="text-xs text-red-500 font-bold mt-2 inline-block">
                          {livroForm.formState.errors.turmasIds.message}
                       </span>
                    )}
                  </div>

                  <div className="pt-10 flex border-t border-slate-100 justify-end gap-3 shrink-0">
                     <Button type="button" variant="outline" disabled={isUploading} onClick={() => setDialogOpen(false)} className="h-12 px-8 rounded-xl font-bold text-slate-500 border-slate-200 hover:bg-slate-50 transition-all px-8">Cancelar</Button>
                     <Button 
                        type="submit" 
                        disabled={isUploading}
                        className="h-12 px-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all active:scale-95 shadow-xl shadow-indigo-100"
                     >
                        {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {isUploading ? 'PROCESSANDO...' : (livroParaEditar ? 'SALVAR ALTERAÇÕES' : 'FINALIZAR CADASTRO')}
                     </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="material" className="m-0 focus-visible:ring-0">
                <form id="material-form" onSubmit={materialForm.handleSubmit(onSubmitMaterial, onInvalid)} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-[13px] font-bold text-slate-700 mb-1.5">Nome do Material *</Label>
                          <Input placeholder="Ex: Caderno de 10 Matérias" {...materialForm.register('nome')} className="h-[44px] rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-medium text-slate-600" />
                          {materialForm.formState.errors.nome && <span className="text-xs text-red-500 font-bold">{materialForm.formState.errors.nome.message}</span>}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[13px] font-bold text-slate-700 mb-1.5">Categoria *</Label>
                            <Select value={materialForm.watch('categoria')} onValueChange={(v) => materialForm.setValue('categoria', v)}>
                              <SelectTrigger className="h-[44px] rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-medium text-slate-600 w-full">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                {CATEGORIAS_MATERIAIS.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[13px] font-bold text-slate-700 mb-1.5">Subcategoria</Label>
                            <Select value={materialForm.watch('subcategoria')} onValueChange={(v) => materialForm.setValue('subcategoria', v)}>
                              <SelectTrigger className="h-[44px] rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-medium text-slate-600 w-full">
                                <SelectValue placeholder="Opcional" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                {SUBCATEGORIAS_POR_CATEGORIA[materialForm.watch('categoria')]?.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[13px] font-bold text-slate-700 mb-1.5">Und. de Medida *</Label>
                            <Select value={materialForm.watch('unidade_medida')} onValueChange={(v) => materialForm.setValue('unidade_medida', v)}>
                              <SelectTrigger className="h-[44px] rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-medium text-slate-600 w-full">
                                <SelectValue placeholder="Ex: unid" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                {UNIDADES_MEDIDA.map(un => <SelectItem key={un} value={un}>{un}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                           <div className="space-y-2">
                             <Label className="text-[13px] font-bold text-slate-700 mb-1.5">Qtd Sugerida *</Label>
                             <Input type="number" {...materialForm.register('quantidade_sugerida')} className="h-[44px] rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-medium text-slate-600" />
                           </div>
                           <div className="space-y-2">
                             <Label className="text-[13px] font-bold text-slate-700 mb-1.5">Marca</Label>
                             <Input placeholder="Ex: Bic" {...materialForm.register('marca_sugerida')} className="h-[44px] rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-medium text-slate-600" />
                           </div>
                           <div className="space-y-2">
                             <Label className="text-[13px] font-bold text-slate-700 mb-1.5">Obrigatoriedade</Label>
                             <Select value={materialForm.watch('obrigatoriedade')} onValueChange={(v: any) => materialForm.setValue('obrigatoriedade', v)}>
                              <SelectTrigger className="h-[44px] rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-medium text-slate-600 w-full">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                <SelectItem value="Obrigatório">⚠️ Obrigatório</SelectItem>
                                <SelectItem value="Recomendado">✓ Recomendado</SelectItem>
                                <SelectItem value="Opcional">○ Opcional</SelectItem>
                              </SelectContent>
                             </Select>
                           </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[13px] font-bold text-slate-700 mb-1.5">Imagem de Referência</Label>
                        <div className="h-[280px] bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group hover:border-indigo-600/30 transition-all">
                          <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full gap-2">
                            {materialCapaPreview ? (
                              <div className="relative w-full h-full">
                                <img src={materialCapaPreview} alt="Preview" className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-white text-[10px] font-bold uppercase tracking-widest">Trocar Foto</span>
                                </div>
                              </div>
                            ) : (
                              <>
                                <ImageIcon className="h-8 w-8 text-slate-300" />
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Enviar Foto</span>
                              </>
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'material')} />
                          </label>

                          {materialCapaPreview && (
                            <Button 
                              type="button" 
                              size="icon" 
                              variant="destructive" 
                              className="absolute top-2 right-2 rounded-full h-8 w-8 scale-0 group-hover:scale-100 transition-transform shadow-lg z-10" 
                              onClick={(e) => { 
                                e.preventDefault();
                                e.stopPropagation();
                                setMaterialCapaFile(null); 
                                setMaterialCapaPreview(null); 
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Label className="text-[13px] font-bold text-slate-700 mb-1.5">Séries / Turmas Disponíveis *</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {turmas?.map(turma => {
                        const isSelected = (materialForm.watch('turmasIds') || []).includes(turma.id)
                        return (
                          <div key={turma.id} onClick={() => handleSelectTurma(turma.id, 'material')} className={`p-5 border border-slate-200 rounded-2xl cursor-pointer transition-all flex flex-col gap-1 active:scale-95 ${isSelected ? 'bg-emerald-600 border-emerald-600 shadow-xl shadow-emerald-100 translate-y-[-2px]' : 'bg-white hover:border-emerald-200'}`}>
                             <span className={`text-[8px] font-bold uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>Turma</span>
                             <span className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-600'}`}>{turma.nome}</span>
                          </div>
                        )
                      })}
                    </div>
                    {materialForm.formState.errors.turmasIds && (
                       <span className="text-xs text-red-500 font-bold mt-2 inline-block">
                          {materialForm.formState.errors.turmasIds.message}
                       </span>
                    )}
                  </div>

                  <div className="pt-10 flex border-t border-slate-100 justify-end gap-3 shrink-0">
                     <Button type="button" variant="outline" disabled={isUploading} onClick={() => setDialogOpen(false)} className="h-12 px-8 rounded-xl font-bold text-slate-500 border-slate-200 hover:bg-slate-50 transition-all">Cancelar</Button>
                     <Button 
                        type="submit" 
                        disabled={isUploading}
                        className="h-12 px-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all active:scale-95 shadow-xl shadow-emerald-100"
                     >
                        {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {isUploading ? 'PROCESSANDO...' : (materialParaEditar ? 'SALVAR ALTERAÇÕES' : 'FINALIZAR CADASTRO')}
                     </Button>
                  </div>
                </form>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {(!livros || livros.length === 0) && (!materiais || materiais.length === 0) ? (
        <Card className="border-4 border-dashed bg-zinc-50/50 shadow-none border-zinc-100 rounded-[48px]">
           <CardContent className="flex flex-col items-center justify-center py-32 text-center">
              <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center mb-8 shadow-xl text-zinc-200 group-hover:rotate-12 transition-transform duration-500">
                <Package size={48} />
              </div>
              <h3 className="text-3xl font-black text-zinc-900 tracking-tighter italic uppercase leading-tight">Nenhum item <span className="text-zinc-300">Vinculado</span></h3>
              <p className="text-zinc-500 mt-4 mb-10 max-w-sm font-medium italic">
                 Sua grade de materiais e livros para este ano letivo está vazia. Comece adicionando o primeiro item.
              </p>
              <Button onClick={handleOpenNew} className="h-16 rounded-[28px] bg-indigo-600 hover:bg-zinc-900 text-white font-black uppercase tracking-widest text-[11px] px-12 shadow-2xl shadow-indigo-100 transition-all active:scale-95">Adicionar Primeiro Item</Button>
           </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-16">
          {Array.from(itensPorTurma.entries()).map(([turmaId, items]) => {
            const turma = turmas?.find(t => t.id === turmaId)
            if (!turma) return null
            if (items.length === 0) return null

            return (
              <div key={turmaId} className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="flex items-center gap-6">
                   <div className="bg-indigo-600 w-2 h-10 rounded-full shadow-lg shadow-indigo-200" />
                   <div className="space-y-0.5">
                      <h2 className="text-3xl font-black text-zinc-900 tracking-tighter italic uppercase leading-none">{turma.nome}</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">{items.length} Itens Vinculados</span>
                        <div className="h-1 w-1 rounded-full bg-zinc-300" />
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">Lista Oficial Ativa</span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {items.map((item: any) => (
                    <div 
                      key={`${item.tipo}-${item.id}`} 
                      className="group bg-white rounded-[44px] border border-zinc-50 shadow-sm hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-700 flex flex-col relative overflow-hidden h-[540px]"
                    >
                      <div className="absolute top-6 left-6 z-20">
                         <Badge className={`border-0 font-black uppercase tracking-[0.2em] text-[8px] py-1.5 px-4 rounded-full shadow-lg ${item.tipo === 'livro' ? 'bg-indigo-600' : 'bg-emerald-500'}`}>
                            {item.tipo === 'livro' ? 'Livro' : 'Material'}
                         </Badge>
                      </div>

                      <div className="h-64 bg-zinc-50/50 flex items-center justify-center relative overflow-hidden group/image">
                         {(item.capa_url || item.imagem_url) ? (
                            <img src={item.capa_url || item.imagem_url} alt="Capa" className="h-full w-full object-contain p-8 drop-shadow-2xl group-hover/image:scale-110 transition-transform duration-1000" />
                         ) : (
                            <div className="text-zinc-100">
                               {item.tipo === 'livro' ? <BookOpen size={100} /> : <Package size={100} />}
                            </div>
                         )}
                         <div className="absolute inset-0 bg-zinc-950/0 group-hover/image:bg-zinc-950/20 transition-all duration-700" />
                      </div>

                      <div className="p-9 flex-1 flex flex-col justify-between">
                         <div className="space-y-4">
                            <div className="flex items-center gap-3">
                               <div className={`w-8 h-1 rounded-full ${item.tipo === 'livro' ? 'bg-indigo-600' : 'bg-emerald-500'}`} />
                               <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic truncate max-w-xs">
                                  {item.tipo === 'livro' ? ((disciplinas as any[])?.find(d => d.id === item.disciplina_id)?.nome || 'Paradidático') : item.categoria}
                               </span>
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                               {item.tipo === 'livro' ? item.titulo : item.nome}
                            </h3>
                            
                            <div className="space-y-2">
                               {item.tipo === 'livro' ? (
                                 <p className="text-xs font-bold text-zinc-400 italic">Por <span className="text-zinc-800">{item.autor}</span> • <span className="opacity-60">{item.editora}</span></p>
                               ) : (
                                 <div className="flex flex-col gap-1.5">
                                   <p className="text-xs font-black text-zinc-800 italic uppercase tracking-tighter">{item.quantidade_sugerida} {item.unidade_medida}</p>
                                   <p className="text-[10px] font-bold text-zinc-400 italic">Marca Sugerida: <span className="text-zinc-600">{item.marca_sugerida || 'Qualquer uma'}</span></p>
                                 </div>
                               )}
                            </div>
                         </div>

                         <div className="flex items-center justify-between pt-6 border-t border-zinc-50">
                            <div className="flex items-center gap-2">
                               <Button variant="ghost" size="icon" onClick={() => item.tipo === 'livro' ? handleEditar(item) : handleEditarMaterial(item)} className="h-12 w-12 rounded-2xl hover:bg-zinc-100 transition-all hover:scale-110 active:scale-95">
                                  <Edit2 size={16} />
                               </Button>
                               <Button variant="ghost" size="icon" onClick={() => item.tipo === 'livro' ? handleExcluirLivro(item) : handleExcluirMaterial(item)} className="h-12 w-12 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all hover:scale-110 active:scale-95">
                                  <Trash2 size={16} />
                               </Button>
                            </div>
                            {item.link_referencia && (
                               <a href={item.link_referencia} target="_blank" rel="noreferrer" className="h-12 w-12 rounded-2xl bg-zinc-950 text-white flex items-center justify-center hover:bg-indigo-600 transition-all hover:scale-110 shadow-lg shadow-zinc-200">
                                  <ExternalLink size={16} />
                               </a>
                            )}
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Disciplina */}
      <Dialog open={dialogDiscOpen} onOpenChange={setDialogDiscOpen}>
        <DialogContent className="max-w-[400px] rounded-[32px] p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-zinc-900 uppercase tracking-tighter italic">Nova Matéria</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-4">
              <Label className="text-[13px] font-bold text-slate-700 mb-1.5">Nome da Disciplina</Label>
              <Input placeholder="Ex: Física, Artes..." className="h-[44px] rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-medium text-slate-600" value={novaDisciplina} onChange={(e) => setNovaDisciplina(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button disabled={criarDisciplina.isPending} onClick={handleCreateDisciplina} className="h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold w-full uppercase tracking-widest text-[10px]">Cadastrar Matéria</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-[400px] rounded-[40px] p-10 border-none overflow-hidden">
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 bg-red-50 rounded-[30px] flex items-center justify-center mb-6">
              <Trash2 className="h-10 w-10 text-red-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight leading-none mb-3 italic">Deseja Excluir?</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 font-medium">Você está removendo "{itemParaExcluir?.titulo}" desta base acadêmica.</DialogDescription>
            <div className="flex gap-4 w-full mt-10">
              <Button variant="ghost" className="h-14 rounded-2xl flex-1 font-bold text-zinc-500" onClick={() => setShowDeleteDialog(false)}>Manter</Button>
              <Button variant="destructive" className="h-14 rounded-2xl flex-1 font-bold bg-red-600 hover:bg-red-700 shadow-xl shadow-red-100" onClick={confirmarExclusao}>Excluir</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
