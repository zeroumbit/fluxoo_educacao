import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Cake, Save, Loader2, Search, UserCheck, UserX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface Student {
  id: string
  nome_completo: string
  nome_social?: string
  foto_url?: string
  data_nascimento?: string
  patologias?: string[]
  medicamentos?: string[]
  alertas_saude_nee?: Array<{ tipo_alerta: string; descricao: string }>
}

interface FrequenciaMobileListProps {
  alunos: Student[]
  initialFrequencias?: Record<string, 'presente' | 'falta' | 'justificada'>
  onSave: (data: Array<{ aluno_id: string; status: string }>) => void
  isSaving?: boolean
}

export function FrequenciaMobileList({ alunos, initialFrequencias = {}, onSave, isSaving }: FrequenciaMobileListProps) {
  const [localStatuses, setLocalStatuses] = useState<Record<string, 'presente' | 'falta' | 'justificada'>>(initialFrequencias)
  const [searchTerm, setSearchTerm] = useState('')

  // Sincroniza se os dados iniciais mudarem
  useEffect(() => {
    if (Object.keys(initialFrequencias).length > 0) {
      setLocalStatuses(initialFrequencias)
    }
  }, [initialFrequencias])

  const toggleStatus = (alunoId: string, status: 'presente' | 'falta') => {
    setLocalStatuses(prev => ({
      ...prev,
      [alunoId]: prev[alunoId] === status ? prev[alunoId] : status
    }))
    
    // Simulação de feedback tátil leve pode ser feita via visual
  }

  const filteredAlunos = useMemo(() => {
    return alunos.filter(a => 
      (a.nome_social || a.nome_completo).toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [alunos, searchTerm])

  const totalRespondidos = useMemo(() => {
    return Object.keys(localStatuses).length
  }, [localStatuses])

  const percentualConcluido = useMemo(() => {
    if (alunos.length === 0) return 0
    return Math.round((totalRespondidos / alunos.length) * 100)
  }, [totalRespondidos, alunos.length])

  const handleFinalize = () => {
    const payload = alunos.map(aluno => ({
      aluno_id: aluno.id,
      status: localStatuses[aluno.id] || 'presente' 
    }))
    onSave(payload)
  }

  const isAniversariante = (dataNasc?: string) => {
    if (!dataNasc) return false
    const hoje = new Date()
    const nasc = new Date(dataNasc)
    return hoje.getDate() === nasc.getUTCDate() && hoje.getMonth() === nasc.getUTCMonth()
  }

  return (
    <div className="flex flex-col gap-4 pb-32 animate-in fade-in duration-500">
      {/* Barra de Busca e Progresso */}
      <div className="sticky top-[10px] z-30 space-y-3 px-1">
         <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" />
            <input 
              type="text"
              placeholder="Buscar aluno pelo nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-white/80 backdrop-blur-xl border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-300 transition-all shadow-sm"
            />
         </div>

         <div className="bg-white/80 backdrop-blur-xl border border-zinc-200 rounded-2xl p-3 shadow-sm">
            <div className="flex justify-between items-center mb-2">
               <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Progresso da Chamada</span>
               <span className="text-[11px] font-bold text-zinc-900">{totalRespondidos} de {alunos.length}</span>
            </div>
            <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${percentualConcluido}%` }}
                 className={cn(
                   "h-full transition-all duration-500 rounded-full",
                   percentualConcluido === 100 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-zinc-900"
                 )}
               />
            </div>
         </div>
      </div>

      {/* Lista de Alunos */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredAlunos.map((aluno, index) => {
            const studentName = aluno.nome_social || aluno.nome_completo
            const status = localStatuses[aluno.id]
            const isBday = isAniversariante(aluno.data_nascimento)
            const hasNee = (aluno.alertas_saude_nee?.length || 0) > 0
            const hasAlergia = (aluno.patologias?.length || 0) > 0

            return (
              <motion.div
                key={aluno.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
              >
                <Card className={cn(
                  "overflow-hidden transition-all duration-300 border-none shadow-sm h-[88px] flex items-center",
                  status === 'presente' ? "bg-emerald-50/50 ring-1 ring-emerald-200" : 
                  status === 'falta' ? "bg-red-50/50 ring-1 ring-red-200" : "bg-white ring-1 ring-zinc-100"
                )}>
                  <CardContent className="p-0 w-full">
                    <div className="flex items-center justify-between px-4">
                      {/* Avatar e Info */}
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {aluno.foto_url ? (
                            <img src={aluno.foto_url} alt={studentName} className="w-14 h-14 rounded-2xl object-cover shadow-sm border-2 border-white" />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 font-bold shadow-sm border-2 border-white">
                              {studentName.charAt(0)}
                            </div>
                          )}
                          {isBday && (
                            <div className="absolute -top-1 -right-1 bg-pink-500 text-white rounded-full p-1 border-2 border-white shadow-sm animate-bounce">
                              <Cake size={10} />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col min-w-0 max-w-[140px]">
                          <span className="font-bold text-[15px] text-zinc-900 leading-tight truncate">
                            {studentName}
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {hasNee && <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-none text-[9px] h-4 px-1.5 font-bold uppercase tracking-tight">NEE</Badge>}
                            {hasAlergia && <Badge variant="secondary" className="bg-red-100 text-red-700 border-none text-[9px] h-4 px-1.5 font-bold uppercase tracking-tight">ALERGIA</Badge>}
                            {!status && <span className="text-[10px] text-zinc-400 font-medium">Pendente</span>}
                            {status === 'presente' && <span className="text-[10px] text-emerald-600 font-bold uppercase flex items-center gap-0.5"><UserCheck size={10} /> Presente</span>}
                            {status === 'falta' && <span className="text-[10px] text-red-600 font-bold uppercase flex items-center gap-0.5"><UserX size={10} /> Falta</span>}
                          </div>
                        </div>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex gap-2">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleStatus(aluno.id, 'presente')}
                          className={cn(
                            "flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all border-2",
                            status === 'presente' 
                              ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-200" 
                              : "bg-white border-zinc-100 text-zinc-400 active:bg-emerald-50"
                          )}
                        >
                          <CheckCircle2 size={24} />
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleStatus(aluno.id, 'falta')}
                          className={cn(
                            "flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all border-2",
                            status === 'falta' 
                              ? "bg-red-500 border-red-400 text-white shadow-lg shadow-red-200" 
                              : "bg-white border-zinc-100 text-zinc-400 active:bg-red-50"
                          )}
                        >
                          <XCircle size={24} />
                        </motion.button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filteredAlunos.length === 0 && searchTerm && (
          <div className="text-center py-12 bg-white rounded-3xl border border-zinc-100">
             <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-8 h-8 text-zinc-300" />
             </div>
             <p className="text-zinc-500 font-medium tracking-tight">Nenhum aluno encontrado para "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Action Bar Flutuante */}
      <div className="fixed bottom-0 left-0 right-0 p-6 pb-safe z-50 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          >
            <Button 
              onClick={handleFinalize}
              disabled={isSaving}
              className={cn(
                "w-full h-16 rounded-[22px] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-lg font-black tracking-tight",
                percentualConcluido === 100 
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200" 
                  : "bg-zinc-900 hover:bg-zinc-800 text-white"
              )}
            >
              {isSaving ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Save className="w-6 h-6" />
              )}
              {percentualConcluido === 100 ? "Finalizar Agora!" : "Salvar Chamada"}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

