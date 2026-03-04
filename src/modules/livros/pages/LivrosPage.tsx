import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useLivros, useCriarLivro, useExcluirLivro, useEditarLivro, useDisciplinas, useCriarDisciplina } from '../hooks'
import { useTurmas } from '@/modules/turmas/hooks'
import type { Livro, Disciplina } from '../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Plus, Loader2, Edit2, Trash2, Library, GraduationCap, CheckCircle, Upload, X, Image as ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { livrosService } from '../service'

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

export function LivrosPage() {
  const { authUser } = useAuth()
  const { data: livros, isLoading } = useLivros()
  const { data: turmas } = useTurmas()
  const { data: disciplinas } = useDisciplinas()

  const criarLivro = useCriarLivro()
  const editarLivro = useEditarLivro()
  const excluirLivro = useExcluirLivro()
  const criarDisciplina = useCriarDisciplina()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogDiscOpen, setDialogDiscOpen] = useState(false)
  const [livroParaEditar, setLivroParaEditar] = useState<Livro | null>(null)
  const [novaDisciplina, setNovaDisciplina] = useState('')
  const [capaFile, setCapaFile] = useState<File | null>(null)
  const [capaPreview, setCapaPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<LivroFormValues>({
    resolver: zodResolver(livroSchema) as any,
    defaultValues: {
      ano_letivo: new Date().getFullYear(),
      turmasIds: [],
      estado: 'Novo'
    }
  })

  // Watch selected turmas
  const selectedTurmas = watch('turmasIds') || []
  
  const handleSelectTurma = (id: string) => {
    if (selectedTurmas.includes(id)) {
      setValue('turmasIds', selectedTurmas.filter(t => t !== id), { shouldValidate: true })
    } else {
      setValue('turmasIds', [...selectedTurmas, id], { shouldValidate: true })
    }
  }

  const handleEditar = (livro: Livro) => {
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
    setValue('turmasIds', livro.turmas?.map(t => t.id) || [])
    
    setCapaPreview(livro.capa_url || null)
    setCapaFile(null)
    setDialogOpen(true)
  }

  const handleOpenNew = () => {
    setLivroParaEditar(null)
    reset({
      ano_letivo: new Date().getFullYear(),
      turmasIds: [],
      estado: 'Novo'
    })
    setCapaPreview(null)
    setCapaFile(null)
    setDialogOpen(true)
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
      reader.onloadend = () => {
        setCapaPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: any) => {
    if (!authUser) return
    const formData = data as LivroFormValues
    try {
      setIsUploading(true)
      let finalCapaUrl = livroParaEditar?.capa_url || null

      if (capaFile) {
        finalCapaUrl = await livrosService.uploadCapa(capaFile)
      }

      if (livroParaEditar) {
        await editarLivro.mutateAsync({
          id: livroParaEditar.id,
          livro: {
            tenant_id: authUser.tenantId,
            titulo: formData.titulo,
            autor: formData.autor,
            editora: formData.editora,
            disciplina_id: formData.disciplina_id,
            ano_letivo: formData.ano_letivo,
            isbn: formData.isbn || null,
            estado: formData.estado || null,
            descricao: formData.descricao || null,
            link_referencia: formData.link_referencia || null,
            capa_url: finalCapaUrl
          },
          turmasIds: formData.turmasIds
        })
        toast.success('Livro atualizado com sucesso!')
      } else {
        await criarLivro.mutateAsync({
          livro: {
            tenant_id: authUser.tenantId,
            titulo: formData.titulo,
            autor: formData.autor,
            editora: formData.editora,
            disciplina_id: formData.disciplina_id,
            ano_letivo: formData.ano_letivo,
            isbn: formData.isbn || null,
            estado: formData.estado || null,
            descricao: formData.descricao || null,
            link_referencia: formData.link_referencia || null,
            capa_url: finalCapaUrl
          },
          turmasIds: formData.turmasIds
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Library className="h-6 w-6 text-indigo-600" /> Materiais e Livros Didáticos
          </h1>
          <p className="text-muted-foreground">Cadastre os livros exigidos para as turmas.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenNew} className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-md">
                <Plus className="mr-2 h-4 w-4" /> Novo Livro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{livroParaEditar ? 'Editar Livro' : 'Cadastro de Livro/Material'}</DialogTitle>
                <DialogDescription>
                  Este livro ficará visível no portal dos alunos das turmas selecionadas.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Título *</Label>
                    <Input placeholder="Título do livro" {...register('titulo')} />
                    {errors.titulo && <span className="text-xs text-red-500">{errors.titulo.message}</span>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Autor/Autores *</Label>
                    <Input placeholder="Nome do autor" {...register('autor')} />
                    {errors.autor && <span className="text-xs text-red-500">{errors.autor.message}</span>}
                  </div>

                  <div className="space-y-2">
                    <Label>Editora *</Label>
                    <Input placeholder="Nome da editora" {...register('editora')} />
                    {errors.editora && <span className="text-xs text-red-500">{errors.editora.message}</span>}
                  </div>

                  <div className="space-y-2">
                    <Label>Ano Letivo *</Label>
                    <Input type="number" {...register('ano_letivo')} />
                    {errors.ano_letivo && <span className="text-xs text-red-500">{errors.ano_letivo.message}</span>}
                  </div>

                  <div className="space-y-2">
                     <div className="flex items-center justify-between">
                        <Label>Disciplina *</Label>
                        <button 
                          type="button"
                          onClick={() => setDialogDiscOpen(true)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded transition-colors"
                        >
                          + DISCIPLINA
                        </button>
                     </div>
                     <Select onValueChange={(v) => setValue('disciplina_id', v)} defaultValue={watch('disciplina_id')}>
                        <SelectTrigger className="w-full">
                           <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                           {disciplinas?.map(d => (
                              <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     {errors.disciplina_id && <span className="text-xs text-red-500">{errors.disciplina_id.message}</span>}
                  </div>

                  <div className="space-y-2">
                     <Label>Estado de Uso Sugerido</Label>
                     <Select onValueChange={(v: any) => setValue('estado', v)} defaultValue={watch('estado')}>
                        <SelectTrigger className="w-full">
                           <SelectValue placeholder="Qual estado usar?" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="Novo">Novo</SelectItem>
                           <SelectItem value="Usado">Permite Usado</SelectItem>
                           <SelectItem value="Indiferente">Indiferente</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>ISBN (Opcional)</Label>
                    <Input placeholder="Código ISBN..." {...register('isbn')} />
                  </div>
                  
                   <div className="space-y-2">
                    <Label>Link de Compra (Opcional)</Label>
                    <Input placeholder="https://..." {...register('link_referencia')} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Capa do Livro (PNG, JPG, WEBP ou PDF)</Label>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors relative group">
                    {capaPreview ? (
                      <div className="relative w-full aspect-[4/3] max-h-[200px] flex items-center justify-center overflow-hidden rounded-xl">
                        {capaPreview.includes('application/pdf') || capaPreview.endsWith('.pdf') ? (
                          <div className="flex flex-col items-center text-slate-400">
                             <BookOpen className="w-12 h-12 mb-2" />
                             <span className="text-xs font-bold uppercase tracking-widest">Documento PDF</span>
                          </div>
                        ) : (
                          <img src={capaPreview} alt="Preview" className="w-full h-full object-contain" />
                        )}
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-2 right-2 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setCapaFile(null)
                            setCapaPreview(null)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer w-full h-32">
                        <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 border border-slate-100">
                          <Upload className="h-5 w-5 text-indigo-500" />
                        </div>
                        <span className="text-sm font-bold text-slate-600">Clique para enviar a capa</span>
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Máximo 5MB</span>
                        <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição / Orientações (Opcional)</Label>
                  <Textarea placeholder="Detalhes sobre a edição..." rows={3} {...register('descricao')} />
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <Label className="text-base text-indigo-900 font-semibold">Vincular às Turmas</Label>
                  {errors.turmasIds && <span className="text-xs text-red-500 block mb-2">{errors.turmasIds.message}</span>}
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {turmas?.map(turma => {
                       const isSelected = selectedTurmas.includes(turma.id)
                       return (
                         <div 
                           key={turma.id}
                           onClick={() => handleSelectTurma(turma.id)}
                           className={`p-3 border rounded-xl cursor-pointer hover:border-indigo-300 transition-all flex items-center justify-between ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-200'}`}
                         >
                            <span className={`text-sm font-medium ${isSelected ? 'text-indigo-800' : 'text-slate-600'}`}>{turma.nome}</span>
                            {isSelected && <CheckCircle className="h-4 w-4 text-indigo-600" />}
                         </div>
                       )
                    })}
                  </div>
                </div>
                
                 <DialogFooter className="pt-6">
                  <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting || isUploading}>
                    {(isSubmitting || isUploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isUploading ? 'Enviando Arquivo...' : 'Salvar Livro'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!livros || (livros as any[]).length === 0 ? (
        <Card className="border-dashed bg-slate-50/50 shadow-none border-slate-200">
           <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6 border border-slate-200">
                <BookOpen className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">Nenhum livro cadastrado</h3>
              <p className="text-slate-500 mt-2 mb-6 max-w-sm">
                 Você ainda não possui livros na sua base para este ano. Cadastre listagens de materiais para os alunos pelo painel.
              </p>
              <Button onClick={handleOpenNew} className="rounded-full">Adicionar Primeiro Livro</Button>
           </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(livros as any[]).map((livro: any) => (
              <Card key={livro.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                <div className="relative aspect-[16/10] bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100">
                  {livro.capa_url ? (
                    <img src={livro.capa_url} alt={livro.titulo} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex flex-col items-center text-slate-300">
                       <ImageIcon className="w-12 h-12 mb-1" />
                       <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sem Capa</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur shadow-sm text-indigo-700 font-bold text-[9px] uppercase tracking-wider py-0.5 px-2 border-none">
                        {livro.disciplina?.nome || 'Geral'}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="p-5 pb-3">
                  <div className="flex justify-between items-start gap-3">
                     <div className="flex-1 min-w-0">
                        <CardTitle className="leading-tight text-lg line-clamp-1" title={livro.titulo}>{livro.titulo}</CardTitle>
                        <CardDescription className="font-medium mt-0.5 line-clamp-1">Autor: {livro.autor}</CardDescription>
                     </div>
                     <div className="flex gap-1 shrink-0 bg-white shadow-sm p-1 rounded-lg border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700" onClick={() => handleEditar(livro)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => {
                           if(window.confirm('Tem certeza?')) excluirLivro.mutate(livro.id)
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                     </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                   <div className="space-y-4">
                      <div className="text-sm text-slate-600 mb-2">
                        <p><span className="font-semibold text-slate-800">Editora:</span> {livro.editora}</p>
                        {livro.isbn && <p><span className="font-semibold text-slate-800">ISBN:</span> {livro.isbn}</p>}
                        <p><span className="font-semibold text-slate-800">Status exigido:</span> {livro.estado || 'Novo'}</p>
                      </div>

                      <div>
                         <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-1">
                           <GraduationCap className="h-3 w-3" /> Turmas Vinculadas ({livro.turmas?.length || 0})
                         </p>
                         <div className="flex flex-wrap gap-1.5">
                            {livro.turmas?.map((t: any) => {
                               // Precisamos do nome da turma, como livros_turmas retorna ID, faremos lookup
                               const turmaReal = turmas?.find(tr => tr.id === t.id)
                               return (
                                  <Badge key={t.id} variant="outline" className="text-[10px] bg-slate-50">
                                    {turmaReal?.nome || 'Turma Oculta'}
                                  </Badge>
                               )
                            })}
                         </div>
                      </div>
                   </div>
                </CardContent>
             </Card>
          ))}
        </div>
      )}

      {/* Modal Independente para Nova Disciplina */}
      <Dialog open={dialogDiscOpen} onOpenChange={setDialogDiscOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Disciplina</DialogTitle>
            <DialogDescription>Adicione as disciplinas para classificar os livros.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>Nome da Disciplina</Label>
              <Input 
                value={novaDisciplina} 
                onChange={e => setNovaDisciplina(e.target.value)} 
                placeholder="Ex: Matemática, Literatura..." 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogDiscOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateDisciplina}>Salvar Adição</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
