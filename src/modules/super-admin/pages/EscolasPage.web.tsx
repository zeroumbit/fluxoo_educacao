import { useState } from 'react'
import type { Fatura } from '@/lib/database.types'
import {
  useEscolas,
  useUpdateEscolaStatus,
  useSuspenderEscola,
  useEscolaDetalhes,
  useFaturas,
  useCreateFatura,
  useDeleteFatura,
  useEscolasDevedoras,
  useConfirmarPagamentoEscola,
  useEnviarCobranca,
  useCancelarAcessoEscola
} from '../hooks'
import { useAuth } from '@/modules/auth/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MoreHorizontal,
  Mail,
  User,
  Calendar,
  CreditCard,
  QrCode,
  FileText,
  Eye,
  Ban,
  AlertTriangle,
  MapPin,
  Plus,
  Trash2,
  DollarSign,
  Send,
  Loader2
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function EscolasPageWeb() {
  const { data: escolas, isLoading } = useEscolas()
  const updateStatus = useUpdateEscolaStatus()
  const suspenderEscola = useSuspenderEscola()
  const { data: escolasDevedoras, isLoading: isLoadingDevedoras } = useEscolasDevedoras()
  const confirmarPagamento = useConfirmarPagamentoEscola()
  const enviarCobranca = useEnviarCobranca()
  const cancelarAcesso = useCancelarAcessoEscola()
  const { authUser } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [escolaSelecionada, setEscolaSelecionada] = useState<string | null>(null)
  const [escolaDevedoraSelecionada, setEscolaDevedoraSelecionada] = useState<any>(null)
  const [dialogDetalhesAberto, setDialogDetalhesAberto] = useState(false)
  const [dialogSuspensaoAberto, setDialogSuspensaoAberto] = useState(false)
  const [dialogPagamentosAberto, setDialogPagamentosAberto] = useState(false)
  const [dialogDevedorAberto, setDialogDevedorAberto] = useState(false)
  const [motivoSuspensao, setMotivoSuspensao] = useState('')

  const { data: detalhesEscola } = useEscolaDetalhes(escolaSelecionada)

  const filteredEscolas = escolas?.filter(escola =>
    escola.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    escola.cnpj?.includes(searchTerm)
  )

  const handleApprove = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: 'ativa' })
      toast.success('Escola aprovada e ativada com sucesso!')
    } catch {
      toast.error('Erro ao aprovar escola.')
    }
  }

  const handleVerDetalhes = (id: string) => {
    setEscolaSelecionada(id)
    setDialogDetalhesAberto(true)
  }

  const handleSuspenderAcesso = (id: string) => {
    setEscolaSelecionada(id)
    setMotivoSuspensao('')
    setDialogSuspensaoAberto(true)
  }

  const handleVerPagamentos = (id: string) => {
    setEscolaSelecionada(id)
    setDialogPagamentosAberto(true)
  }

  const handleConfirmarSuspensao = async () => {
    if (!motivoSuspensao.trim()) {
      toast.error('Informe o motivo da suspensão.')
      return
    }
    try {
      await suspenderEscola.mutateAsync({ id: escolaSelecionada!, motivo: motivoSuspensao.trim() })
      toast.success('Escola suspensa com sucesso.')
      setDialogSuspensaoAberto(false)
      setEscolaSelecionada(null)
    } catch {
      toast.error('Erro ao suspender escola.')
    }
  }

  const handleVerDetalhesDevedor = (devedor: any) => {
    setEscolaDevedoraSelecionada(devedor)
    setDialogDevedorAberto(true)
  }

  const handleDarBaixa = async () => {
    if (!escolaDevedoraSelecionada?.escola?.id || !authUser?.id) return
    try {
      await confirmarPagamento.mutateAsync({ 
        tenantId: escolaDevedoraSelecionada.escola.id, 
        adminId: authUser.id 
      })
      toast.success('Pagamento confirmado com sucesso!')
      setDialogDevedorAberto(false)
    } catch {
      toast.error('Erro ao confirmar pagamento.')
    }
  }

  const handleEnviarCobrancaDevedor = async () => {
    if (!escolaDevedoraSelecionada?.escola?.id) return
    try {
      await enviarCobranca.mutateAsync({ 
        tenantId: escolaDevedoraSelecionada.escola.id 
      })
      toast.success('Cobrança enviada para a escola!')
    } catch {
      toast.error('Erro ao enviar cobrança.')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativa':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Ativa</Badge>
      case 'pendente':
        return <Badge variant="outline" className="text-amber-600 border-amber-600 bg-amber-50">Pendente</Badge>
      case 'suspensa':
        return <Badge variant="destructive">Suspensa</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentIcon = (metodo: string) => {
    switch (metodo) {
      case 'mercado_pago': return <CreditCard className="h-4 w-4 text-indigo-600" />
      case 'pix': return <QrCode className="h-4 w-4 text-emerald-600" />
      case 'boleto': return <FileText className="h-4 w-4 text-zinc-500" />
      default: return null
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Building2 className="h-8 w-8 animate-pulse text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Gestão de Escolas</h1>
          <p className="text-muted-foreground mt-1">
            Administre todas as instituições e gerencie a fila de onboarding.
          </p>
        </div>
        <div className="flex items-center gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Buscar por nome ou CNPJ..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-[300px] border-zinc-200"
                />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-xl shadow-zinc-200/50 bg-white">
          <CardHeader className="pt-[30px] pb-2 gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aguardando Aprovação</CardTitle>
            <div className="text-2xl font-bold text-amber-600">
              {escolas?.filter(e => e.status_assinatura === 'pendente').length}
            </div>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-xl shadow-zinc-200/50 bg-white">
          <CardHeader className="pt-[30px] pb-2 gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Instituições Ativas</CardTitle>
             <div className="text-2xl font-bold text-emerald-600">
               {escolas?.filter(e => e.status_assinatura === 'ativa').length}
             </div>
          </CardHeader>
        </Card>
        <Card 
          className="border-0 shadow-xl shadow-zinc-200/50 bg-white cursor-pointer hover:shadow-2xl transition-all group"
          onClick={() => {
            if (escolasDevedoras && escolasDevedoras.length > 0) {
              handleVerDetalhesDevedor(escolasDevedoras[0])
            }
          }}
        >
          <CardHeader className="pt-[30px] pb-2 gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-red-600 transition-colors">Pagamentos em Atraso</CardTitle>
            <div className="text-2xl font-bold text-red-600">
              {isLoadingDevedoras ? '...' : escolasDevedoras?.length || 0}
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-0 shadow-xl shadow-zinc-200/50 overflow-hidden bg-white">
        <CardHeader className="pt-[30px] gap-3">
           <CardTitle>Instituições Cadastradas</CardTitle>
           <CardDescription>Lista global de tenants e status contratual.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead className="pl-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Instituição</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Gestor / Contato</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Plano / Pagto</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Cadastro</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-right pr-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEscolas?.map((escola) => (
                <TableRow key={escola.id} className="group hover:bg-zinc-50/50 transition-colors">
                  <TableCell className="pl-8">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50">
                        <Building2 className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 leading-none mb-1">{escola.razao_social}</p>
                        <p className="text-xs text-muted-foreground">{escola.cnpj}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-zinc-600 font-medium">
                        <User className="h-3 w-3" />
                        {escola.nome_gestor || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-tight">
                        <Mail className="h-3 w-3" />
                        {escola.email_gestor}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-indigo-700">{escola.plano?.nome || 'Nenhum'}</p>
                        <div className="flex items-center gap-1.5">
                            {getPaymentIcon(escola.metodo_pagamento)}
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">
                                {escola.metodo_pagamento?.replace('_', ' ')}
                            </p>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(escola.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(escola.status_assinatura)}
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-200/50">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Opções da Escola</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {escola.status_assinatura === 'pendente' && (
                          <DropdownMenuItem
                            onClick={() => handleApprove(escola.id)}
                            className="text-emerald-600 focus:text-emerald-700 font-bold"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Aprovar e Ativar
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem onClick={() => handleVerDetalhes(escola.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => handleVerPagamentos(escola.id)}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pagamentos
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleSuspenderAcesso(escola.id)}
                          className="text-destructive focus:text-destructive font-bold"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Suspender Acesso
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Detalhes da Escola */}
      <Dialog open={dialogDetalhesAberto} onOpenChange={setDialogDetalhesAberto}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-indigo-600" />
              Detalhes da Escola
            </DialogTitle>
            <DialogDescription>
              Informações completas da instituição e dados contratuais.
            </DialogDescription>
          </DialogHeader>

          {detalhesEscola ? (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Razão Social</p>
                  <p className="font-semibold text-zinc-900">{detalhesEscola.razao_social}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">CNPJ</p>
                  <p className="font-medium text-zinc-700">{detalhesEscola.cnpj}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Status</p>
                  <div className="mt-1">{getStatusBadge(detalhesEscola.status_assinatura)}</div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-indigo-700">
                  <MapPin className="h-5 w-5" />
                  <h4 className="font-bold text-sm uppercase tracking-wide">Endereço</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Logradouro</p>
                    <p className="font-medium">{detalhesEscola.logradouro}, {detalhesEscola.numero}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bairro</p>
                    <p className="font-medium">{detalhesEscola.bairro}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cidade/UF</p>
                    <p className="font-medium">{detalhesEscola.cidade}/{detalhesEscola.estado}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CEP</p>
                    <p className="font-medium">{detalhesEscola.cep}</p>
                  </div>
                </div>
              </div>

              {/* Gestor */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-indigo-700">
                  <User className="h-5 w-5" />
                  <h4 className="font-bold text-sm uppercase tracking-wide">Gestor / Contato</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Nome do Gestor</p>
                    <p className="font-medium">{detalhesEscola.nome_gestor || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">E-mail</p>
                    <p className="font-medium">{detalhesEscola.email_gestor}</p>
                  </div>
                  {detalhesEscola.telefone && (
                    <div>
                      <p className="text-xs text-muted-foreground">Telefone</p>
                      <p className="font-medium">{detalhesEscola.telefone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Plano e Assinatura */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-indigo-700">
                  <CreditCard className="h-5 w-5" />
                  <h4 className="font-bold text-sm uppercase tracking-wide">Plano e Assinatura</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Plano</p>
                    <p className="font-bold text-indigo-700">{detalhesEscola.plano?.nome || 'Nenhum'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor/Aluno</p>
                    <p className="font-medium">
                      {detalhesEscola.plano?.valor_por_aluno 
                        ? `R$ ${Number(detalhesEscola.plano.valor_por_aluno).toFixed(2).replace('.', ',')}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Método Pagamento</p>
                    <p className="font-medium capitalize">{detalhesEscola.metodo_pagamento?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Limite Alunos</p>
                    <p className="font-medium">{detalhesEscola.limite_alunos_contratado || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Datas Importantes */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-indigo-700">
                  <Calendar className="h-5 w-5" />
                  <h4 className="font-bold text-sm uppercase tracking-wide">Datas Importantes</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Cadastro</p>
                    <p className="font-medium">
                      {format(new Date(detalhesEscola.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  {detalhesEscola.data_inicio && (
                    <div>
                      <p className="text-xs text-muted-foreground">Início</p>
                      <p className="font-medium">
                        {format(new Date(detalhesEscola.data_inicio), "dd 'de' MMM, yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  {detalhesEscola.data_suspensao && (
                    <div>
                      <p className="text-xs text-muted-foreground">Suspensão</p>
                      <p className="font-medium text-destructive">
                        {format(new Date(detalhesEscola.data_suspensao), "dd 'de' MMM, yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Motivo da Suspensão (se houver) */}
              {detalhesEscola.motivo_suspensao && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <h4 className="font-bold text-sm uppercase tracking-wide">Motivo da Suspensão</h4>
                  </div>
                  <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-lg">
                    <p className="text-sm text-destructive">{detalhesEscola.motivo_suspensao}</p>
                  </div>
                </div>
              )}

              {/* Filiais */}
              {detalhesEscola.filiais && detalhesEscola.filiais.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-indigo-700">
                    <Building2 className="h-5 w-5" />
                    <h4 className="font-bold text-sm uppercase tracking-wide">Filiais ({detalhesEscola.filiais.length})</h4>
                  </div>
                  <div className="space-y-2">
                    {detalhesEscola.filiais.map((filial: any) => (
                      <div key={filial.id} className="bg-zinc-50 p-3 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-medium">{filial.nome_fantasia}</p>
                          <p className="text-xs text-muted-foreground">{filial.cidade}/{filial.estado}</p>
                        </div>
                        <Badge variant={filial.status === 'ativo' ? 'default' : 'secondary'}>
                          {filial.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Building2 className="h-8 w-8 animate-pulse text-muted-foreground" />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogDetalhesAberto(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Suspensão */}
      <Dialog open={dialogSuspensaoAberto} onOpenChange={setDialogSuspensaoAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-destructive">
              <Ban className="h-6 w-6" />
              Suspender Acesso da Escola
            </DialogTitle>
            <DialogDescription className="pt-2">
              Esta ação irá bloquear o acesso de todos os usuários da escola.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-amber-800">Atenção - Ação Irreversível</p>
                  <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                    <li>Todos os usuários perderão o acesso imediatamente</li>
                    <li>A escola não poderá emitir novas cobranças</li>
                    <li>O acesso administrativo será bloqueado</li>
                    <li>Dados permanecem armazenados para consulta</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">
                Motivo da Suspensão <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={motivoSuspensao}
                onChange={(e) => setMotivoSuspensao(e.target.value)}
                placeholder="Descreva o motivo da suspensão (ex: inadimplência, solicitação do cliente, etc.)"
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogSuspensaoAberto(false)}
              disabled={suspenderEscola.isPending}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmarSuspensao}
              disabled={suspenderEscola.isPending || !motivoSuspensao.trim()}
            >
              {suspenderEscola.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar Suspensão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórico de Pagamentos */}
      <DialogPagamentos 
        escolaId={escolaSelecionada} 
        open={dialogPagamentosAberto} 
        onOpenChange={setDialogPagamentosAberto} 
      />

      {/* Dialog de Detalhes do Devedor */}
      <Dialog open={dialogDevedorAberto} onOpenChange={setDialogDevedorAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Pagamentos em Atraso
            </DialogTitle>
            <DialogDescription className="pt-2">
              Escola com faturas pendentes ou atrasadas.
            </DialogDescription>
          </DialogHeader>

          {escolaDevedoraSelecionada && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-900">{escolaDevedoraSelecionada.escola?.razao_social}</h3>
                    <p className="text-xs text-red-700">Débito Total Estimado</p>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-xl font-black text-red-600">
                      R$ {Number(escolaDevedoraSelecionada.total_devido).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-zinc-900">Ações</h4>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={handleDarBaixa}
                    disabled={confirmarPagamento.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {confirmarPagamento.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    <DollarSign className="h-4 w-4 mr-2" />
                    Dar Baixa
                  </Button>
                  <Button 
                    onClick={handleEnviarCobrancaDevedor}
                    disabled={enviarCobranca.isPending}
                    variant="outline"
                  >
                    {enviarCobranca.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Cobrança
                  </Button>
                  <Button 
                    onClick={() => {
                      setMotivoSuspensao('')
                      setDialogDevedorAberto(false)
                      setEscolaSelecionada(escolaDevedoraSelecionada.escola?.id)
                      setDialogSuspensaoAberto(true)
                    }}
                    variant="destructive"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Cancelar Acesso
                  </Button>
                </div>
              </div>

              {escolaDevedoraSelecionada.escola?.nome_gestor && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    Contato: {escolaDevedoraSelecionada.escola.nome_gestor} ({escolaDevedoraSelecionada.escola.email_gestor})
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogDevedorAberto(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DialogPagamentos({ escolaId, open, onOpenChange }: { escolaId: string | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: faturas, isLoading } = useFaturas(escolaId ? { tenant_id: escolaId } : undefined)
  const { data: detalhesEscola } = useEscolaDetalhes(escolaId)
  const createFatura = useCreateFatura()
  const deleteFatura = useDeleteFatura()

  const [dialogNovaFaturaAberto, setDialogNovaFaturaAberto] = useState(false)
  const [novaFatura, setNovaFatura] = useState({
    valor: '',
    competencia: format(new Date(), 'yyyy-MM-01'),
    data_vencimento: format(new Date(new Date().setDate(new Date().getDate() + 5)), 'yyyy-MM-dd'),
    forma_pagamento: 'pix_manual'
  })

  const handleCriarFatura = async () => {
    if (!novaFatura.valor || Number(novaFatura.valor) <= 0) {
      toast.error('Informe um valor válido.')
      return
    }

    try {
      await createFatura.mutateAsync({
        tenant_id: escolaId,
        valor: Number(novaFatura.valor),
        competencia: novaFatura.competencia,
        data_vencimento: novaFatura.data_vencimento,
        forma_pagamento: novaFatura.forma_pagamento,
        status: 'pendente'
      })
      toast.success('Fatura manual gerada com sucesso!')
      setDialogNovaFaturaAberto(false)
    } catch {
      toast.error('Erro ao gerar fatura manual.')
    }
  }

  const handleExcluirFatura = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fatura?')) return
    try {
      await deleteFatura.mutateAsync(id)
      toast.success('Fatura excluída com sucesso.')
    } catch {
      toast.error('Erro ao excluir fatura.')
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
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white border-0 shadow-2xl p-0">
          <DialogHeader className="p-8 border-b bg-zinc-50/50">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center border border-indigo-200 shadow-sm">
                <CreditCard className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-zinc-900 leading-tight">Histórico de Pagamentos</DialogTitle>
                <DialogDescription className="text-zinc-600 font-medium">
                  {detalhesEscola?.razao_social || 'Carregando...'}
                </DialogDescription>
              </div>
            </div>
            <Button 
                onClick={() => setDialogNovaFaturaAberto(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
                <Plus className="h-4 w-4 mr-2" />
                Nova Fatura Manual
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-12 w-12 rounded-full border-4 border-zinc-100 border-t-indigo-600 animate-spin" />
                <p className="text-sm font-bold text-zinc-400 animate-pulse uppercase tracking-widest">Buscando histórico...</p>
              </div>
            ) : faturas && faturas.length > 0 ? (
              <div className="border border-zinc-100 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-zinc-50/50">
                    <TableRow>
                      <TableHead className="pl-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 py-4">Competência</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 py-4">Valor</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 py-4">Vencimento</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 py-4">Status</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 py-4">Comprovante</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faturas.map((f: Fatura) => (
                      <TableRow key={f.id} className="group hover:bg-zinc-50 transition-colors border-zinc-100">
                        <TableCell className="pl-6 py-4">
                          <span className="font-bold text-zinc-900 uppercase text-sm">
                            {f.competencia ? format(new Date(f.competencia), 'MMM/yyyy', { locale: ptBR }) : '—'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="font-black text-indigo-600">
                            R$ {Number(f.valor).toFixed(2).replace('.', ',')}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-xs font-bold text-zinc-500">
                          {f.data_vencimento ? format(new Date(f.data_vencimento), 'dd/MM/yyyy') : '—'}
                        </TableCell>
                        <TableCell className="py-4">
                          {getStatusBadge(f.status)}
                        </TableCell>
                        <TableCell className="py-4">
                          {f.comprovante_url ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-[11px] font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                              onClick={() => window.open(f.comprovante_url!, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-2" />
                              Ver Comprovante
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-zinc-300 uppercase italic">Não enviado</span>
                                {f.status === 'pendente' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                                        onClick={() => handleExcluirFatura(f.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-zinc-50/50 rounded-3xl border-2 border-dashed border-zinc-200">
                <FileText className="h-16 w-16 text-zinc-200 mb-6" />
                <p className="text-lg font-black text-zinc-400 uppercase tracking-widest">Nenhuma fatura registrada</p>
                <p className="text-sm text-zinc-400 mt-2 font-medium">Esta instituição ainda não possui histórico de faturamento.</p>
              </div>
            )}
          </div>

          <DialogFooter className="p-6 border-t bg-zinc-50/50 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="px-8 font-black uppercase tracking-widest text-xs h-11 rounded-xl border-zinc-200 hover:bg-white hover:border-zinc-300 shadow-sm transition-all"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogNovaFaturaAberto} onOpenChange={setDialogNovaFaturaAberto}>
        <DialogContent className="max-w-md bg-white">
            <DialogHeader>
                <DialogTitle>Gerar Fatura Manual</DialogTitle>
                <DialogDescription>
                    Crie uma nova cobrança para esta instituição. A escola será notificada se o método for PIX.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Valor da Fatura (R$)</label>
                    <Input 
                        type="number" 
                        placeholder="0,00" 
                        value={novaFatura.valor}
                        onChange={(e) => setNovaFatura({ ...novaFatura, valor: e.target.value })}
                        className="font-bold text-lg text-indigo-600"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">Competência</label>
                        <Input 
                            type="date" 
                            value={novaFatura.competencia}
                            onChange={(e) => setNovaFatura({ ...novaFatura, competencia: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">Vencimento</label>
                        <Input 
                            type="date" 
                            value={novaFatura.data_vencimento}
                            onChange={(e) => setNovaFatura({ ...novaFatura, data_vencimento: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Método de Pagamento</label>
                    <select 
                        className="w-full h-10 px-3 rounded-md border border-zinc-200 text-sm"
                        value={novaFatura.forma_pagamento}
                        onChange={(e) => setNovaFatura({ ...novaFatura, forma_pagamento: e.target.value })}
                    >
                        <option value="pix_manual">PIX Manual (Comprovante)</option>
                        <option value="boleto">Boleto Bancário</option>
                        <option value="mercado_pago">Cartão / MP (Automático)</option>
                    </select>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={() => setDialogNovaFaturaAberto(false)}>Cancelar</Button>
                <Button 
                    onClick={handleCriarFatura}
                    disabled={createFatura.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                    {createFatura.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Gerar Fatura
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
