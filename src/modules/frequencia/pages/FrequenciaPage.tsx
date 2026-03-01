import { useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useTurmas } from '@/modules/turmas/hooks'
import { useSalvarFrequencias, useFrequenciasPorTurmaData } from '../hooks'
import { useMatriculasAtivas } from '@/modules/academico/hooks'
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
  CheckCheck
} from 'lucide-react'
import type { FrequenciaStatus } from '@/lib/database.types'
import { useAlunos } from '@/modules/alunos/hooks'

const statusConfig: Record<FrequenciaStatus, { label: string; icon: any; color: string; bgColor: string; borderColor: string }> = {
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

export function FrequenciaPage() {
  const { authUser } = useAuth()
  const { data: turmas } = useTurmas()
  const { data: alunos, isLoading: isLoadingAlunos } = useAlunos()
  const { data: matriculasAtivas } = useMatriculasAtivas()
  const salvarFrequencias = useSalvarFrequencias()
  
  const [turmaId, setTurmaId] = useState('')
  const [dataAula, setDataAula] = useState(new Date().toISOString().split('T')[0])
  
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

  // Cria um Set com IDs de alunos com matrícula ativa
  const alunosComMatriculaIds = useMemo(() => {
    return new Set(matriculasAtivas?.map(m => m.aluno_id) || [])
  }, [matriculasAtivas])

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
    alunosComMatricula.forEach(a => {
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
      console.error('❌ [FrequenciaPage] Tentativa de salvar sem tenant_id:', authUser)
      return
    }

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
      justificativa: statusMap[a.id] === 'justificada' ? (justificativaMap[a.id]?.trim() || null) : null,
    }))

    console.log('🚀 [FrequenciaPage] Salvando dados:', dados)

    try {
      await salvarFrequencias.mutateAsync(dados)
      toast.success('Frequência salva com sucesso!')
    } catch (err: any) {
      console.error('❌ [FrequenciaPage] Erro ao salvar:', err)
      toast.error(err.message || 'Erro ao salvar frequência')
    }
  }

  const alunosAtivos = useMemo(() => {
    return (alunos?.filter(a => a.status === 'ativo') || []).map(aluno => ({
      ...aluno,
      temMatricula: alunosComMatriculaIds.has(aluno.id),
    }))
  }, [alunos, alunosComMatriculaIds])

  const alunosComMatricula = alunosAtivos.filter(a => a.temMatricula)
  const alunosSemMatricula = alunosAtivos.filter(a => !a.temMatricula)

  const contagens = {
    presente: alunosComMatricula.filter(a => (statusMap[a.id] || 'presente') === 'presente').length,
    falta: alunosComMatricula.filter(a => statusMap[a.id] === 'falta').length,
    justificada: alunosComMatricula.filter(a => statusMap[a.id] === 'justificada').length,
  }

  if (isLoadingAlunos) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Frequência Escolar</h1>
          <p className="text-muted-foreground italic">Registro oficial de presença e faltas justificadas</p>
        </div>
        <div className="flex gap-2">
          {turmaId && (
            <Button
              variant="outline"
              onClick={marcarTodosPresentes}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Todos Presente
            </Button>
          )}
          {turmaId && (
            <Button
              onClick={handleSalvar}
              disabled={salvarFrequencias.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-lg px-6"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="turma" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Turma</Label>
          <Select onValueChange={setTurmaId} value={turmaId}>
            <SelectTrigger id="turma" className="h-12 text-base font-medium transition-all focus:ring-2 focus:ring-emerald-500/20">
              <SelectValue placeholder="Selecione a turma para carregar os alunos" />
            </SelectTrigger>
            <SelectContent>
              {turmas?.map((t) => (
                <SelectItem key={t.id} value={t.id} className="py-3 text-base">
                   <div className="font-bold">{t.nome}</div>
                   <div className="text-xs text-muted-foreground uppercase">{t.turno}</div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="data" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Data da Aula</Label>
          <Input 
            id="data" 
            type="date" 
            className="h-12 text-base font-medium transition-all focus:ring-2 focus:ring-emerald-500/20"
            value={dataAula} 
            onChange={(e) => setDataAula(e.target.value)} 
          />
        </div>
        <div className="space-y-2">
           <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Resumo do Dia</Label>
           <div className="grid grid-cols-3 gap-2">
             <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col items-center">
               <span className="text-xs font-bold text-emerald-600 uppercase">Pres.</span>
               <span className="text-lg font-black text-emerald-700">{contagens.presente}</span>
             </div>
             <div className="p-2 rounded-xl bg-red-50 border border-red-100 flex flex-col items-center">
               <span className="text-xs font-bold text-red-600 uppercase">Faltas</span>
               <span className="text-lg font-black text-red-700">{contagens.falta}</span>
             </div>
             <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 flex flex-col items-center">
               <span className="text-xs font-bold text-amber-600 uppercase">Just.</span>
               <span className="text-lg font-black text-amber-700">{contagens.justificada}</span>
             </div>
           </div>
        </div>
      </div>

      {turmaId && alunosSemMatricula.length > 0 && (
        <Card className="border-0 shadow-lg bg-red-50 ring-1 ring-red-200">
          <CardContent className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-red-800">
               <FileX className="h-6 w-6 shrink-0" />
               <div>
                 <p className="text-sm font-black uppercase tracking-tight">Alunos sem matrícula ativa ({alunosSemMatricula.length})</p>
                 <p className="text-xs font-medium font-serif italic">Estes alunos não estão disponíveis para registro de frequência.</p>
               </div>
            </div>
            <Button variant="ghost" className="text-red-700 hover:bg-red-100 font-bold text-xs uppercase underline" onClick={() => (window.location.href='/matriculas')}>Regularizar Todos</Button>
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
            ) : alunosComMatricula.length > 0 ? (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="w-[60px] text-center text-slate-400 font-black">#</TableHead>
                    <TableHead className="py-6 text-slate-800 font-black uppercase tracking-widest text-[10px]">Nome do Estudante</TableHead>
                    <TableHead className="w-[380px] text-right text-slate-800 font-black uppercase tracking-widest text-[10px] pr-8">Frequência e Justificativa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alunosComMatricula.map((aluno, index) => {
                    const status = statusMap[aluno.id] || 'presente'
                    const hasJustificativa = !!justificativaMap[aluno.id]
                    
                    return (
                      <TableRow key={aluno.id} className="group hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0 h-20">
                        <TableCell className="text-center">
                           <span className="text-slate-400 font-black text-sm">{String(index + 1).padStart(2, '0')}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition-colors">
                              {aluno.nome_completo}
                            </span>
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
                 <h3 className="text-xl font-bold text-slate-600">Nenhum aluno ativo nesta turma</h3>
                 <p className="text-slate-400 mt-2">Certifique-se de que os alunos possuem matrículas ativas para o ano letivo.</p>
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
