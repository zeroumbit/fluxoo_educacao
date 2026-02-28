import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useTurmas } from '@/modules/turmas/hooks'
import { useAlunosPorTurma } from '@/modules/alunos/hooks'
import { useFrequenciasPorTurmaData, useSalvarFrequencias } from '../hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarCheck, Loader2, Save, UserCircle, Check, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FrequenciaStatus } from '@/lib/database.types'

type AlunoFrequencia = {
  aluno_id: string
  nome: string
  status: FrequenciaStatus
}

export function FrequenciaPage() {
  const { authUser } = useAuth()
  const { data: turmas } = useTurmas()
  const [turmaId, setTurmaId] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const { data: alunos } = useAlunosPorTurma(turmaId)
  const { data: frequenciasExistentes } = useFrequenciasPorTurmaData(turmaId, data)
  const salvarFrequencias = useSalvarFrequencias()

  const [presencas, setPresencas] = useState<AlunoFrequencia[]>([])

  useEffect(() => {
    if (alunos) {
      const novasPresencas = alunos.map((aluno) => {
        const frequenciaExistente = frequenciasExistentes?.find(
          (f) => f.aluno_id === aluno.id
        )
        return {
          aluno_id: aluno.id,
          nome: aluno.nome,
          status: (frequenciaExistente?.status as FrequenciaStatus) || 'presente',
        }
      })
      setPresencas(novasPresencas)
    }
  }, [alunos, frequenciasExistentes])

  const toggleStatus = (alunoId: string) => {
    setPresencas((prev) =>
      prev.map((p) => {
        if (p.aluno_id === alunoId) {
          const nextStatus: Record<FrequenciaStatus, FrequenciaStatus> = {
            presente: 'falta',
            falta: 'justificada',
            justificada: 'presente',
          }
          return { ...p, status: nextStatus[p.status] }
        }
        return p
      })
    )
  }

  const handleSalvar = async () => {
    if (!authUser || !turmaId || presencas.length === 0) return

    try {
      await salvarFrequencias.mutateAsync(
        presencas.map((p) => ({
          tenant_id: authUser.tenantId,
          aluno_id: p.aluno_id,
          turma_id: turmaId,
          data,
          status: p.status,
        }))
      )
      toast.success('Frequência salva com sucesso!')
    } catch {
      toast.error('Erro ao salvar frequência')
    }
  }

  const statusConfig = {
    presente: {
      label: 'Presente',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: Check,
    },
    falta: {
      label: 'Falta',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: X,
    },
    justificada: {
      label: 'Justificada',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: AlertCircle,
    },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Frequência</h1>
        <p className="text-muted-foreground">Registre a presença dos alunos</p>
      </div>

      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Turma</Label>
              <Select value={turmaId} onValueChange={setTurmaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas?.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.nome} - {turma.turno}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Presença */}
      {turmaId && presencas.length > 0 && (
        <>
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-indigo-600" />
                  Lista de Presença
                </CardTitle>
                <div className="flex gap-2 text-xs">
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                    {presencas.filter((p) => p.status === 'presente').length} presentes
                  </Badge>
                  <Badge variant="secondary" className="bg-red-50 text-red-700">
                    {presencas.filter((p) => p.status === 'falta').length} faltas
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {presencas.map((p) => {
                  const config = statusConfig[p.status]
                  const Icon = config.icon
                  return (
                    <div
                      key={p.aluno_id}
                      className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                          <UserCircle className="h-5 w-5 text-indigo-600" />
                        </div>
                        <span className="font-medium text-sm">{p.nome}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleStatus(p.aluno_id)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105',
                          config.color
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {config.label}
                      </button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSalvar}
              disabled={salvarFrequencias.isPending}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-md"
            >
              {salvarFrequencias.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Frequência
            </Button>
          </div>
        </>
      )}

      {turmaId && presencas.length === 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            <CalendarCheck className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p>Nenhum aluno ativo nesta turma.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
