import { useState, useMemo, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useTurmas } from '@/modules/turmas/hooks'
import { useSalvarFrequencias, useFrequenciasPorTurmaData } from '../hooks'
import { useMatriculasAtivasPorTurma } from '@/modules/academico/hooks'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  FileX,
  MessageSquare,
  CheckCheck,
  FileText,
  Heart,
  Brain,
  Cake,
} from 'lucide-react'
import type { FrequenciaStatus } from '@/lib/database.types'
import { useAlunos } from '@/modules/alunos/hooks'
import { useAlertasProfessor } from '@/modules/professor/hooks'

const _statusConfig: Record<FrequenciaStatus, { label: string; icon: any; color: string; bgColor: string; borderColor: string }> = {
  presente: {
    label: 'Presente',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  falta: {
    label: 'Falta',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  justificada: {
    label: 'Justificada',
    icon: AlertCircle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
}

export function FrequenciaPageWeb() {
  const { authUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [turmaId, setTurmaId] = useState(() => (location.state as any)?.turmaId || '')
  const [dataAula, setDataAula] = useState(new Date().toISOString().split('T')[0])

  const { data: turmas } = useTurmas()
  const { data: alunos, isLoading: isLoadingAlunos } = useAlunos()
  const { data: matriculasAtivas } = useMatriculasAtivasPorTurma(turmaId)
  const { data: alertasProfessor } = useAlertasProfessor()
  const salvarFrequencias = useSalvarFrequencias()

  // Queries
  const { data: frequenciasExistentes, isLoading: isLoadingFreq } = useFrequenciasPorTurmaData(turmaId, dataAula)

  // States para edição
  const [statusMap, setStatusMap] = useState<Record<string, FrequenciaStatus>>({})
  const [justificativaMap, setJustificativaMap] = useState<Record<string, string>>({})

  // Modal de Justificativa
  const [modalOpen, setModalOpen] = useState(false)
  const [alunoJustificando, setAlunoJustificando] = useState<{ id: string, nome: string } | null>(null)
  const [justificativaTemp, setJustificativaTemp] = useState('')

  // Sincronizar dados existentes quando mudar turma ou data
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
    
    // Pega os IDs dos alunos com matrícula ativa nesta turma
    const alunosIds = new Set(matriculasAtivas.map(m => m.aluno_id))
    
    // Filtra apenas os alunos que estão na lista de alunos E têm matrícula na turma
    return alunos
      .filter(a => alunosIds.has(a.id) && a.status === 'ativo')
      .sort((a, b) => a.nome_completo.localeCompare(b.nome_completo))
  }, [matriculasAtivas, alunos])

  const setStatus = (alunoId: string, status: FrequenciaStatus) => {
    setStatusMap((prev) => ({ ...prev, [alunoId]: status }))

    if (status === 'justificada') {
      const aluno = alunos?.find(a => a.id === alunoId)
      if (aluno) {
        setAlunoJustificando({ id: aluno.id, nome: aluno.nome_completo })
        setJustificativaTemp(justificativaMap[alunoId] || '')
        setModalOpen(true)
      }
    } else {
      // Limpa justificativa se mudar para presente ou falta
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
      setModalOpen(false)
      setAlunoJustificando(null)
    }
  }

  const marcarTodosPresentes = () => {
    const newMap: Record<string, FrequenciaStatus> = { ...statusMap }
    alunosDaTurma.forEach(a => {
      newMap[a.id] = 'presente'
    })
    setStatusMap(newMap)
    setJustificativaMap({})
    toast.success('Todos marcados como presente!')
  }

  const handleSalvar = async () => {
    if (!authUser || !turmaId) return

    if (!authUser.tenantId) {
      toast.error('O seu usuário não possui uma escola (tenant) vinculada. Entre em contato com o suporte.')
      logger.error('❌ [FrequenciaPage] Tentativa de salvar sem tenant_id:', authUser)
      return
    }

    if (alunosDaTurma.length === 0) {
      toast.error('Nenhum aluno com matrícula ativa encontrado nesta turma')
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

    logger.info('🚀 [FrequenciaPage] Salvando dados:', dados)

    try {
      await salvarFrequencias.mutateAsync(dados)
      toast.success('Frequência salva com sucesso!')
    } catch (err: any) {
      logger.error('❌ [FrequenciaPage] Erro ao salvar:', err)
      toast.error(err.message || 'Erro ao salvar frequência')
    }
  }

  const contagens = {
    presente: alunosDaTurma.filter(a => (statusMap[a.id] || 'presente') === 'presente').length,
    falta: alunosDaTurma.filter(a => statusMap[a.id] === 'falta').length,
    justificada: alunosDaTurma.filter(a => statusMap[a.id] === 'justificada').length,
  }

  if (isLoadingAlunos) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Frequência Escolar</h1>
          <p className="text-muted-foreground italic mb-2">Registro oficial de presença e faltas justificadas</p>
          <Button
            variant="ghost"
            onClick={() => navigate('/frequencia/relatorio')}
            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold text-xs uppercase p-0 h-auto gap-1.5"
          >
            <FileText size={14} /> Ver Relatório Mensal
          </Button>
        </div>
        <div className="flex gap-2">
          {turmaId && (
            <Button
              variant="outline"
              onClick={marcarTodosPresentes}
              className="h-12 border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl px-6"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Todos Presente
            </Button>
          )}
          {turmaId && (
            <Button
              onClick={handleSalvar}
              disabled={salvarFrequencias.isPending}
              className="h-12 bg-emerald-600 hover:bg-emerald-700 shadow-lg px-8 rounded-xl"
            >
              {salvarFrequencias.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
        <div className="md:col-span-6 space-y-2">
          <Label htmlFor="turma" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Turma</Label>
          <Select onValueChange={setTurmaId} value={turmaId}>
            <SelectTrigger id="turma" className="w-full h-12 text-base font-medium transition-all focus:ring-2 focus:ring-emerald-500/20 rounded-xl">
              <SelectValue placeholder="Selecione a turma..." />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200">
              {turmas?.map((t) => (
                <SelectItem key={t.id} value={t.id} className="py-3 text-base">
                  <div className="font-bold">{t.nome}</div>
                  <div className="text-xs text-muted-foreground uppercase">{t.turno}</div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="data" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Data da Aula</Label>
          <Input
            id="data"
            type="date"
            className="w-full h-12 text-base font-medium transition-all focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
            value={dataAula}
            onChange={(e) => setDataAula(e.target.value)}
          />
        </div>
        <div className="md:col-span-4 space-y-2">
          <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Resumo do Dia</Label>
          <div className="grid grid-cols-3 gap-3">
            <div className="h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-start px-4 gap-2">
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tight flex-1">Presente</span>
              <span className="text-xl font-black text-emerald-700 leading-none">{contagens.presente}</span>
            </div>
            <div className="h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-start px-4 gap-2">
              <span className="text-[9px] font-black text-red-600 uppercase tracking-tight flex-1">Faltas</span>
              <span className="text-xl font-black text-red-700 leading-none">{contagens.falta}</span>
            </div>
            <div className="h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-start px-4 gap-2">
              <span className="text-[9px] font-black text-amber-600 uppercase tracking-tight flex-1">Justificado</span>
              <span className="text-xl font-black text-amber-700 leading-none">{contagens.justificada}</span>
            </div>
          </div>
        </div>
      </div>

      {turmaId && alunosDaTurma.length === 0 && (
        <Card className="border-0 shadow-lg bg-amber-50 ring-1 ring-amber-200">
          <CardContent className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-amber-800">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <div>
                <p className="text-sm font-black uppercase tracking-tight">Nenhum aluno com matrícula ativa nesta turma</p>
                <p className="text-xs font-medium font-serif italic">Cadastre matrículas ativas para os alunos desta turma.</p>
              </div>
            </div>
            <Button variant="ghost" className="text-amber-700 hover:bg-amber-100 font-bold text-xs uppercase underline" onClick={() => (window.location.href = '/matriculas')}>Gerenciar Matrículas</Button>
          </CardContent>
        </Card>
      )}

      {turmaId && (
        <Card className="border-0 shadow-xl overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <CardContent className="p-0">
            {isLoadingFreq ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                <p className="text-slate-500 font-medium font-serif italic">Sincronizando registros existentes...</p>
              </div>
            ) : alunosDaTurma.length > 0 ? (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="w-[60px] text-center text-slate-400 font-black">#</TableHead>
                    <TableHead className="py-6 text-slate-800 font-black uppercase tracking-widest text-[10px] pl-8">Nome do Estudante</TableHead>
                    <TableHead className="w-[380px] text-right text-slate-800 font-black uppercase tracking-widest text-[10px] pr-8">Frequência e Justificativa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alunosDaTurma.map((aluno, index) => {
                    const status = statusMap[aluno.id] || 'presente'
                    const hasJustificativa = !!justificativaMap[aluno.id]

                    return (
                      <TableRow key={aluno.id} className="group hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0 h-20">
                        <TableCell className="text-center">
                          <span className="text-slate-400 font-black text-sm">{String(index + 1).padStart(2, '0')}</span>
                        </TableCell>
                        <TableCell className="pl-8">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition-colors">
                                  {aluno.nome_completo}
                                </span>
                                
                                {/* BADGES DE ALERTA (PONTO FOCAL DO PROFESSOR) */}
                                <div className="flex items-center gap-1">
                                    {/* Alertas de Saúde */}
                                    {alertasProfessor?.find(a => a.aluno_id === aluno.id && a.tipo === 'saude') && (
                                        <div className="h-6 w-6 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 animate-pulse" title="Alerta de Saúde">
                                            <Heart className="h-3.5 w-3.5 fill-current" />
                                        </div>
                                    )}
                                    {/* Alertas de Inclusão (NEE/Cérebro) */}
                                    {alertasProfessor?.find(a => a.aluno_id === aluno.id && a.tipo === 'inclusao') && (
                                        <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600" title="Necessidades Especiais/Inclusão">
                                            <Brain className="h-3.5 w-3.5" />
                                        </div>
                                    )}
                                    {/* Aniversariante do Mês/Dia */}
                                    {alertasProfessor?.find(a => a.aluno_id === aluno.id && a.tipo === 'operacional_prof' && a.titulo.toLowerCase().includes('aniversário')) && (
                                        <div className="h-6 w-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600" title="Aniversariante">
                                            <Cake className="h-3.5 w-3.5" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {hasJustificativa && (
                              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded-full w-fit">
                                <MessageSquare className="h-3 w-3" />
                                <span>Justificativa: {justificativaMap[aluno.id].substring(0, 40)}{justificativaMap[aluno.id].length > 40 ? '...' : ''}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="pr-8">
                          <div className="flex items-center justify-end gap-3">
                            <div className="flex p-1 bg-slate-100 rounded-2xl shadow-inner border border-slate-200">
                              <Button
                                variant={status === 'presente' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setStatus(aluno.id, 'presente')}
                                className={`rounded-xl px-4 font-black transition-all ${status === 'presente' ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md' : 'text-slate-500 hover:bg-emerald-100 hover:text-emerald-700'}`}
                              >
                                P
                              </Button>
                              <Button
                                variant={status === 'falta' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setStatus(aluno.id, 'falta')}
                                className={`rounded-xl px-4 font-black transition-all ${status === 'falta' ? 'bg-red-600 hover:bg-red-700 text-white shadow-md' : 'text-slate-500 hover:bg-red-100 hover:text-red-700'}`}
                              >
                                F
                              </Button>
                              <Button
                                variant={status === 'justificada' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setStatus(aluno.id, 'justificada')}
                                className={`rounded-xl px-4 font-black transition-all ${status === 'justificada' ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:bg-amber-100 hover:text-amber-700'}`}
                              >
                                J
                              </Button>
                            </div>

                            {status === 'justificada' && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setStatus(aluno.id, 'justificada')}
                                className="h-9 w-9 rounded-xl border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-24 text-center">
                <Users className="h-20 w-20 mx-auto mb-6 text-slate-200" />
                <h3 className="text-xl font-bold text-slate-600">Nenhum aluno com matrícula ativa nesta turma</h3>
                <p className="text-slate-400 mt-2">Certifique-se de que existem matrículas ativas vinculadas a esta turma.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!turmaId && (
        <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
          <Users className="h-24 w-24 text-slate-200 mb-6" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-[11px]">Aguardando seleção de turma</p>
          <p className="text-slate-400 text-sm mt-2">Escolha uma turma acima para carregar a lista de presença.</p>
        </div>
      )}

      {/* Modal de Justificativa */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
          <DialogHeader className="p-8 bg-amber-500 text-white">
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <AlertCircle className="h-8 w-8" />
              Justificar Falta
            </DialogTitle>
            <DialogDescription className="text-amber-50 font-bold opacity-90">
              Aluno: {alunoJustificando?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-4 bg-white">
            <div className="space-y-2">
              <Label className="uppercase tracking-widest text-[10px] font-black text-slate-400">Motivo da Falta / Observações</Label>
              <Textarea
                placeholder="Ex: Atestado médico apresentado pelo responsável..."
                className="min-h-[150px] rounded-2xl border-slate-200 focus:ring-amber-500/20 text-base py-4"
                value={justificativaTemp}
                onChange={(e) => setJustificativaTemp(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 flex sm:justify-between items-center gap-4">
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="rounded-xl font-bold text-slate-500">Cancelar</Button>
            <Button
              onClick={handleSalvarJustificativa}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-8 font-black shadow-lg shadow-amber-200"
            >
              Confirmar Justificativa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
