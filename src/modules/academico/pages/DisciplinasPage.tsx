import { useState } from 'react'
import { useAuth } from '@/modules/auth/AuthContext'
import { useCatalogoDisciplinas, useToggleDisciplinaAtiva, useCriarDisciplina } from '@/modules/turmas/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Library, 
  Plus, 
  Search, 
  Settings2, 
  CheckCircle2, 
  AlertCircle,
  BookOpen
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

export function DisciplinasPage() {
  const { authUser } = useAuth()
  const tenantId = authUser?.tenantId || 'PENDING_TENANT'
  
  const { data: disciplinas, isLoading } = useCatalogoDisciplinas(tenantId)
  const toggleAtiva = useToggleDisciplinaAtiva()
  const criarDisciplina = useCriarDisciplina()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novaEtapa, setNovaEtapa] = useState('TODAS')
  const [novaCategoria, setNovaCategoria] = useState('Outros')

  const handleToggle = (id: string, isGlobal: boolean, ativa: boolean) => {
    toggleAtiva.mutate({
      disciplinaId: id,
      tenantId: tenantId,
      isGlobal: isGlobal,
      ocultar: ativa // Se está ativa, o toggle vai ocultar (ativa -> false)
    })
  }

  const handleCriar = async () => {
    if (!novoNome.trim()) return
    await criarDisciplina.mutateAsync({
      nome: novoNome.trim(),
      tenantId,
      etapa: novaEtapa,
      categoria: novaCategoria
    })
    setNovoNome('')
    setIsOpen(false)
  }

  const filtered = disciplinas?.filter(d => 
    d.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-4 lg:px-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Gestão de Disciplinas</h1>
          <p className="text-zinc-500 max-w-2xl text-sm lg:text-base">
            Gerencie o catálogo da sua escola. Ative ou desative disciplinas do padrão BNCC ou adicione suas próprias disciplinas personalizadas.
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 h-11 lg:h-10">
              <Plus className="h-4 w-4" />
              <span className="font-semibold">Nova Disciplina</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                Nova Disciplina Principal
              </DialogTitle>
              <DialogDescription>
                Esta disciplina será salva apenas para a sua unidade atual e estará disponível para todas as turmas.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nome da Disciplina</label>
                <Input 
                  placeholder="Ex: Robótica Avançada" 
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="rounded-xl border-zinc-200 h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Etapa Sugerida</label>
                  <Select value={novaEtapa} onValueChange={setNovaEtapa}>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODAS">Geral (Todas)</SelectItem>
                      <SelectItem value="EI">Educação Infantil</SelectItem>
                      <SelectItem value="EF1">Fundamental 1</SelectItem>
                      <SelectItem value="EF2">Fundamental 2</SelectItem>
                      <SelectItem value="EM">Ensino Médio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Categoria</label>
                  <Select value={novaCategoria} onValueChange={setNovaCategoria}>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Outros">Outros / Extra</SelectItem>
                      <SelectItem value="Linguagens">Linguagens</SelectItem>
                      <SelectItem value="Matemática">Matemática</SelectItem>
                      <SelectItem value="Ciências da Natureza">Ciências da Natureza</SelectItem>
                      <SelectItem value="Ciências Humanas">Ciências Humanas</SelectItem>
                      <SelectItem value="Itinerários">Itinerários</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl">Cancelar</Button>
              <Button onClick={handleCriar} disabled={criarDisciplina.isPending} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8 h-11">
                {criarDisciplina.isPending ? 'Salvando...' : 'Criar Agora'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="px-4 lg:px-0 space-y-6">
        {/* Busca */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
          <Input 
            placeholder="Filtrar por nome ou categoria..." 
            className="pl-12 h-12 lg:h-11 rounded-2xl lg:rounded-xl border-zinc-200 focus-visible:ring-indigo-500 shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Lista de Disciplinas */}
        <div className="rounded-2xl lg:rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50/80">
                <TableRow className="hover:bg-transparent border-b-zinc-200">
                  <TableHead className="w-[45%] h-12 text-zinc-500 font-bold uppercase text-[10px] tracking-widest pl-6">Disciplina / Catálogo</TableHead>
                  <TableHead className="h-12 text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Etapa</TableHead>
                  <TableHead className="h-12 text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Categoria</TableHead>
                  <TableHead className="h-12 text-zinc-500 font-bold uppercase text-[10px] tracking-widest text-right pr-6">Visibilidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 14 }).map((_, i) => (
                    <TableRow key={i} className="border-b-zinc-100">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                           <Skeleton className="h-10 w-10 rounded-xl" />
                           <div className="space-y-2">
                             <Skeleton className="h-4 w-32" />
                             <Skeleton className="h-3 w-20" />
                           </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="pr-6 text-right"><Skeleton className="h-6 w-12 ml-auto rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : filtered?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-3 py-10 opacity-50">
                        <div className="h-16 w-16 rounded-3xl bg-zinc-100 flex items-center justify-center">
                          <Search className="h-8 w-8 text-zinc-400" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-zinc-900">Nenhuma disciplina encontrada</p>
                          <p className="text-sm text-zinc-500">Tente ajustar seus termos de busca.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered?.map((d) => (
                  <TableRow key={d.id} className="group hover:bg-zinc-50/50 transition-colors border-b-zinc-100 last:border-0 h-20 lg:h-16">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-4">
                        <div 
                          className="h-11 w-11 lg:h-9 lg:w-9 rounded-2xl lg:rounded-xl flex items-center justify-center text-[10px] lg:text-[9px] font-black text-white shadow-md transition-transform group-hover:scale-110 group-hover:-rotate-3"
                          style={{ backgroundColor: d.cor }}
                        >
                          {d.codigo}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-base lg:text-sm text-zinc-900 truncate tracking-tight">{d.nome}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {d.is_global ? (
                              <Badge variant="outline" className="text-[9px] lg:text-[8px] py-0 h-4 uppercase font-black bg-indigo-50/80 text-indigo-700 border-indigo-200/50 tracking-tighter flex items-center gap-1">
                                <Library className="h-2 w-2" />
                                BNCC Oficial
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] lg:text-[8px] py-0 h-4 uppercase font-black bg-emerald-50 text-emerald-700 border-emerald-200/50 tracking-tighter">
                                Personalizada
                              </Badge>
                            )}
                            {d.ativa ? (
                              <span className="flex items-center gap-1 text-[10px] lg:text-[9px] font-bold text-emerald-600">
                                <CheckCircle2 className="h-2 w-2" /> Ativa na Unidade
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] lg:text-[9px] font-bold text-zinc-400">
                                <AlertCircle className="h-2 w-2" /> Oculta pela Unidade
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-black text-[10px] uppercase h-6 lg:h-5 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors">
                        {d.etapa === 'TODAS' ? 'Geral' : d.etapa}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-500 text-xs font-medium italic">
                      {d.categoria}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-4 lg:gap-3">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest transition-colors",
                          d.ativa ? "text-emerald-600" : "text-zinc-400"
                        )}>
                          {d.ativa ? 'Visível' : 'Oculta'}
                        </span>
                        <Switch 
                          checked={d.ativa}
                          onCheckedChange={() => handleToggle(d.id, d.is_global, d.ativa)}
                          className="data-[state=checked]:bg-indigo-600 border-2"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Footer Info */}
        <div className="flex items-center gap-4 p-5 rounded-2xl lg:rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/50 group shadow-sm">
          <div className="h-10 w-10 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
            <Settings2 className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
              <strong className="text-indigo-900">Como funciona:</strong> Desativar disciplinas BNCC apenas as oculta nos formulários de criação de turmas e horários para a sua escola. Disciplinas criadas pela escola são salvas imediatamente e podem ser usadas por qualquer gestor.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
