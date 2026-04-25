import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/AuthContext'
import {
  useAgendaDiaria,
  usePendenciasProfessor,
  useSaudeTurmas,
  useAlertasProfessor,
  useConcluirAlerta
} from '@/modules/professor/hooks'
import type { AgendaAula, Pendencia, SaudeTurma, AlertaProfessor } from '@/modules/professor/types'
import { Greeting } from '@/components/ui/Greeting'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BookOpen,
  Users,
  TrendingUp,
  TrendingDown,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Heart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Component, type ReactNode } from 'react'
import { toast } from 'sonner'

// ─── Error Boundary por Widget ─────────────────────────────────────────────
class WidgetErrorBoundary extends Component<
  { children: ReactNode; title: string },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">
              Erro ao carregar <strong>{this.props.title}</strong>. Os outros painéis continuam funcionando.
            </p>
          </CardContent>
        </Card>
      )
    }
    return this.props.children
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

function formatarDataPendencia(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()} ${MESES[d.getMonth()]}`
}

// ─── Widget: Alertas do Professor ───────────────────────────────────────────
function AlertasCard({ alerta, onConcluir }: { alerta: AlertaProfessor, onConcluir: (id: string) => void }) {
  const iconConfig: Record<string, { icon: any, color: string, bg: string }> = {
    pedagogico: { icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50' },
    frequencia: { icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
    saude: { icon: AlertTriangle, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    inclusao: { icon: Heart, color: 'text-purple-600', bg: 'bg-purple-50' },
    operacional_prof: { icon: ClipboardCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' }
  }

  const { icon: Icon, color, bg } = iconConfig[alerta.tipo] || iconConfig.operacional_prof

  return (
    <div className={cn(
      "group relative flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300",
      "bg-white hover:shadow-md border-zinc-100 hover:border-zinc-200"
    )}>
      {/* Icon Side */}
      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0", bg)}>
        <Icon className={cn("h-6 w-6", color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            {alerta.turma_nome || 'Geral'}
          </span>
          {alerta.gravidade === 'critica' && (
            <Badge className="bg-rose-500 text-white border-0 text-[9px] h-4">CRÍTICO</Badge>
          )}
        </div>
        <h4 className="text-sm font-bold text-zinc-800 leading-snug group-hover:text-indigo-600 transition-colors">
          {alerta.titulo}
        </h4>
        <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
          {alerta.aluno_nome && <strong>{alerta.aluno_nome}: </strong>}
          {alerta.descricao}
        </p>
      </div>

      {/* Done Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-50 hover:bg-emerald-50 hover:text-emerald-600"
        onClick={() => onConcluir(alerta.id)}
      >
        <CheckCircle2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

function AlertasWidget({ data, isLoading }: { data?: AlertaProfessor[]; isLoading: boolean }) {
  const concluir = useConcluirAlerta()

  if (isLoading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
    </div>
  )

  if (!data || data.length === 0) return (
     <div className="flex flex-col items-center justify-center py-12 bg-zinc-50/50 rounded-3xl border-2 border-dashed border-zinc-200">
       <CheckCircle2 className="h-12 w-12 text-zinc-200 mb-4" />
       <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Silêncio por aqui</p>
       <p className="text-zinc-400 text-xs mt-1">Nenhum alerta pendente para suas turmas.</p>
     </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {data.map(alerta => (
        <AlertasCard 
          key={alerta.id} 
          alerta={alerta} 
          onConcluir={(id) => {
            toast.promise(concluir.mutateAsync({ alertaId: id }), {
              loading: 'Concluindo alerta...',
              success: 'Alerta arquivado com sucesso!',
              error: 'Erro ao concluir alerta.'
            })
          }} 
        />
      ))}
    </div>
  )
}

// ─── Widget: Agenda do Dia ──────────────────────────────────────────────────
function AgendaWidget({ data, isLoading }: { data?: AgendaAula[]; isLoading: boolean }) {
  const navigate = useNavigate()
  const hoje = new Date()
  const diaSemana = DIAS_SEMANA[hoje.getDay()]
  const dataFormatada = `${diaSemana}, ${hoje.getDate()} de ${MESES[hoje.getMonth()]}`

  if (isLoading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
    </div>
  )

  if (!data || data.length === 0) return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
      <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
        <Calendar className="h-7 w-7 text-indigo-400" />
      </div>
      <div>
        <p className="font-semibold text-zinc-700">Nenhuma aula alocada para hoje</p>
        <p className="text-sm text-zinc-400 mt-0.5">Aproveite para preparar as próximas aulas!</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">{dataFormatada}</p>
      {data.map(aula => (
        <div
          key={aula.grade_id}
          className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200"
        >
          {/* Horário */}
          <div className="flex-shrink-0 text-center min-w-[52px]">
            <p className="text-base font-bold text-zinc-800 leading-tight">{aula.hora_inicio?.substring(0,5)}</p>
            <p className="text-xs text-zinc-400">{aula.hora_fim?.substring(0,5)}</p>
          </div>

          {/* Separador */}
          <div className="w-px h-10 bg-zinc-200 flex-shrink-0" />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-zinc-800 text-sm truncate">{aula.disciplina_nome}</p>
            <p className="text-xs text-zinc-500 truncate">{aula.turma_nome} {aula.sala && `· Sala ${aula.sala}`}</p>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1 items-end flex-shrink-0">
            <Badge
              variant={aula.chamada_realizada ? 'default' : 'outline'}
              className={cn(
                'text-[10px] px-2 py-0.5 gap-1',
                aula.chamada_realizada ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'text-zinc-400'
              )}
            >
              {aula.chamada_realizada ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              Chamada
            </Badge>
            <Badge
              variant={aula.conteudo_registrado ? 'default' : 'outline'}
              className={cn(
                'text-[10px] px-2 py-0.5 gap-1',
                aula.conteudo_registrado ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100' : 'text-zinc-400'
              )}
            >
              {aula.conteudo_registrado ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              Conteúdo
            </Badge>
          </div>

          {/* Ações */}
          {!aula.chamada_realizada && (
            <Button
              size="sm"
              variant="ghost"
              className="flex-shrink-0 h-8 text-indigo-600 hover:bg-indigo-50"
              onClick={() => navigate(`/frequencia?turma=${aula.turma_id}&disciplina=${aula.disciplina_id}`)}
            >
              <ClipboardCheck className="h-4 w-4" />
            </Button>
          )}
          {!aula.conteudo_registrado && (
            <Button
              size="sm"
              variant="ghost"
              className="flex-shrink-0 h-8 text-blue-600 hover:bg-blue-50"
              onClick={() => navigate(`/planos-aula?turma=${aula.turma_id}&disciplina=${aula.disciplina_id}`)}
            >
              <FileText className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Widget: Pendências ─────────────────────────────────────────────────────
function PendenciasWidget({ data, isLoading }: { data?: Pendencia[]; isLoading: boolean }) {
  if (isLoading) return (
    <div className="space-y-2">
      {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
    </div>
  )

  if (!data || data.length === 0) return (
    <div className="flex items-center gap-3 py-6 justify-center text-center">
      <CheckCircle2 className="h-8 w-8 text-emerald-400 flex-shrink-0" />
      <div className="text-left">
        <p className="font-semibold text-zinc-700">Tudo em dia!</p>
        <p className="text-sm text-zinc-400">Nenhuma pendência nos últimos 15 dias</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-2">
      {data.map((p, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100"
        >
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-800">{p.descricao}</p>
            <p className="text-xs text-zinc-500 truncate">{p.contexto} · {formatarDataPendencia(p.data_referencia)}</p>
          </div>
          <Badge className="flex-shrink-0 bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-[10px]">
            {p.tipo_pendencia === 'conteudo' ? 'Conteúdo' : 'Notas'}
          </Badge>
        </div>
      ))}
    </div>
  )
}

// ─── Widget: Saúde das Turmas ───────────────────────────────────────────────
function SaudeTurmasWidget({ data, isLoading }: { data?: SaudeTurma[]; isLoading: boolean }) {
  if (isLoading) return (
    <div className="space-y-3">
      {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
    </div>
  )

  if (!data || data.length === 0) return (
    <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
      <BookOpen className="h-8 w-8 text-zinc-300" />
      <p className="text-sm text-zinc-400">Nenhuma turma vinculada</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {data.map(turma => {
        const presencaOk = turma.percentual_presenca >= 75
        const mediaOk = turma.media_geral >= 6

        return (
          <div key={turma.turma_id} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-indigo-500" />
                <p className="font-semibold text-sm text-zinc-800">{turma.turma_nome}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <Users className="h-3.5 w-3.5" />
                {turma.total_alunos} alunos
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Frequência */}
              <div className={cn(
                'rounded-xl p-3 flex flex-col gap-1',
                presencaOk ? 'bg-emerald-50' : 'bg-red-50'
              )}>
                <div className="flex items-center gap-1">
                  {presencaOk ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
                  <span className={cn('text-[10px] font-semibold uppercase tracking-wider', presencaOk ? 'text-emerald-600' : 'text-red-600')}>
                    Presença
                  </span>
                </div>
                <p className={cn('text-xl font-bold', presencaOk ? 'text-emerald-700' : 'text-red-700')}>
                  {turma.percentual_presenca}%
                </p>
              </div>

              {/* Média */}
              <div className={cn(
                'rounded-xl p-3 flex flex-col gap-1',
                mediaOk ? 'bg-blue-50' : 'bg-amber-50'
              )}>
                <div className="flex items-center gap-1">
                  {mediaOk ? <TrendingUp className="h-3.5 w-3.5 text-blue-500" /> : <TrendingDown className="h-3.5 w-3.5 text-amber-500" />}
                  <span className={cn('text-[10px] font-semibold uppercase tracking-wider', mediaOk ? 'text-blue-600' : 'text-amber-600')}>
                    Média Geral
                  </span>
                </div>
                <p className={cn('text-xl font-bold', mediaOk ? 'text-blue-700' : 'text-amber-700')}>
                  {turma.media_geral.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Página Principal ────────────────────────────────────────────────────────
export function ProfessorDashboardPage() {
  const { authUser } = useAuth()
  const { data: agenda, isLoading: loadingAgenda } = useAgendaDiaria()
  const { data: pendencias, isLoading: loadingPendencias } = usePendenciasProfessor()
  const { data: saudeTurmas, isLoading: loadingSaude } = useSaudeTurmas()
  const { data: alertas, isLoading: loadingAlertas } = useAlertasProfessor()

  const totalPendencias = pendencias?.length ?? 0
  const totalAlertas = alertas?.length ?? 0

  return (
    <div className="space-y-6 p-4 lg:p-0 animate-in fade-in duration-300">
      <Greeting />

      {/* KPI Strip — Pendências e Alertas em destaque */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {totalPendencias > 0 && (
          <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-amber-800 text-sm">
                {totalPendencias} {totalPendencias === 1 ? 'pendência' : 'pendências'} identificada{totalPendencias > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-600">Conteúdos e resultados pendentes</p>
            </div>
          </div>
        )}
        {totalAlertas > 0 && (
          <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200">
            <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="h-5 w-5 text-rose-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-rose-800 text-sm">
                {totalAlertas} {totalAlertas === 1 ? 'alerta' : 'alertas'} de atenção
              </p>
              <p className="text-xs text-rose-600">Alunos com queda de rendimento ou observações</p>
            </div>
          </div>
        )}
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Agenda do Dia — 2 colunas */}
        <div className="lg:col-span-2">
          <WidgetErrorBoundary title="Agenda do Dia">
            <Card className="h-full border-0 shadow-sm bg-white">
              <CardHeader className="pt-[30px] pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-indigo-600" />
                  </div>
                  Agenda de Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AgendaWidget data={agenda} isLoading={loadingAgenda} />
              </CardContent>
            </Card>
          </WidgetErrorBoundary>
        </div>

        {/* Pendências — 1 coluna */}
        <div>
          <WidgetErrorBoundary title="Pendências">
            <Card className="h-full border-0 shadow-sm bg-white">
              <CardHeader className="pt-[30px] pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center',
                    totalPendencias > 0 ? 'bg-amber-100' : 'bg-emerald-100'
                  )}>
                    <AlertTriangle className={cn('h-4 w-4', totalPendencias > 0 ? 'text-amber-600' : 'text-emerald-600')} />
                  </div>
                  Pendências
                  {totalPendencias > 0 && (
                    <Badge className="bg-amber-500 text-white text-xs ml-auto">
                      {totalPendencias}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PendenciasWidget data={pendencias} isLoading={loadingPendencias} />
              </CardContent>
            </Card>
          </WidgetErrorBoundary>
        </div>

        {/* ALERTAS DO PROFESSOR — Expansão do Ecosystema (Ponto Focal Novo) */}
        <div className="lg:col-span-3">
          <WidgetErrorBoundary title="Alertas de Atenção">
            <Card className="border-0 shadow-sm bg-white overflow-hidden">
              <CardHeader className="pt-[30px] pb-2 bg-zinc-50/50 border-b">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-rose-100 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                    </div>
                    Alertas e Observações
                  </CardTitle>
                  <span className="text-xs font-normal text-muted-foreground">— Visão macro das turmas</span>
                  {totalAlertas > 0 && (
                    <Badge variant="outline" className="ml-auto border-rose-200 text-rose-600 bg-rose-50">
                      {totalAlertas} ativos
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <AlertasWidget data={alertas} isLoading={loadingAlertas} />
              </CardContent>
            </Card>
          </WidgetErrorBoundary>
        </div>

        {/* Saúde das Turmas — coluna inteira */}
        <div className="lg:col-span-3">
          <WidgetErrorBoundary title="Saúde das Turmas">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pt-[30px] pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  Saúde das Turmas
                  <span className="text-xs font-normal text-muted-foreground ml-1">— mês atual</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {loadingSaude
                    ? [1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)
                    : <SaudeTurmasWidget data={saudeTurmas} isLoading={false} />
                  }
                </div>
              </CardContent>
            </Card>
          </WidgetErrorBoundary>
        </div>

      </div>
    </div>
  )
}

export default ProfessorDashboardPage
