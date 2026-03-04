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
import { BookOpen, Plus, Loader2, Edit2, Trash2, Library, GraduationCap, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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
    
    setDialogOpen(true)
  }

  const handleOpenNew = () => {
    setLivroParaEditar(null)
    reset({
      ano_letivo: new Date().getFullYear(),
      turmasIds: [],
      estado: 'Novo'
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data: any) => {
    if (!authUser) return
    const formData = data as LivroFormValues
    try {
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
          },
          turmasIds: formData.turmasIds
        })
        toast.success('Livro cadastrado com sucesso!')
      }
      setDialogOpen(false)
    } catch {
      toast.error('Ocorreu um erro ao salvar o livro.')
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
           <Dialog open={dialogDiscOpen} onOpenChange={setDialogDiscOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700">
                <Plus className="h-4 w-4 mr-1" /> Disciplina
              </Button>
            </DialogTrigger>
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
                     <Label>Disciplina *</Label>
                     <Select onValueChange={(v) => setValue('disciplina_id', v)} defaultValue={watch('disciplina_id')}>
                        <SelectTrigger>
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
                        <SelectTrigger>
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
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar Livro
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
             <Card key={livro.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                <CardHeader className="p-5 pb-3 bg-gradient-to-b from-slate-50 to-white">
                  <div className="flex justify-between items-start gap-3">
                     <div>
                        <Badge variant="secondary" className="mb-2 bg-indigo-50 text-indigo-700 font-semibold tracking-wide border-indigo-100">
                           {livro.disciplina?.nome || 'Geral'}
                        </Badge>
                        <CardTitle className="leading-tight text-lg line-clamp-2" title={livro.titulo}>{livro.titulo}</CardTitle>
                        <CardDescription className="font-medium mt-1">Autor: {livro.autor}</CardDescription>
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
    </div>
  )
}
