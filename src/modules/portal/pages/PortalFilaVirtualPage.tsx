import { useFilaVirtual, useEntrarNaFila, useCancelarFila } from '../hooks'
import { usePortalContext } from '../context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, CarFront, CheckCircle, XCircle, ChevronRight, MapPin, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { BotaoVoltar } from '../components/BotaoVoltar'

// Helper de vibração
const vibrate = (ms: number | number[] = 20) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

// --- SKELETON LOADING ---
const FilaSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-32 bg-slate-900 rounded-2xl" />
    <div className="h-8 w-40 bg-slate-100 rounded-lg" />
    <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white border border-slate-100 rounded-xl" />)}
    </div>
  </div>
)
export function PortalFilaVirtualPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const { alunoSelecionado, tenantId, responsavel } = usePortalContext()
  const { data: historicoFila, isLoading } = useFilaVirtual()
  
  const entrarMut = useEntrarNaFila()
  const cancelarMut = useCancelarFila()

  const filaAtiva = historicoFila?.find(f => f.status === 'aguardando')

  const handleEntrarFila = async () => {
    if (!alunoSelecionado || !tenantId || !responsavel) return
    vibrate([40, 20, 40])

    const horarioTurma = alunoSelecionado.turma?.horario
    if (horarioTurma) {
      const times = horarioTurma.match(/(\d{1,2}:\d{2})/g)
      if (times && times.length >= 2) {
        const agora = new Date()
        const [hInicio, mInicio] = times[0].split(':').map(Number)
        const [hFim, mFim] = times[1].split(':').map(Number)

        const dataInicio = new Date(agora)
        dataInicio.setHours(hInicio, mInicio, 0)
        const dataFim = new Date(agora)
        dataFim.setHours(hFim, mFim, 0)

        if (dataFim < dataInicio) dataFim.setDate(dataFim.getDate() + 1)

        if (agora < dataInicio || agora > dataFim) {
          toast.error(`Fora do horário: A fila só abre entre ${times[0]} e ${times[1]}.`, {
            description: 'Você só pode ativar a fila durante o período de saída.',
            duration: 5000
          })
          return
        }
      }
    }

    try {
      await entrarMut.mutateAsync({
        tenant_id: tenantId,
        aluno_id: alunoSelecionado.id,
        responsavel_id: responsavel.id,
      })
      vibrate(60)
      toast.success('Você entrou na Fila Virtual!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao entrar na fila.')
    }
  }

  const handleCancelar = async (id: string | undefined) => {
    if (!id) return
    try {
      vibrate(20)
      await cancelarMut.mutateAsync(id)
      toast.success('Operação cancelada.')
    } catch {
      toast.error('Erro ao cancelar.')
    }
  }

  if (isLoading) return <FilaSkeleton />

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
            <CarFront className="h-8 w-8 text-slate-200" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800">Fila Virtual</h2>
          <p className="text-sm text-slate-400">Selecione um aluno.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-500 font-sans">

      {/* Header */}
      {!hideHeader && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-3">
            <BotaoVoltar />
            <div className="flex flex-col gap-0.5">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">Fila Virtual</h2>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Chegada & Pick-up</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Main Action Section */}
        <div className="lg:col-span-2 space-y-5">
          <Card className={cn(
            "border border-slate-100 shadow-lg overflow-hidden relative rounded-2xl md:rounded-3xl transition-all",
            filaAtiva ? "bg-slate-900" : "bg-gradient-to-br from-teal-500 to-teal-700"
          )}>
            <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-5 pointer-events-none">
              <CarFront size={150} className="text-white" />
            </div>
            
            <CardContent className="p-5 md:p-8 relative z-10 space-y-5">
              <div className="space-y-2">
                 <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center",
                      filaAtiva ? "bg-teal-500 text-white" : "bg-white/10 text-white"
                    )}>
                       <MapPin size={16} />
                    </div>
                    <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
                       {filaAtiva ? "Localização" : "Gestão de Fluxo"}
                    </span>
                 </div>
                 <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
                   {filaAtiva ? "Aguardando na Portaria" : "Próximo da Instituição?"}
                 </h3>
                 <p className="text-xs text-white/60 leading-relaxed max-w-sm">
                   {filaAtiva 
                     ? "Seu alerta já está no painel da portaria."
                     : "Acione ao entrar no perímetro da escola."}
                 </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                 {!filaAtiva ? (
                   <Button 
                     onClick={handleEntrarFila}
                     disabled={entrarMut.isPending}
                     className="h-14 px-6 rounded-xl bg-white text-slate-900 hover:bg-teal-50 font-bold text-xs uppercase tracking-wider flex-1 shadow-lg active:scale-95"
                   >
                     {entrarMut.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CarFront className="h-5 w-5 mr-2 text-teal-600" />}
                     Estou Chegando
                   </Button>
                 ) : (
                   <div className="flex flex-col w-full gap-3">
                      <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-xl">
                         <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                         <p className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider">Em processamento...</p>
                      </div>
                      <Button 
                        variant="ghost"
                        onClick={() => handleCancelar(filaAtiva?.id)}
                        disabled={cancelarMut.isPending}
                        className="h-11 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-400/10 font-semibold uppercase text-[10px] tracking-wider"
                      >
                        {cancelarMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                        Cancelar
                      </Button>
                   </div>
                 )}
              </div>
            </CardContent>
          </Card>

          {/* Guidelines Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-white text-teal-600 flex items-center justify-center shadow-sm mb-3">
                   <Clock size={16} />
                </div>
                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Horários</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                   Fila abre 15min antes da saída: <span className="text-teal-600 font-semibold">{alunoSelecionado.turma?.horario || "Sob consulta"}</span>.
                </p>
             </div>
             <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-white text-teal-600 flex items-center justify-center shadow-sm mb-3">
                   <CheckCircle size={16} />
                </div>
                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Confirmação</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                   O sistema registra quem efetuou a chamada e o horário.
                </p>
             </div>
          </div>
        </div>

        {/* Sidebar Context / History */}
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Atividade de Hoje</h3>
              <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
           </div>

           <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {historicoFila && historicoFila.length > 0 ? (
                  historicoFila.slice(0, 5).map((registro, idx) => (
                    <motion.div 
                      layout
                      key={registro.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-between"
                    >
                       <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center",
                            registro.status === 'atendido' ? "bg-teal-50 text-teal-600" : 
                            registro.status === 'aguardando' ? "bg-amber-50 text-amber-600" :
                            "bg-slate-50 text-slate-300"
                          )}>
                             {registro.status === 'atendido' ? <CheckCircle size={16} /> :
                              registro.status === 'aguardando' ? <CarFront size={16} /> : <XCircle size={16} />}
                          </div>
                          <div>
                             <p className="text-xs font-bold text-slate-800 leading-none mb-0.5">
                               {registro.status === 'atendido' ? "Finalizado" : 
                                registro.status === 'aguardando' ? "Em andamento" : "Cancelado"}
                             </p>
                             <p className="text-[10px] text-slate-400">{format(new Date(registro.created_at), "HH:mm", { locale: ptBR })}</p>
                          </div>
                       </div>
                       <ChevronRight size={14} className="text-slate-200" />
                    </motion.div>
                  ))
                ) : (
                  <div className="py-10 text-center space-y-3 border-2 border-dashed border-slate-200 rounded-2xl">
                     <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-200">
                        <CarFront size={20} />
                     </div>
                     <p className="text-xs text-slate-400">
                        Nenhum registro hoje.
                     </p>
                  </div>
                )}
              </AnimatePresence>
           </div>

           <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 text-center space-y-2">
              <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Controle Escolar</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                 Para terceiros, utilize <span className="text-teal-600 font-semibold">Autorizações</span> na secretaria.
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}
