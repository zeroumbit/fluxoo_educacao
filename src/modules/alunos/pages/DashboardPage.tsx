import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDashboard } from '../dashboard.hooks'
import { Users, CreditCard, AlertTriangle, Megaphone, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function DashboardPage() {
  const { data: dashboard, isLoading } = useDashboard()

  if (isLoading || !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const { totalAlunosAtivos, limiteAlunos, totalCobrancasAbertas, avisosRecentes } = dashboard
  const percentualLimite = limiteAlunos ? (totalAlunosAtivos / limiteAlunos) * 100 : 0
  const proximoDoLimite = percentualLimite >= 80

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua escola</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alunos Ativos
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAlunosAtivos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              de {limiteAlunos} permitidos
            </p>
            {/* Barra de progresso */}
            <div className="mt-3 h-2 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  proximoDoLimite
                    ? 'bg-gradient-to-r from-amber-400 to-red-500'
                    : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                }`}
                style={{ width: `${Math.min(percentualLimite, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cobranças Abertas
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCobrancasAbertas}</div>
            <p className="text-xs text-muted-foreground mt-1">pendentes ou atrasadas</p>
          </CardContent>
        </Card>

        {proximoDoLimite && (
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-800">
                Alerta de Limite
              </CardTitle>
              <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-800">
                {Math.round(percentualLimite)}%
              </div>
              <p className="text-xs text-amber-700 mt-1">do limite utilizado</p>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avisos Publicados
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avisosRecentes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">nos últimos avisos</p>
          </CardContent>
        </Card>
      </div>

      {/* Avisos recentes */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Avisos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {avisosRecentes.length > 0 ? (
            <div className="space-y-4">
              {avisosRecentes.map((aviso) => (
                <div
                  key={aviso.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-zinc-50/80 hover:bg-zinc-100/80 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center shrink-0">
                    <Megaphone className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{aviso.titulo}</h4>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {aviso.turmas ? aviso.turmas.nome : 'Todos'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {aviso.conteudo}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(aviso.criado_em), "dd 'de' MMMM 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum aviso publicado ainda.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
