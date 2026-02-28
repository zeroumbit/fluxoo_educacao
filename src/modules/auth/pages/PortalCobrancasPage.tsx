import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { portalService } from '@/modules/auth/portal.service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CreditCard } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function PortalCobrancasPage() {
  const { authUser } = useAuth()

  const { data: responsavel } = useQuery({
    queryKey: ['portal', 'responsavel', authUser?.user.id],
    queryFn: () => portalService.buscarResponsavelPorUserId(authUser!.user.id),
    enabled: !!authUser,
  })

  const { data: alunos } = useQuery({
    queryKey: ['portal', 'alunos', responsavel?.id, authUser?.tenantId],
    queryFn: () => portalService.buscarAlunosPorResponsavel(responsavel!.id, authUser!.tenantId),
    enabled: !!responsavel && !!authUser,
  })

  const alunoId = alunos?.[0]?.id || ''

  const { data: cobrancas, isLoading } = useQuery({
    queryKey: ['portal', 'cobrancas', alunoId, authUser?.tenantId],
    queryFn: () => portalService.buscarCobrancasPorAluno(alunoId, authUser!.tenantId),
    enabled: !!alunoId && !!authUser,
  })

  const statusBadge = (status: string, vencimento: string) => {
    const isAtrasado = status === 'pendente' && new Date(vencimento) < new Date()
    const displayStatus = isAtrasado ? 'atrasado' : status

    const styles: Record<string, string> = {
      pendente: 'bg-amber-100 text-amber-800',
      pago: 'bg-emerald-100 text-emerald-800',
      atrasado: 'bg-red-100 text-red-800',
      cancelado: 'bg-zinc-100 text-zinc-600',
    }

    return <Badge className={styles[displayStatus] || ''}>{displayStatus}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Cobranças</h2>

      {cobrancas && cobrancas.length > 0 ? (
        <div className="space-y-3">
          {cobrancas.map((cobranca) => (
            <Card key={cobranca.id} className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{cobranca.descricao}</h3>
                      <p className="text-xs text-muted-foreground">
                        Vencimento:{' '}
                        {format(new Date(cobranca.vencimento + 'T12:00:00'), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(cobranca.valor)}
                    </p>
                    {statusBadge(cobranca.status, cobranca.vencimento)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p>Nenhuma cobrança encontrada.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
