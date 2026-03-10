import * as React from "react"
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CarFront, 
  Clock, 
  UserCheck, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle, 
  ArrowLeft,
  ChevronRight,
  History,
  Timer
} from 'lucide-react'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/modules/auth/AuthContext'
import { toast } from 'sonner'

// Components Mobile
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { NativeCard } from '@/components/mobile/NativeCard'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Tab = 'fila' | 'historico'

export function FilaVirtualAdminPageMobile() {
  const { authUser } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('fila')

  // Buscar Fila de Hoje
  const { data: filaData, isLoading, refetch } = useQuery({
    queryKey: ['fila_virtual_admin', authUser?.tenantId],
    queryFn: async () => {
      const hoje = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('fila_virtual')
        .select(`
          *,
          alunos(nome_completo),
          responsaveis(nome)
        `)
        .eq('tenant_id', authUser!.tenantId)
        .gte('created_at', `${hoje}T00:00:00.000Z`)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data || []
    },
    enabled: !!authUser?.tenantId,
    refetchInterval: 10000
  })

  // Marcar como atendido/entregue
  const liberarMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('fila_virtual' as any) as any)
        .update({ 
          status: 'atendido', 
          updated_at: new Date().toISOString() 
        } as any)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Aluno liberado!')
      queryClient.invalidateQueries({ queryKey: ['fila_virtual_admin'] })
    }
  })

  const aguardando = (filaData as any[])?.filter((f: any) => f.status === 'aguardando') || []
  const concluidos = (filaData as any[])?.filter((f: any) => f.status === 'atendido') || []
  
  const minMedio = useMemo(() => {
    if (!concluidos || concluidos.length === 0) return null
    const tempos = concluidos.map((f: any) => {
      const chegada = new Date(f.created_at).getTime()
      const saida = new Date(f.updated_at || f.created_at).getTime()
      return (saida - chegada) / 60000
    }).filter(t => t > 0)
    
    if (tempos.length === 0) return null
    return Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length)
  }, [concluidos])

  const handleRefresh = async () => {
    await refetch()
  }

  return (
    <MobilePageLayout
      title="Portaria Expresso"
      leftAction={
        <button onClick={() => window.history.back()} className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </button>
      }
    >
      {/* Quick Stats Header */}
      <div className="grid grid-cols-2 gap-4 mb-8 pt-4">
        <div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-100 dark:shadow-none overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1.5">
              <CarFront className="h-4 w-4 opacity-70" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">NA FILA</span>
            </div>
            <div className="text-4xl font-black">{aguardando.length}</div>
          </div>
          <CarFront className="absolute -right-4 -bottom-4 h-20 w-20 text-white/10 rotate-12" />
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1.5">
              <Timer className="h-4 w-4 text-indigo-600" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">MÉDIA</span>
            </div>
            <div className="text-4xl font-black text-slate-900 dark:text-white leading-none">
              {minMedio !== null ? `${minMedio}` : '--'}
              <span className="text-xs font-black ml-1 text-slate-400 uppercase">min</span>
            </div>
          </div>
          <Clock className="absolute -right-4 -bottom-4 h-20 w-20 text-slate-50 dark:text-slate-800 rotate-12" />
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl mb-6">
        <button 
          onClick={() => setActiveTab('fila')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
            activeTab === 'fila' ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-400"
          )}
        >
          <CarFront className="h-4 w-4" /> Portaria
        </button>
        <button 
          onClick={() => setActiveTab('historico')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
            activeTab === 'historico' ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-400"
          )}
        >
          <History className="h-4 w-4" /> Histórico
        </button>
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {activeTab === 'fila' ? (
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-xs font-black uppercase tracking-widest">Atualizando fila...</p>
                </div>
              ) : aguardando.length > 0 ? (
                aguardando.map((reg: any, idx) => (
                  <motion.div
                    key={reg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <NativeCard className="p-5 flex flex-col gap-4 border-none shadow-sm dark:bg-slate-900 overflow-hidden relative">
                      <div className="flex justify-between items-start relative z-10">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                             <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 text-[9px] font-black uppercase px-2 py-0.5">AGUARDANDO</Badge>
                             <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg uppercase tracking-tight">
                                <Clock className="h-3 w-3 inline mr-1" /> {format(new Date(reg.created_at), "HH:mm")}
                             </span>
                          </div>
                          <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-1 truncate">
                            {(reg.alunos as any)?.nome_completo}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            <UserCheck className="h-3.5 w-3.5" /> {(reg.responsaveis as any)?.nome}
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={() => liberarMut.mutate(reg.id)}
                        disabled={liberarMut.isPending}
                        className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-base font-black uppercase tracking-widest shadow-lg shadow-emerald-100 dark:shadow-none"
                      >
                        {liberarMut.isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                          <>
                            <CheckCircle2 className="mr-2 h-6 w-6" />
                            LIBERAR ALUNO
                          </>
                        )}
                      </Button>
                    </NativeCard>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-20 flex flex-col items-center text-center px-8"
                >
                  <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <CarFront className="h-10 w-10 text-slate-200" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Fila Limpa</h3>
                  <p className="text-slate-500 text-sm mt-2 font-medium">Nenhum responsável informou aproximação no momento.</p>
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <div className="space-y-3">
              {concluidos.length > 0 ? (
                concluidos.map((reg: any) => {
                  const chegada = new Date(reg.created_at).getTime()
                  const saida = new Date(reg.updated_at || reg.created_at).getTime()
                  const minsEspera = Math.max(0, Math.round((saida - chegada) / 60000))

                  return (
                    <NativeCard key={reg.id} className="p-4 flex items-center justify-between border-slate-50 dark:border-slate-800/50">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-bold text-slate-800 dark:text-white truncate">
                          {(reg.alunos as any)?.nome_completo}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          Saiu às {format(new Date(reg.updated_at || reg.created_at), 'HH:mm')}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "h-8 px-3 rounded-xl border-none text-[10px] font-black uppercase tracking-widest",
                          minsEspera > 10 
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500' 
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500'
                        )}
                      >
                        {minsEspera} min
                      </Badge>
                    </NativeCard>
                  )
                })
              ) : (
                <div className="py-20 text-center text-slate-400">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-10" />
                  <p className="text-sm font-bold uppercase tracking-widest">Nenhuma liberação hoje</p>
                </div>
              )}
            </div>
          )}

          {/* Info Alert */}
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-4 rounded-2xl flex gap-3 shadow-sm">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
              Mantenha esta tela aberta em um tablet ou monitor na portaria para gerenciar as saídas em tempo real.
            </p>
          </div>
        </div>
      </PullToRefresh>
    </MobilePageLayout>
  )
}
