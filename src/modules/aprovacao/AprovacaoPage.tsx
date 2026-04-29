import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AprovacaoService, type AprovacaoPendente } from './AprovacaoService'

export function AprovacaoPage() {
  const queryClient = useQueryClient()
  const [selectedItem, setSelectedItem] = useState<AprovacaoPendente | null>(null)
  const [motivo, setMotivo] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: aprovacoes = [], isLoading } = useQuery({
    queryKey: ['aprovacoes-pendentes'],
    queryFn: AprovacaoService.listarPendentes,
  })

  const decisaoMutation = useMutation({
    mutationFn: ({ id, decisao, motivoStr }: { id: string, decisao: 'aprovada'|'rejeitada', motivoStr?: string }) => 
      AprovacaoService.decidir(id, decisao, motivoStr),
    onSuccess: (_, variables) => {
      toast.success(`Solicitação ${variables.decisao} com sucesso!`)
      queryClient.invalidateQueries({ queryKey: ['aprovacoes-pendentes'] })
      setDialogOpen(false)
      setMotivo('')
      setSelectedItem(null)
    },
    onError: (err: Error) => {
      toast.error('Erro ao registrar decisão', { description: err.message })
    }
  })

  const handleDecision = (decisao: 'aprovada' | 'rejeitada') => {
    if (!selectedItem) return
    if (decisao === 'rejeitada' && motivo.trim().length < 5) {
      toast.warning('Informe um motivo para a rejeição.')
      return
    }
    decisaoMutation.mutate({ id: selectedItem.id, decisao, motivoStr: motivo })
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      transferencia_aluno: 'Transferência',
      cancelamento_matricula: 'Cancelamento',
      alteracao_nota: 'Alteração de Nota',
      lancamento_gestor: 'Ação Excepcional (Gestor)',
      concessao_desconto: 'Desconto Financeiro',
    }
    return labels[type] || 'Outros'
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando aprovações...</div>
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fluxo de Aprovações</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de autorizações para ações sensíveis da escola.
          </p>
        </div>
        <Badge variant={aprovacoes.length > 0 ? "destructive" : "secondary"} className="px-4 py-1 text-sm">
          {aprovacoes.length} pendente{aprovacoes.length !== 1 && 's'}
        </Badge>
      </div>

      {aprovacoes.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <CheckCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">Tudo em dia!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Não há nenhuma solicitação aguardando sua aprovação no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {aprovacoes.map(aprov => (
            <Card key={aprov.id} className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      {getTypeLabel(aprov.tipo_acao)}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(aprov.created_at), "dd/MM 'às' HH:mm")}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{aprov.titulo}</CardTitle>
                  <CardDescription className="text-foreground/80 mt-1">
                    {aprov.descricao}
                  </CardDescription>
                </div>
                
                <Dialog open={dialogOpen && selectedItem?.id === aprov.id} onOpenChange={(open) => {
                  setDialogOpen(open)
                  if(open) setSelectedItem(aprov)
                  else { setSelectedItem(null); setMotivo('') }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">Analisar</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Analisar Solicitação</DialogTitle>
                      <DialogDescription>
                        Revise os detalhes abaixo antes de aprovar ou rejeitar.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4 text-sm">
                      <div className="bg-muted p-3 rounded-md">
                        <span className="font-semibold block mb-1">Justificativa do Solicitante:</span>
                        <span className="italic text-muted-foreground">"{aprov.justificativa}"</span>
                      </div>

                      {aprov.tipo_acao === 'lancamento_gestor' && (
                        <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                          <AlertCircle className="h-5 w-5 shrink-0" />
                          <p className="text-xs leading-relaxed">
                            <strong>Atenção:</strong> Esta é uma notificação de uma ação excepcional já executada por um Gestor. 
                            Você pode validar (Aprovar) para constar no registro de auditoria, ou rejeitar para sinalizar discordância, 
                            embora a ação técnica já tenha ocorrido (pois Gestores têm bypass sistêmico de urgência).
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="font-medium text-sm">
                          Motivo da decisão (Opcional para aprovar, obrigatório para rejeitar)
                        </label>
                        <Textarea 
                          value={motivo} 
                          onChange={e => setMotivo(e.target.value)} 
                          placeholder="Digite aqui observações sobre a sua decisão..."
                          className="resize-none"
                        />
                      </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button 
                        variant="destructive" 
                        onClick={() => handleDecision('rejeitada')}
                        disabled={decisaoMutation.isPending}
                        className="w-full sm:w-auto"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Rejeitar
                      </Button>
                      <Button 
                        variant="default" 
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                        onClick={() => handleDecision('aprovada')}
                        disabled={decisaoMutation.isPending}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Aprovar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default AprovacaoPage
