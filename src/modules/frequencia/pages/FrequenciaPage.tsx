import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useTurmas } from '@/modules/turmas/hooks'
import { useFrequenciasPorTurmaData, useSalvarFrequencias } from '../hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle, XCircle, AlertCircle, Save } from 'lucide-react'
import { format } from 'date-fns'
import type { FrequenciaStatus } from '@/lib/database.types'
import { useAlunos } from '@/modules/alunos/hooks'

const statusConfig: Record<FrequenciaStatus, { label: string; icon: typeof CheckCircle; color: string }> = {
  presente: { label: 'Presente', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-100' },
  falta: { label: 'Falta', icon: XCircle, color: 'text-red-600 bg-red-100' },
  justificada: { label: 'Justificada', icon: AlertCircle, color: 'text-amber-600 bg-amber-100' },
}

export function FrequenciaPage() {
  const { authUser } = useAuth()
  const { data: turmas } = useTurmas()
  const { data: alunos } = useAlunos()
  const salvarFrequencias = useSalvarFrequencias()
  const [turmaId, setTurmaId] = useState('')
  const [dataAula, setDataAula] = useState(format(new Date(), 'yyyy-MM-dd'))
  const { data: frequencias } = useFrequenciasPorTurmaData(turmaId, dataAula)

  const [statusMap, setStatusMap] = useState<Record<string, FrequenciaStatus>>({})

  const toggleStatus = (alunoId: string) => {
    const current = statusMap[alunoId] || 'presente'
    const next: FrequenciaStatus =
      current === 'presente' ? 'falta' : current === 'falta' ? 'justificada' : 'presente'
    setStatusMap((prev) => ({ ...prev, [alunoId]: next }))
  }

  const handleSalvar = async () => {
    if (!authUser || !turmaId) return
    const alunosParaSalvar = alunos?.filter(a => a.status === 'ativo') || []
    if (alunosParaSalvar.length === 0) {
      toast.error('Nenhum aluno ativo encontrado')
      return
    }
    const dados = alunosParaSalvar.map((a) => ({
      tenant_id: authUser.tenantId,
      turma_id: turmaId,
      aluno_id: a.id,
      data_aula: dataAula,
      status: statusMap[a.id] || 'presente',
    }))

    try {
      await salvarFrequencias.mutateAsync(dados)
      toast.success('Frequência salva!')
    } catch {
      toast.error('Erro ao salvar')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Frequência</h1>
        <p className="text-muted-foreground">Registre a presença dos alunos</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Turma</Label>
          <Select onValueChange={setTurmaId}>
            <SelectTrigger><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
            <SelectContent>
              {turmas?.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.nome} ({t.turno})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Data</Label>
          <Input type="date" value={dataAula} onChange={(e) => setDataAula(e.target.value)} />
        </div>
      </div>

      {turmaId && alunos && (
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Chamada</CardTitle>
            <div className="flex gap-2">
              {Object.entries(statusConfig).map(([key, cfg]) => {
                const count = Object.values(statusMap).filter((s) => s === key).length
                return (
                  <Badge key={key} variant="secondary" className={cfg.color}>
                    {cfg.label}: {count}
                  </Badge>
                )
              })}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alunos
                .filter((a) => a.status === 'ativo')
                .map((aluno) => {
                  const status = statusMap[aluno.id] || 'presente'
                  const cfg = statusConfig[status]
                  const Icon = cfg.icon

                  return (
                    <div
                      key={aluno.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer"
                      onClick={() => toggleStatus(aluno.id)}
                    >
                      <span className="font-medium text-sm">{aluno.nome_completo}</span>
                      <Badge className={cfg.color}>
                        <Icon className="h-3.5 w-3.5 mr-1" />
                        {cfg.label}
                      </Badge>
                    </div>
                  )
                })}
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSalvar}
                disabled={salvarFrequencias.isPending}
                className="bg-gradient-to-r from-emerald-600 to-green-600"
              >
                {salvarFrequencias.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Frequência
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
