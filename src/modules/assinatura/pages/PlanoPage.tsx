import { useState } from 'react'
import { useAuth } from '@/modules/auth/AuthContext'
import { useEscola, useSolicitacoesUpgrade, useCriarSolicitacaoUpgrade, useAssinaturaAtiva } from '../hooks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  ArrowUpCircle, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Trophy,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export function PlanoPage() {
  const { authUser } = useAuth()
  const { data: escola, isLoading: loadingEscola } = useEscola()
  const { data: assinatura, isLoading: loadingAssinatura } = useAssinaturaAtiva()
  const { data: solicitacoes } = useSolicitacoesUpgrade()
  const criarUpgrade = useCriarSolicitacaoUpgrade()

  const [novoLimite, setNovoLimite] = useState<number>(0)
  const [isRequesting, setIsRequesting] = useState(false)

  // Sincronização de dados reais do Super Admin / Banco de Dados
  // Prioriza a assinatura ativa, depois os dados da escola
  const activePlan = (assinatura as any)?.plano || (escola as any)?.plano
  const currentLimit = (assinatura as any)?.limite_alunos_contratado || (escola as any)?.limite_alunos_contratado || 0
  const valorUnitario = (assinatura as any)?.valor_por_aluno_contratado || (activePlan ? Number(activePlan.valor_por_aluno) : 0)
  const totalMensal = (assinatura as any)?.valor_total_contratado || (currentLimit * valorUnitario)

  // Data de referência do contrato
  const dataReferencia = (assinatura as any)?.data_inicio || (escola as any)?.data_inicio

  const handleRequestUpgrade = async () => {
    if (novoLimite <= currentLimit) {
      toast.error('O novo limite deve ser maior que o atual.')
      return
    }

    try {
      await criarUpgrade.mutateAsync({
        tenant_id: authUser!.tenantId,
        limite_atual: currentLimit,
        limite_solicitado: novoLimite,
        valor_atual: totalMensal,
        valor_proposto: novoLimite * valorUnitario,
        status: 'pendente'
      })
      toast.success('Solicitação de upgrade enviada!')
      setIsRequesting(false)
      setNovoLimite(0)
    } catch {
      toast.error('Erro ao enviar solicitação.')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado': return <Badge className="bg-emerald-500">Aprovado</Badge>
      case 'pendente': return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Análise</Badge>
      case 'recusado': return <Badge variant="destructive">Recusado</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loadingEscola || loadingAssinatura) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Seu Plano</h1>
        <p className="text-muted-foreground">Informações de assinatura e limites da sua escola.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card do Plano Atual - UI Restaurada e Sincronizada */}
        <Card className="lg:col-span-2 border-0 shadow-lg overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-br from-indigo-700 to-blue-600 text-white pb-8">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-300 fill-amber-300/20" />
                  {activePlan?.nome || 'Plano Personalizado'}
                </CardTitle>
                <CardDescription className="text-indigo-100 mt-1">
                  Ativo desde {dataReferencia ? format(new Date(dataReferencia), "dd/MM/yyyy") : '—'}
                </CardDescription>
              </div>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-md uppercase tracking-wider text-[10px] font-bold">
                {(escola as any)?.status_assinatura || 'Ativa'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Capacidade Contratada</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-zinc-900">{currentLimit}</span>
                  <span className="text-sm text-muted-foreground font-medium">Alunos</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Valor por Aluno</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-medium text-muted-foreground">R$</span>
                  <span className="text-2xl font-black text-zinc-900">{valorUnitario.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Total Mensal</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-medium text-indigo-600">R$</span>
                  <span className="text-2xl font-black text-indigo-700">{totalMensal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-zinc-100">
                  <CreditCard className="h-5 w-5 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Método de Pagamento</p>
                  <p className="text-xs text-muted-foreground capitalize">{(escola as any)?.metodo_pagamento?.replace('_', ' ') || 'Manual (PIX/Boleto)'}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-zinc-600 font-bold border-zinc-200">
                Alterar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card de Upgrade Rápido */}
        <Card className="border-0 shadow-lg bg-zinc-900 text-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-indigo-400">
              <Plus className="h-5 w-5" />
              Upgrade de Limite
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Expanda sua escola com mais vagas para novos alunos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isRequesting ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Solicite um aumento no limite de alunos para continuar crescendo e recebendo novas matrículas.
                </p>
                <Button 
                  onClick={() => setIsRequesting(true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 border-0 h-11 font-bold shadow-lg shadow-indigo-900/20"
                >
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  Solicitar Upgrade
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs uppercase font-bold tracking-wider">Novo Limite Almejado</Label>
                  <Input 
                    type="number" 
                    placeholder="Ex: 500" 
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus:ring-indigo-500"
                    value={novoLimite || ''}
                    onChange={(e) => setNovoLimite(Number(e.target.value))}
                  />
                </div>
                {novoLimite > currentLimit && (
                  <div className="p-3 rounded-lg bg-indigo-950/50 border border-indigo-500/30">
                    <p className="text-xs text-indigo-300 leading-relaxed font-medium">
                      Novo investimento: <strong className="text-white">R$ {(novoLimite * valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</strong>. 
                    </p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="ghost" onClick={() => setIsRequesting(false)} className="flex-1 text-zinc-400 hover:bg-zinc-800 hover:text-white">
                    Cancelar
                  </Button>
                  <Button 
                    variant="default" 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleRequestUpgrade}
                    disabled={criarUpgrade.isPending || novoLimite <= currentLimit}
                  >
                    {criarUpgrade.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Solicitações */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Alterações</CardTitle>
          <CardDescription>Acompanhe aqui o status dos seus pedidos de mudança de plano.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-100">
            {solicitacoes?.map((sol: any) => (
              <div key={sol.id} className="p-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center",
                    sol.status === 'aprovado' ? "bg-emerald-50 text-emerald-600" : 
                    sol.status === 'pendente' ? "bg-amber-50 text-amber-600" : "bg-zinc-50 text-zinc-400"
                  )}>
                    {sol.status === 'aprovado' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">
                      Upgrade para {sol.limite_solicitado} alunos
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Solicitado em {format(new Date(sol.created_at), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  {getStatusBadge(sol.status)}
                  <p className="text-[10px] text-zinc-400 font-bold uppercase">R$ {Number(sol.valor_proposto || 0).toFixed(2)}</p>
                </div>
              </div>
            ))}
            {(!solicitacoes || solicitacoes.length === 0) && (
              <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-zinc-50 flex items-center justify-center">
                  <Clock className="h-6 w-6 opacity-30" />
                </div>
                <p className="text-sm font-medium">Nenhuma alteração solicitada até o momento.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
