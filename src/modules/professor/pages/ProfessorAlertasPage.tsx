import { useState, useMemo } from 'react'
import { useAuth } from '@/modules/auth/AuthContext'
import { useAlertasProfessor, useConcluirAlerta } from '@/modules/professor/hooks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Loader2, AlertTriangle, Search, Check, Clock, TrendingDown, Stethoscope, User, GraduationCap, ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function ProfessorAlertasPage() {
  const { data: alertas, isLoading, refetch, isFetching } = useAlertasProfessor()
  const concluirAlertaMutation = useConcluirAlerta()
  
  const [busca, setBusca] = useState('')
  const [selectedTipo, setSelectedTipo] = useState('todos')
  const [selectedAlerta, setSelectedAlerta] = useState<any>(null)
  const [observacao, setObservacao] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const alertasFiltrados = useMemo(() => {
    if (!alertas) return []
    return alertas.filter((alerta: any) => {
      const matchesSearch = alerta.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
                           alerta.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
                           alerta.aluno_nome?.toLowerCase().includes(busca.toLowerCase())
      const matchesTipo = selectedTipo === 'todos' || alerta.tipo === selectedTipo
      return matchesSearch && matchesTipo
    })
  }, [alertas, busca, selectedTipo])

  const tiposUnicos = useMemo(() => {
    if (!alertas) return []
    return Array.from(new Set(alertas.map((a: any) => a.tipo)))
  }, [alertas])

  const handleConcluirAlerta = () => {
    if (selectedAlerta) {
      concluirAlertaMutation.mutate({
        alertaId: selectedAlerta.id,
        observacao,
      }, {
        onSuccess: () => {
          toast.success('Alerta concluído com sucesso!')
          setDialogOpen(false)
          setObservacao('')
          setSelectedAlerta(null)
        }
      })
    }
  }

  const getAlertaIcon = (tipo: string, gravidade: string) => {
    if (gravidade === 'critica') return <AlertTriangle className="w-5 h-5 text-red-600" />
    switch (tipo) {
      case 'pedagogico': return <GraduationCap className="w-5 h-5 text-indigo-600" />
      case 'frequencia': return <TrendingDown className="w-5 h-5 text-amber-600" />
      case 'saude': return <Stethoscope className="w-5 h-5 text-emerald-600" />
      default: return <Clock className="w-5 h-5 text-zinc-600" />
    }
  }

  const getCardStyle = (gravidade: string) => {
    switch (gravidade) {
      case 'critica': return "bg-red-50 border-red-100 ring-1 ring-red-200"
      case 'alta': return "bg-orange-50 border-orange-100 ring-1 ring-orange-200"
      case 'media': return "bg-amber-50 border-amber-100"
      default: return "bg-white border-zinc-100"
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
        <p className="text-zinc-400 font-medium animate-pulse">Sincronizando alertas...</p>
      </div>
    )
  }

  if (isFetching) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-zinc-200/50 px-6 pt-safe pb-4 flex flex-col gap-1 shadow-sm">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Central de Alertas</h1>
          <p className="text-[13px] text-zinc-500 font-medium leading-none">Atualizando alertas...</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header Nativo Premium */}
      <div className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-zinc-200/50 px-6 pt-safe pb-4 flex flex-col gap-1 shadow-sm">
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Central de Alertas</h1>
        <p className="text-[13px] text-zinc-500 font-medium leading-none">Acompanhe e resolva pendências importantes</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Barra de Busca e Filtro Rápido */}
        <div className="space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
            <input 
              type="text"
              placeholder="Buscar por aluno ou assunto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-white border border-zinc-200 rounded-2xl text-[15px] focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all shadow-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            <button 
              onClick={() => setSelectedTipo('todos')}
              className={cn(
                "px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border",
                selectedTipo === 'todos' ? "bg-zinc-900 border-zinc-900 text-white shadow-lg shadow-zinc-200" : "bg-white border-zinc-200 text-zinc-500"
              )}
            >
              Todos
            </button>
            {tiposUnicos.map((tipo: any) => (
              <button 
                key={tipo}
                onClick={() => setSelectedTipo(tipo)}
                className={cn(
                  "px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border capitalize",
                  selectedTipo === tipo ? "bg-zinc-900 border-zinc-900 text-white shadow-lg shadow-zinc-200" : "bg-white border-zinc-200 text-zinc-500"
                )}
              >
                {tipo.replace(/_|prof/g, ' ').trim()}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Alertas (Visual Nativo) */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {alertasFiltrados.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 bg-white rounded-[40px] border border-zinc-100 shadow-sm"
              >
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-inner">
                  <Check className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-zinc-900 text-lg font-black tracking-tight">Tudo em dia!</h3>
                <p className="text-zinc-500 text-sm font-medium">Nenhum alerta pendente no momento.</p>
              </motion.div>
            ) : (
              alertasFiltrados.map((alerta: any, index: number) => (
                <motion.div
                  key={alerta.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", damping: 20, stiffness: 100, delay: index * 0.05 }}
                  onClick={() => {
                    setSelectedAlerta(alerta)
                    setDialogOpen(true)
                  }}
                >
                  <Card className={cn(
                    "overflow-hidden border-none shadow-sm transition-all active:scale-[0.97] cursor-pointer rounded-[28px]",
                    getCardStyle(alerta.gravidade)
                  )}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm bg-white border border-white/50",
                          alerta.gravidade === 'critica' && "animate-pulse"
                        )}>
                          {getAlertaIcon(alerta.tipo, alerta.gravidade)}
                        </div>
                        
                        <div className="flex-1 min-w-0 py-0.5">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h3 className="font-black text-[15px] text-zinc-900 leading-tight truncate">
                              {alerta.titulo}
                            </h3>
                          </div>
                          
                          <p className="text-[14px] text-zinc-600 line-clamp-2 leading-snug font-medium mb-3">
                            {alerta.descricao}
                          </p>

                          <div className="flex flex-wrap items-center gap-2">
                            {alerta.aluno_nome && (
                              <div className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-xl ring-1 ring-zinc-200/50 shadow-sm">
                                <User className="w-3.5 h-3.5 text-zinc-500" />
                                <span className="text-[11px] font-bold text-zinc-700 truncate max-w-[120px]">{alerta.aluno_nome}</span>
                              </div>
                            )}
                            <Badge variant="outline" className="bg-white/70 border-zinc-200 text-[10px] h-6 px-2.5 font-black uppercase tracking-widest rounded-xl">
                              {alerta.turma_nome || 'Sem turma'}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center self-center text-zinc-400">
                          <ChevronRight size={20} strokeWidth={3} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal de Detalhes - Estilo Bottom Sheet em Mobile */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-t-[40px] rounded-b-none sm:rounded-[40px] sm:max-w-md border-none p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 bg-zinc-900 text-white relative">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full mb-4 sm:hidden" />
            <div className="flex items-center gap-4 pt-2">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shadow-inner">
                {selectedAlerta && getAlertaIcon(selectedAlerta.tipo, selectedAlerta.gravidade)}
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight">{selectedAlerta?.titulo}</DialogTitle>
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest opacity-80">{selectedAlerta?.aluno_nome} • {selectedAlerta?.turma_nome}</p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-6 bg-white">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Contexto do Alerta</label>
              <div className="p-5 bg-zinc-50 rounded-3xl border border-zinc-100">
                <p className="text-[15px] text-zinc-800 leading-relaxed font-medium">{selectedAlerta?.descricao}</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Observações da Resolução</label>
              <Textarea
                placeholder="Exemplo: Conversado com o responsável, resolvido em sala..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="min-h-[140px] rounded-3xl border-zinc-200 bg-white focus:ring-zinc-900/5 focus:border-zinc-400 transition-all resize-none shadow-sm text-base p-5"
              />
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex flex-col-reverse sm:flex-row gap-3 bg-white">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="h-14 w-full sm:flex-1 rounded-2xl text-zinc-500 font-black uppercase text-xs tracking-widest">
              Voltar
            </Button>
            <Button
              onClick={handleConcluirAlerta}
              disabled={concluirAlertaMutation.isPending}
              className="h-14 w-full sm:flex-[2] rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase text-xs tracking-widest gap-2 shadow-xl shadow-zinc-200"
            >
              {concluirAlertaMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              Confirmar Resolução
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProfessorAlertasPage
