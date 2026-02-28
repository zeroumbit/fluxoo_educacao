import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { portalService } from '@/modules/auth/portal.service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Megaphone } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function PortalAvisosPage() {
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

  const turmaId = alunos?.[0]?.turma_id || null

  const { data: avisos, isLoading } = useQuery({
    queryKey: ['portal', 'avisos', turmaId, authUser?.tenantId],
    queryFn: () => portalService.buscarAvisosPorTurma(turmaId, authUser!.tenantId),
    enabled: !!authUser,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Avisos</h2>

      {avisos && avisos.length > 0 ? (
        <div className="space-y-4">
          {avisos.map((aviso) => (
            <Card key={aviso.id} className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center shrink-0">
                    <Megaphone className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{aviso.titulo}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {(aviso as Record<string, unknown>).turmas
                          ? ((aviso as Record<string, unknown>).turmas as { nome: string }).nome
                          : 'Geral'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {aviso.conteudo}
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">
                      {format(new Date(aviso.criado_em), "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p>Nenhum aviso disponível.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
