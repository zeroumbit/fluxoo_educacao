import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, CreditCard, Users, Loader2 } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { useSuperAdminDashboard } from '../hooks'
import { Badge } from '@/components/ui/badge'
import { useTenantHealthScores } from '../hooks'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react'

export function SuperAdminDashboardPageWeb() {
  const { data: dashboard, isLoading } = useSuperAdminDashboard()
  const { data: healthScores, isLoading: loadingHealth } = useTenantHealthScores()

  if (isLoading || !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground font-semibold" />
      </div>
    )
  }

  const { 
    totalEscolas, 
    assinaturasAtivas, 
    totalAlunos, 
    escolasRecentes, 
    saudeFinanceiraGlobal,
    faturasPixPendentes,
    faturasAtrasadas,
    faturamentoTotal
  } = dashboard

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão da Empresa</h1>
          <p className="text-muted-foreground">Visão global da plataforma e unidades escolares</p>
        </div>
      </div>

      {(faturasPixPendentes > 0 || faturasAtrasadas > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
            {faturasPixPendentes > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <AlertCircle className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-900">{faturasPixPendentes} PIX aguardando confirmação</p>
                            <p className="text-xs text-amber-700 font-medium">Verifique os comprovantes nas faturas.</p>
                        </div>
                    </div>
                    <a href="/super-admin/faturas" className="text-xs font-black uppercase tracking-widest text-amber-600 hover:text-amber-700">Ver Todas</a>
                </div>
            )}
            {faturasAtrasadas > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center">
                            <TrendingDown className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-red-900">{faturasAtrasadas} faturas atrasadas</p>
                            <p className="text-xs text-red-700 font-medium">Escolas com pendências financeiras.</p>
                        </div>
                    </div>
                    <a href="/super-admin/faturas" className="text-xs font-black uppercase tracking-widest text-red-600 hover:text-red-700">Ver Todas</a>
                </div>
            )}
        </div>
      )}

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
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-muted-foreground">Faturamento mensal</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(faturamentoTotal || 0)}</p>
            </div>
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
                      <span>Uso: {Math.round(score.percentual_uso)}% ({score.alunos_ativos}/{score.limite_alunos_contratado})</span>
                      <span>{score.possui_atraso ? '⚠️ Atraso' : '✅ Em Dia'}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider",
                        score.health_score < 25 ? "text-red-600" : score.health_score < 50 ? "text-amber-600" : score.health_score < 75 ? "text-yellow-600" : "text-emerald-600"
                      )}>
                        {score.health_score < 25 ? 'Crítico' : score.health_score < 50 ? 'Atenção' : score.health_score < 75 ? 'Estável' : 'Saudável'}
                      </span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            score.health_score < 25 ? "bg-red-500" : score.health_score < 50 ? "bg-amber-500" : score.health_score < 75 ? "bg-yellow-500" : "bg-emerald-500"
                          )}
                          style={{ width: `${score.health_score}%` }}
                        />
                      </div>
                    </div>
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
