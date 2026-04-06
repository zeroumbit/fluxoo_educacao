import { useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useAgendaDiaria } from '@/modules/professor/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  Users,
  Calendar,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type FrequenciaStatus = 'presente' | 'falta' | 'justificada'

const statusConfig: Record<FrequenciaStatus, { label: string; icon: any; color: string; bgColor: string }> = {
  presente: {
    label: 'Presente',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  falta: {
    label: 'Falta',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  justificada: {
    label: 'Justificada',
    icon: AlertCircle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
}

export function ProfessorFrequenciaPage() {
  const { authUser } = useAuth()
  const { data: agenda, isLoading: loadingAgenda } = useAgendaDiaria()
  
  const [turmaId, setTurmaId] = useState('')
  const [dataAula, setDataAula] = useState(new Date().toISOString().split('T')[0])
  const [statusMap, setStatusMap] = useState<Record<string, FrequenciaStatus>>({})
  const [justificativaMap, setJustificativaMap] = useState<Record<string, string>>({})
  
  // Modal de Justificativa
  const [modalOpen, setModalOpen] = useState(false)
  const [alunoJustificando, setAlunoJustificando] = useState<{ id: string, nome: string } | null>(null)
  const [justificativaTemp, setJustificativaTemp] = useState('')

  // Turmas únicas da agenda
  const turmasUnicas = useMemo(() => {
    if (!agenda) return []
    const map = new Map()
    agenda.forEach((aula: any) => {
      if (!map.has(aula.turma_id)) {
        map.set(aula.turma_id, {
          id: aula.turma_id,
          nome: aula.turma_nome,
        })
      }
    })
    return Array.from(map.values())
  }, [agenda])

  // Alunos mock (será substituído por dados reais do Supabase)
  const alunosTurma = useMemo(() => {
    if (!turmaId) return []
    // TODO: Buscar alunos reais do Supabase via hook
    return []
  }, [turmaId])

  const handleStatusChange = (alunoId: string, status: FrequenciaStatus) => {
    setStatusMap(prev => ({ ...prev, [alunoId]: status }))
    
    if (status === 'justificada') {
      setAlunoJustificando({ id: alunoId, nome: alunoId })
      setModalOpen(true)
    }
  }

  const handleSalvarJustificativa = () => {
    if (alunoJustificando) {
      setJustificativaMap(prev => ({
        ...prev,
        [alunoJustificando.id]: justificativaTemp
      }))
      setModalOpen(false)
      setJustificativaTemp('')
      setAlunoJustificando(null)
    }
  }

  const handleSalvarFrequencia = async () => {
    try {
      // TODO: Implementar chamada real ao Supabase
      toast.success('Frequência salva com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar frequência')
    }
  }

  if (loadingAgenda) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados da Aula</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Turma</Label>
              <Select value={turmaId} onValueChange={setTurmaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmasUnicas.map((turma: any) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data da Aula</Label>
              <Input
                type="date"
                value={dataAula}
                onChange={(e) => setDataAula(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Frequência */}
      {turmaId && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Justificativa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunosTurma.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-12">
                      <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500">Nenhum aluno encontrado para esta turma</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  alunosTurma.map((aluno: any) => {
                    const status = statusMap[aluno.id] || 'presente'
                    const config = statusConfig[status]
                    const Icon = config.icon

                    return (
                      <TableRow key={aluno.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                              {aluno.nome?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{aluno.nome}</p>
                              <p className="text-xs text-slate-500">{aluno.email || 'Sem email'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {(['presente', 'falta', 'justificada'] as FrequenciaStatus[]).map((s) => {
                              const cfg = statusConfig[s]
                              const Ico = cfg.icon
                              const isSelected = status === s
                              
                              return (
                                <button
                                  key={s}
                                  onClick={() => handleStatusChange(aluno.id, s)}
                                  className={`p-2 rounded-lg border-2 transition-all ${
                                    isSelected
                                      ? `${cfg.bgColor} ${cfg.color} border-current`
                                      : 'border-slate-200 text-slate-400 hover:border-slate-300'
                                  }`}
                                  title={cfg.label}
                                >
                                  <Ico className="w-5 h-5" />
                                </button>
                              )
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {justificativaMap[aluno.id] ? (
                            <Badge variant="secondary" className="max-w-xs truncate">
                              {justificativaMap[aluno.id]}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-sm">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            {alunosTurma.length > 0 && (
              <div className="p-4 border-t border-slate-200">
                <Button
                  onClick={handleSalvarFrequencia}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Frequência
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Justificativa */}
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
              <Label>Justificativa</Label>
              <Textarea
                placeholder="Motivo da falta justificada..."
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
              Salvar Justificativa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProfessorFrequenciaPage
