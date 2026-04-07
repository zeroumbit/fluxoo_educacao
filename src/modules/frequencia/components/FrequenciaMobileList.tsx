import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertTriangle, Cake, Info, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, isToday } from 'date-fns'

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

  // Sincroniza se os dados iniciais mudarem
  useEffect(() => {
    if (Object.keys(initialFrequencias).length > 0) {
      setLocalStatuses(initialFrequencias)
    }
  }, [initialFrequencias])

  const toggleStatus = (alunoId: string, status: 'presente' | 'falta') => {
    setLocalStatuses(prev => ({
      ...prev,
      // Se já era esse status, mantém ou altera dependendo da UX. Aqui faremos toggle simples.
      [alunoId]: prev[alunoId] === status ? prev[alunoId] : status
    }))
  }

  const handleFinalize = () => {
    const payload = alunos.map(aluno => ({
      aluno_id: aluno.id,
      status: localStatuses[aluno.id] || 'presente' // Default para presente se não tocado
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
    <div className="flex flex-col gap-4 pb-24">
      {alunos.map((aluno) => {
        const studentName = aluno.nome_social || aluno.nome_completo
        const status = localStatuses[aluno.id] || 'neutral'
        const isBday = isAniversariante(aluno.data_nascimento)
        const hasNee = (aluno.alertas_saude_nee?.length || 0) > 0
        const hasAlergia = (aluno.patologias?.length || 0) > 0

        return (
          <Card key={aluno.id} className={cn(
            "overflow-hidden transition-all border-l-4",
            status === 'presente' ? "border-l-emerald-500 bg-emerald-50/30" : 
            status === 'falta' ? "border-l-red-500 bg-red-50/30" : "border-l-zinc-200"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                {/* Avatar e Info */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {aluno.foto_url ? (
                      <img src={aluno.foto_url} alt={studentName} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 font-bold border-2 border-white shadow-sm">
                        {studentName.charAt(0)}
                      </div>
                    )}
                    {isBday && (
                      <div className="absolute -top-1 -right-1 bg-pink-500 text-white rounded-full p-0.5 border-2 border-white">
                        <Cake size={10} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <span className="font-semibold text-zinc-900 leading-tight">
                      {studentName}
                    </span>
                    {/* Alertas Visuais Instantâneos */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {isBday && <Badge variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-100 border-none text-[10px] h-4 px-1">B-Day! 🎂</Badge>}
                      {hasNee && <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[10px] h-4 px-1">NEE 🧩</Badge>}
                      {hasAlergia && <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100 border-none text-[10px] h-4 px-1">ALERGIA ⚠️</Badge>}
                    </div>
                  </div>
                </div>

                {/* Botões de Ação (Tamanho Mobile-First) */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleStatus(aluno.id, 'presente')}
                    className={cn(
                      "flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all border-2",
                      localStatuses[aluno.id] === 'presente' 
                        ? "bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105" 
                        : "bg-white border-zinc-100 text-zinc-400 active:bg-emerald-50"
                    )}
                  >
                    <CheckCircle2 size={24} />
                    <span className="text-[10px] font-bold mt-0.5">PRES</span>
                  </button>

                  <button
                    onClick={() => toggleStatus(aluno.id, 'falta')}
                    className={cn(
                      "flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all border-2",
                      localStatuses[aluno.id] === 'falta' 
                        ? "bg-red-500 border-red-600 text-white shadow-lg shadow-red-200 scale-105" 
                        : "bg-white border-zinc-100 text-zinc-400 active:bg-red-50"
                    )}
                  >
                    <XCircle size={24} />
                    <span className="text-[10px] font-bold mt-0.5">FALTA</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Botão Flutuante de Salvar em Lote */}
      <div className="fixed bottom-6 left-0 right-0 px-6 z-50">
        <Button 
          onClick={handleFinalize}
          disabled={isSaving}
          className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span className="font-bold text-lg">Finalizar Chamada</span>
        </Button>
      </div>
    </div>
  )
}
