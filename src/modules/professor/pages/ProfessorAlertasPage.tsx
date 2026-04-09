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
  const { data: alertas, isLoading } = useAlertasProfessor()
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

  return (
    <div className="min-h-screen bg-zinc-50 pb-32 -m-6 md:m-0">
      {/* Header Nativo */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-zinc-100 px-6 py-4 flex flex-col gap-1">
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Central de Alertas</h1>
        <p className="text-[13px] text-zinc-500 font-medium leading-none">Acompanhe e resolva pendências importantes</p>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Barra de Busca e Filtro Rápido */}
        <div className="flex flex-col gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" />
            <input 
              type="text"
              placeholder="Buscar por aluno ou assunto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-white border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all shadow-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button 
              onClick={() => setSelectedTipo('todos')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                selectedTipo === 'todos' ? "bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-200" : "bg-white border-zinc-100 text-zinc-500"
              )}
            >
              Todos
            </button>
            {tiposUnicos.map((tipo: any) => (
              <button 
                key={tipo}
                onClick={() => setSelectedTipo(tipo)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border capitalize",
                  selectedTipo === tipo ? "bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-200" : "bg-white border-zinc-100 text-zinc-500"
                )}
              >
                {tipo.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Cards */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {alertasFiltrados.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-white rounded-[32px] border border-zinc-100 mx-2"
              >
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-zinc-900 font-bold">Tudo sob controle!</h3>
                <p className="text-zinc-500 text-sm">Nenhum alerta pendente para estes filtros.</p>
              </motion.div>
            ) : (
              alertasFiltrados.map((alerta: any, index: number) => (
                <motion.div
                  key={alerta.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setSelectedAlerta(alerta)
                    setDialogOpen(true)
                  }}
                >
                  <Card className={cn(
                    "overflow-hidden border-none shadow-sm transition-all active:scale-[0.98] cursor-pointer",
                    getCardStyle(alerta.gravidade)
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-white",
                          alerta.gravidade === 'critica' && "animate-pulse"
                        )}>
                          {getAlertaIcon(alerta.tipo, alerta.gravidade)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-[15px] text-zinc-900 leading-tight truncate pr-2">
                              {alerta.titulo}
                            </h3>
                            <span className="text-[10px] font-bold text-zinc-400 whitespace-nowrap">
                              {new Date(alerta.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </span>
                          </div>
                          
                          <p className="text-sm text-zinc-600 line-clamp-2 leading-snug mb-2">
                            {alerta.descricao}
                          </p>

                          <div className="flex items-center gap-2">
                            {alerta.aluno_nome && (
                              <div className="flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded-full ring-1 ring-zinc-200/50">
                                <User className="w-3 h-3 text-zinc-400" />
                                <span className="text-[11px] font-bold text-zinc-500 truncate max-w-[100px]">{alerta.aluno_nome}</span>
                              </div>
                            )}
                            <Badge variant="outline" className="bg-white/50 border-zinc-200 text-[9px] h-5 px-1.5 font-bold uppercase tracking-tight">
                              {alerta.turma_nome || 'Sem turma'}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center self-center text-zinc-300">
                          <ChevronRight size={18} />
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

      {/* Modal de Detalhes e Resolução */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-[32px] sm:max-w-md border-none p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-zinc-900 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                {selectedAlerta && getAlertaIcon(selectedAlerta.tipo, selectedAlerta.gravidade)}
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight">{selectedAlerta?.titulo}</DialogTitle>
                <p className="text-xs text-zinc-400 font-medium">{selectedAlerta?.aluno_nome} • {selectedAlerta?.turma_nome}</p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Descrição Completa</label>
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-sm text-zinc-700 leading-relaxed">{selectedAlerta?.descricao}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Ações de Resolução</label>
              <Textarea
                placeholder="Descreva brevemente como este alerta foi resolvido..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="min-h-[120px] rounded-2xl border-zinc-200 focus:ring-zinc-900/5 focus:border-zinc-300 transition-all resize-none shadow-sm"
              />
            </div>
          </div>

          <DialogFooter className="p-6 pt-0 flex gap-3">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="flex-1 rounded-2xl text-zinc-500 font-bold">
              Cancelar
            </Button>
            <Button
              onClick={handleConcluirAlerta}
              disabled={concluirAlertaMutation.isPending}
              className="flex-[2] rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold gap-2"
            >
              {concluirAlertaMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Marcar como Resolvido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProfessorAlertasPage
