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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-zinc-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-[2rem] bg-white overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
            <CardTitle className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
              Alunos Ativos
            </CardTitle>
            <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center transition-transform group-hover:scale-110">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-3xl font-black text-zinc-900">{totalAlunosAtivos}</div>
            <p className="text-[11px] text-zinc-500 mt-1 font-medium">
              de {limiteAlunos} permitidos
            </p>
            {/* Barra de progresso */}
            <div className="mt-4 h-1.5 rounded-full bg-zinc-50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  proximoDoLimite
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(percentualLimite, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-[2rem] bg-white overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
            <CardTitle className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
              Cobranças Abertas
            </CardTitle>
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center transition-transform group-hover:scale-110">
              <CreditCard className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-3xl font-black text-zinc-900">{totalCobrancasAbertas}</div>
            <p className="text-[11px] text-zinc-500 mt-1 font-medium">pendentes ou atrasadas</p>
          </CardContent>
        </Card>

        {proximoDoLimite && (
          <Card className="border border-amber-100 shadow-sm hover:shadow-md transition-all duration-300 bg-amber-50/30 rounded-[2rem] overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
              <CardTitle className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">
                Alerta de Limite
              </CardTitle>
              <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center transition-transform group-hover:scale-110">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-3xl font-black text-amber-700">
                {Math.round(percentualLimite)}%
              </div>
              <p className="text-[11px] text-amber-600 mt-1 font-medium">do limite utilizado</p>
            </CardContent>
          </Card>
        )}

        <Card className="border border-zinc-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-[2rem] bg-white overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
            <CardTitle className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
              Avisos Publicados
            </CardTitle>
            <div className="h-10 w-10 rounded-2xl bg-violet-50 flex items-center justify-center transition-transform group-hover:scale-110">
              <Megaphone className="h-5 w-5 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-3xl font-black text-zinc-900">{avisosRecentes.length}</div>
            <p className="text-[11px] text-zinc-500 mt-1 font-medium">nos últimos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Radar de Evasão (Inteligência Zero Cost) */}
      {radarEvasao && radarEvasao.length > 0 && (
        <Card className="border border-red-100 shadow-sm bg-red-50/20 rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-4 px-8 pt-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shadow-sm">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-red-900 tracking-tight">Radar de Evasão</CardTitle>
                <p className="text-sm text-red-700/70 font-medium">Insights proativos baseados em faltas e inadimplência</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {radarEvasao.map((aluno: any) => (
                <div key={aluno.aluno_id} className="p-5 rounded-[1.5rem] bg-white border border-red-100 shadow-sm space-y-3 transition-transform hover:-translate-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-zinc-900">{aluno.nome_completo}</h4>
                    <Badge variant="destructive" className="text-[9px] px-2 h-4 font-black uppercase tracking-wider">CRÍTICO</Badge>
                  </div>
                  <div className="space-y-2">
                    {aluno.faltas_consecutivas > 0 && (
                      <p className="text-xs text-red-600 flex items-center gap-2 font-medium">
                        <Users className="h-3.5 w-3.5" /> {aluno.faltas_consecutivas} faltas consecutivas
                      </p>
                    )}
                    {aluno.cobrancas_atrasadas > 0 && (
                      <p className="text-xs text-amber-600 flex items-center gap-2 font-medium">
                        <CreditCard className="h-3.5 w-3.5" /> {aluno.cobrancas_atrasadas} mensalidades em atraso
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
      <Card className="border border-zinc-100 shadow-sm rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="border-b border-zinc-50 bg-zinc-50/20 px-8 py-6">
          <CardTitle className="text-xl font-black text-zinc-900 tracking-tight">Mural de Avisos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {avisosRecentes.length > 0 ? (
            <div className="divide-y divide-zinc-50">
              {avisosRecentes.map((aviso: any) => (
                <div
                  key={aviso.id}
                  className="flex items-start gap-5 p-6 hover:bg-zinc-50/30 transition-colors"
                >
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm">
                    <Megaphone className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h4 className="font-bold text-base text-zinc-900 truncate">{aviso.titulo}</h4>
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-500 rounded-lg">
                        {aviso.turmas ? aviso.turmas.nome : 'Todos'}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed font-medium">
                      {aviso.conteudo}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                       <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                        {format(new Date(aviso.created_at), "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-zinc-400">
              <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-10" />
              <p className="text-sm font-medium">Nenhum aviso publicado ainda.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
