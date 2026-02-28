import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { portalService } from '@/modules/auth/portal.service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, UserCircle, BookOpen } from 'lucide-react'

export function PortalAlunoPage() {
  const { authUser } = useAuth()

  const { data: responsavel } = useQuery({
    queryKey: ['portal', 'responsavel', authUser?.user.id],
    queryFn: () => portalService.buscarResponsavelPorUserId(authUser!.user.id),
    enabled: !!authUser,
  })

  const { data: alunos, isLoading } = useQuery({
    queryKey: ['portal', 'alunos', responsavel?.id, authUser?.tenantId],
    queryFn: () => portalService.buscarAlunosPorResponsavel(responsavel!.id, authUser!.tenantId),
    enabled: !!responsavel && !!authUser,
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
      <h2 className="text-xl font-bold">Meu(s) Aluno(s)</h2>

      {alunos?.map((aluno) => {
        const turma = (aluno as Record<string, unknown>).turmas as { nome: string; turno: string } | null
        return (
          <Card key={aluno.id} className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-200 to-blue-200 flex items-center justify-center">
                  <UserCircle className="h-8 w-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{aluno.nome}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      className={
                        aluno.status === 'ativo'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-zinc-100 text-zinc-600'
                      }
                    >
                      {aluno.status}
                    </Badge>
                    {turma && (
                      <Badge variant="secondary">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {turma.nome} - {turma.turno}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Data de Nascimento</p>
                  <p className="font-medium">{aluno.data_nascimento || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sexo</p>
                  <p className="font-medium capitalize">{aluno.sexo || '—'}</p>
                </div>
                {aluno.alergias && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Alergias</p>
                    <p className="font-medium">{aluno.alergias}</p>
                  </div>
                )}
                {aluno.tipo_sanguineo && (
                  <div>
                    <p className="text-muted-foreground">Tipo Sanguíneo</p>
                    <p className="font-medium">{aluno.tipo_sanguineo}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {(!alunos || alunos.length === 0) && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            <UserCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p>Nenhum aluno vinculado.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
