import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  CheckCheck, 
  Save, 
  Loader2, 
  Search, 
  Filter, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  MessageSquare,
  AlertTriangle,
  Users,
  Calendar,
  Layers,
  Check,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '@/modules/auth/AuthContext'
import { useTurmas } from '@/modules/turmas/hooks'
import { useSalvarFrequencias, useFrequenciasPorTurmaData } from '../hooks'
import { useMatriculasAtivasPorTurma } from '@/modules/academico/hooks'
import { useAlunos } from '@/modules/alunos/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import type { FrequenciaStatus } from '@/lib/database.types'

export function FrequenciaPageMobile() {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  
  const [turmaId, setTurmaId] = useState('')
  const [dataAula, setDataAula] = useState(new Date().toISOString().split('T')[0])
  const [searchTerm, setSearchTerm] = useState('')

  const { data: turmas } = useTurmas()
  const { data: alunos, isLoading: isLoadingAlunos } = useAlunos()
  const { data: matriculasAtivas } = useMatriculasAtivasPorTurma(turmaId)
  const salvarFrequencias = useSalvarFrequencias()

  const { data: frequenciasExistentes, isLoading: isLoadingFreq, refetch } = useFrequenciasPorTurmaData(turmaId, dataAula)

  const [statusMap, setStatusMap] = useState<Record<string, FrequenciaStatus>>({})
  const [justificativaMap, setJustificativaMap] = useState<Record<string, string>>({})

  const [isJustificativaOpen, setIsJustificativaOpen] = useState(false)
  const [alunoJustificando, setAlunoJustificando] = useState<{ id: string, nome: string } | null>(null)
  const [justificativaTemp, setJustificativaTemp] = useState('')

  useEffect(() => {
    if (frequenciasExistentes) {
      const newStatusMap: Record<string, FrequenciaStatus> = {}
      const newJustificativaMap: Record<string, string> = {}
      frequenciasExistentes.forEach((f: any) => {
        newStatusMap[f.aluno_id] = f.status as FrequenciaStatus
        if (f.justificativa) newJustificativaMap[f.aluno_id] = f.justificativa
      })
      setStatusMap(newStatusMap)
      setJustificativaMap(newJustificativaMap)
    } else {
      setStatusMap({})
      setJustificativaMap({})
    }
  }, [frequenciasExistentes])

  // Busca apenas alunos COM VÍNCULO REAL na turma selecionada
  const alunosDaTurma = useMemo(() => {
    if (!matriculasAtivas || !alunos) return []
    
    const alunosIds = new Set(matriculasAtivas.map(m => m.aluno_id))
    
    return alunos
      .filter(a => alunosIds.has(a.id) && a.status === 'ativo')
      .sort((a, b) => a.nome_completo.localeCompare(b.nome_completo))
  }, [matriculasAtivas, alunos])

  const filteredAlunos = useMemo(() => {
    return alunosDaTurma.filter(a => a.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [alunosDaTurma, searchTerm])

  const setStatus = (alunoId: string, status: FrequenciaStatus) => {
    setStatusMap((prev) => ({ ...prev, [alunoId]: status }))
    if (status === 'justificada') {
      const aluno = alunos?.find(a => a.id === alunoId)
      if (aluno) {
        setAlunoJustificando({ id: aluno.id, nome: aluno.nome_completo })
        setJustificativaTemp(justificativaMap[alunoId] || '')
        setIsJustificativaOpen(true)
      }
    } else {
      setJustificativaMap(prev => {
        const next = { ...prev }
        delete next[alunoId]
        return next
      })
    }
  }

  const handleSalvarJustificativa = () => {
    if (alunoJustificando) {
      setJustificativaMap(prev => ({ ...prev, [alunoJustificando.id]: justificativaTemp }))
      setIsJustificativaOpen(false)
      setAlunoJustificando(null)
    }
  }

  const marcarTodosPresentes = () => {
    const newMap: Record<string, FrequenciaStatus> = { ...statusMap }
    alunosDaTurma.forEach(a => { newMap[a.id] = 'presente' })
    setStatusMap(newMap)
    setJustificativaMap({})
    toast.success('Todos marcados como presente!')
  }

  const handleSalvar = async () => {
    if (!authUser || !turmaId) return
    if (alunosDaTurma.length === 0) {
      toast.error('Nenhum aluno com matrícula ativa nesta turma')
      return
    }
    const dados = alunosDaTurma.map((a) => ({
      tenant_id: authUser.tenantId,
      turma_id: turmaId,
      aluno_id: a.id,
      data_aula: dataAula,
      status: statusMap[a.id] || 'presente',
      justificativa: statusMap[a.id] === 'justificada' ? (justificativaMap[a.id]?.trim() || null) : null,
    }))
    try {
      await salvarFrequencias.mutateAsync(dados)
      toast.success('Frequência salva com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar frequência')
    }
  }

  const contagens = {
    presente: alunosDaTurma.filter(a => (statusMap[a.id] || 'presente') === 'presente').length,
    falta: alunosDaTurma.filter(a => statusMap[a.id] === 'falta').length,
    justificada: alunosDaTurma.filter(a => statusMap[a.id] === 'justificada').length,
  }

  const isLoading = isLoadingAlunos || (turmaId && isLoadingFreq)

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-40">
      {/* Top Header Sticky (Rule 3) */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="mx-auto w-full max-w-[640px] px-4 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/dashboard')} className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
                <ArrowLeft className="h-4 w-4 text-slate-500" />
              </motion.button>
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">Chamada</h1>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Frequência Diária</p>
              </div>
            </div>
            {turmaId && (
              <motion.button 
                whileTap={{ scale: 0.9 }} 
                onClick={marcarTodosPresentes}
                className="h-9 px-4 rounded-xl bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase tracking-widest border border-emerald-100/50 flex items-center gap-2"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Presente
              </motion.button>
            )}
          </div>

          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-8">
              <Select onValueChange={setTurmaId} value={turmaId}>
                <SelectTrigger className="w-full h-14 rounded-2xl text-[15px] font-semibold bg-slate-50/50 dark:bg-slate-800/50 border-0 shadow-inner">
                  <SelectValue placeholder="Escolha a turma" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {turmas?.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="py-4 font-semibold text-[15px]">{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-4">
              <Input 
                type="date" 
                value={dataAula} 
                onChange={(e) => setDataAula(e.target.value)}
                className="h-14 rounded-2xl text-[13px] font-bold bg-slate-50/50 dark:bg-slate-800/50 border-0 text-center px-2"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[640px] px-4 pt-6 space-y-6">
        {/* Resumo Stats */}
        {turmaId && (
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-white border border-emerald-100 text-center">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Presentes</p>
              <p className="text-lg font-black text-emerald-700">{contagens.presente}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-red-100 text-center">
              <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Faltas</p>
              <p className="text-lg font-black text-red-700">{contagens.falta}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-amber-100 text-center">
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Justif.</p>
              <p className="text-lg font-black text-amber-700">{contagens.justificada}</p>
            </div>
          </div>
        )}

        {/* Search inside list */}
        {turmaId && (
           <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                 placeholder="Pesquisar aluno..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-10 h-12 rounded-2xl border-0 bg-white shadow-sm text-sm font-bold"
              />
           </div>
        )}

        <PullToRefresh onRefresh={async () => { await refetch() }}>
          <div className="space-y-3">
            {isLoading ? (
               Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
            ) : turmaId ? (
              <AnimatePresence mode="popLayout">
                {filteredAlunos.map((aluno, idx) => {
                  const status = statusMap[aluno.id] || 'presente'
                  return (
                    <motion.div 
                      key={aluno.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <NativeCard className="p-4">
                        <div className="flex justify-between items-center gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                               {aluno.foto_url ? (
                                 <img src={aluno.foto_url} alt="" className="w-full h-full object-cover" />
                               ) : (
                                 <User className="h-6 w-6 text-slate-300" />
                               )}
                            </div>
                            <div className="min-w-0">
                               <h3 className="text-[14px] font-bold text-slate-900 dark:text-white truncate uppercase tracking-tight">{aluno.nome_completo}</h3>
                               {justificativaMap[aluno.id] && (
                                 <div className="flex items-center gap-1 mt-1.5 text-[9px] font-black text-amber-500 bg-amber-50/50 dark:bg-amber-900/20 px-2 py-0.5 rounded-lg w-fit">
                                    <MessageSquare className="h-3 w-3" /> {justificativaMap[aluno.id].substring(0, 15)}...
                                 </div>
                               )}
                            </div>
                          </div>
                          <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
                             <motion.button 
                                whileTap={{ scale: 0.92 }}
                                onClick={() => setStatus(aluno.id, 'presente')}
                                className={cn(
                                   "h-11 w-11 rounded-xl flex items-center justify-center text-[13px] font-black transition-all",
                                   status === 'presente' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400"
                                )}
                             >P</motion.button>
                             <motion.button 
                                whileTap={{ scale: 0.92 }}
                                onClick={() => setStatus(aluno.id, 'falta')}
                                className={cn(
                                   "h-11 w-11 rounded-xl flex items-center justify-center text-[13px] font-black transition-all mx-1",
                                   status === 'falta' ? "bg-rose-600 text-white shadow-lg" : "text-slate-400"
                                )}
                             >F</motion.button>
                             <motion.button 
                                whileTap={{ scale: 0.92 }}
                                onClick={() => setStatus(aluno.id, 'justificada')}
                                className={cn(
                                   "h-11 w-11 rounded-xl flex items-center justify-center text-[13px] font-black transition-all",
                                   status === 'justificada' ? "bg-amber-500 text-white shadow-lg" : "text-slate-400"
                                )}
                             >J</motion.button>
                          </div>
                        </div>
                      </NativeCard>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            ) : (
              <div className="py-20 text-center">
                <div className="h-20 w-20 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                   <Users className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Seleção Pendente</h3>
                <p className="text-xs font-medium text-slate-400 max-w-[200px] mx-auto mt-2 italic">Escolha uma turma para realizar o registro de frequência.</p>
              </div>
            )}
            {turmaId && filteredAlunos.length === 0 && (
               <div className="py-10 text-center text-slate-400 font-bold text-xs italic">Nenhum aluno encontrado para "{searchTerm}"</div>
            )}
          </div>
        </PullToRefresh>
      </div>

      {/* Floating Save Button with Safe Area (Rule 13/23) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 pb-safe">
        <div className="mx-auto w-full max-w-[640px] px-4 py-4">
          <Button 
            disabled={!turmaId || salvarFrequencias.isPending}
            onClick={handleSalvar}
            className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black text-base shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            {salvarFrequencias.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <><Check className="h-5 w-5" /> SALVAR CHAMADA</>
            )}
          </Button>
        </div>
      </div>

      {/* Sheet for Justification (Rule 4) */}
      <BottomSheet isOpen={isJustificativaOpen} onClose={() => setIsJustificativaOpen(false)} title="Justificar Ausência" size="half">
        <div className="space-y-7 pt-4 text-center pb-32">
           <div className="h-16 w-16 bg-amber-50 dark:bg-amber-900/40 rounded-xl flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="h-8 w-8 text-amber-500" />
           </div>
           <div>
              <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">Motivo da Falta</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-2 italic uppercase tracking-widest">
                Para: <span className="text-slate-900 dark:text-white font-black">{alunoJustificando?.nome}</span>
              </p>
           </div>
           
           <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Observação</Label>
              <Textarea 
                placeholder="Ex: Atestado médico, viagem familiar..."
                value={justificativaTemp}
                onChange={(e) => setJustificativaTemp(e.target.value)}
                className="min-h-[120px] rounded-2xl border-0 bg-slate-50/70 dark:bg-slate-800/70 text-base font-bold shadow-inner py-4 focus:ring-2 focus:ring-amber-500/20"
              />
           </div>

           {/* Fixed Footer (Rule 11) */}
           <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 pb-safe">
             <div className="mx-auto w-full max-w-[640px] px-6 py-4">
               <Button 
                className="w-full h-14 rounded-xl bg-amber-600 font-bold text-base active:scale-92 transition-all" 
                onClick={handleSalvarJustificativa}
               >
                  Confirmar Justificativa
               </Button>
             </div>
           </div>
        </div>
      </BottomSheet>
    </div>
  )
}
