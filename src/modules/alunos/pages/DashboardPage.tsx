import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDashboard } from '../dashboard.hooks'
import { Users, CreditCard, AlertTriangle, Megaphone, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { OnboardingGuide } from '../components/OnboardingGuide'

export function DashboardPage() {
  const { data: dashboard, isLoading, isError } = useDashboard()

  // 1. Estado de Carregamento (Sempre mostra spinner se não temos dados ainda)
  if (isLoading || (!dashboard && !isError)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }
 
  // 2. Erro Crítico de Carregamento
  if (isError && !dashboard) {
    return (
      <div className="p-12 text-center bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-zinc-900">Erro ao carregar dados</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Verifique sua conexão com a internet ou tente recarregar a página.
        </p>
      </div>
    )
  }

  // 3. Garantia de Dados (Chegando aqui, dashboard DEVE existir)
  if (!dashboard) return null

  const { totalAlunosAtivos, limiteAlunos, totalCobrancasAbertas, avisosRecentes, onboarding, statusAssinatura, metodoPagamento, radarEvasao } = dashboard
  const percentualLimite = limiteAlunos ? (totalAlunosAtivos / limiteAlunos) * 100 : 0
  const proximoDoLimite = percentualLimite >= 80

  // 4. Lógica de Bloqueio por Aprovação Pendente
  // Só bloqueia se: Status não é ativo E o método é manual (PIX/Boleto)
  const isPendente = statusAssinatura !== 'ativa'
  const isManual = metodoPagamento === 'pix' || metodoPagamento === 'boleto' || metodoPagamento === 'manual'
  const mostrarAvisoAprovacao = isPendente && isManual

  if (mostrarAvisoAprovacao) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto space-y-6 bg-white p-8 rounded-3xl border shadow-sm my-8">
        <div className="h-24 w-24 rounded-3xl bg-amber-50 flex items-center justify-center animate-bounce">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-zinc-900 leading-tight">Aprovação em Andamento</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Seja bem-vindo ao <strong>Fluxoo Educação</strong>! <br/>
            Identificamos que seu cadastro ainda está em fase de aprovação pelo nosso time financeiro.
          </p>
        </div>
        <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-2xl w-full">
          <p className="text-sm text-amber-800 font-medium leading-relaxed">
            Se você realizou o pagamento via <strong>PIX</strong>, o prazo de liberação é de até 24h úteis. 
            Assim que aprovado, todas as funcionalidades serão liberadas automaticamente.
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold opacity-50">Powered by Fluxoo &bull; 2026</p>
      </div>
    )
  }

  // 5. Renderização da Dashboard Real
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua escola</p>
        </div>
      </div>

      {onboarding && <OnboardingGuide status={onboarding} />}

      {/* Cards de métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
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

        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
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
          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-amber-50 to-orange-50 ring-1 ring-amber-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-800 uppercase tracking-wider">
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

        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Avisos Publicados
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avisosRecentes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">nos últimos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Radar de Evasão (Inteligência Zero Cost) */}
      {radarEvasao && radarEvasao.length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-white border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg text-red-900">Radar de Evasão</CardTitle>
                <p className="text-xs text-red-700 font-medium">Insights proativos baseados em faltas e inadimplência</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {radarEvasao.map((aluno: any) => (
                <div key={aluno.aluno_id} className="p-4 rounded-xl bg-white border border-red-100 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-zinc-900">{aluno.nome_completo}</h4>
                    <Badge variant="destructive" className="text-[10px] px-1.5 h-4">ALTA PRIORIDADE</Badge>
                  </div>
                  <div className="space-y-1">
                    {aluno.faltas_consecutivas > 0 && (
                      <p className="text-xs text-red-600 flex items-center gap-1.5">
                        <Users className="h-3 w-3" /> {aluno.faltas_consecutivas} faltas consecutivas
                      </p>
                    )}
                    {aluno.cobrancas_atrasadas > 0 && (
                      <p className="text-xs text-amber-600 flex items-center gap-1.5">
                        <CreditCard className="h-3 w-3" /> {aluno.cobrancas_atrasadas} mensalidades em atraso
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avisos recentes */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b bg-zinc-50/30">
          <CardTitle className="text-lg">Atividades e Mural de Avisos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {avisosRecentes.length > 0 ? (
            <div className="divide-y divide-zinc-100">
              {avisosRecentes.map((aviso: any) => (
                <div
                  key={aviso.id}
                  className="flex items-start gap-4 p-5 hover:bg-zinc-50/80 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <Megaphone className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-sm text-zinc-900 truncate">{aviso.titulo}</h4>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {aviso.turmas ? aviso.turmas.nome : 'Todos'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {aviso.conteudo}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                       <p className="text-xs text-zinc-400">
                        Publicado em {format(new Date(aviso.created_at), "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhum aviso ou material publicado ainda.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
