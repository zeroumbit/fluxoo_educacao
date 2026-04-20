import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useAgendaDiaria } from '@/modules/professor/hooks'
import { useTurmas } from '@/modules/turmas/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { useNavigate } from 'react-router-dom'
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  Users,
  ArrowLeft,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAlunosDaTurma, useFrequenciaOptimistic, useFrequenciasPorTurmaData } from '@/modules/frequencia/hooks'
import { FrequenciaMobileList } from '@/modules/frequencia/components/FrequenciaMobileList'

type FrequenciaStatus = 'presente' | 'falta' | 'justificada'

export function ProfessorFrequenciaPage() {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const { data: agenda, isLoading: loadingAgenda } = useAgendaDiaria()
  const { data: minhasTurmas, isLoading: loadingTurmas } = useTurmas()
  
  const [turmaId, setTurmaId] = useState('')
  const [dataAula, setDataAula] = useState(new Date().toISOString().split('T')[0])
  
  // Modal de Justificativa
  const [modalOpen, setModalOpen] = useState(false)
  const [alunoJustificando, _setAlunoJustificando] = useState<{ id: string, nome: string } | null>(null)
  const [justificativaTemp, setJustificativaTemp] = useState('')

  // Turmas únicas combinadas (agenda + turmas vinculadas)
  const turmasUnicas = useMemo(() => {
    const map = new Map()

    if (minhasTurmas) {
      minhasTurmas.forEach((turma: any) => {
        map.set(turma.id, {
          id: turma.id,
          nome: turma.nome,
        })
      })
    }

    if (agenda) {
      agenda.forEach((aula: any) => {
        if (!map.has(aula.turma_id)) {
          map.set(aula.turma_id, {
            id: aula.turma_id,
            nome: aula.turma_nome,
          })
        }
      })
    }
    
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome))
  }, [agenda, minhasTurmas])

  // Dados Reais do Supabase
  const { data: alunosTurma = [], isLoading: loadingAlunos } = useAlunosDaTurma(turmaId)
  const { data: frequenciasExistentes = [] } = useFrequenciasPorTurmaData(turmaId, dataAula)
  const { salvarLote, isSaving } = useFrequenciaOptimistic(turmaId, dataAula)

  // Mapear frequências existentes para o formato do componente
  const initialFrequencias = useMemo(() => {
    const map: Record<string, 'presente' | 'falta' | 'justificada'> = {}
    frequenciasExistentes.forEach((f: any) => {
      map[f.aluno_id] = f.status as any
    })
    return map
  }, [frequenciasExistentes])

  const initialJustificativas = useMemo(() => {
    const map: Record<string, string> = {}
    frequenciasExistentes.forEach((f: any) => {
      if (f.justificativa) {
        map[f.aluno_id] = f.justificativa
      }
    })
    return map
  }, [frequenciasExistentes])

  const handleSalvarFrequenciaBulk = async (payload: Array<{ aluno_id: string; status: string }>) => {
    try {
      const frequenciasInsert: any[] = payload.map(p => ({
        tenant_id: authUser?.tenantId!,
        turma_id: turmaId,
        aluno_id: p.aluno_id,
        status: p.status,
        data_aula: dataAula,
        justificativa: p.status === 'justificada' ? 'Informada pelo professor' : null
      }))

      salvarLote(frequenciasInsert, {
        onSuccess: () => toast.success('Chamada sincronizada com sucesso!'),
        onError: () => toast.error('Erro ao salvar. Verifique sua conexão.')
      })
    } catch (error) {
      toast.error('Ocorreu um erro ao processar os dados.')
    }
  }

  const handleSalvarJustificativa = () => {
    // Implementar se necessário no futuro para o componente mobile
    setModalOpen(false)
  }

  if (loadingAgenda) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-32">
      {/* Header Nativo (Estilo App) */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-zinc-100 px-4 py-4 flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="h-10 w-10 rounded-2xl bg-zinc-100 active:scale-90 transition-all"
        >
          <ArrowLeft className="h-5 w-5 text-zinc-600" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-[17px] font-black text-zinc-900 tracking-tight leading-none">Diário de Classe</h1>
          <p className="text-[10px] uppercase font-bold text-zinc-400 mt-1.5 tracking-widest leading-none">Chamada Presença</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Filtros Glassmorphism */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-zinc-100 flex flex-col gap-5">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Selecione a Turma</Label>
              <Select value={turmaId} onValueChange={setTurmaId}>
                <SelectTrigger className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:ring-zinc-900/5">
                  <SelectValue placeholder="Toque para escolher..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-zinc-100">
                  {turmasUnicas.map((turma: any) => (
                    <SelectItem key={turma.id} value={turma.id} className="py-3 rounded-xl focus:bg-zinc-50">
                      {turma.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Data da Chamada</Label>
              <Input
                type="date"
                value={dataAula}
                className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:ring-zinc-900/5 shadow-none"
                onChange={(e) => setDataAula(e.target.value)}
              />
            </div>
        </div>

      {/* Lista Mobile Optimistic */}
      {turmaId && (
        <div className="mt-4">
          {loadingAlunos ? (
            <div className="flex flex-col items-center justify-center h-48 py-12">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-300 mb-2" />
              <p className="text-zinc-500 font-medium text-sm">Buscando alunos da {turmasUnicas.find((t: any) => t.id === turmaId)?.nome}...</p>
            </div>
          ) : alunosTurma.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-zinc-100 mx-4">
              <Users className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
              <p className="text-zinc-500 text-sm">Nenhum aluno ativo encontrado nesta turma.</p>
            </div>
          ) : (
            <div className="px-4 md:px-0">
              <FrequenciaMobileList 
                alunos={alunosTurma}
                initialFrequencias={initialFrequencias}
                initialJustificativas={initialJustificativas}
                onSave={handleSalvarFrequenciaBulk}
                isSaving={isSaving}
              />
            </div>
          )}
        </div>
      )}

      {/* Modal de Justificativa (Legado/Opcional) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Justificativa</DialogTitle>
            <DialogDescription>
              Aluno: {alunoJustificando?.nome}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo Especial</Label>
              <Textarea
                placeholder="Ex: Aluno apresentou atestado médico..."
                value={justificativaTemp}
                onChange={(e) => setJustificativaTemp(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarJustificativa}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}

export default ProfessorFrequenciaPage
