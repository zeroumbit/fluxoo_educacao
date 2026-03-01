import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useItensAlmoxarifado, useCriarItemAlmoxarifado, useMovimentacoes, useCriarMovimentacao, useAtualizarItemAlmoxarifado, useDeletarItemAlmoxarifado } from '../hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Loader2, Package, ArrowDownUp, AlertTriangle, Edit2, Trash2 } from 'lucide-react'
import { DialogFooter, DialogDescription } from '@/components/ui/dialog'

const itemSchema = z.object({ nome: z.string().min(1), categoria: z.string().optional(), quantidade: z.coerce.number().min(0), alerta_estoque_minimo: z.coerce.number().optional(), custo_unitario: z.coerce.number().optional() })
const movSchema = z.object({ item_id: z.string().min(1), tipo: z.enum(['entrada', 'saida']), quantidade: z.coerce.number().min(1), justificativa: z.string().optional() })

export function AlmoxarifadoPage() {
  const { authUser } = useAuth()
  const { data: itens, isLoading } = useItensAlmoxarifado()
  const { data: movs } = useMovimentacoes()
  const criarItem = useCriarItemAlmoxarifado()
  const atualizarItem = useAtualizarItemAlmoxarifado()
  const deletarItem = useDeletarItemAlmoxarifado()
  const criarMov = useCriarMovimentacao()
  const [openItem, setOpenItem] = useState(false)
  const [openMov, setOpenMov] = useState(false)
  const [itemParaEditar, setItemParaEditar] = useState<any | null>(null)
  const [itemParaDeletar, setItemParaDeletar] = useState<any | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const itemForm = useForm({ resolver: zodResolver(itemSchema) })
  const movForm = useForm({ resolver: zodResolver(movSchema), defaultValues: { tipo: 'entrada' as const } })

  const onSubmitItem = async (data: any) => {
    if (!authUser) return
    try {
      if (itemParaEditar) {
        await atualizarItem.mutateAsync({ id: itemParaEditar.id, data })
        toast.success('Item atualizado!')
      } else {
        await criarItem.mutateAsync({ ...data, tenant_id: authUser.tenantId })
        toast.success('Item cadastrado!')
      }
      itemForm.reset()
      setOpenItem(false)
      setItemParaEditar(null)
    } catch {
      toast.error('Erro ao salvar')
    }
  }

  const handleEditar = (item: any) => {
    setItemParaEditar(item)
    itemForm.setValue('nome', item.nome)
    itemForm.setValue('categoria', item.categoria || '')
    itemForm.setValue('quantidade', item.quantidade)
    itemForm.setValue('alerta_estoque_minimo', item.alerta_estoque_minimo || 0)
    itemForm.setValue('custo_unitario', item.custo_unitario || 0)
    setOpenItem(true)
  }

  const handleDeletar = (item: any) => {
    setItemParaDeletar(item)
    setDeleteOpen(true)
  }

  const confirmarExclusao = async () => {
    if (!itemParaDeletar) return
    try {
      await deletarItem.mutateAsync(itemParaDeletar.id)
      toast.success('Item excluído!')
      setDeleteOpen(false)
      setItemParaDeletar(null)
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const onSubmitMov = async (data: any) => {
    if (!authUser) return
    try { await criarMov.mutateAsync({ ...data, tenant_id: authUser.tenantId }); toast.success('Movimentação registrada!'); movForm.reset(); setOpenMov(false) }
    catch { toast.error('Erro') }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">Almoxarifado</h1><p className="text-muted-foreground">Controle de estoque e materiais</p></div>
        <div className="flex gap-2">
          <Dialog open={openMov} onOpenChange={setOpenMov}>
            <DialogTrigger asChild><Button variant="outline"><ArrowDownUp className="mr-2 h-4 w-4" />Movimentação</Button></DialogTrigger>
            <DialogContent className="max-w-[800px]">
              <DialogHeader>
                <DialogTitle>Movimentação de Estoque</DialogTitle>
                <DialogDescription>Registre uma entrada ou saída de itens do almoxarifado.</DialogDescription>
              </DialogHeader>
              <form onSubmit={movForm.handleSubmit(onSubmitMov)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Item *</Label>
                  <Select onValueChange={(v) => movForm.setValue('item_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um item" />
                    </SelectTrigger>
                    <SelectContent>
                      {itens?.map((i: any) => (
                        <SelectItem key={i.id} value={i.id}>{i.nome} (Estoque: {i.quantidade})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Movimentação</Label>
                  <RadioGroup defaultValue="entrada" onValueChange={(v) => movForm.setValue('tipo', v as any)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="entrada" id="ent" />
                      <Label htmlFor="ent" className="text-emerald-700 font-medium">Entrada</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="saida" id="sai" />
                      <Label htmlFor="sai" className="text-red-700 font-medium">Saída</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>Quantidade *</Label>
                  <Input type="number" min="1" placeholder="0" {...movForm.register('quantidade')} />
                </div>
                <div className="space-y-2">
                  <Label>Justificativa</Label>
                  <Input placeholder="Ex: Compra mensal, Uso em sala de aula..." {...movForm.register('justificativa')} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpenMov(false)}>Cancelar</Button>
                  <Button type="submit">Registrar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={openItem} onOpenChange={setOpenItem}>
            <DialogTrigger asChild>
              <Button onClick={() => { setItemParaEditar(null); itemForm.reset({ nome: '', categoria: '', quantidade: 0, alerta_estoque_minimo: 0, custo_unitario: 0 }); }} className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md">
                <Plus className="mr-2 h-4 w-4" />Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[800px]">
              <DialogHeader>
                <DialogTitle>{itemParaEditar ? 'Editar Item' : 'Novo Item'}</DialogTitle>
                <DialogDescription>
                  {itemParaEditar ? 'Atualize as informações do item no almoxarifado.' : 'Cadastre um novo item no almoxarifado da escola.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={itemForm.handleSubmit(onSubmitItem)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input placeholder="Ex: Resma de papel A4, Caixa de lápis..." {...itemForm.register('nome')} />
                  {itemForm.formState.errors.nome && <p className="text-sm text-destructive">{itemForm.formState.errors.nome.message as string}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select onValueChange={(v) => itemForm.setValue('categoria', v)} defaultValue={itemForm.getValues('categoria')}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="material_didatico">Material Didático</SelectItem>
                        <SelectItem value="limpeza">Limpeza</SelectItem>
                        <SelectItem value="papelaria">Papelaria</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantidade Inicial *</Label>
                    <Input type="number" min="0" placeholder="0" {...itemForm.register('quantidade')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Custo Unitário (R$)</Label>
                    <Input type="number" step="0.01" placeholder="0,00" {...itemForm.register('custo_unitario')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Alerta Estoque Mínimo</Label>
                    <Input type="number" placeholder="Ex: 10" {...itemForm.register('alerta_estoque_minimo')} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setOpenItem(false); setItemParaEditar(null); itemForm.reset(); }}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {itemParaEditar ? 'Salvar alterações' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="estoque">
        <TabsList><TabsTrigger value="estoque"><Package className="h-4 w-4 mr-1" />Estoque</TabsTrigger><TabsTrigger value="historico"><ArrowDownUp className="h-4 w-4 mr-1" />Histórico</TabsTrigger></TabsList>
        <TabsContent value="estoque">
          <Card className="border-0 shadow-md"><CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Categoria</TableHead><TableHead>Quantidade</TableHead><TableHead>Custo Unit.</TableHead><TableHead>Alerta</TableHead><TableHead className="w-[100px]">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {itens?.map((i: any) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-bold">{i.nome}</TableCell>
                    <TableCell><Badge variant="outline">{i.categoria || '—'}</Badge></TableCell>
                    <TableCell>
                      <span className={i.quantidade <= (i.alerta_estoque_minimo || 0) ? 'text-red-600 font-bold' : ''}>{i.quantidade}</span>
                      {i.quantidade <= (i.alerta_estoque_minimo || 0) && <AlertTriangle className="inline ml-1 h-4 w-4 text-red-500" />}
                    </TableCell>
                    <TableCell>R$ {Number(i.custo_unitario || 0).toFixed(2)}</TableCell>
                    <TableCell>{i.alerta_estoque_minimo || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleEditar(i)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeletar(i)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!itens || itens.length === 0) && <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground"><Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />Nenhum item cadastrado.</TableCell></TableRow>}
              </TableBody></Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="historico">
          <Card className="border-0 shadow-md"><CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Tipo</TableHead><TableHead>Qtd.</TableHead><TableHead>Justificativa</TableHead><TableHead>Data</TableHead></TableRow></TableHeader>
              <TableBody>
                {movs?.map((m: any) => (
                  <TableRow key={m.id}><TableCell className="font-bold">{m.item?.nome || '—'}</TableCell>
                    <TableCell><Badge className={m.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>{m.tipo === 'entrada' ? '+ Entrada' : '- Saída'}</Badge></TableCell>
                    <TableCell>{m.quantidade}</TableCell><TableCell>{m.justificativa || '—'}</TableCell><TableCell className="text-sm text-muted-foreground">{new Date(m.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  </TableRow>))}
                {(!movs || movs.length === 0) && <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Nenhuma movimentação.</TableCell></TableRow>}
              </TableBody></Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O item será permanentemente removido do almoxarifado.
            </DialogDescription>
          </DialogHeader>
          {itemParaDeletar && (
            <div className="p-4 bg-zinc-50 rounded-lg">
              <p className="text-sm font-medium">Item: {itemParaDeletar.nome}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Quantidade atual: {itemParaDeletar.quantidade}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarExclusao}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
