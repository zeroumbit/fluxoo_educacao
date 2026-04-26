import { useState } from 'react'
import { useFaturas, useConfirmarFatura, useEscolas, useCreateFatura } from '../hooks'
import { useAuth } from '@/modules/auth/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Search, FileText, CheckCircle2, ExternalLink, MoreHorizontal, AlertTriangle, Clock, Loader2, AlertCircle, Calendar, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { format, isBefore, parseISO, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Fatura } from '@/lib/database.types'

export function FaturasPage() {
  const [tab, setTab] = useState('pendente_confirmacao')
  const { data: faturas, isLoading } = useFaturas(tab !== 'todas' ? { status: tab } : undefined)
  const { data: escolas } = useEscolas()
  const confirmar = useConfirmarFatura()
  const createFatura = useCreateFatura()
  const { authUser } = useAuth()
  const [search, setSearch] = useState('')
  const [isEarlyConfirmOpen, setIsEarlyConfirmOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [faturaEarlyConfirm, setFaturaEarlyConfirm] = useState<any | null>(null)
  const [selectedFatura, setSelectedFatura] = useState<any | null>(null)
  
  const [isNovaFaturaOpen, setIsNovaFaturaOpen] = useState(false)
  const [novaFatura, setNovaFatura] = useState({
    tenant_id: '',
    valor: '',
    competencia: format(new Date(), 'yyyy-MM-01'),
    data_vencimento: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
    metodo_pagamento: 'pix_manual'
  })

  const filtered = faturas?.filter((f: Fatura) =>
    (f as any).escola?.razao_social?.toLowerCase().includes(search.toLowerCase())
  )

  const handleConfirmarClick = (fatura: Fatura) => {
    const hoje = new Date()
    const vencimento = fatura.data_vencimento ? parseISO(fatura.data_vencimento) : null
    
    // Verifica se está tentando aprovar antes do vencimento
    if (vencimento && isBefore(hoje, vencimento)) {
      setFaturaEarlyConfirm(fatura)
      setIsEarlyConfirmOpen(true)
    } else {
      handleConfirmar(fatura.id)
    }
  }

  const handleDetailsClick = (fatura: Fatura) => {
    setSelectedFatura(fatura)
    setIsDetailsOpen(true)
  }

  const handleConfirmar = async (id: string) => {
    if (!authUser) return
    try {
      await confirmar.mutateAsync({ id, adminId: authUser.user.id })
      toast.success('Fatura confirmada como paga!')
      setFaturaEarlyConfirm(null)
      setIsEarlyConfirmOpen(false)
    } catch {
      toast.error('Erro ao confirmar fatura.')
    }
  }

  const handleCriarFatura = async () => {
    if (!novaFatura.tenant_id) {
      toast.error('Selecione uma escola.')
      return
    }
    if (!novaFatura.valor || Number(novaFatura.valor) <= 0) {
      toast.error('Informe um valor válido.')
      return
    }

    try {
      await createFatura.mutateAsync({
        tenant_id: novaFatura.tenant_id,
        valor: Number(novaFatura.valor),
        competencia: novaFatura.competencia,
        data_vencimento: novaFatura.data_vencimento,
        forma_pagamento: novaFatura.forma_pagamento,
        status: 'pendente'
      })
      toast.success('Fatura manual gerada com sucesso!')
      setIsNovaFaturaOpen(false)
      setNovaFatura({
        tenant_id: '',
        valor: '',
        competencia: format(new Date(), 'yyyy-MM-01'),
        data_vencimento: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
        forma_pagamento: 'pix_manual'
      })
    } catch {
      toast.error('Erro ao gerar fatura manual.')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Pago</Badge>
      case 'pendente': return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">Pendente</Badge>
      case 'pendente_confirmacao': return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Aguardando Confirmação</Badge>
      case 'atrasado': return <Badge variant="destructive">Atrasado</Badge>
      case 'cancelado': return <Badge variant="secondary">Cancelado</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Faturas da Plataforma</h1>
          <p className="text-muted-foreground mt-1">Gestão de faturamento SaaS e conciliação de pagamentos.</p>
        </div>
        <Button 
          onClick={() => setIsNovaFaturaOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Fatura Manual
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-amber-50 border-amber-100">
          <CardHeader className="pt-[30px] pb-2 gap-2">
            <CardTitle className="text-sm font-medium text-amber-700">Aguardando Confirmação</CardTitle>
            <div className="text-2xl font-bold text-amber-900">
              {faturas?.filter((f: any) => f.status === 'pendente_confirmacao').length || 0}
            </div>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg bg-red-50 border-red-100">
          <CardHeader className="pt-[30px] pb-2 gap-2">
            <CardTitle className="text-sm font-medium text-red-700">Atrasadas</CardTitle>
            <div className="text-2xl font-bold text-red-900">
              {faturas?.filter((f: any) => f.status === 'atrasado').length || 0}
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-0 shadow-xl overflow-hidden bg-white">
        <CardHeader className="pt-[30px] gap-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Histórico de Faturas</CardTitle>
              <CardDescription>Filtre por status para gerenciar a conciliação de pagamentos.</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar escola..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-[250px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={tab} onValueChange={setTab}>
            <div className="px-6 border-b">
              <TabsList className="bg-transparent h-10">
                <TabsTrigger value="pendente_confirmacao" className="text-xs data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">
                  <Clock className="h-3 w-3 mr-1" /> Aguardando
                </TabsTrigger>
                <TabsTrigger value="atrasado" className="text-xs data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Atrasadas
                </TabsTrigger>
                <TabsTrigger value="pago" className="text-xs data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Pagas
                </TabsTrigger>
                <TabsTrigger value="todas" className="text-xs">Todas</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={tab} className="mt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <Table>
                  <TableHeader className="bg-zinc-50/50">
                    <TableRow>
                      <TableHead className="pl-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Escola</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Competência</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Valor</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Vencimento</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Comprovante</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                      <TableHead className="text-right pr-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Nenhuma fatura encontrada.</TableCell>
                      </TableRow>
                    )}
                    {filtered?.map((f: any) => (
                      <TableRow key={f.id} className="hover:bg-zinc-50/50 transition-colors">
                        <TableCell className="pl-8 font-bold text-zinc-900">{f.escola?.razao_social || '—'}</TableCell>
                        <TableCell className="text-sm">
                          {f.competencia ? format(new Date(f.competencia), 'MMM/yyyy', { locale: ptBR }).toUpperCase() : '—'}
                        </TableCell>
                        <TableCell className="font-bold text-zinc-900">R$ {Number(f.valor).toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {f.data_vencimento ? format(new Date(f.data_vencimento), 'dd/MM/yyyy') : '—'}
                        </TableCell>
                        <TableCell>
                          {f.comprovante_url ? (
                            <a href={f.comprovante_url} target="_blank" rel="noopener noreferrer"
                               className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" /> Ver
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Sem comprovante</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(f.status)}</TableCell>
                        <TableCell className="text-right pr-8">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {f.status === 'pendente_confirmacao' && (
                                  <DropdownMenuItem
                                    onClick={() => handleConfirmarClick(f)}
                                    className="text-emerald-600 font-bold"
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar Pagamento
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleDetailsClick(f)}>
                                  <FileText className="mr-2 h-4 w-4" /> Detalhes
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de Confirmação Antecipada */}
      <Dialog open={isEarlyConfirmOpen} onOpenChange={setIsEarlyConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              Confirmação Antecipada
            </DialogTitle>
            <DialogDescription>
              O pagamento desta fatura ainda não venceu. Tem certeza que deseja confirmar?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 my-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Detalhes da fatura:</p>
                <p><strong>Escola:</strong> {faturaEarlyConfirm?.escola?.razao_social}</p>
                <p><strong>Valor:</strong> R$ {Number(faturaEarlyConfirm?.valor).toFixed(2)}</p>
                <p><strong>Vencimento:</strong> {faturaEarlyConfirm?.data_vencimento ? format(new Date(faturaEarlyConfirm.data_vencimento), 'dd/MM/yyyy') : '—'}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEarlyConfirmOpen(false)}>Cancelar</Button>
            <Button 
              variant="default" 
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => faturaEarlyConfirm && handleConfirmar(faturaEarlyConfirm.id)}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmar Mesmo Assim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal de Detalhes da Fatura */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl bg-white border-0 shadow-2xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-zinc-900">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              Detalhes da Fatura
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1">
              Confira as informações completas do pagamento e conciliação.
            </DialogDescription>
          </DialogHeader>

          {selectedFatura && (
            <div className="py-6 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Instituição</p>
                  <p className="text-lg font-bold text-zinc-900 leading-tight">{selectedFatura.escola?.razao_social}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</p>
                  <div>{getStatusBadge(selectedFatura.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-black text-indigo-600">R$ {Number(selectedFatura.valor).toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Competência</p>
                  <p className="text-lg font-bold text-zinc-900">
                    {selectedFatura.competencia ? format(new Date(selectedFatura.competencia), 'MMMM/yyyy', { locale: ptBR }).toUpperCase() : '—'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vencimento</p>
                  <div className="flex items-center gap-2 font-bold text-zinc-700">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    {selectedFatura.data_vencimento ? format(new Date(selectedFatura.data_vencimento), 'dd/MM/yyyy') : '—'}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pagamento</p>
                  <div className="flex items-center gap-2 font-bold text-zinc-700">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    {selectedFatura.data_pagamento ? format(new Date(selectedFatura.data_pagamento), 'dd/MM/yyyy') : '—'}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Registrada em</p>
                  <p className="text-sm font-medium text-muted-foreground">
                    {selectedFatura.created_at ? format(new Date(selectedFatura.created_at), 'dd/MM/yyyy HH:mm') : '—'}
                  </p>
                </div>
              </div>

              {selectedFatura.comprovante_url && (
                <div className="space-y-3 pt-4 border-t border-zinc-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Comprovante de Pagamento</p>
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3 text-emerald-700">
                      <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Arquivo Enviado</p>
                        <p className="text-xs opacity-80">Enviado pela instituição para análise.</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => window.open(selectedFatura.comprovante_url, '_blank')}
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-zinc-50 border-emerald-200 text-emerald-700 font-bold"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Comprovante
                    </Button>
                  </div>
                </div>
              )}

              {selectedFatura.status === 'pendente_confirmacao' && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-1" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">Aguardando Confirmação</p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                      Esta escola enviou um comprovante de pagamento. Verifique se o valor caiu na conta antes de confirmar.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)} className="font-bold border-zinc-200">
              Fechar
            </Button>
            {selectedFatura?.status === 'pendente_confirmacao' && (
              <Button 
                onClick={() => {
                  setIsDetailsOpen(false)
                  handleConfirmarClick(selectedFatura)
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmar Agora
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Nova Fatura Manual */}
      <Dialog open={isNovaFaturaOpen} onOpenChange={setIsNovaFaturaOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-600" />
              Gerar Fatura Manual
            </DialogTitle>
            <DialogDescription>
              Crie uma nova cobrança manual para uma escola cadastrada.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Escola / Instituição</label>
              <select 
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                value={novaFatura.tenant_id}
                onChange={(e) => setNovaFatura({ ...novaFatura, tenant_id: e.target.value })}
              >
                <option value="">Selecione uma escola...</option>
                {escolas?.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.razao_social} ({e.email_gestor})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Valor da Cobrança (R$)</label>
              <Input 
                type="number" 
                placeholder="0,00" 
                value={novaFatura.valor}
                onChange={(e) => setNovaFatura({ ...novaFatura, valor: e.target.value })}
                className="h-11 font-bold text-lg text-indigo-600 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Competência</label>
                <Input 
                  type="date" 
                  value={novaFatura.competencia}
                  onChange={(e) => setNovaFatura({ ...novaFatura, competencia: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Vencimento</label>
                <Input 
                  type="date" 
                  value={novaFatura.data_vencimento}
                  onChange={(e) => setNovaFatura({ ...novaFatura, data_vencimento: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Método de Pagamento</label>
              <select 
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                value={novaFatura.forma_pagamento}
                onChange={(e) => setNovaFatura({ ...novaFatura, forma_pagamento: e.target.value })}
              >
                <option value="pix_manual">PIX Manual (Comprovante)</option>
                <option value="boleto">Boleto Bancário</option>
                <option value="mercado_pago">Cartão / Automático</option>
              </select>
            </div>
          </div>

          <DialogFooter className="border-t pt-6">
            <Button variant="outline" onClick={() => setIsNovaFaturaOpen(false)} className="rounded-xl h-11 font-bold">
              Cancelar
            </Button>
            <Button 
              onClick={handleCriarFatura}
              disabled={createFatura.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-11 px-8"
            >
              {createFatura.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Gerar Cobrança
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
