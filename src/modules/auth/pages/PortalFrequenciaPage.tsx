import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { portalService } from '@/modules/auth/portal.service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CalendarCheck, Check, X, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function PortalFrequenciaPage() {
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

  const { data: frequencias, isLoading } = useQuery({
    queryKey: ['portal', 'frequencia', alunoId, authUser?.tenantId],
    queryFn: () => portalService.buscarFrequenciaPorAluno(alunoId, authUser!.tenantId),
    enabled: !!alunoId && !!authUser,
  })

  const statusIcon = (status: string) => {
    switch (status) {
      case 'presente':
        return <Check className="h-4 w-4 text-emerald-600" />
      case 'falta':
        return <X className="h-4 w-4 text-red-600" />
      case 'justificada':
        return <AlertCircle className="h-4 w-4 text-amber-600" />
      default:
        return null
    }
  }

  const statusStyle = (status: string) => {
    switch (status) {
      case 'presente':
        return 'bg-emerald-100 text-emerald-800'
      case 'falta':
        return 'bg-red-100 text-red-800'
      case 'justificada':
        return 'bg-amber-100 text-amber-800'
      default:
        return ''
    }
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
      <h2 className="text-xl font-bold">Frequência</h2>

      {frequencias && frequencias.length > 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0 divide-y">
            {frequencias.map((freq) => (
              <div key={freq.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {format(new Date(freq.data + 'T12:00:00'), "EEEE, dd 'de' MMMM", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <Badge className={statusStyle(freq.status)}>
                  <span className="flex items-center gap-1">
                    {statusIcon(freq.status)}
                    {freq.status}
                  </span>
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            <CalendarCheck className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p>Nenhum registro de frequência.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
