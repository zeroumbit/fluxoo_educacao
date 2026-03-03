import { useState } from 'react'
import { 
  useEscolas, 
  useUpdateEscolaStatus 
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
  FileText
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function EscolasPage() {
  const { data: escolas, isLoading } = useEscolas()
  const updateStatus = useUpdateEscolaStatus()
  const [searchTerm, setSearchTerm] = useState('')

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
                <TableHead className="pl-6">Instituição</TableHead>
                <TableHead>Gestor / Contato</TableHead>
                <TableHead>Plano / Pagto</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEscolas?.map((escola) => (
                <TableRow key={escola.id} className="group hover:bg-zinc-50/50 transition-colors">
                  <TableCell className="pl-6">
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
                  <TableCell className="text-right pr-6">
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

                        <DropdownMenuItem>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <XCircle className="mr-2 h-4 w-4" />
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
    </div>
  )
}
