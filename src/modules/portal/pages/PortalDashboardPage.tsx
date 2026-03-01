import { usePortalContext } from '../context'
import { useDashboardAluno } from '../hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Loader2, UserCircle, BookOpen, CalendarCheck, CreditCard,
  AlertTriangle, TrendingUp, Bell, ChevronRight, Users, GraduationCap
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
        <Loader2 className="h-8 w-8 animate-spin text-[#14B8A6]" />
      </div>
    )
  }

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <Users className="h-16 w-16 text-slate-300" />
        <h2 className="text-xl font-bold text-[#1E293B]">Nenhum aluno vinculado</h2>
        <p className="text-slate-500">Entre em contato com a escola para vincular seu acesso.</p>
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

      {/* Card do Aluno - Teal Deep */}
      <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-[#134E4A] via-[#0F3937] to-[#134E4A] relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <GraduationCap className="h-32 w-32 text-white" />
        </div>
        <div className="p-6 md:p-8 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-[#14B8A6] flex items-center justify-center shadow-lg shadow-teal-900/40 border border-teal-400/30">
                <UserCircle className="h-11 w-11 text-white" />
              </div>
              <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-[#134E4A] ${alunoSelecionado.status === 'ativo' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`} />
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {alunoSelecionado.nome_social || alunoSelecionado.nome_completo}
                </h2>
                <Badge className={`w-fit text-[10px] font-bold uppercase tracking-widest border-0 ${alunoSelecionado.status === 'ativo' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'}`}>
                  {alunoSelecionado.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              
              {turma && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white/90 font-medium">
                    <BookOpen className="h-3.5 w-3.5 text-[#14B8A6]" />
                    <span>{turma.nome}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white/90 font-medium">
                    <CalendarCheck className="h-3.5 w-3.5 text-[#14B8A6]" />
                    <span>{turma.turno}</span>
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
        <Card className="border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all cursor-pointer bg-white" onClick={() => navigate('/portal/frequencia')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
              Frequência
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-[#CCFBF1] flex items-center justify-center">
              <CalendarCheck className="h-5 w-5 text-[#14B8A6]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-[#134E4A]">{freq?.percentual || 100}%</div>
            <p className="text-[10px] text-[#64748B] mt-1 font-medium">
              {freq?.totalPresencas || 0} presenças · {freq?.totalFaltas || 0} faltas
            </p>
            <div className="mt-4 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#14B8A6] transition-all duration-700 shadow-sm"
                style={{ width: `${freq?.percentual || 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financeiro */}
        <Card className="border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all cursor-pointer bg-white" onClick={() => navigate('/portal/cobrancas')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
              Financeiro
            </CardTitle>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${(fin?.totalAtrasadas || 0) > 0 ? 'bg-red-50' : 'bg-blue-50'}`}>
              <CreditCard className={`h-5 w-5 ${(fin?.totalAtrasadas || 0) > 0 ? 'text-red-500' : 'text-blue-500'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-black ${(fin?.totalAtrasadas || 0) > 0 ? 'text-red-600' : 'text-[#1E293B]'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fin?.totalPendente || 0)}
            </div>
            <p className="text-[10px] text-[#64748B] mt-1 font-medium">
              {fin?.totalCobrancas || 0} cobranças pendentes
              {(fin?.totalAtrasadas || 0) > 0 && <span className="text-red-500 font-bold"> · {fin?.totalAtrasadas} atrasadas</span>}
            </p>
          </CardContent>
        </Card>

        {/* Avisos */}
        <Card className="border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all cursor-pointer bg-white" onClick={() => navigate('/portal/avisos')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
              Avisos
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-[#CCFBF1] flex items-center justify-center font-bold">
              <Bell className="h-5 w-5 text-[#14B8A6]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-[#134E4A]">{dashboard?.avisosRecentes?.length || 0}</div>
            <p className="text-[10px] text-[#64748B] mt-1 font-medium italic">novos alertas da escola</p>
            {dashboard?.avisosRecentes && dashboard.avisosRecentes.length > 0 && (
              <p className="text-[10px] text-[#14B8A6] mt-2 font-bold truncate bg-teal-50 p-1 rounded">
                Destaque: {dashboard.avisosRecentes[0].titulo}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertas Críticos */}
      {(fin?.totalAtrasadas || 0) > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-white ring-1 ring-red-200">
          <CardContent className="py-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
               <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-red-900">Atenção Crítica</p>
              <p className="text-xs text-red-600 font-medium tracking-tight">Você possui {fin?.totalAtrasadas} mensalidade(s) com vencimento expirado.</p>
            </div>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold px-4" onClick={() => navigate('/portal/cobrancas')}>
              Regularizar <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ações Rápidas */}
      <Card className="border border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-[#E2E8F0] py-4">
          <CardTitle className="text-sm font-bold text-[#1E293B] uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#14B8A6]" />
            Acesso Rápido
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6">
          {[
            { label: 'Frequência', icon: CalendarCheck, bgColor: 'emerald', textColor: '#10B981', href: '/portal/frequencia' },
            { label: 'Boletim', icon: BookOpen, bgColor: 'teal', textColor: '#14B8A6', href: '/portal/boletim' },
            { label: 'Avisos', icon: Bell, bgColor: 'blue', textColor: '#3B82F6', href: '/portal/avisos' },
            { label: 'Cobranças', icon: CreditCard, bgColor: 'amber', textColor: '#F59E0B', href: '/portal/cobrancas' },
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md hover:ring-2 hover:ring-[#14B8A6]/20 transition-all duration-300 text-center border border-slate-100"
            >
              <div className="p-3 rounded-xl bg-white shadow-sm group-hover:scale-110 transition-transform duration-300 ring-1 ring-slate-100">
                <item.icon className="h-6 w-6" style={{ color: item.textColor }} />
              </div>
              <span className="text-xs font-bold text-[#1E293B] group-hover:text-[#14B8A6]">{item.label}</span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
