import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  ShoppingBag,
  Tag,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Package,
  BookOpen,
  Users,
  Settings2,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  Eye,
  Briefcase,
  ExternalLink,
  MapPin,
  AlertTriangle,
  FileText,
  User,
  Power
} from 'lucide-react'
import {
  useMarketplaceCategorias,
  useCriarCategoria,
  useAtualizarCategoria,
  useExcluirCategoria,
  useLojistas,
  useProfissionais
} from '../marketplace.hooks'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { X } from 'lucide-react'

const ICON_OPTIONS = [
  { name: 'Package', icon: Package },
  { name: 'Tag', icon: Tag },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Users', icon: Users },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'Settings2', icon: Settings2 },
]

export function MarketplaceConfigPage() {
  const { data: categorias, isLoading: isLoadingCategorias } = useMarketplaceCategorias()
  const { data: lojistas, isLoading: loadingLojistas } = useLojistas()
  const { data: profissionais, isLoading: loadingProfissionais } = useProfissionais()
  
  const criarCategoria = useCriarCategoria()
  const atualizarCategoria = useAtualizarCategoria()
  const excluirCategoria = useExcluirCategoria()

  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    icone: 'Package',
    ativo: true,
    subcategorias: [] as string[]
  })
  const [newSubcat, setNewSubcat] = useState('')

  const filteredCategorias = categorias?.filter((c: any) =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  )

  const _categoriasCount = filteredCategorias?.length || 0

  const filteredLojistas = lojistas?.filter((l: any) =>
    l.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.cnpj.includes(searchTerm)
  )

  const filteredProfissionais = profissionais?.filter((p: any) =>
    (p as any).usuarios_sistema?.email_login?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf?.includes(searchTerm)
  )

  const lojistasCount = filteredLojistas?.length || 0
  const profissionaisCount = filteredProfissionais?.length || 0

  const handleOpenModal = (cat?: any) => {
    if (cat) {
      setEditingCat(cat)
      setFormData({
        nome: cat.nome,
        descricao: cat.descricao || '',
        icone: cat.icone || 'Package',
        ativo: cat.ativo,
        subcategorias: cat.subcategorias || []
      })
    } else {
      setEditingCat(null)
      setFormData({ 
        nome: '', 
        descricao: '', 
        icone: 'Package', 
        ativo: true,
        subcategorias: [] 
      })
    }
    setIsModalOpen(true)
  }

  const addSubcat = () => {
    if (!newSubcat.trim()) return
    if (formData.subcategorias.includes(newSubcat.trim())) {
      toast.error('Esta subcategoria já existe')
      return
    }
    setFormData({ ...formData, subcategorias: [...formData.subcategorias, newSubcat.trim()] })
    setNewSubcat('')
  }

  const removeSubcat = (sc: string) => {
    setFormData({ ...formData, subcategorias: formData.subcategorias.filter(s => s !== sc) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCat) {
      await atualizarCategoria.mutateAsync({ id: editingCat.id, updates: formData })
    } else {
      await criarCategoria.mutateAsync(formData)
    }
    setIsModalOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta categoria? Isso pode afetar produtos vinculados.')) return
    await excluirCategoria.mutateAsync(id)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo': return <Badge className="bg-emerald-500 hover:bg-emerald-600 uppercase text-[10px]">Ativo</Badge>
      case 'pendente': return <Badge variant="outline" className="text-amber-600 border-amber-600 bg-amber-50 uppercase text-[10px]">Pendente</Badge>
      case 'inativo': return <Badge variant="destructive" className="uppercase text-[10px]">Inativo</Badge>
      default: return <Badge variant="secondary" className="uppercase text-[10px]">{status}</Badge>
    }
  }

  const isLoading = isLoadingCategorias || loadingLojistas || loadingProfissionais

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-indigo-600" />
            Marketplace
          </h1>
          <p className="text-slate-500 font-medium">Gestão de categorias, lojistas e profissionais do ecossistema.</p>
        </div>
      </div>

      <Tabs defaultValue="categorias" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="categorias" className="rounded-lg gap-2 px-6">
            <Tag size={16} /> Categorias
          </TabsTrigger>
          <TabsTrigger value="lojistas" className="rounded-lg gap-2 px-6">
            <ShoppingBag size={16} /> Lojistas
          </TabsTrigger>
          <TabsTrigger value="profissionais" className="rounded-lg gap-2 px-6">
            <Briefcase size={16} /> Profissionais
          </TabsTrigger>
        </TabsList>

        {/* ABA CATEGORIAS */}
        <TabsContent value="categorias">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar categoria..."
                  className="pl-10 h-10 rounded-xl bg-white border-slate-200 shadow-sm focus:border-indigo-500 transition-all font-medium"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95">
                    <Plus className="mr-2 h-5 w-5" /> Nova Categoria
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md rounded-2xl border-0 shadow-2xl">
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">{editingCat ? 'Editar Categoria' : 'Criar Categoria'}</DialogTitle>
                      <DialogDescription className="font-medium text-slate-500">
                        Categorias mandatórias para lojistas do ecossistema.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-6">
                      <div className="space-y-2">
                        <Label htmlFor="nome" className="text-xs font-bold uppercase tracking-widest text-slate-400">Nome da Categoria</Label>
                        <Input
                          id="nome"
                          placeholder="Ex: Material Escolar"
                          value={formData.nome}
                          onChange={e => setFormData({ ...formData, nome: e.target.value })}
                          required
                          className="h-11 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="icone" className="text-xs font-bold uppercase tracking-widest text-slate-400">Ícone Representativo</Label>
                        <div className="grid grid-cols-6 gap-2">
                          {ICON_OPTIONS.map((item) => (
                            <button
                              key={item.name}
                              type="button"
                              onClick={() => setFormData({ ...formData, icone: item.name })}
                              className={cn(
                                "h-10 w-10 flex items-center justify-center rounded-lg border transition-all",
                                formData.icone === item.name
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm"
                                  : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50"
                              )}
                            >
                              <item.icon className="h-5 w-5" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="desc" className="text-xs font-bold uppercase tracking-widest text-slate-400">Descrição (Opcional)</Label>
                        <Textarea
                          id="desc"
                          value={formData.descricao}
                          onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                          rows={3}
                          placeholder="Para que serve esta categoria..."
                          className="rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <Label className="text-sm font-bold text-slate-700">Categoria Ativa</Label>
                        <Badge
                          variant={formData.ativo ? 'default' : 'secondary'}
                          className={cn(
                            "cursor-pointer px-3 py-1 rounded-md font-bold uppercase text-[10px]",
                            formData.ativo ? "bg-emerald-500 hover:bg-emerald-600" : "bg-slate-300"
                          )}
                          onClick={() => setFormData({ ...formData, ativo: !formData.ativo })}
                        >
                          {formData.ativo ? 'Sim' : 'Não'}
                        </Badge>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Subcategorias</Label>
                        <div className="flex gap-2">
                           <Input 
                             placeholder="Ex: Livros de Arte, Uniforme de Inverno..." 
                             value={newSubcat}
                             onChange={e => setNewSubcat(e.target.value)}
                             onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubcat())}
                             className="h-10 rounded-xl border-slate-200"
                           />
                           <Button type="button" onClick={addSubcat} className="bg-slate-900 h-10 w-10 p-0 rounded-xl shrink-0"><Plus size={18}/></Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.subcategorias.map(sc => (
                            <Badge key={sc} variant="secondary" className="pl-3 pr-1 py-1 gap-1 border-slate-200 rounded-lg bg-white text-slate-600 font-bold uppercase text-[9px]">
                              {sc}
                              <button 
                                type="button" 
                                onClick={() => removeSubcat(sc)}
                                className="h-4 w-4 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
                              >
                                <X size={10} />
                              </button>
                            </Badge>
                          ))}
                          {formData.subcategorias.length === 0 && (
                            <p className="text-[10px] text-slate-400 italic">Nenhuma subcategoria adicionada.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold h-11 text-slate-500">
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={criarCategoria.isPending || atualizarCategoria.isPending}
                        className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold h-11 px-8 shadow-lg shadow-indigo-100"
                      >
                        {(criarCategoria.isPending || atualizarCategoria.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Categoria
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-50 p-8 pt-10 bg-slate-50/30">
                <div>
                  <CardTitle className="text-2xl font-black tracking-tighter text-slate-900">Categorias Permitidas</CardTitle>
                  <CardDescription className="font-medium">Define as opções que estarão disponíveis para os lojistas.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-20 pl-8 h-12"></TableHead>
                        <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest pl-0">Nome da Categoria</TableHead>
                        <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Descrição</TableHead>
                        <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                        <TableHead className="text-right font-bold text-slate-400 uppercase text-[10px] tracking-widest pr-8">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCategorias?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-48 text-center bg-slate-50/20">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                                <AlertCircle className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">Nenhuma categoria encontrada</p>
                                <p className="text-sm text-slate-400 font-medium">Crie categorias para começar a configurar seu marketplace.</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCategorias?.map((cat: any) => {
                          const IconComp = ICON_OPTIONS.find(i => i.name === cat.icone)?.icon || Package
                          return (
                            <TableRow key={cat.id} className="group hover:bg-slate-50/50 transition-colors">
                              <TableCell className="w-20 pl-8">
                                <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
                                  <IconComp className="h-5 w-5" />
                                </div>
                              </TableCell>
                              <TableCell className="font-bold text-slate-900 pl-0">
                                {cat.nome}
                              </TableCell>
                              <TableCell className="text-sm text-slate-500 font-medium max-w-[300px] truncate">
                                {cat.descricao || 'Nenhuma descrição informada.'}
                              </TableCell>
                              <TableCell className="text-center">
                                {cat.ativo ? (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> ATIVA
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-xs font-bold border border-slate-100">
                                    <XCircle className="h-3.5 w-3.5" /> INATIVA
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right pr-8">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title={cat.ativo ? 'Desativar Categoria' : 'Ativar Categoria'}
                                    onClick={() => atualizarCategoria.mutate({ id: cat.id, updates: { ativo: !cat.ativo } })}
                                    className={cn(
                                      "h-9 w-9 rounded-lg border border-transparent transition-all",
                                      cat.ativo ? "text-amber-500 hover:bg-amber-50 hover:border-amber-100" : "text-emerald-500 hover:bg-emerald-50 hover:border-emerald-100"
                                    )}
                                  >
                                    <Power className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenModal(cat)}
                                    className="h-9 w-9 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100"
                                    onClick={() => handleDelete(cat.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl shadow-xl shadow-indigo-100 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 -rotate-12 transition-transform group-hover:scale-125 duration-1000">
                <Settings2 size={160} />
              </div>
              <div className="flex items-start gap-6 relative z-10">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-lg">
                  <AlertCircle size={24} />
                </div>
                <div className="space-y-4">
                  <h4 className="text-xl font-bold italic uppercase tracking-tighter">Regras do Ecossistema</h4>
                  <p className="text-sm font-medium text-indigo-50 leading-relaxed max-w-2xl">
                    As categorias aqui definidas são sementes globais. Elas garantem a padronização e a curadoria necessária para que o marketplace mantenha a qualidade educacional exigida pelo Fluxoo.
                    <br /><br />
                    <strong>Dica:</strong> Mantenha nomes curtos e descrições claras para facilitar a escolha do lojista no momento do cadastro.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ABA LOJISTAS */}
        <TabsContent value="lojistas">
          <Card className="border-0 shadow-xl shadow-zinc-200/50 overflow-hidden bg-white">
            <CardHeader className="pt-[30px] border-b bg-zinc-50/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-zinc-900 flex items-center gap-2">
                    Lojistas Ativos
                    <Badge className="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-50 text-[10px] uppercase font-bold py-0 h-5">
                      {lojistasCount}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-zinc-500 font-medium tracking-tight">
                    Parceiros comerciais que oferecem produtos no ecossistema Fluxoo.
                  </CardDescription>
                </div>
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar lojista por nome ou CNPJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 rounded-xl bg-white border-slate-200 shadow-sm focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-zinc-50/50">
                  <TableRow>
                    <TableHead className="pl-8 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Empresa</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Categoria</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Contato</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Plano</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right pr-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLojistas?.length ? filteredLojistas.map((lojista: any) => (
                    <TableRow key={lojista.id} className="group hover:bg-zinc-50/50 transition-colors">
                      <TableCell className="pl-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
                            <ShoppingBag className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900 leading-tight mb-0.5">{lojista.razao_social}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{lojista.cnpj}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-zinc-100 text-zinc-600">
                          {lojista.categoria || 'Não definida'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-zinc-600">
                            <Mail size={12} className="text-zinc-400" /> {lojista.email}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                            <Phone size={12} className="text-zinc-400" /> {lojista.telefone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-bold text-indigo-600 uppercase tracking-tighter">{lojista.plano_id}</p>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(lojista.status)}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem><Eye size={14} className="mr-2" /> Ver Perfil</DropdownMenuItem>
                            <DropdownMenuItem><CheckCircle2 size={14} className="mr-2" /> Alterar Plano</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600"><AlertTriangle size={14} className="mr-2" /> Suspender</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                        Nenhum lojista encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA PROFISSIONAIS */}
        <TabsContent value="profissionais">
          <Card className="border-0 shadow-xl shadow-zinc-200/50 overflow-hidden bg-white">
            <CardHeader className="pt-[30px] border-b bg-zinc-50/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-zinc-900 flex items-center gap-2">
                    Profissionais Disponíveis
                    <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-50 text-[10px] uppercase font-bold py-0 h-5">
                      {profissionaisCount}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-zinc-500 font-medium tracking-tight">
                    Currículos ativos para vagas ou prestadores de serviços autônomos.
                  </CardDescription>
                </div>
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar profissional por e-mail ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 rounded-xl bg-white border-slate-200 shadow-sm focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-zinc-50/50">
                  <TableRow>
                    <TableHead className="pl-8 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Profissional</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Interesses</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Modalidade</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Cadastro</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right pr-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfissionais?.length ? filteredProfissionais.map((prof: any) => (
                    <TableRow key={prof.id} className="group hover:bg-zinc-50/50 transition-colors">
                      <TableCell className="pl-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900 leading-tight mb-0.5">{(prof as any).usuarios_sistema?.email_login}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{prof.cpf}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {prof.areas_interesse?.slice(0, 2).map((area: string) => (
                            <Badge key={area} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-[9px] uppercase">
                              {area}
                            </Badge>
                          ))}
                          {prof.areas_interesse?.length > 2 && (
                            <span className="text-[10px] text-muted-foreground">+{prof.areas_interesse.length - 2}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {prof.busca_vaga && (
                            <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-bold uppercase">
                              <Briefcase size={10} /> Busca Vaga
                            </div>
                          )}
                          {prof.presta_servico && (
                            <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-bold uppercase">
                              <CheckCircle2 size={10} /> Presta Serviço
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                          <Calendar size={12} /> {format(new Date(prof.created_at), "dd/MM/yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(prof.is_ativo ? 'ativo' : 'inativo')}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Opções Professional</DropdownMenuLabel>
                            <DropdownMenuItem><FileText size={14} className="mr-2" /> Ver Currículo</DropdownMenuItem>
                            <DropdownMenuItem><Mail size={14} className="mr-2" /> Entrar em Contato</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600"><AlertTriangle size={14} className="mr-2" /> Desativar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                        Nenhum profissional cadastrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
