import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { useDashboard } from '../dashboard.hooks'
import {
  Users,
  CreditCard,
  AlertTriangle,
  Megaphone,
  Loader2,
  ArrowUpRight,
  BookOpen,
  TrendingUp,
  ChevronRight,
  Plus,
  Search,
  Calendar,
  Zap
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import type { AvisoRecente, RadarAluno } from '../dashboard.service'
import { Button } from '@/components/ui/button'

/**
 * VERSÃO MOBILE DO DASHBOARD (MOBILE FIRST PRO)
 * Focada em estética premium, micro-interações e usabilidade mobile.
 */
export function DashboardPageMobile() {
  const navigate = useNavigate()
  const { 
    data: dashboardData, 
    isLoading,
  } = useDashboard()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-10 w-10 text-indigo-500" />
        </motion.div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Sincronizando dados...</p>
      </div>
    )
  }

  const quickActions = [
    { label: 'Novo Aluno', icon: Plus, path: '/alunos/novo', color: 'bg-indigo-500' },
    { label: 'Matricular', icon: Zap, path: '/matriculas', color: 'bg-emerald-500' },
    { label: 'Chamada', icon: Calendar, path: '/frequencia', color: 'bg-amber-500' },
    { label: 'Financeiro', icon: CreditCard, path: '/financeiro', color: 'bg-rose-500' },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8 px-4 pt-6"
      >
        {/* Cabeçalho Premium */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">
               {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fluxoo <span className="text-indigo-600">Edu</span></h1>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100 active:scale-90 transition-transform cursor-pointer" onClick={() => navigate('/alunos')}>
             <Search className="h-5 w-5 text-slate-400" />
          </div>
        </motion.div>

        {/* Quick Actions Scroll Horizontal */}
        <motion.section variants={item} className="space-y-4">
          <div className="flex items-center justify-between px-1">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ações Rápidas</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
            {quickActions.map((action, i) => (
              <button 
                key={i}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 shrink-0 active:scale-95 transition-transform"
              >
                <div className={`h-16 w-16 rounded-[1.5rem] ${action.color} shadow-lg shadow-${action.color.split('-')[1]}-100 flex items-center justify-center text-white`}>
                   <action.icon className="h-7 w-7" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 tracking-tight">{action.label}</span>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Stats Principais com Design Premium - Estilo Bento Grid */}
        <motion.section variants={item} className="grid grid-cols-2 gap-4">
          <Card 
             onClick={() => navigate('/alunos')}
             className="col-span-2 rounded-[2.5rem] border-0 shadow-xl shadow-indigo-100 overflow-hidden active:scale-[0.98] transition-all bg-gradient-to-br from-indigo-600 to-indigo-700 text-white group"
          >
             <CardContent className="p-7 relative overflow-hidden">
                <Users className="absolute -right-4 -bottom-4 h-32 w-32 text-white/10 group-hover:scale-110 transition-transform" />
                <div className="relative z-10 space-y-4">
                   <div className="flex justify-between items-start">
                      <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10">
                         <Users className="h-5 w-5 text-white" />
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-white/50" />
                   </div>
                   <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-100 opacity-80 mb-1">Total de Alunos</p>
                      <p className="text-4xl font-black tracking-tighter">{dashboardData?.totalAlunosAtivos || 0}</p>
                   </div>
                   <div className="pt-2">
                       <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(((dashboardData?.totalAlunosAtivos || 0) / (dashboardData?.limiteAlunos || 1)) * 100, 100)}%` }}
                            className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                          />
                       </div>
                       <p className="text-[8px] font-bold text-indigo-100 mt-2 opacity-70">
                          {dashboardData?.totalAlunosAtivos} de {dashboardData?.limiteAlunos} vagas utilizadas
                       </p>
                   </div>
                </div>
             </CardContent>
          </Card>

          {/* Inadimplência */}
          <Card 
             onClick={() => navigate('/financeiro')}
             className="rounded-[2rem] border-0 shadow-sm overflow-hidden active:scale-[0.98] transition-all bg-white group border border-slate-100"
          >
             <CardContent className="p-5 space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-100">
                   <CreditCard className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                   <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Pendentes</p>
                   <p className="text-lg font-black text-slate-900 tracking-tight">
                      R$ {dashboardData?.totalReceber.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                   </p>
                </div>
             </CardContent>
          </Card>

          {/* Saúde Financeira (Contas) */}
          <Card 
             onClick={() => navigate('/financeiro-relatorios')}
             className="rounded-[2rem] border-0 shadow-sm overflow-hidden active:scale-[0.98] transition-all bg-white group border border-slate-100"
          >
             <CardContent className="p-5 space-y-3">
                {(() => {
                  const valor = (dashboardData?.totalReceber || 0) - (dashboardData?.totalPagar || 0)
                  const isPositive = valor >= 0
                  return (
                    <>
                      <div className={`h-10 w-10 rounded-2xl ${isPositive ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'} flex items-center justify-center border`}>
                         <TrendingUp className={`h-5 w-5 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`} />
                      </div>
                      <div>
                         <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Saldo Proj.</p>
                         <p className={`text-lg font-black tracking-tight ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                         </p>
                      </div>
                    </>
                  )
                })()}
             </CardContent>
          </Card>

          {/* Alertas Ativos */}
          <Card 
             onClick={() => navigate('/frequencia')}
             className="col-span-2 rounded-[2rem] border-0 shadow-sm overflow-hidden active:scale-[0.98] transition-all bg-white group border border-slate-100"
          >
             <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                   <AlertTriangle className="h-6 w-6 text-amber-500" />
                </div>
                <div className="flex-1">
                   <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Alertas no Radar</p>
                   <p className="text-lg font-black text-slate-900 tracking-tight">
                      {dashboardData?.radarEvasao?.length || 0} Alunos em risco
                   </p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300" />
             </CardContent>
          </Card>
        </motion.section>

        {/* Radar de Risco */}
        {dashboardData?.radarEvasao && dashboardData.radarEvasao.length > 0 && (
           <motion.section variants={item} className="space-y-5">
              <div className="flex items-center justify-between px-1">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">Radar de Próximos Passos</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Alunos que requerem sua atenção imediata</p>
                  </div>
                  <Badge className="bg-rose-500 text-white border-0 text-[10px] font-black h-6 px-3 rounded-full shadow-lg shadow-rose-200">
                     {dashboardData.radarEvasao.length} ALERTAS
                  </Badge>
              </div>
              
              <div className="space-y-3">
                 <AnimatePresence>
                    {dashboardData.radarEvasao.slice(0, 3).map((aluno: RadarAluno, idx: number) => (
                       <motion.div 
                          key={aluno.aluno_id}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.1 }}
                       >
                          <Card 
                             onClick={() => navigate(`/alunos/${aluno.aluno_id}`)}
                             className="rounded-[2rem] border-0 shadow-sm active:scale-[0.97] transition-all bg-white relative overflow-hidden group border border-slate-50"
                          >
                             <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                             <CardContent className="p-5 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-800 font-black text-lg shrink-0">
                                   {aluno.nome_completo.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <h4 className="font-bold text-sm text-slate-800 truncate">{aluno.nome_completo}</h4>
                                   <div className="flex gap-2 items-center mt-1.5 overflow-x-auto no-scrollbar pb-1">
                                      {aluno.faltas_consecutivas >= 3 && (
                                         <Badge variant="outline" className="text-[8px] font-black uppercase text-rose-600 border-rose-100 bg-rose-50/50 rounded-lg shrink-0">
                                            {aluno.faltas_consecutivas} Faltas
                                         </Badge>
                                      )}
                                      {aluno.cobrancas_atrasadas > 0 && (
                                         <Badge variant="outline" className="text-[8px] font-black uppercase text-amber-600 border-amber-100 bg-amber-50/50 rounded-lg shrink-0">
                                            {aluno.cobrancas_atrasadas} Pendência{aluno.cobrancas_atrasadas > 1 ? 's' : ''}
                                         </Badge>
                                      )}
                                   </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-200 group-hover:text-indigo-400 transition-colors" />
                             </CardContent>
                          </Card>
                       </motion.div>
                    ))}
                 </AnimatePresence>
                 {dashboardData.radarEvasao.length > 3 && (
                    <Button 
                       variant="ghost" 
                       className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 py-6 h-auto hover:bg-white" 
                       onClick={() => navigate('/alunos')}
                    >
                       Ver radar completo ({dashboardData.radarEvasao.length})
                    </Button>
                 )}
              </div>
           </motion.section>
        )}

        {/* Mural de Comunicados Premium */}
        <motion.section variants={item} className="space-y-5">
           <div className="flex items-center justify-between px-1">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                     <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight leading-none">Mural da Escola</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Comunicados recentes</p>
                  </div>
               </div>
               <Button variant="ghost" className="h-8 w-8 rounded-xl p-0" onClick={() => navigate('/mural')}>
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
               </Button>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {dashboardData?.avisosRecentes.map((aviso: AvisoRecente) => (
                 <Card key={aviso.id} className="rounded-[2.5rem] border-0 shadow-sm overflow-hidden bg-white active:scale-[0.98] transition-transform border border-slate-50">
                    <CardContent className="p-6">
                       <div className="flex justify-between items-start mb-4">
                          <Badge variant="secondary" className="text-[8px] bg-slate-100 text-slate-600 border-0 font-black uppercase tracking-widest px-3 py-1 rounded-full">
                             {aviso.turmas?.nome || 'Geral'}
                          </Badge>
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">
                             {format(new Date(aviso.created_at), "dd MMM", { locale: ptBR })}
                          </span>
                       </div>
                       <h4 className="font-bold text-slate-800 mb-1 leading-tight">{aviso.titulo}</h4>
                       <p className="text-xs font-medium text-slate-400 line-clamp-2 leading-relaxed">
                          {aviso.conteudo}
                       </p>
                    </CardContent>
                 </Card>
              ))}
           </div>
        </motion.section>
      </motion.div>
    </div>
  )
}
