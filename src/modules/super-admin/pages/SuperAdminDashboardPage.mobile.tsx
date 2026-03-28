import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { useSuperAdminDashboard, useTenantHealthScores } from '../hooks'
import {
  Building2,
  AlertTriangle,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Globe,
  Plus,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { useSuperAdminNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'

export function SuperAdminDashboardPageMobile() {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useSuperAdminDashboard()
  const { data: healthScores, isLoading: loadingHealth } = useTenantHealthScores()
  const { data: notifications } = useSuperAdminNotifications()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-10 w-10 text-indigo-500" />
        </motion.div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Escaneando Rede...</p>
      </div>
    )
  }

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
        className="space-y-6 px-4 pt-8"
      >
        {/* Header Premium do SuperAdmin */}
        <motion.div variants={item} className="flex items-center justify-between">
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Global Dashboard</p>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                 Status <span className="text-indigo-600">Global</span>
              </h1>
           </div>
           <NotificationBell
              total={notifications?.total || 0}
              items={notifications?.items || []}
            />
        </motion.div>

        {/* Card Status de Alto Impacto */}
        <motion.div variants={item}>
           <Card 
              onClick={() => navigate('/super-admin/faturas')}
              className="rounded-[2.5rem] border-0 bg-slate-900 shadow-2xl shadow-slate-200 overflow-hidden group active:scale-[0.98] transition-all"
           >
              <CardContent className="p-8 relative">
                 <TrendingUp className="absolute -right-6 -bottom-6 h-40 w-40 text-white/5 group-hover:scale-110 transition-transform" />
                 <div className="relative z-10 space-y-4">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-black px-3 py-1 rounded-full text-[10px]">
                       STATUS PLATAFORMA
                    </Badge>
                    <div>
                       <p className="text-3xl font-black text-white tracking-tighter uppercase">
                          ONLINE
                       </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                       <ShieldCheck className="h-3 w-3" /> {stats?.assinaturasAtivas} Assinaturas em Vigor
                    </div>
                 </div>
              </CardContent>
           </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={item} className="grid grid-cols-1 gap-4">
           <Card 
              onClick={() => navigate('/super-admin/escolas')}
              className="rounded-[2.5rem] border-0 bg-white shadow-sm p-7 flex items-center gap-5 ring-1 ring-slate-100 active:scale-[0.98] transition-transform"
           >
              <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                 <Building2 className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="flex-1">
                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Instituições</p>
                 <p className="text-2xl font-black text-slate-800 tracking-tight">{stats?.totalEscolas || 0}</p>
                 <p className="text-[10px] font-bold text-slate-400">Escolas gerenciadas</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-slate-200" />
           </Card>

           <Card 
              onClick={() => navigate('/super-admin/alunos')}
              className="rounded-[2.5rem] border-0 bg-white shadow-sm p-7 flex items-center gap-5 ring-1 ring-slate-100 active:scale-[0.98] transition-transform"
           >
              <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                 <Users className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="flex-1">
                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total de Alunos</p>
                 <p className="text-2xl font-black text-slate-800 tracking-tight">{stats?.totalAlunos || 0}</p>
                 <p className="text-[10px] font-bold text-slate-400 italic">Em toda a rede</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-slate-200" />
           </Card>
        </motion.div>

        {/* Footer Actions / Bottom Menu Hub */}
        <motion.div variants={item} className="grid grid-cols-2 gap-4 pt-4">
           <button
              onClick={() => navigate('/super-admin/planos')}
              className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-transform"
           >
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                 <Plus className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Gerir Planos</span>
           </button>
           <button
              onClick={() => navigate('/super-admin/upgrades')}
              className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-transform"
           >
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                 <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Upgrades</span>
           </button>
        </motion.div>

        {/* Health Score Card */}
        <motion.div variants={item} className="pt-4">
          <Card className="rounded-[2rem] border-0 bg-white shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Health Score</p>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Saúde das Escolas</h3>
              </div>
              <TrendingUp className="h-6 w-6 text-indigo-600" />
            </div>

            {loadingHealth ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
              </div>
            ) : healthScores && healthScores.length > 0 ? (
              <div className="space-y-4">
                {healthScores.slice(0, 5).map((score: any) => (
                  <div key={score.tenant_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {score.health_score < 25 ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : score.health_score < 50 ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                        <span className="text-[11px] font-bold text-slate-700 truncate max-w-[180px]">
                          {score.razao_social}
                        </span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black",
                        score.health_score < 25 ? "text-red-600" : score.health_score < 50 ? "text-amber-600" : score.health_score < 75 ? "text-yellow-600" : "text-emerald-600"
                      )}>
                        {Math.round(score.health_score)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            score.health_score < 25 ? "bg-red-500" : score.health_score < 50 ? "bg-amber-500" : score.health_score < 75 ? "bg-yellow-500" : "bg-emerald-500"
                          )}
                          style={{ width: `${score.health_score}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-slate-500 font-bold">
                        Uso: {Math.round(score.percentual_uso)}% ({score.alunos_ativos}/{score.limite_alunos_contratado})
                      </span>
                      <span className={cn(
                        "font-bold uppercase tracking-wider",
                        score.health_score < 25 ? "text-red-600" : score.health_score < 50 ? "text-amber-600" : score.health_score < 75 ? "text-yellow-600" : "text-emerald-600"
                      )}>
                        {score.health_score < 25 ? 'Crítico' : score.health_score < 50 ? 'Atenção' : score.health_score < 75 ? 'Estável' : 'Saudável'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">Nenhum dado disponível.</p>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
