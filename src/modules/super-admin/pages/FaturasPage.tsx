import { useState } from 'react'
import { useFaturas, useConfirmarFatura } from '../hooks'
import { useAuth } from '@/modules/auth/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Search, FileText, CheckCircle2, ExternalLink, MoreHorizontal, AlertTriangle, Clock, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { format, isBefore, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function FaturasPage() {
  const [tab, setTab] = useState('pendente_confirmacao')
  const { data: faturas, isLoading } = useFaturas(tab !== 'todas' ? { status: tab } : undefined)
  const confirmar = useConfirmarFatura()
  const { authUser } = useAuth()
  const [search, setSearch] = useState('')
  const [isEarlyConfirmOpen, setIsEarlyConfirmOpen] = useState(false)
  const [faturaEarlyConfirm, setFaturaEarlyConfirm] = useState<any | null>(null)

  const filtered = faturas?.filter((f: any) =>
    f.escola?.razao_social?.toLowerCase().includes(search.toLowerCase())
  )

  const handleConfirmarClick = (fatura: any) => {
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Faturas da Plataforma</h1>
        <p className="text-muted-foreground mt-1">Gestão de faturamento SaaS e conciliação de pagamentos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-amber-50 border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Aguardando Confirmação</CardTitle>
            <div className="text-2xl font-bold text-amber-900">
              {faturas?.filter((f: any) => f.status === 'pendente_confirmacao').length || 0}
            </div>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg bg-red-50 border-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Atrasadas</CardTitle>
            <div className="text-2xl font-bold text-red-900">
              {faturas?.filter((f: any) => f.status === 'atrasado').length || 0}
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-0 shadow-xl overflow-hidden bg-white">
        <CardHeader>
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
                      <TableHead className="pl-6">Escola</TableHead>
                      <TableHead>Competência</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Comprovante</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right pr-6">Ações</TableHead>
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
                        <TableCell className="pl-6 font-bold text-zinc-900">{f.escola?.razao_social || '—'}</TableCell>
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
                        <TableCell className="text-right pr-6">
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
                              <DropdownMenuItem><FileText className="mr-2 h-4 w-4" /> Detalhes</DropdownMenuItem>
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
    </div>
  )
}
