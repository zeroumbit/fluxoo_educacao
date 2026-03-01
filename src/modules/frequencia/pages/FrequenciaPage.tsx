import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useTurmas } from '@/modules/turmas/hooks'
import { useSalvarFrequencias } from '../hooks'
import { useMatriculasAtivas } from '@/modules/academico/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, CheckCircle, XCircle, AlertCircle, Save, Users, FileX } from 'lucide-react'
import type { FrequenciaStatus } from '@/lib/database.types'
import { useAlunos } from '@/modules/alunos/hooks'

const statusConfig: Record<FrequenciaStatus, { label: string; icon: typeof CheckCircle; color: string; badgeColor: string }> = {
  presente: { label: 'Presente', icon: CheckCircle, color: 'text-emerald-600', badgeColor: 'bg-emerald-100 text-emerald-700' },
  falta: { label: 'Falta', icon: XCircle, color: 'text-red-600', badgeColor: 'bg-red-100 text-red-700' },
  justificada: { label: 'Justificada', icon: AlertCircle, color: 'text-amber-600', badgeColor: 'bg-amber-100 text-amber-700' },
}

export function FrequenciaPage() {
  const { authUser } = useAuth()
  const { data: turmas } = useTurmas()
  const { data: alunos, isLoading: isLoadingAlunos } = useAlunos()
  const { data: matriculasAtivas } = useMatriculasAtivas()
  const salvarFrequencias = useSalvarFrequencias()
  const [turmaId, setTurmaId] = useState('')
  const [dataAula, setDataAula] = useState(new Date().toISOString().split('T')[0])
  const [statusMap, setStatusMap] = useState<Record<string, FrequenciaStatus>>({})

  // Cria um Set com IDs de alunos com matrícula ativa para consulta rápida
  const alunosComMatriculaIds = useMemo(() => {
    return new Set(matriculasAtivas?.map(m => m.aluno_id) || [])
  }, [matriculasAtivas])

  const toggleStatus = (alunoId: string) => {
    const current = statusMap[alunoId] || 'presente'
    const next: FrequenciaStatus =
      current === 'presente' ? 'falta' : current === 'falta' ? 'justificada' : 'presente'
    setStatusMap((prev) => ({ ...prev, [alunoId]: next }))
  }

  const handleSalvar = async () => {
    if (!authUser || !turmaId) return
    
    // Filtra apenas alunos com matrícula ativa
    const alunosParaSalvar = alunos?.filter(a => 
      a.status === 'ativo' && alunosComMatriculaIds.has(a.id)
    ) || []
    
    if (alunosParaSalvar.length === 0) {
      toast.error('Nenhum aluno com matrícula ativa encontrado')
      return
    }
    
    const dados = alunosParaSalvar.map((a) => ({
      tenant_id: authUser.tenantId,
      turma_id: turmaId,
      aluno_id: a.id,
      data_aula: dataAula,
      status: statusMap[a.id] || 'presente',
      justificativa: null,
    }))

    try {
      await salvarFrequencias.mutateAsync(dados)
      toast.success('Frequência salva!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar frequência')
    }
  }

  // Alunos ativos com informação de matrícula
  const alunosAtivos = useMemo(() => {
    return (alunos?.filter(a => a.status === 'ativo') || []).map(aluno => ({
      ...aluno,
      temMatricula: alunosComMatriculaIds.has(aluno.id),
    }))
  }, [alunos, alunosComMatriculaIds])

  const alunosComMatricula = alunosAtivos.filter(a => a.temMatricula)
  const alunosSemMatricula = alunosAtivos.filter(a => !a.temMatricula)

  const contagens = {
    presente: Object.values(statusMap).filter(s => s === 'presente').length,
    falta: Object.values(statusMap).filter(s => s === 'falta').length,
    justificada: Object.values(statusMap).filter(s => s === 'justificada').length,
  }

  if (isLoadingAlunos) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Frequência</h1>
          <p className="text-muted-foreground">Registre a presença dos alunos</p>
        </div>
        {turmaId && (
          <Button
            onClick={handleSalvar}
            disabled={salvarFrequencias.isPending}
            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-md"
          >
            {salvarFrequencias.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Frequência
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="turma">Turma *</Label>
          <Select onValueChange={setTurmaId} value={turmaId}>
            <SelectTrigger id="turma"><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
            <SelectContent>
              {turmas?.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.nome} ({t.turno})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="data">Data *</Label>
          <Input id="data" type="date" value={dataAula} onChange={(e) => setDataAula(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Total de Alunos</Label>
          <div className="flex flex-col gap-1 h-10 px-3 rounded-md border bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{alunosComMatricula.length} com matrícula</span>
              </span>
              {alunosSemMatricula.length > 0 && (
                <span className="text-xs text-amber-600 font-medium">{alunosSemMatricula.length} sem matrícula</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de alunos sem matrícula */}
      {turmaId && alunosSemMatricula.length > 0 && (
        <Card className="border-0 shadow-md bg-amber-50 ring-1 ring-amber-200">
          <CardContent className="py-4 flex items-start gap-4">
            <FileX className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">
                {alunosSemMatricula.length} aluno(s) sem matrícula ativa
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Estes alunos não podem receber frequência. Regularize as matrículas na tela de Matrícula.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {turmaId && alunosComMatricula.length > 0 && (
        <>
          {/* Contadores de Status */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <Badge key={key} variant="secondary" className={cfg.badgeColor}>
                <cfg.icon className="h-3.5 w-3.5 mr-1" />
                {cfg.label}: {key === 'presente' ? contagens.presente : key === 'falta' ? contagens.falta : contagens.justificada}
              </Badge>
            ))}
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Nome do Aluno</TableHead>
                    <TableHead className="w-[150px]">Status</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alunosComMatricula.map((aluno, index) => {
                    const status = statusMap[aluno.id] || 'presente'
                    const cfg = statusConfig[status]
                    const Icon = cfg.icon

                    return (
                      <TableRow key={aluno.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleStatus(aluno.id)}>
                        <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-medium">{aluno.nome_completo}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cfg.badgeColor}>
                            <Icon className="h-3.5 w-3.5 mr-1" />
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleStatus(aluno.id)
                            }}
                          >
                            <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {!turmaId && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p>Selecione uma turma para registrar a frequência.</p>
          </CardContent>
        </Card>
      )}

      {turmaId && alunosComMatricula.length === 0 && alunosSemMatricula.length === 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p>Nenhum aluno ativo encontrado para esta turma.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
