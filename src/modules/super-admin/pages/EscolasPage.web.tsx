import { useState } from 'react'
import {
  useEscolas,
  useUpdateEscolaStatus,
  useSuspenderEscola,
  useEscolaDetalhes
} from '../hooks'
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
  Phone,
  MapPin,
  TrendingUp
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
  const [searchTerm, setSearchTerm] = useState('')
  const [escolaSelecionada, setEscolaSelecionada] = useState<string | null>(null)
  const [dialogDetalhesAberto, setDialogDetalhesAberto] = useState(false)
  const [dialogSuspensaoAberto, setDialogSuspensaoAberto] = useState(false)
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-xl shadow-zinc-200/50 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aguardando Aprovação</CardTitle>
            <div className="text-2xl font-bold text-amber-600">
              {escolas?.filter(e => e.status_assinatura === 'pendente').length}
            </div>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-xl shadow-zinc-200/50 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Instituições Ativas</CardTitle>
             <div className="text-2xl font-bold text-emerald-600">
              {escolas?.filter(e => e.status_assinatura === 'ativa').length}
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-0 shadow-xl shadow-zinc-200/50 overflow-hidden bg-white">
        <CardHeader>
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
              {suspenderEscola.isPending && <Building2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar Suspensão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
