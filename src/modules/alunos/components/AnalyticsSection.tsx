import { useEffect, useRef } from 'react'
import { useDashboardAnalytics } from '../dashboard.analytics.hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, BarChart3, LineChart, TrendingUp } from 'lucide-react'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { ExportButton } from '@/modules/relatorios/components/ExportButton'
import { registrarExportacoesDoDashboard } from '../dashboard.export'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Legend,
} from 'recharts'
import type { DashboardAnalytics } from '../dashboard.analytics.service'

const CHART_COLORS = {
  indigo: '#6366f1',
  indigoLight: '#e0e7ff',
  emerald: '#10b981',
  emeraldLight: '#d1fae5',
  amber: '#f59e0b',
  amberLight: '#fef3c7',
  rose: '#f43f5e',
  roseLight: '#ffe4e6',
  sky: '#0ea5e9',
  skyLight: '#e0f2fe',
  violet: '#8b5cf6',
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-[2rem] bg-white border border-zinc-100 p-6 space-y-4">
          <Skeleton className="h-4 w-32 rounded-lg" />
          <Skeleton className="h-[200px] w-full rounded-2xl" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 bg-zinc-50/50 rounded-3xl border-2 border-dashed border-zinc-200">
      <BarChart3 className="h-12 w-12 text-zinc-200 mb-4" />
      <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">
        Sem dados suficientes
      </p>
      <p className="text-zinc-400 text-xs mt-1">
        Os gráficos serão exibidos após alguns meses de uso
      </p>
    </div>
  )
}

function ChartErrorState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12 bg-rose-50 rounded-3xl border border-rose-100">
      <AlertTriangle className="h-10 w-10 text-rose-400 mb-3" />
      <p className="text-sm font-bold text-rose-700">Não foi possível carregar os gráficos</p>
      <p className="text-xs text-rose-500 mt-1">Tente novamente mais tarde</p>
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  children,
  className,
}: {
  title: string
  subtitle?: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={`rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden ${className || ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
        <div>
          <CardTitle className="text-xs font-black uppercase tracking-[0.15em] text-zinc-400">
            {title}
          </CardTitle>
          {subtitle && (
            <p className="text-[10px] font-medium text-zinc-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="h-[220px]">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-bold text-zinc-700 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value}{entry.name === 'Frequência' ? '%' : entry.name === 'Previsto' || entry.name === 'Recebido' || entry.name === 'Inadimplência' ? ` R$${entry.value.toLocaleString('pt-BR')}` : ''}
        </p>
      ))}
    </div>
  )
}

function AlunosChart({ data }: { data: DashboardAnalytics }) {
  const hasData = data.novasMatriculasPorMes.some((m) => m.valor > 0)
  if (!hasData) return null

  return (
    <ChartCard
      title="Novos Alunos"
      subtitle="Matrículas realizadas por mês"
      icon={TrendingUp}
      iconBg="bg-indigo-50"
      iconColor="text-indigo-600"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.novasMatriculasPorMes} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="rotulo"
            tick={{ fontSize: 10, fill: '#a1a1aa' }}
            axisLine={{ stroke: '#e4e4e7' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: '#a1a1aa' }}
            axisLine={false}
            tickLine={false}
            width={24}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
          <Bar
            dataKey="valor"
            name="Alunos"
            fill={CHART_COLORS.indigo}
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function FrequenciaChart({ data }: { data: DashboardAnalytics }) {
  const hasData = data.frequenciaPorMes.some((m) => m.valor > 0)
  if (!hasData) return null

  return (
    <ChartCard
      title="Frequência"
      subtitle="Presença média mensal"
      icon={LineChart}
      iconBg="bg-emerald-50"
      iconColor="text-emerald-600"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.frequenciaPorMes} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="rotulo"
            tick={{ fontSize: 10, fill: '#a1a1aa' }}
            axisLine={{ stroke: '#e4e4e7' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#a1a1aa' }}
            axisLine={false}
            tickLine={false}
            width={24}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
          <Bar
            dataKey="valor"
            name="Frequência"
            fill={CHART_COLORS.emerald}
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function ReceitaChart({ data }: { data: DashboardAnalytics }) {
  const hasData = data.receitaComparada.some((m) => m.previsto > 0 || m.recebido > 0)
  if (!hasData) return null

  return (
    <ChartCard
      title="Receita"
      subtitle="Previsto vs. Recebido por mês"
      icon={BarChart3}
      iconBg="bg-sky-50"
      iconColor="text-sky-600"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data.receitaComparada}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="rotulo"
            tick={{ fontSize: 10, fill: '#a1a1aa' }}
            axisLine={{ stroke: '#e4e4e7' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#a1a1aa' }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 10, fontWeight: 600, paddingTop: 8 }}
          />
          <Bar
            dataKey="previsto"
            name="Previsto"
            fill={CHART_COLORS.amber}
            radius={[4, 4, 0, 0]}
            maxBarSize={20}
          />
          <Bar
            dataKey="recebido"
            name="Recebido"
            fill={CHART_COLORS.emerald}
            radius={[4, 4, 0, 0]}
            maxBarSize={20}
          />
          <Line
            type="monotone"
            dataKey="recebido"
            stroke={CHART_COLORS.emerald}
            strokeWidth={2}
            dot={false}
            name="Tendência"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function InadimplenciaChart({ data }: { data: DashboardAnalytics }) {
  const hasData = data.inadimplenciaPorMes.some((m) => m.valor > 0)
  if (!hasData) return null

  return (
    <ChartCard
      title="Inadimplência"
      subtitle="Valores em atraso por mês"
      icon={AlertTriangle}
      iconBg="bg-rose-50"
      iconColor="text-rose-600"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.inadimplenciaPorMes} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="rotulo"
            tick={{ fontSize: 10, fill: '#a1a1aa' }}
            axisLine={{ stroke: '#e4e4e7' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#a1a1aa' }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
          <Bar
            dataKey="valor"
            name="Inadimplência"
            fill={CHART_COLORS.rose}
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function ChartsContent() {
  const { data, isLoading, error } = useDashboardAnalytics()

  if (isLoading) return <LoadingSkeleton />
  if (error || !data) return <ChartErrorState />

  const charts = [
    <AlunosChart key="alunos" data={data} />,
    <FrequenciaChart key="frequencia" data={data} />,
    <ReceitaChart key="receita" data={data} />,
    <InadimplenciaChart key="inadimplencia" data={data} />,
  ].filter(Boolean)

  if (charts.length === 0) return <EmptyState />

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {charts}
    </div>
  )
}

function ChartsErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-12 bg-rose-50 rounded-3xl border border-rose-100">
      <AlertTriangle className="h-10 w-10 text-rose-400 mb-3" />
      <p className="text-sm font-bold text-rose-700">Erro ao carregar gráficos</p>
    </div>
  )
}

export function AnalyticsSection() {
  const registered = useRef(false)
  useEffect(() => {
    if (!registered.current) {
      registrarExportacoesDoDashboard()
      registered.current = true
    }
  }, [])

  return (
    <section className="w-full animate-in fade-in duration-300">
      <ErrorBoundary fallback={<ChartsErrorFallback />}>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-zinc-900 tracking-tight">Tendências e Análises</h2>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mt-0.5">
              Evolução mensal de indicadores
            </p>
          </div>
          <ExportButton
            reportKey="dashboard.analytics-completo"
            label="Exportar"
            variant="outline"
            size="sm"
            formats={['csv', 'pdf']}
          />
        </div>
        <ChartsContent />
      </ErrorBoundary>
    </section>
  )
}
