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
  Settings2
} from 'lucide-react'
import { 
  useMarketplaceCategorias, 
  useCriarCategoria, 
  useAtualizarCategoria, 
  useExcluirCategoria 
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

const ICON_OPTIONS = [
  { name: 'Package', icon: Package },
  { name: 'Tag', icon: Tag },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Users', icon: Users },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'Settings2', icon: Settings2 },
]

export function MarketplaceConfigPage() {
  const { data: categorias, isLoading } = useMarketplaceCategorias()
  const criarCategoria = useCriarCategoria()
  const atualizarCategoria = useAtualizarCategoria()
  const excluirCategoria = useExcluirCategoria()

  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    icone: 'Package',
    ativo: true
  })

  const filteredCategorias = categorias?.filter((c: any) =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  )

  const handleOpenModal = (cat?: any) => {
    if (cat) {
      setEditingCat(cat)
      setFormData({
        nome: cat.nome,
        descricao: cat.descricao || '',
        icone: cat.icone || 'Package',
        ativo: cat.ativo
      })
    } else {
      setEditingCat(null)
      setFormData({ nome: '', descricao: '', icone: 'Package', ativo: true })
    }
    setIsModalOpen(true)
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
          <p className="text-slate-500 font-medium">Gestão de categorias e regras globais de comercialização.</p>
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

      {/* Grid Principal */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50 p-6 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Categorias Permitidas</CardTitle>
                <CardDescription className="font-medium">Define as opções que estarão disponíveis para os lojistas.</CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Buscar categoria..." 
                  className="pl-10 h-10 rounded-xl bg-white border-slate-200 shadow-sm focus:border-indigo-500 transition-all font-medium" 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                />
              </div>
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

        {/* Informação Adicional/Dica */}
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
    </div>
  )
}
