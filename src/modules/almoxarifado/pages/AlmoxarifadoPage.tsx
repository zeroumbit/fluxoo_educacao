import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useItensAlmoxarifado, useCriarItemAlmoxarifado, useMovimentacoes, useCriarMovimentacao } from '../hooks'
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
import { Plus, Loader2, Package, ArrowDownUp, AlertTriangle } from 'lucide-react'
import { DialogFooter, DialogDescription } from '@/components/ui/dialog'

const itemSchema = z.object({ nome: z.string().min(1), categoria: z.string().optional(), quantidade: z.coerce.number().min(0), alerta_estoque_minimo: z.coerce.number().optional(), custo_unitario: z.coerce.number().optional() })
const movSchema = z.object({ item_id: z.string().min(1), tipo: z.enum(['entrada', 'saida']), quantidade: z.coerce.number().min(1), justificativa: z.string().optional() })

export function AlmoxarifadoPage() {
  const { authUser } = useAuth()
  const { data: itens, isLoading } = useItensAlmoxarifado()
  const { data: movs } = useMovimentacoes()
  const criarItem = useCriarItemAlmoxarifado()
  const criarMov = useCriarMovimentacao()
  const [openItem, setOpenItem] = useState(false)
  const [openMov, setOpenMov] = useState(false)
  const itemForm = useForm({ resolver: zodResolver(itemSchema) })
  const movForm = useForm({ resolver: zodResolver(movSchema), defaultValues: { tipo: 'entrada' as const } })

  const onSubmitItem = async (data: any) => {
    if (!authUser) return
    try { await criarItem.mutateAsync({ ...data, tenant_id: authUser.tenantId }); toast.success('Item cadastrado!'); itemForm.reset(); setOpenItem(false) }
    catch { toast.error('Erro') }
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
              <DialogHeader><DialogTitle>Movimentação de Estoque</DialogTitle></DialogHeader>
              <form onSubmit={movForm.handleSubmit(onSubmitMov)} className="space-y-4">
                <div className="space-y-2"><Label>Item *</Label>
                  <Select onValueChange={(v) => movForm.setValue('item_id', v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{itens?.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.nome} (Estoque: {i.quantidade})</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Tipo</Label>
                  <RadioGroup defaultValue="entrada" onValueChange={(v) => movForm.setValue('tipo', v as any)} className="flex gap-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="entrada" id="ent" /><Label htmlFor="ent" className="text-emerald-700">Entrada</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="saida" id="sai" /><Label htmlFor="sai" className="text-red-700">Saída</Label></div>
                  </RadioGroup>
                </div>
                <div className="space-y-2"><Label>Quantidade *</Label><Input type="number" min="1" {...movForm.register('quantidade')} /></div>
                <div className="space-y-2"><Label>Justificativa</Label><Input placeholder="Ex: Compra do mês" {...movForm.register('justificativa')} /></div>
                <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpenMov(false)}>Cancelar</Button><Button type="submit">Registrar</Button></div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={openItem} onOpenChange={setOpenItem}>
            <DialogTrigger asChild><Button className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md"><Plus className="mr-2 h-4 w-4" />Novo Item</Button></DialogTrigger>
            <DialogContent className="max-w-[800px]">
              <DialogHeader><DialogTitle>Novo Item</DialogTitle></DialogHeader>
              <form onSubmit={itemForm.handleSubmit(onSubmitItem)} className="space-y-4">
                <div className="space-y-2"><Label>Nome *</Label><Input placeholder="Ex: Resma A4" {...itemForm.register('nome')} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Categoria</Label>
                    <Select onValueChange={(v) => itemForm.setValue('categoria', v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="material_didatico">Material Didático</SelectItem><SelectItem value="limpeza">Limpeza</SelectItem><SelectItem value="papelaria">Papelaria</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent></Select>
                  </div>
                  <div className="space-y-2"><Label>Qtd. Inicial</Label><Input type="number" min="0" {...itemForm.register('quantidade')} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Alerta Estoque Mínimo</Label><Input type="number" {...itemForm.register('alerta_estoque_minimo')} /></div>
                  <div className="space-y-2"><Label>Custo Unitário (R$)</Label><Input type="number" step="0.01" {...itemForm.register('custo_unitario')} /></div>
                </div>
                <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpenItem(false)}>Cancelar</Button><Button type="submit">Cadastrar</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="estoque">
        <TabsList><TabsTrigger value="estoque"><Package className="h-4 w-4 mr-1" />Estoque</TabsTrigger><TabsTrigger value="historico"><ArrowDownUp className="h-4 w-4 mr-1" />Histórico</TabsTrigger></TabsList>
        <TabsContent value="estoque">
          <Card className="border-0 shadow-md"><CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Categoria</TableHead><TableHead>Quantidade</TableHead><TableHead>Custo Unit.</TableHead><TableHead>Alerta</TableHead></TableRow></TableHeader>
              <TableBody>
                {itens?.map((i: any) => (
                  <TableRow key={i.id}><TableCell className="font-bold">{i.nome}</TableCell><TableCell><Badge variant="outline">{i.categoria || '—'}</Badge></TableCell>
                    <TableCell><span className={i.quantidade <= (i.alerta_estoque_minimo || 0) ? 'text-red-600 font-bold' : ''}>{i.quantidade}</span>{i.quantidade <= (i.alerta_estoque_minimo || 0) && <AlertTriangle className="inline ml-1 h-4 w-4 text-red-500" />}</TableCell>
                    <TableCell>R$ {Number(i.custo_unitario || 0).toFixed(2)}</TableCell><TableCell>{i.alerta_estoque_minimo || '—'}</TableCell>
                  </TableRow>))}
                {(!itens || itens.length === 0) && <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground"><Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />Nenhum item cadastrado.</TableCell></TableRow>}
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
    </div>
  )
}
