import { usePortalContext } from '../context'
import { useDashboardAluno } from '../hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Loader2, UserCircle, BookOpen, CalendarCheck, CreditCard,
  AlertTriangle, TrendingUp, Bell, ChevronRight, Users
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SeletorAluno } from '../components/SeletorAluno'

export function PortalDashboardPage() {
  const { alunoSelecionado, isLoading: loadingCtx, isMultiAluno } = usePortalContext()
  const { data: dashboard, isLoading } = useDashboardAluno()
  const navigate = useNavigate()

  if (loadingCtx || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <Users className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="text-xl font-bold">Nenhum aluno vinculado</h2>
        <p className="text-muted-foreground">Entre em contato com a escola para vincular seu acesso.</p>
      </div>
    )
  }

  const turma = alunoSelecionado.turma
  const freq = dashboard?.frequencia
  const fin = dashboard?.financeiro

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Seletor de aluno (se multi-aluno) */}
      {isMultiAluno && <SeletorAluno />}

      {/* Card do Aluno */}
      <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                <UserCircle className="h-11 w-11 text-white" />
              </div>
              <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-slate-800 ${alunoSelecionado.status === 'ativo' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  {alunoSelecionado.nome_social || alunoSelecionado.nome_completo}
                </h2>
                <Badge className={`w-fit text-xs font-semibold border-0 ${alunoSelecionado.status === 'ativo' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                  {alunoSelecionado.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              
              {turma && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white/90">
                    <BookOpen className="h-3.5 w-3.5 text-teal-400" />
                    <span className="font-medium">{turma.nome}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white/90">
                    <CalendarCheck className="h-3.5 w-3.5 text-teal-400" />
                    <span className="font-medium">{turma.turno}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Cards de Indicadores */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Frequência */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/portal/frequencia')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Frequência
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CalendarCheck className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">{freq?.percentual || 100}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {freq?.totalPresencas || 0} presenças · {freq?.totalFaltas || 0} faltas
            </p>
            <div className="mt-3 h-2 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-700"
                style={{ width: `${freq?.percentual || 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financeiro */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/portal/cobrancas')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Financeiro
            </CardTitle>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${(fin?.totalAtrasadas || 0) > 0 ? 'bg-red-50' : 'bg-blue-50'}`}>
              <CreditCard className={`h-5 w-5 ${(fin?.totalAtrasadas || 0) > 0 ? 'text-red-600' : 'text-blue-600'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${(fin?.totalAtrasadas || 0) > 0 ? 'text-red-700' : 'text-zinc-900'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fin?.totalPendente || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {fin?.totalCobrancas || 0} cobranças pendentes
              {(fin?.totalAtrasadas || 0) > 0 && <span className="text-red-600 font-bold"> · {fin?.totalAtrasadas} atrasadas</span>}
            </p>
          </CardContent>
        </Card>

        {/* Avisos */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/portal/avisos')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Avisos
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center">
              <Bell className="h-5 w-5 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard?.avisosRecentes?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">avisos recentes</p>
            {dashboard?.avisosRecentes && dashboard.avisosRecentes.length > 0 && (
              <p className="text-xs text-violet-600 mt-2 font-medium truncate">
                Último: {dashboard.avisosRecentes[0].titulo}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {(fin?.totalAtrasadas || 0) > 0 && (
        <Card className="border-0 shadow-md bg-gradient-to-r from-red-50 to-orange-50 ring-1 ring-red-200">
          <CardContent className="py-4 flex items-center gap-4">
            <AlertTriangle className="h-6 w-6 text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800">Atenção: você possui {fin?.totalAtrasadas} cobrança(s) em atraso</p>
              <p className="text-xs text-red-600 mt-0.5">Regularize para evitar pendências junto à escola.</p>
            </div>
            <Button size="sm" variant="outline" className="border-red-300 text-red-700" onClick={() => navigate('/portal/cobrancas')}>
              Ver cobranças <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ações Rápidas */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Acesso Rápido</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Frequência', icon: CalendarCheck, color: 'emerald', href: '/portal/frequencia' },
            { label: 'Avisos', icon: Bell, color: 'violet', href: '/portal/avisos' },
            { label: 'Cobranças', icon: CreditCard, color: 'blue', href: '/portal/cobrancas' },
            { label: 'Fila Virtual', icon: TrendingUp, color: 'amber', href: '/portal/fila' },
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-${item.color}-50 hover:bg-${item.color}-100 transition-colors text-center`}
            >
              <item.icon className={`h-6 w-6 text-${item.color}-600`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
