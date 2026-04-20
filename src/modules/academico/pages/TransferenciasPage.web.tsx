import { useState, useMemo } from 'react'
import { useAuth } from '@/modules/auth/AuthContext'
import {
  useTransferenciasEscola,
  useLiberarAluno,
  useCheckPermissaoTransferencia
} from '../hooks'
import { STATUS_LABEL, STATUS_COLOR } from '../transferencias.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
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
  CalendarClock,
  Unlock,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow, format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { ModalSolicitarTransferencia } from '@/components/shared/transferencias/ModalSolicitarTransferencia'
import { EmitirHistoricoModal } from '@/components/shared/transferencias/EmitirHistoricoModal'

// Mapa de ícones para cada status
const STATUS_ICON: Record<string, any> = {
  aguardando_responsavel:      Clock,
  aguardando_liberacao_origem: CalendarClock,
  concluido:                   CheckCircle2,
  recusado:                    XCircle,
  cancelado:                   XCircle,
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_COLOR[status] || STATUS_COLOR.cancelado
  const label = STATUS_LABEL[status] || status
  const Icon = STATUS_ICON[status] || Clock
  return (
    <Badge className={`${cfg.bg} ${cfg.color} border-0 text-[9px] font-bold px-2.5 py-1 gap-1.5`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

export function TransferenciasPageWeb() {
  const { authUser } = useAuth()
  const tenantId = authUser?.tenantId
  const { data: transferencias, isLoading } = useTransferenciasEscola()
  const { data: permissao } = useCheckPermissaoTransferencia()
  const liberarAluno = useLiberarAluno()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailTransferencia, setDetailTransferencia] = useState<any>(null)
  const [confirmLiberar, setConfirmLiberar] = useState<any>(null)
  const [busca, setBusca] = useState('')
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false)
  const [historicoTransferencia, setHistoricoTransferencia] = useState<any>(null)

  const transferenciasList = useMemo(() => {
    if (!transferencias) return []
    return transferencias.filter((t: any) => {
      const q = busca.toLowerCase()
      return t.aluno_nome?.toLowerCase().includes(q) ||
             t.escola_origem?.toLowerCase().includes(q) ||
             t.escola_destino?.toLowerCase().includes(q)
    })
  }, [transferencias, busca])

  // Recebidas = escola destino = solicitações onde minha escola é a destino
  const recebidas = useMemo(() =>
    transferenciasList.filter((t: any) => t.destino_id === tenantId),
    [transferenciasList, tenantId]
  )

  // Enviadas = escola origem = alunos que estou liberando
  const enviadas = useMemo(() =>
    transferenciasList.filter((t: any) => t.origem_id === tenantId),
    [transferenciasList, tenantId]
  )

  // Pendentes de ação da minha escola
  const pendentesLiberacao = useMemo(() =>
    enviadas.filter((t: any) => t.status === 'aguardando_liberacao_origem'),
    [enviadas]
  )

  const pendentes = useMemo(() =>
    transferenciasList.filter((t: any) =>
      t.status !== 'concluido' && t.status !== 'recusado' && t.status !== 'cancelado'
    ).length,
    [transferenciasList]
  )

  const handleLiberarAluno = async () => {
    if (!confirmLiberar) return
    try {
      await liberarAluno.mutateAsync(confirmLiberar.transferencia_id)
      toast.success('Aluno liberado com sucesso! Transferência concluída.')
      setConfirmLiberar(null)
      setDetailTransferencia(null)
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao liberar aluno')
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

        <Card className={`rounded-xl border shadow-sm ${pendentesLiberacao.length > 0 ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${pendentesLiberacao.length > 0 ? 'bg-blue-100' : 'bg-slate-50'}`}>
                <CalendarClock className={`h-6 w-6 ${pendentesLiberacao.length > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Aguardam Liberação</p>
                <p className={`text-2xl font-bold ${pendentesLiberacao.length > 0 ? 'text-blue-700' : 'text-slate-900'}`}>
                  {pendentesLiberacao.length}
                </p>
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
                  {transferenciasList.filter((t: any) => t.status === 'concluido').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Banner compliance */}
      {permissao && !permissao.permissao_solicitacao_ativa && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-rose-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-800">Solicitações Bloqueadas</p>
            <p className="text-xs text-rose-600">
              Sua escola está temporariamente suspensa de realizar solicitações ativas de alunos.
            </p>
          </div>
        </div>
      )}

      {pendentesLiberacao.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              {pendentesLiberacao.length} aluno{pendentesLiberacao.length > 1 ? 's' : ''} com liberação obrigatória pendente
            </p>
            <p className="text-xs text-blue-600">
              O responsável aprovou a transferência. Você tem até 30 dias para validar a documentação e clicar em "Liberar Aluno" para concluir o processo.
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

        {/* Recebidas — escola destino visualiza */}
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
                    <TableHead className="h-14 text-[11px] font-black uppercase tracking-widest text-slate-400">Iniciado por</TableHead>
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
                    recebidas.map((t: any) => (
                      <TableRow key={t.transferencia_id} className="border-slate-100 hover:bg-slate-50/30 transition-colors">
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
                        <TableCell className="text-slate-600 font-medium text-xs">{t.escola_origem || '—'}</TableCell>
                        <TableCell>
                          <Badge className="text-[9px] font-bold capitalize bg-slate-100 text-slate-600 border-0">
                            {t.solicitante_tipo === 'responsavel' ? 'Responsável' : t.solicitante_tipo === 'destino' ? 'Escola Destino' : 'Escola Origem'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs tabular-nums">
                          {t.data_solicitacao
                            ? formatDistanceToNow(new Date(t.data_solicitacao), { locale: ptBR, addSuffix: true })
                            : '—'}
                        </TableCell>
                        <TableCell><StatusBadge status={t.status} /></TableCell>
                        <TableCell className="pr-8 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDetailTransferencia(t)}
                            className="h-9 w-9 rounded-lg text-indigo-600 hover:bg-indigo-50"
                            title="Ver Detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enviadas — escola origem gerencia liberação */}
        <TabsContent value="enviadas" className="space-y-6">
          <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="pl-8 h-14 text-[11px] font-black uppercase tracking-widest text-slate-400">Aluno</TableHead>
                    <TableHead className="h-14 text-[11px] font-black uppercase tracking-widest text-slate-400">Escola Destino</TableHead>
                    <TableHead className="h-14 text-[11px] font-black uppercase tracking-widest text-slate-400">Prazo</TableHead>
                    <TableHead className="h-14 text-[11px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                    <TableHead className="pr-8 h-14 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enviadas.length === 0 ? (
                    <TableRow className="border-slate-100">
                      <TableCell colSpan={5} className="h-48 text-center">
                        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <TrendingDown className="h-8 w-8 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nenhuma transferência enviada</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    enviadas.map((t: any) => {
                      const isLiberacaoPendente = t.status === 'aguardando_liberacao_origem'
                      const diasRestantes = t.prazo_liberacao
                        ? 30 - differenceInDays(new Date(), new Date(t.prazo_liberacao))
                        : null
                      const prazoVencido = diasRestantes !== null && diasRestantes < 0

                      return (
                        <TableRow key={t.transferencia_id} className={`border-slate-100 hover:bg-slate-50/30 transition-colors ${isLiberacaoPendente ? 'bg-blue-50/30' : ''}`}>
                          <TableCell className="pl-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isLiberacaoPendente ? 'bg-blue-50' : 'bg-amber-50'}`}>
                                {isLiberacaoPendente
                                  ? <CalendarClock className="h-5 w-5 text-blue-600" />
                                  : <AlertTriangle className="h-5 w-5 text-amber-600" />
                                }
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
                          <TableCell className="text-slate-600 font-medium text-xs">{t.escola_destino || '—'}</TableCell>
                          <TableCell>
                            {isLiberacaoPendente && t.prazo_liberacao ? (
                              <span className={`text-xs font-bold ${prazoVencido ? 'text-rose-600' : 'text-blue-600'}`}>
                                {prazoVencido
                                  ? `Vencido há ${Math.abs(diasRestantes!)}d`
                                  : `${diasRestantes}d restantes`}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell><StatusBadge status={t.status} /></TableCell>
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
                              {isLiberacaoPendente && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setConfirmLiberar(t)}
                                  className="h-9 w-9 rounded-lg text-emerald-600 hover:bg-emerald-50"
                                  title="Liberar Aluno (Concluir Transferência)"
                                >
                                  <Unlock className="h-4 w-4" />
                                </Button>
                              )}
                              {(t.status === 'concluido' || t.status === 'aguardando_liberacao_origem') && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setHistoricoTransferencia({
                                      transferencia_id: t.transferencia_id,
                                      aluno_id: t.aluno_id,
                                      aluno_nome: t.aluno_nome,
                                      escola_origem: t.escola_origem,
                                      escola_destino: t.escola_destino
                                    })
                                    setHistoricoModalOpen(true)
                                  }}
                                  className="h-9 w-9 rounded-lg text-amber-600 hover:bg-amber-50"
                                  title="Emitir Histórico Escolar"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              )}
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

      {/* Modal: Solicitar Transferência (escola destino) */}
      <ModalSolicitarTransferencia
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />

      {/* Dialog: Confirmar Liberação */}
      <Dialog open={!!confirmLiberar} onOpenChange={(open) => !open && setConfirmLiberar(null)}>
        <DialogContent className="max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <Unlock className="h-5 w-5" />
              Confirmar Liberação
            </DialogTitle>
            <DialogDescription>
              A transferência foi aprovada pelo responsável. Use este tempo para garantir que a documentação do aluno esteja 100% regularizada antes de confirmar a saída definitiva.
            </DialogDescription>
          </DialogHeader>
          {confirmLiberar && (
            <div className="space-y-3 py-2">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Aluno para Desligamento</p>
                <p className="font-semibold text-slate-800">{confirmLiberar.aluno_nome}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Escola de Destino</p>
                <p className="font-semibold text-blue-800">{confirmLiberar.escola_destino}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  <strong>Aviso Legal:</strong> A liberação é obrigatória após a anuência dos responsáveis. O botão abaixo conclui o desligamento acadêmico do aluno no sistema.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmLiberar(null)}>Cancelar</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleLiberarAluno}
              disabled={liberarAluno.isPending}
            >
              {liberarAluno.isPending ? 'Processando...' : 'Confirmar Liberação'}
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

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Iniciado por</p>
                  <p className="text-sm font-semibold text-slate-700 capitalize">
                    {detailTransferencia.solicitante_tipo === 'responsavel' ? 'Responsável'
                      : detailTransferencia.solicitante_tipo === 'destino' ? 'Escola Destino'
                      : 'Escola Origem'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Data</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {detailTransferencia.data_solicitacao
                      ? format(new Date(detailTransferencia.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })
                      : '—'}
                  </p>
                </div>
              </div>

              {detailTransferencia.prazo_liberacao && (
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Prazo de Liberação</p>
                  <p className="text-sm font-semibold text-blue-800">
                    {format(new Date(detailTransferencia.prazo_liberacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}

              {detailTransferencia.motivo_solicitacao && (
                <div className="p-4 bg-zinc-50 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Motivo</p>
                  <p className="text-sm text-zinc-700 leading-relaxed">{detailTransferencia.motivo_solicitacao}</p>
                </div>
              )}

              <div className="p-4 rounded-xl flex items-center gap-3 bg-slate-50">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Status</p>
                  <StatusBadge status={detailTransferencia.status} />
                </div>
              </div>

              {detailTransferencia.justificativa_recusa && (
                <div className="p-4 bg-rose-50 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-1">Motivo da Recusa</p>
                  <p className="text-sm text-rose-700 leading-relaxed">{detailTransferencia.justificativa_recusa}</p>
                </div>
              )}

              {detailTransferencia.status === 'aguardando_liberacao_origem' &&
               detailTransferencia.origem_id === tenantId && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    setDetailTransferencia(null)
                    setConfirmLiberar(detailTransferencia)
                  }}
                >
                  <Unlock className="mr-2 h-4 w-4" />
                  Liberar Aluno (Concluir Transferência)
                </Button>
              )}

              {detailTransferencia.status === 'concluido' && detailTransferencia.origem_id === tenantId && (
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  onClick={() => {
                    setDetailTransferencia(null)
                    setHistoricoTransferencia({
                      transferencia_id: detailTransferencia.transferencia_id,
                      aluno_id: detailTransferencia.aluno_id,
                      aluno_nome: detailTransferencia.aluno_nome,
                      escola_origem: detailTransferencia.escola_origem,
                      escola_destino: detailTransferencia.escola_destino
                    })
                    setHistoricoModalOpen(true)
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Emitir Histórico Escolar
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EmitirHistoricoModal
        isOpen={historicoModalOpen}
        onClose={() => {
          setHistoricoModalOpen(false)
          setHistoricoTransferencia(null)
        }}
        transferencia={historicoTransferencia}
        tenantId={tenantId || ''}
      />
    </div>
  )
}

export default TransferenciasPageWeb
