import { useState } from 'react'
import { usePlanos, useUpsertPlano, useDeletePlano, useModulos, usePlanoModulos, useSetPlanoModulos } from '../hooks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2, Search, CheckCircle2, XCircle, Puzzle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export function PlanosPage() {
  const { data: planos, isLoading } = usePlanos()
  const { data: modulos } = useModulos()
  const upsertPlano = useUpsertPlano()
  const deletePlano = useDeletePlano()
  const setPlanoModulos = useSetPlanoModulos()

  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlano, setEditingPlano] = useState<any>(null)
  const [isModulosOpen, setIsModulosOpen] = useState(false)
  const [selectedPlanoId, setSelectedPlanoId] = useState('')
  const [selectedModuloIds, setSelectedModuloIds] = useState<string[]>([])

  const [formData, setFormData] = useState({
    nome: '',
    descricao_curta: '',
    valor_por_aluno: 0,
    status: true
  })

  const filteredPlanos = planos?.filter((p: any) =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  )

  // ===== CRUD Planos =====
  const handleOpenModal = (plano?: any) => {
    if (plano) {
      setEditingPlano(plano)
      setFormData({
        nome: plano.nome,
        descricao_curta: plano.descricao_curta || '',
        valor_por_aluno: Number(plano.valor_por_aluno),
        status: plano.status
      })
    } else {
      setEditingPlano(null)
      setFormData({ nome: '', descricao_curta: '', valor_por_aluno: 0, status: true })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await upsertPlano.mutateAsync({
        ...(editingPlano?.id ? { id: editingPlano.id } : {}),
        ...formData
      })
      toast.success(editingPlano ? 'Plano atualizado!' : 'Plano criado!')
      setIsModalOpen(false)
    } catch {
      toast.error('Erro ao salvar plano')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Desativar este plano?')) return
    try {
      await deletePlano.mutateAsync(id)
      toast.success('Plano desativado!')
    } catch {
      toast.error('Erro ao desativar plano')
    }
  }

  // ===== Módulos =====
  const handleOpenModulos = (planoId: string) => {
    setSelectedPlanoId(planoId)
    setIsModulosOpen(true)
  }

  // Carrega módulos vinculados quando o dialog abre
  const { data: planoModulos } = usePlanoModulos(selectedPlanoId)

  const handleSaveModulos = async () => {
    try {
      await setPlanoModulos.mutateAsync({ planoId: selectedPlanoId, moduloIds: selectedModuloIds })
      toast.success('Módulos do plano atualizados!')
      setIsModulosOpen(false)
    } catch {
      toast.error('Erro ao salvar módulos.')
    }
  }

  // Sincroniza checkbox ao abrir
  const moduloIdsVinculados = planoModulos?.map((pm: any) => pm.modulo_id) || []

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planos & Módulos</h1>
          <p className="text-muted-foreground">Catálogo comercial com funcionalidades atreladas a cada plano.</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" /> Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader><DialogTitle>{editingPlano ? 'Editar Plano' : 'Criar Novo Plano'}</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Plano</Label>
                  <Input id="nome" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Descrição Curta</Label>
                  <Textarea id="desc" value={formData.descricao_curta} onChange={e => setFormData({ ...formData, descricao_curta: e.target.value })} rows={2} placeholder="Resumo para exibição no checkout..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor por Aluno (R$)</Label>
                  <Input id="valor" type="number" step="0.01" value={formData.valor_por_aluno} onChange={e => setFormData({ ...formData, valor_por_aluno: parseFloat(e.target.value) })} required />
                </div>
                <div className="flex items-center gap-2">
                  <Label>Status:</Label>
                  <Badge variant={formData.status ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => setFormData({ ...formData, status: !formData.status })}>
                    {formData.status ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={upsertPlano.isPending}>
                  {upsertPlano.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog de Módulos */}
      <Dialog open={isModulosOpen} onOpenChange={setIsModulosOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Módulos do Plano</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">Selecione quais módulos este plano oferece às escolas.</p>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {modulos?.map((m: any) => {
              const isChecked = selectedModuloIds.includes(m.id)
              return (
                <label key={m.id} className="flex items-start gap-3 p-3 rounded-lg border border-zinc-100 hover:bg-zinc-50/50 cursor-pointer transition-colors">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedModuloIds([...selectedModuloIds, m.id])
                      else setSelectedModuloIds(selectedModuloIds.filter(id => id !== m.id))
                    }}
                  />
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{m.nome}</p>
                    <p className="text-xs text-muted-foreground">{m.descricao || m.codigo}</p>
                  </div>
                </label>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModulosOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveModulos} disabled={setPlanoModulos.isPending}>
              {setPlanoModulos.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar Módulos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar planos..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor p/ Aluno</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlanos?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Nenhum plano encontrado.</TableCell>
                </TableRow>
              ) : (
                filteredPlanos?.map((plano: any) => (
                  <TableRow key={plano.id}>
                    <TableCell className="font-bold">{plano.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{plano.descricao_curta || '—'}</TableCell>
                    <TableCell className="font-bold text-indigo-700">R$ {Number(plano.valor_por_aluno).toFixed(2)}</TableCell>
                    <TableCell>
                      {plano.status ? (
                        <div className="flex items-center text-emerald-600 gap-1 text-sm font-medium"><CheckCircle2 className="h-4 w-4" />Ativo</div>
                      ) : (
                        <div className="flex items-center text-zinc-400 gap-1 text-sm font-medium"><XCircle className="h-4 w-4" />Inativo</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => {
                          handleOpenModulos(plano.id)
                          setSelectedModuloIds(moduloIdsVinculados)
                        }}>
                          <Puzzle className="h-4 w-4 text-indigo-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(plano)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(plano.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
