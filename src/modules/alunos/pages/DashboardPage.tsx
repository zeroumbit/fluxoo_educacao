import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { useDashboard } from '../dashboard.hooks'
import {
  Users,
  CreditCard,
  AlertTriangle,
  Megaphone,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  BookOpen,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { OnboardingGuide } from '../components/OnboardingGuide'
import type { AvisoRecente, RadarAluno } from '../dashboard.service'

// ---------------------------------------------------------------------------
// Sub-componente: Card de Métrica
// ---------------------------------------------------------------------------
interface MetricCardProps {
  label: string
  value: number | string
  sub: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  warning?: boolean
  children?: React.ReactNode
  onClick?: () => void
}

function MetricCard({ label, value, sub, icon: Icon, iconBg, iconColor, warning, children, onClick }: MetricCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`border shadow-sm hover:shadow-md transition-all duration-300 rounded-[2rem] overflow-hidden group ${
        warning ? 'border-amber-100 bg-amber-50/20' : 'border-zinc-100 bg-white'
      } ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
        <CardTitle className={`text-[10px] font-black uppercase tracking-[0.2em] ${warning ? 'text-amber-600' : 'text-zinc-400'}`}>
          {label}
        </CardTitle>
        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className={`text-3xl font-black tracking-tight ${warning ? 'text-amber-700' : 'text-zinc-900'}`}>
          {value}
        </div>
        <p className={`text-[11px] mt-1 font-medium ${warning ? 'text-amber-600' : 'text-zinc-500'}`}>{sub}</p>
        {children}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Sub-componente: Card do Radar de Evasão
// ---------------------------------------------------------------------------
function RadarCard({ aluno }: { aluno: RadarAluno }) {
  const nivel =
    aluno.cobrancas_atrasadas >= 2 && aluno.faltas_consecutivas >= 5
      ? 'CRÍTICO'
      : aluno.cobrancas_atrasadas >= 1 && aluno.faltas_consecutivas >= 3
      ? 'ALERTA'
      : 'ATENÇÃO'

  const badgeClass =
    nivel === 'CRÍTICO'
      ? 'bg-red-600 text-white'
      : nivel === 'ALERTA'
      ? 'bg-amber-500 text-white'
      : 'bg-yellow-400 text-yellow-900'

  return (
    <div className="p-5 rounded-[1.5rem] bg-white border border-red-100 shadow-sm space-y-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="flex justify-between items-start gap-2">
        <h4 className="font-bold text-sm text-zinc-900 leading-tight">{aluno.nome_completo}</h4>
        <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider shrink-0 ${badgeClass}`}>
          {nivel}
        </span>
      </div>
      <div className="space-y-2">
        {aluno.faltas_consecutivas > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
              <Users className="h-3.5 w-3.5 text-red-500" />
            </div>
            <p className="text-[11px] text-red-600 font-semibold">
              {aluno.faltas_consecutivas} falta{aluno.faltas_consecutivas > 1 ? 's' : ''} nos últimos 21 dias
            </p>
          </div>
        )}
        {aluno.cobrancas_atrasadas > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <CreditCard className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <p className="text-[11px] text-amber-600 font-semibold">
              {aluno.cobrancas_atrasadas} mensalidade{aluno.cobrancas_atrasadas > 1 ? 's' : ''} em atraso
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-componente: Item do Mural de Avisos
// ---------------------------------------------------------------------------
function AvisoItem({ aviso, index }: { aviso: AvisoRecente; index: number }) {
  const colors = [
    { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-100' },
    { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
    { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-violet-100' },
    { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
    { bg: 'bg-rose-50', icon: 'text-rose-600', border: 'border-rose-100' },
    { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100' },
  ]
  const c = colors[index % colors.length]

  return (
    <div className="flex items-start gap-5 p-6 hover:bg-zinc-50/40 transition-colors rounded-2xl -mx-2 px-2">
      <div className={`h-12 w-12 rounded-2xl ${c.bg} flex items-center justify-center shrink-0 border ${c.border} shadow-sm`}>
        <Megaphone className={`h-5 w-5 ${c.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h4 className="font-bold text-sm text-zinc-900 truncate">{aviso.titulo}</h4>
          <Badge
            variant="secondary"
            className="text-[9px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-500 rounded-lg shrink-0"
          >
            {aviso.turmas?.nome ?? 'Todos'}
          </Badge>
        </div>
        <p className="text-[12px] text-zinc-500 line-clamp-2 leading-relaxed font-medium">
          {aviso.conteudo}
        </p>
        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-2">
          {format(new Date(aviso.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página Principal
// ---------------------------------------------------------------------------
export function DashboardPage() {
  const navigate = useNavigate()
  const { data: dashboard, isLoading, isError } = useDashboard()

  // Estado de carregamento
  if (isLoading || (!dashboard && !isError)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  // Erro crítico
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

  if (!dashboard) return null

  const {
    totalAlunosAtivos,
    limiteAlunos,
    totalCobrancasAbertas,
    totalContasPagarAbertas,
    avisosRecentes,
    onboarding,
    statusAssinatura,
    metodoPagamento,
    radarEvasao,
  } = dashboard

  const percentualLimite = limiteAlunos ? (totalAlunosAtivos / limiteAlunos) * 100 : 0
  const proximoDoLimite = percentualLimite >= 80

  // Bloqueio por aprovação pendente (pagamento manual)
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
            Seja bem-vindo ao <strong>Fluxoo Educação</strong>!{' '}<br />
            Identificamos que seu cadastro ainda está em fase de aprovação pelo nosso time financeiro.
          </p>
        </div>
        <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-2xl w-full">
          <p className="text-sm text-amber-800 font-medium leading-relaxed">
            Se você realizou o pagamento via <strong>PIX</strong>, o prazo de liberação é de até 24h úteis.
            Assim que aprovado, todas as funcionalidades serão liberadas automaticamente.
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold opacity-50">
          Powered by Fluxoo &bull; 2026
        </p>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Renderização Principal
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua escola</p>
        </div>
      </div>

      {/* 1. Onboarding Guide (condicional — some quando completo) */}
      {onboarding && <OnboardingGuide status={onboarding} />}

      {/* 2. Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card Combinado: Capacidade e Alunos */}
        <MetricCard
          label="Capacidade de Alunos"
          value={`${totalAlunosAtivos} / ${limiteAlunos}`}
          sub={proximoDoLimite ? "Próximo do limite do plano" : `${limiteAlunos - totalAlunosAtivos} vagas disponíveis`}
          icon={Users}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          warning={proximoDoLimite}
          onClick={() => navigate('/alunos')}
        >
          <div className="mt-4 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                proximoDoLimite ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(percentualLimite, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 font-bold uppercase tracking-wider text-[9px]">
            <span className={proximoDoLimite ? "text-amber-500" : "text-zinc-400"}>
              {Math.round(percentualLimite)}% Utilizado
            </span>
            <span className="text-zinc-400">
              {limiteAlunos - totalAlunosAtivos} Livres
            </span>
          </div>
        </MetricCard>

        {/* Card: Cobranças Abertas */}
        <MetricCard
          label="Cobranças Abertas"
          value={totalCobrancasAbertas}
          sub="recebíveis pendentes"
          icon={CreditCard}
          iconBg={totalCobrancasAbertas > 0 ? 'bg-rose-50' : 'bg-emerald-50'}
          iconColor={totalCobrancasAbertas > 0 ? 'text-rose-600' : 'text-emerald-600'}
          onClick={() => navigate('/financeiro')}
        >
          {totalCobrancasAbertas > 0 && (
            <div className="mt-3 flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" />
              <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">
                Ver pendências
              </p>
            </div>
          )}
        </MetricCard>

        {/* Card: Contas a Pagar */}
        <MetricCard
          label="Contas a Pagar"
          value={totalContasPagarAbertas}
          sub="obrigações pendentes"
          icon={TrendingUp}
          iconBg={totalContasPagarAbertas > 0 ? 'bg-amber-50' : 'bg-emerald-50'}
          iconColor={totalContasPagarAbertas > 0 ? 'text-amber-600' : 'text-emerald-600'}
          onClick={() => navigate('/financeiro')}
        >
          {totalContasPagarAbertas > 0 && (
            <div className="mt-3 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                Contas em aberto
              </p>
            </div>
          )}
        </MetricCard>

        {/* Card: Alerta de Limite ou Info Adicional */}
        {proximoDoLimite ? (
          <MetricCard
            label="Alerta de Limite"
            value="CRÍTICO"
            sub="capacidade quase esgotada"
            icon={AlertTriangle}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            warning
            onClick={() => navigate('/perfil-escola')}
          >
            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mt-3">
              Ampliar plano agora
            </p>
          </MetricCard>
        ) : (
          <MetricCard
            label="Situação Geral"
            value="ESTÁVEL"
            sub="operação dentro do limite"
            icon={BookOpen}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            onClick={() => navigate('/alunos')}
          />
        )}
      </div>

      {/* 3. Radar de Evasão */}
      {radarEvasao && radarEvasao.length > 0 && (
        <Card className="border border-red-100 shadow-sm bg-red-50/20 rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-4 px-8 pt-8">
              <div
                className="flex items-center gap-4 cursor-pointer group"
                onClick={() => navigate('/alunos')}
              >
                <div className="h-12 w-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-red-900 tracking-tight flex items-center gap-2">
                    Radar de Evasão
                    <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardTitle>
                  <p className="text-sm text-red-700/70 font-medium">
                    Alunos com faltas recorrentes ou inadimplência — {radarEvasao.length} aluno{radarEvasao.length > 1 ? 's' : ''} em situação de risco
                  </p>
                </div>
              </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {radarEvasao.map((aluno) => (
                <RadarCard key={aluno.aluno_id} aluno={aluno} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Mural de Avisos */}
      <Card className="border border-zinc-100 shadow-sm rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="border-b border-zinc-50 bg-zinc-50/20 px-8 py-6">
          <div className="flex items-center justify-between">
            <CardTitle
              className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate('/mural')}
            >
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Megaphone className="h-5 w-5 text-indigo-600" />
              </div>
              Mural de Avisos
              <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400" />
            </CardTitle>
            {avisosRecentes.length > 0 && (
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                {avisosRecentes.length} aviso{avisosRecentes.length > 1 ? 's' : ''} recente{avisosRecentes.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-4">
          {avisosRecentes.length > 0 ? (
            <div className="divide-y divide-zinc-50">
              {avisosRecentes.map((aviso, idx) => (
                <AvisoItem key={aviso.id} aviso={aviso} index={idx} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-zinc-400 space-y-3">
              <Megaphone className="h-12 w-12 mx-auto opacity-10" />
              <p className="text-sm font-medium">Nenhum aviso publicado ainda.</p>
              <p className="text-[11px] text-zinc-400">
                Vá até o módulo <strong>Mural</strong> para criar comunicados para alunos e responsáveis.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
