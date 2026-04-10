import { useState, useMemo } from 'react'
import { useAuth } from '@/modules/auth/AuthContext'
import { useAlunos } from '@/modules/alunos/hooks'
import { useEscola } from '@/modules/escolas/hooks'
import {
  useTransferenciasEscola,
  useSolicitarTransferencia,
  useCheckPermissaoTransferencia
} from '../../academico/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowRightLeft,
  Plus,
  Search,
  Loader2,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  School,
  ShieldCheck,
  TrendingDown,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pendente_pais: { label: 'Aguardando Pais', color: 'text-amber-700', bg: 'bg-amber-50', icon: Clock },
  pendente_destino: { label: 'Aguardando Destino', color: 'text-blue-700', bg: 'bg-blue-50', icon: School },
  pendente_origem: { label: 'Aguardando Origem', color: 'text-purple-700', bg: 'bg-purple-50', icon: FileText },
  recusada: { label: 'Recusada', color: 'text-rose-700', bg: 'bg-rose-50', icon: XCircle },
  cancelada: { label: 'Cancelada', color: 'text-zinc-500', bg: 'bg-zinc-50', icon: XCircle },
  concluida: { label: 'Concluída', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2 },
}

export function TransferenciasPageWeb() {
  const { authUser } = useAuth()
  const tenantId = authUser?.tenantId
  const { data: transferencias, isLoading } = useTransferenciasEscola()
  const { data: escola } = useEscola(tenantId!)
  const { data: alunos } = useAlunos()
  const { data: permissao } = useCheckPermissaoTransferencia()
  const solicitar = useSolicitarTransferencia()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailTransferencia, setDetailTransferencia] = useState<any>(null)
  const [busca, setBusca] = useState('')

  // Form states
  const [selectedAlunoId, setSelectedAlunoId] = useState('')
  const [destinoId, setDestinoId] = useState('')
  const [motivo, setMotivo] = useState('')

  const transferenciasList = useMemo(() => {
    if (!transferencias) return []
    return transferencias.filter((t: any) => {
      const match = t.aluno_nome?.toLowerCase().includes(busca.toLowerCase()) ||
        t.escola_origem?.toLowerCase().includes(busca.toLowerCase()) ||
        t.escola_destino?.toLowerCase().includes(busca.toLowerCase())
      return match
    })
  }, [transferencias, busca])

  // Separar por tipo
  const recebidas = useMemo(() =>
    transferenciasList?.filter((t: any) => t.destino_id === tenantId) || [],
    [transferenciasList, tenantId]
  )

  const enviadas = useMemo(() =>
    transferenciasList?.filter((t: any) => t.origem_id === tenantId) || [],
    [transferenciasList, tenantId]
  )

  const pendentes = useMemo(() =>
    transferenciasList?.filter((t: any) =>
      t.status !== 'concluida' && t.status !== 'recusada' && t.status !== 'cancelada'
    ).length || 0,
    [transferenciasList]
  )

  const handleSolicitar = async () => {
    if (!selectedAlunoId || !destinoId || !motivo) {
      toast.error('Preencha todos os campos')
      return
    }

    if (!tenantId) return

    try {
      await solicitar.mutateAsync({
        alunoId: selectedAlunoId,
        origemId: tenantId,
        destinoId,
        motivo,
      })
      toast.success('Solicitação de transferência enviada com sucesso!')
      setDialogOpen(false)
      setSelectedAlunoId('')
      setDestinoId('')
      setMotivo('')
    } catch (error: any) {
      console.error('Erro na transferência:', error)
      toast.error(error?.message || 'Erro ao solicitar transferência')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
              <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Transferências</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Gerencie transferências de alunos entre escolas
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Solicitar Transferência
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pendentes</p>
                <p className="text-2xl font-bold text-slate-900">{pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <ArrowRightLeft className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</p>
                <p className="text-2xl font-bold text-slate-900">{transferenciasList.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Concluídas</p>
                <p className="text-2xl font-bold text-slate-900">
                  {transferenciasList.filter((t: any) => t.status === 'concluida').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Banner */}
      {permissao && !permissao.permissao_solicitacao_ativa && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-rose-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-800">Solicitações Bloqueadas</p>
            <p className="text-xs text-rose-600">
              Sua escola está temporariamente suspenso de realizar solicitações ativas de alunos.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="recebidas" className="space-y-6">
        <TabsList className="bg-slate-100/50 p-1 rounded-xl h-auto self-start">
          <TabsTrigger
            value="recebidas"
            className="rounded-lg data-[state=active]:bg-white px-6 py-2 font-bold text-sm"
          >
            Recebidas ({recebidas.length})
          </TabsTrigger>
          <TabsTrigger
            value="enviadas"
            className="rounded-lg data-[state=active]:bg-white px-6 py-2 font-bold text-sm"
          >
            Enviadas ({enviadas.length})
          </TabsTrigger>
        </TabsList>

        {/* Recebidas */}
        <TabsContent value="recebidas" className="space-y-6">
          <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="p-6 border-b border-slate-100">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar por aluno ou escola..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-11 h-11 bg-slate-50 border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="pl-8 h-14 text-[11px] font-black uppercase tracking-widest text-slate-400">Aluno</TableHead>
                    <TableHead className="h-14 text-[11px] font-black uppercase tracking-widest text-slate-400">Escola Origem</TableHead>
                    <TableHead className="h-14 text-[11px] font-black uppercase tracking-widest text-slate-400">Solicitante</TableHead>
                    <TableHead className="h-14 text-[11px] font-black uppercase tracking-widest text-slate-400">Data</TableHead>
                    <TableHead className="h-14 text-[11px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                    <TableHead className="pr-8 h-14 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recebidas.length === 0 ? (
                    <TableRow className="border-slate-100">
                      <TableCell colSpan={6} className="h-48 text-center">
                        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <School className="h-8 w-8 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nenhuma transferência recebida</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recebidas.map((t: any) => {
                      const cfg = statusConfig[t.status] || statusConfig.pendente_pais
                      const StatusIcon = cfg.icon
                      return (
                        <TableRow key={t.transferencia_id || t.id} className="border-slate-100 hover:bg-slate-50/30 transition-colors">
                          <TableCell className="pl-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                <User className="h-5 w-5 text-indigo-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 text-sm">{t.aluno_nome}</p>
                                {t.motivo_solicitacao && (
                                  <p className="text-xs text-slate-400 truncate max-w-[200px]">{t.motivo_solicitacao}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 font-medium text-xs">
                            {t.escola_origem || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge className="text-[9px] font-bold capitalize bg-slate-100 text-slate-600 border-0">
                              {t.solicitante_tipo?.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-500 text-xs tabular-nums">
                            {t.data_solicitacao
                              ? formatDistanceToNow(new Date(t.data_solicitacao), { locale: ptBR, addSuffix: true })
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${cfg.bg} ${cfg.color} border-0 text-[9px] font-bold px-2.5 py-1 gap-1.5`}>
                              <StatusIcon className="h-3 w-3" />
                              {cfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-8 text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDetailTransferencia(t)}
                                className="h-9 w-9 rounded-lg text-indigo-600 hover:bg-indigo-50"
                                title="Ver Detalhes"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enviadas */}
        <TabsContent value="enviadas" className="space-y-6">
          <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="pl-8 h-14 text-[11px] font-black uppercase tracking-widest text-slate-400">Aluno</TableHead>
                    <TableHead className="h-14 text-[11px] font-black uppercase tracking-widest text-slate-400">Escola Destino</TableHead>
                    <TableHead className="h-14 text-[11px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                    <TableHead className="pr-8 h-14 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enviadas.length === 0 ? (
                    <TableRow className="border-slate-100">
                      <TableCell colSpan={4} className="h-48 text-center">
                        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <TrendingDown className="h-8 w-8 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nenhuma transferência enviada</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    enviadas.map((t: any) => {
                      const cfg = statusConfig[t.status] || statusConfig.pendente_pais
                      const StatusIcon = cfg.icon
                      return (
                        <TableRow key={t.transferencia_id || t.id} className="border-slate-100 hover:bg-slate-50/30 transition-colors">
                          <TableCell className="pl-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 text-sm">{t.aluno_nome}</p>
                                <p className="text-xs text-slate-400">
                                  Solicitada em {t.data_solicitacao
                                    ? format(new Date(t.data_solicitacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                                    : '—'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 font-medium text-xs">
                            {t.escola_destino || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${cfg.bg} ${cfg.color} border-0 text-[9px] font-bold px-2.5 py-1 gap-1.5`}>
                              <StatusIcon className="h-3 w-3" />
                              {cfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-8 text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDetailTransferencia(t)}
                                className="h-9 w-9 rounded-lg text-indigo-600 hover:bg-indigo-50"
                                title="Ver Detalhes"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Solicitar Transferência */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
              Solicitar Transferência
            </DialogTitle>
            <DialogDescription>
              Capture um aluno de outra escola para sua instituição.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Aluno</label>
              <Select value={selectedAlunoId} onValueChange={setSelectedAlunoId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione o aluno..." />
                </SelectTrigger>
                <SelectContent>
                  {alunos?.map((aluno: any) => (
                    <SelectItem key={aluno.id} value={aluno.id}>
                      {aluno.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Escola Destino (sua escola)</label>
              <div className="h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center text-sm text-slate-600 font-medium">
                <School className="h-4 w-4 mr-2 text-slate-400" />
                {escola?.razao_social || tenantId}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">ID da Escola Destino</label>
              <Input
                placeholder="UUID da escola de destino..."
                value={destinoId}
                onChange={(e) => setDestinoId(e.target.value)}
                className="h-12"
              />
              <p className="text-xs text-slate-400">
                Informe o ID da escola para onde o aluno será transferido.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Motivo da Solicitação</label>
              <Textarea
                placeholder="Descreva o motivo da transferência..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-3 flex-col-reverse sm:flex-row">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="h-12 sm:flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleSolicitar}
              disabled={solicitar.isPending || !selectedAlunoId || !destinoId || !motivo}
              className="h-12 sm:flex-1 bg-gradient-to-r from-indigo-600 to-blue-600"
            >
              {solicitar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Enviar Solicitação'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalhes da Transferência */}
      <Dialog open={!!detailTransferencia} onOpenChange={(open) => !open && setDetailTransferencia(null)}>
        <DialogContent className="max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-indigo-600" />
              Detalhes da Transferência
            </DialogTitle>
          </DialogHeader>

          {detailTransferencia && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{detailTransferencia.aluno_nome}</p>
                  <p className="text-xs text-slate-400">Aluno</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-amber-50 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-1">Escola Origem</p>
                  <p className="text-sm font-semibold text-amber-800">{detailTransferencia.escola_origem || '—'}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">Escola Destino</p>
                  <p className="text-sm font-semibold text-blue-800">{detailTransferencia.escola_destino || '—'}</p>
                </div>
              </div>

              {detailTransferencia.motivo_solicitacao && (
                <div className="p-4 bg-zinc-50 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Motivo</p>
                  <p className="text-sm text-zinc-700 leading-relaxed">{detailTransferencia.motivo_solicitacao}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Solicitante</p>
                  <p className="text-sm font-semibold text-slate-700 capitalize">{detailTransferencia.solicitante_tipo?.replace('_', ' ')}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Data</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {detailTransferencia.data_solicitacao
                      ? format(new Date(detailTransferencia.data_solicitacao), "dd/MM/yyyy", { locale: ptBR })
                      : '—'}
                  </p>
                </div>
              </div>

              {(() => {
                const cfg = statusConfig[detailTransferencia.status] || statusConfig.pendente_pais
                const StatusIcon = cfg.icon
                return (
                  <div className={`p-4 ${cfg.bg} rounded-xl flex items-center gap-3`}>
                    <StatusIcon className={`h-5 w-5 ${cfg.color}`} />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Status</p>
                      <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
                    </div>
                  </div>
                )
              })()}

              {detailTransferencia.observacoes_recusa && (
                <div className="p-4 bg-rose-50 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-1">Observações de Recusa</p>
                  <p className="text-sm text-rose-700 leading-relaxed">{detailTransferencia.observacoes_recusa}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TransferenciasPageWeb
