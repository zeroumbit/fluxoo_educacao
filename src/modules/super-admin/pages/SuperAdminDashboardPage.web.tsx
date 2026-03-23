import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, CreditCard, Users, Loader2 } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { useSuperAdminDashboard } from '../hooks'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTenantHealthScores } from '../hooks'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { useAdminNotifications } from '@/hooks/useGlobalNotifications'

export function SuperAdminDashboardPageWeb() {
  const { data: dashboard, isLoading } = useSuperAdminDashboard()
  const { data: healthScores, isLoading: loadingHealth } = useTenantHealthScores()
  const { data: notifications } = useAdminNotifications()

  if (isLoading || !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground font-semibold" />
      </div>
    )
  }

  const { totalEscolas, assinaturasAtivas, totalAlunos, escolasRecentes, saudeFinanceiraGlobal } = dashboard

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão da Empresa</h1>
          <p className="text-muted-foreground">Visão global da plataforma e unidades escolares</p>
        </div>
        <NotificationBell
          total={notifications?.total || 0}
          items={notifications?.items || []}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-[30px]">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Escolas
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEscolas}</div>
            <p className="text-xs text-muted-foreground mt-1">Instituições cadastradas</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-[30px]">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assinaturas Ativas
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{assinaturasAtivas}</div>
            <p className="text-xs text-muted-foreground mt-1">Planos em vigor</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-[30px]">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Alunos
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center">
              <Users className="h-5 w-5 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAlunos}</div>
            <p className="text-xs text-muted-foreground mt-1">Em toda a plataforma</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-slate-50 to-zinc-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-[30px]">
            <div>
              <CardTitle className="text-sm font-medium text-slate-800">
                Saúde Global
              </CardTitle>
            </div>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shadow-sm ${saudeFinanceiraGlobal >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
              <TrendingUp className={`h-5 w-5 ${saudeFinanceiraGlobal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tracking-tight ${saudeFinanceiraGlobal >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(saudeFinanceiraGlobal)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Consolidado de todas as escolas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-0 shadow-md">
          <CardHeader className="pt-[30px]">
            <CardTitle>Escolas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {escolasRecentes.length > 0 ? (
                escolasRecentes.map((escola: any) => (
                  <div
                    key={escola.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-zinc-50/80 hover:bg-zinc-100/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-white rounded-lg border flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-zinc-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{escola.razao_social}</h4>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(escola.created_at, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={escola.status_assinatura === 'ativa' ? 'default' : 'secondary'} className="capitalize">
                      {escola.status_assinatura}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma escola cadastrada ainda.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 border-0 shadow-md flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4 pt-[30px]">
            <div>
              <CardTitle>Health Score</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Instituições em risco ou estáveis</p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex-1 overflow-auto max-h-[400px]">
            <div className="space-y-6">
              {loadingHealth ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : healthScores && healthScores.length > 0 ? (
                healthScores.map((score: any) => (
                  <div key={score.tenant_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {score.health_score < 50 ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : score.health_score < 75 ? (
                          <TrendingDown className="h-4 w-4 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                        <span className="text-sm font-medium leading-none">{score.razao_social}</span>
                      </div>
                      <span className={cn(
                        "text-xs font-bold",
                        score.health_score < 50 ? "text-red-600" : score.health_score < 75 ? "text-amber-600" : "text-emerald-600"
                      )}>
                        {score.health_score}%
                      </span>
                    </div>
                    <Progress 
                      value={score.health_score} 
                      className="h-1.5"
                      // Nota: A cor do progresso no shadcn-ui tradicional é primária, mas podemos personalizar via CSS se necessário.
                      // Aqui usaremos a cor padrão por enquanto.
                    />
                    <p className="text-[10px] text-muted-foreground flex justify-between">
                      <span>Uso de Alunos: {Math.round(score.percentual_uso)}%</span>
                      <span>{score.possui_atraso ? '⚠️ Faturas em Atraso' : '✅ Financeiro em Dia'}</span>
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
