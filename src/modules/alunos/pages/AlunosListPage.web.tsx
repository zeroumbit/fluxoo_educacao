import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlunos, useExcluirAluno, useAtualizarAluno } from '../hooks'
import { useMatriculasAtivas } from '@/modules/academico/hooks'
import { useAuth } from '@/modules/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus, Search, Loader2, UserCircle, Eye, Trash2, Edit2,
  AlertCircle, FileX, Shield, Percent, Users, UserMinus,
  AlertTriangle, History, TrendingDown, CheckCircle2, Archive, RefreshCcw, FileUp, CloudUpload, Trash
} from 'lucide-react'
import { useImportacoesPendentes, useDeletarLoteImportacao } from '../hooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ModalAutorizacoesAluno } from '@/modules/autorizacoes/components/ModalAutorizacoesAluno'
import { ModalDescontoAluno } from '../components/ModalDescontoAluno'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BadgeGravidade } from '@/components/ui/BadgeGravidade'
import { AlertasProvider, useAlertas } from '../AlertasContext'
import type { RadarAlunoComStatus } from '../AlertasContext'
import { useRadarCompleto, useAlertasProfessor } from '../dashboard.hooks'
import { RadarEvasaoModal } from '../components/RadarEvasaoModal'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function AlunosListPageContent({ isProfessor = false }: { isProfessor?: boolean }) {
  const { authUser } = useAuth()
  const { data: alunos, isLoading } = useAlunos()
  const { data: matriculasAtivas } = useMatriculasAtivas()
  const [busca, setBusca] = useState('')
  const navigate = useNavigate()
  const excluirAluno = useExcluirAluno()
  const atualizarAluno = useAtualizarAluno()

  const { alertas, historicoAcoes } = useAlertas()
  const [selectedRadarAluno, setSelectedRadarAluno] = useState<RadarAlunoComStatus | null>(null)
  const [isRadarModalOpen, setIsRadarModalOpen] = useState(false)

  const [alunoParaExcluir, setAlunoParaExcluir] = useState<any | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [alunoAutorizacoes, setAlunoAutorizacoes] = useState<any | null>(null)
  const [alunoDesconto, setAlunoDesconto] = useState<any | null>(null)
  const [alunoParaDesativar, setAlunoParaDesativar] = useState<any | null>(null)
  const [showDesativarDialog, setShowDesativarDialog] = useState(false)
  const [confirmacaoDesativar, setConfirmacaoDesativar] = useState(false)

  const { data: countPendentes } = useImportacoesPendentes()
  const deletarLote = useDeletarLoteImportacao()

  // Cria um Map com IDs de alunos com matrícula ativa
  const alunosComMatriculaMap = useMemo(() => {
    const map = new Map<string, { temMatricula: boolean; anoLetivo?: number }>()
    matriculasAtivas?.forEach(m => {
      map.set(m.aluno_id, { temMatricula: true, anoLetivo: m.ano_letivo })
    })
    return map
  }, [matriculasAtivas])

  const alunosFiltrados = useMemo(() => {
    const list = (alunos as any[])?.filter((a) =>
      a.nome_completo.toLowerCase().includes(busca.toLowerCase())
    ).map((aluno) => {
      const respFinanceiro = aluno.aluno_responsavel?.find((v: any) => v.is_financeiro);
      const matriculaInfo = alunosComMatriculaMap.get(aluno.id)
      return {
        ...aluno,
        temMatricula: matriculaInfo?.temMatricula || false,
        anoLetivo: matriculaInfo?.anoLetivo,
        financeiroCpf: respFinanceiro?.responsaveis?.cpf || 'sem-financeiro',
        financeiroNome: respFinanceiro?.responsaveis?.nome || '—'
      }
    })

    return list?.sort((a, b) => {
       if (a.financeiroCpf === b.financeiroCpf) {
         return a.nome_completo.localeCompare(b.nome_completo);
       }
       return a.financeiroCpf.localeCompare(b.financeiroCpf);
    });
  }, [alunos, busca, alunosComMatriculaMap])

  const gruposMultiIrmaos = useMemo(() => {
    const grupos: Record<string, any[]> = {};
    alunosFiltrados?.forEach(a => {
      if (a.financeiroCpf !== 'sem-financeiro') {
        if (!grupos[a.financeiroCpf]) grupos[a.financeiroCpf] = [];
        grupos[a.financeiroCpf].push(a);
      }
    });

    return Object.entries(grupos)
      .filter(([_, lista]) => lista.length > 1)
      .map(([cpf, lista]) => ({
        cpf,
        responsavel: lista[0].financeiroNome,
        alunos: lista
      }));
  }, [alunosFiltrados])

  const handleExcluir = (aluno: any, e: React.MouseEvent) => {
    e.stopPropagation()
    if (aluno.status === 'ativo') {
      toast.error('Não é possível excluir um aluno ativo. Desative-o primeiro.', {
        description: 'Alunos ativos não podem ser removidos por segurança.',
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
      })
      return
    }
    setAlunoParaExcluir(aluno)
    setShowDeleteDialog(true)
  }

  const handleDesativar = (aluno: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setAlunoParaDesativar(aluno)
    setShowDesativarDialog(true)
    setConfirmacaoDesativar(false)
  }

  const confirmarDesativacao = async () => {
    if (!alunoParaDesativar || !confirmacaoDesativar) return
    try {
      await atualizarAluno.mutateAsync({ 
        id: alunoParaDesativar.id, 
        aluno: { status: 'inativo' } 
      })
      toast.success('Aluno desativado com sucesso!')
      setShowDesativarDialog(false)
      setAlunoParaDesativar(null)
      setConfirmacaoDesativar(false)
    } catch (_err: any) {
      toast.error('Erro ao desativar aluno')
    }
  }

  const confirmarExclusao = async () => {
    if (!alunoParaExcluir) return
    try {
      await excluirAluno.mutateAsync(alunoParaExcluir.id)
      toast.success('Aluno removido com sucesso.')
      setShowDeleteDialog(false)
      setAlunoParaExcluir(null)
    } catch (_err: any) {
      toast.error('Não foi possível excluir')
    }
  }

  const handleVerRadar = (alerta: RadarAlunoComStatus) => {
    setSelectedRadarAluno(alerta)
    setIsRadarModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gerenciamento de Alunos</h1>
          <p className="text-muted-foreground">Visualize e gerencie todos os estudantes da sua escola</p>
        </div>
        {/* REGRA DE NEGÓCIO: Professores NÃO podem adicionar alunos */}
        {!authUser?.isProfessor && (
          <div className="flex gap-2">
            <Button
               variant="outline"
               onClick={() => navigate('/alunos/importar')}
               className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold px-4 h-11"
            >
              <FileUp className="mr-2 h-4 w-4" /> Cadastro em Massa
            </Button>
            <Button
               onClick={() => navigate('/alunos/novo')}
               className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md font-bold px-6 h-11 border-0"
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar Aluno
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="alunos" className="space-y-6">
        <TabsList className="bg-slate-100/50 p-1 rounded-xl h-auto self-start">
          <TabsTrigger value="alunos" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 font-bold text-sm">
            <Users className="h-4 w-4 mr-2" /> Alunos
          </TabsTrigger>
          {isProfessor ? (
            <TabsTrigger value="radar" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 font-bold text-sm">
              <AlertTriangle className="h-4 w-4 mr-2" /> Alertas
            </TabsTrigger>
          ) : (
            <TabsTrigger value="radar" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 font-bold text-sm">
              <AlertTriangle className="h-4 w-4 mr-2" /> Radar de Evasão
            </TabsTrigger>
          )}
          <TabsTrigger value="historico" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 font-bold text-sm">
            <History className="h-4 w-4 mr-2" /> Histórico de Ações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alunos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center">
                       <Users className="h-6 w-6 text-slate-600" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total de Alunos</p>
                       <p className="text-2xl font-bold text-slate-900">{alunos?.length || 0}</p>
                    </div>
                 </div>
              </Card>

              <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                       <Shield className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/50">Matriculados</p>
                       <p className="text-2xl font-bold text-emerald-700">{alunosComMatriculaMap.size}</p>
                    </div>
                 </div>
              </Card>

              <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                       <FileX className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600/50">Sem Matrícula</p>
                       <p className="text-2xl font-bold text-amber-700">{(alunosFiltrados?.filter(a => !a.temMatricula).length || 0)}</p>
                    </div>
                 </div>
              </Card>

              <Card className="rounded-xl border border-rose-100 bg-rose-50/30 shadow-sm overflow-hidden p-6">
                 <div className="flex items-center gap-4 text-rose-600">
                    <div className="h-12 w-12 rounded-xl bg-rose-100 flex items-center justify-center">
                       <Users className="h-6 w-6" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600/50">Irmãos Detectados</p>
                       <p className="text-2xl font-bold">{gruposMultiIrmaos.length} Famílias</p>
                    </div>
                 </div>
              </Card>
          </div>

          {/* Banner de Tarefa Ativa (Staging Area) */}
          {!isProfessor && countPendentes && countPendentes > 0 ? (
            <div className="w-full bg-blue-50/60 border border-blue-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-all animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <CloudUpload className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-blue-900">Cadastro em Massa Pendente</h3>
                  <p className="text-xs text-blue-700">Você possui {countPendentes} famílias na área de preparação aguardando revisão.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-rose-600 hover:bg-rose-50 font-bold text-xs"
                  onClick={() => (deletarLote.mutate as any)()}
                  disabled={deletarLote.isPending}
                >
                  <Trash className="w-4 h-4 mr-1" /> Deletar Lote
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-blue-200 text-blue-700 hover:bg-blue-100 font-bold text-xs"
                  onClick={() => navigate('/alunos/importar')}
                >
                  Revisar Dados
                </Button>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border-0"
                  onClick={() => navigate('/alunos/importar')}
                >
                  Continuar Matrículas
                </Button>
              </div>
            </div>
          ) : null}

          <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="relative w-full max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                       placeholder="Buscar por nome ou CPF..."
                       className="pl-12 h-11 bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-500/20 rounded-xl font-medium"
                       value={busca}
                       onChange={(e) => setBusca(e.target.value)}
                    />
                 </div>
                 
                 {gruposMultiIrmaos.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                       <AlertCircle className="h-4 w-4 text-amber-600" />
                       <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                          {gruposMultiIrmaos.length} famílias detectadas
                       </p>
                    </div>
                 )}
              </div>

              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="py-4 font-bold text-slate-800 pl-8">Aluno</TableHead>
                    <TableHead className="font-bold text-slate-800">Responsável</TableHead>
                    <TableHead className="font-bold text-slate-800">Matrícula</TableHead>
                    <TableHead className="font-bold text-slate-800 text-center">Status</TableHead>
                    <TableHead className="py-4 font-bold text-slate-800 text-right pr-8">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alunosFiltrados?.map((aluno) => {
                    const temIrmao = gruposMultiIrmaos.some(g => g.cpf === aluno.financeiroCpf);
                    
                    return (
                      <TableRow 
                        key={aluno.id} 
                        className="group cursor-pointer hover:bg-zinc-50/50 transition-colors border-zinc-50"
                        onClick={() => navigate(`/alunos/${aluno.id}`)}
                      >
                        <TableCell className="py-5 pl-8">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 transition-transform overflow-hidden relative border border-slate-200">
                               {aluno.foto_url ? (
                                 <img src={aluno.foto_url} className="w-full h-full object-cover" />
                               ) : (
                                 <UserCircle className="h-6 w-6" />
                               )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-700">{aluno.nome_completo}</p>
                              <p className="text-[10px] font-medium text-slate-400">{aluno.cpf || '—'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                           <div>
                              <p className="font-bold text-slate-600 text-sm">{aluno.financeiroNome}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                 <p className="text-[10px] text-slate-400">{aluno.financeiroCpf}</p>
                                 {temIrmao && (
                                   <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[8px] font-bold border-0 rounded px-1.5 h-4">
                                      FAMÍLIA
                                   </Badge>
                                 )}
                              </div>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                              <div className={cn(
                                 "h-2 w-2 rounded-full",
                                 aluno.temMatricula ? "bg-emerald-500" : "bg-amber-400"
                              )} />
                              <p className={cn(
                                 "text-[10px] font-bold uppercase",
                                 aluno.temMatricula ? "text-emerald-700" : "text-amber-700"
                              )}>
                                 {aluno.temMatricula ? `Ativa ${aluno.anoLetivo || new Date().getFullYear()}` : 'Sem Matrícula'}
                              </p>
                           </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn(
                            "rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                            aluno.status === 'ativo' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"
                          )}>
                            {aluno.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-indigo-600 hover:bg-indigo-50"
                              onClick={() => setAlunoDesconto(aluno)}
                              title="Gerenciar Desconto"
                            >
                              <Percent className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:bg-slate-100"
                              onClick={() => setAlunoAutorizacoes(aluno)}
                              title="Gerenciar Autorizações"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                              onClick={() => navigate(`/alunos/${aluno.id}`)}
                              title="Ver Detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:bg-slate-100"
                              onClick={() => navigate(`/alunos/${aluno.id}?edit=true`)}
                              title="Editar"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            {aluno.status === 'ativo' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                                onClick={(e) => handleDesativar(aluno, e)}
                                title="Desativar Aluno"
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-500 hover:bg-rose-50"
                              onClick={(e) => handleExcluir(aluno, e)}
                              title="Excluir Aluno"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="radar" className="space-y-6">
           <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
              <CardContent className="p-0">
                 <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div>
                       <CardTitle className="text-2xl font-black text-rose-950 tracking-tight">
                          {isProfessor ? 'Alertas do Dia-a-Dia' : 'Radar de Evasão'}
                       </CardTitle>
                       <p className="text-zinc-500 text-sm font-medium">
                          {isProfessor
                            ? 'Alunos com faltas consecutivas nas suas turmas'
                            : 'Alunos com sinais de abandono escolar detectados'}
                       </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                       <AlertTriangle className="h-6 w-6 text-rose-600" />
                    </div>
                 </div>
                 <Table>
                    <TableHeader className="bg-slate-50">
                       <TableRow>
                          <TableHead className="pl-8 py-4 font-bold text-slate-800">Aluno</TableHead>
                          <TableHead className="font-bold text-slate-800">Gravidade</TableHead>
                          <TableHead className="font-bold text-slate-800">Faltas</TableHead>
                          {!isProfessor && (
                             <TableHead className="font-bold text-slate-800">Financeiro</TableHead>
                          )}
                          <TableHead className="font-bold text-slate-800 text-right pr-8 text-[12px]">Status</TableHead>
                          <TableHead className="pr-8 text-right font-bold text-slate-800">Ações</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {alertas.length === 0 ? (
                          <TableRow>
                             <TableCell colSpan={isProfessor ? 5 : 6} className="py-12 text-center text-zinc-400 italic">
                                {isProfessor
                                   ? 'Nenhum aluno com faltas nas suas turmas.'
                                   : 'Nenhum risco de evasão identificado no momento.'}
                             </TableCell>
                          </TableRow>
                       ) : alertas.map((alerta) => (
                          <TableRow key={alerta.aluno_id}>
                             <TableCell className="pl-8 font-bold text-slate-700">{alerta.nome_completo}</TableCell>
                             <TableCell><BadgeGravidade gravidade={alerta.gravidade} /></TableCell>
                             <TableCell className="text-sm font-medium">{alerta.faltas_consecutivas} faltas</TableCell>
                             {!isProfessor && (
                                <TableCell className="text-sm font-medium">{alerta.cobrancas_atrasadas} em atraso</TableCell>
                             )}
                             <TableCell className="text-right pr-8">
                                <Badge className={cn(
                                   "rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase border-0",
                                   alerta.status === 'ativo' ? "bg-rose-500 text-white" : "bg-zinc-100 text-zinc-400"
                                )}>
                                   {alerta.status}
                                </Badge>
                             </TableCell>
                             <TableCell className="text-right pr-8">
                                <div className="flex items-center justify-end gap-2">
                                   <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                      onClick={() => handleVerRadar(alerta)}
                                      title="Ver Detalhes"
                                   >
                                      <Eye className="h-4 w-4" />
                                   </Button>
                                </div>
                             </TableCell>
                          </TableRow>
                       ))}
                    </TableBody>
                 </Table>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-6">
           <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
              <CardContent className="p-0">
                 <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <CardTitle className="text-2xl font-black text-indigo-950 tracking-tight">Histórico de Ações</CardTitle>
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                       <History className="h-6 w-6 text-indigo-600" />
                    </div>
                 </div>
                 <div className="divide-y divide-zinc-100">
                    {historicoAcoes.length === 0 ? (
                       <div className="py-12 text-center text-zinc-400 italic">Nenhuma ação registrada ainda.</div>
                    ) : historicoAcoes.map((h) => (
                       <div key={h.id} className="p-6 hover:bg-zinc-50/50 transition-colors flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                {h.acao === 'tratado' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : h.acao === 'arquivado' ? <Archive className="h-5 w-5 text-amber-500" /> : <RefreshCcw className="h-5 w-5 text-blue-500" />}
                             </div>
                             <div>
                                <h4 className="font-bold text-zinc-900">{h.alunoNome}</h4>
                                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                                   {h.alertaTitulo} • {format(new Date(h.data), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                </p>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="text-right hidden md:block">
                                <p className="text-xs font-bold text-zinc-600">{h.usuario}</p>
                                <Badge variant="outline" className="text-[9px] font-black uppercase px-2 py-0 border-zinc-200 text-zinc-400">{h.acao}</Badge>
                             </div>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                onClick={() => {
                                  // Encontra o alerta correspondente ou cria um temp
                                  const alertaRef = alertas.find(a => a.aluno_id === h.alertaId);
                                  if (alertaRef) handleVerRadar(alertaRef);
                                }}
                                title="Visualizar Detalhes"
                             >
                                <Eye className="h-4 w-4" />
                             </Button>
                          </div>
                       </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>

      {/* Modais Originais */}
      <ModalDescontoAluno 
        open={!!alunoDesconto} 
        aluno={alunoDesconto} 
        onClose={() => setAlunoDesconto(null)} 
      />

      <ModalAutorizacoesAluno 
        open={!!alunoAutorizacoes} 
        onClose={() => setAlunoAutorizacoes(null)} 
        alunoId={alunoAutorizacoes?.id} 
      />

      {/* Dialog de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-xl border-0 shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 pb-2">
            <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center mb-4">
               <AlertCircle className="h-6 w-6 text-rose-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">Confirmar Exclusão</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium pt-2 text-sm">
              Você tem certeza que deseja excluir <strong>{alunoParaExcluir?.nome_completo}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-600 font-bold mb-3">Antes de excluir, considere:</p>
              <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                <li>O sistema removerá automaticamente os vínculos com responsáveis</li>
                <li>Matrículas e cobranças ativas ainda impedem a exclusão por segurança</li>
                <li>Todo o histórico financeiro e acadêmico será perdido</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 mt-4 flex gap-3">
            <Button
               variant="ghost"
               className="flex-1 rounded-xl h-11 font-bold text-slate-600"
               onClick={() => setShowDeleteDialog(false)}
            >
               Manter Aluno
            </Button>
            <Button
               className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 h-11 font-bold shadow-md text-white"
               onClick={confirmarExclusao}
            >
               Excluir Definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Desativação */}
      <Dialog open={showDesativarDialog} onOpenChange={(open) => {
        setShowDesativarDialog(open)
        if (!open) {
          setAlunoParaDesativar(null)
          setConfirmacaoDesativar(false)
        }
      }}>
        <DialogContent className="rounded-xl border-0 shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 pb-2">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
               <UserMinus className="h-6 w-6 text-amber-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
              {confirmacaoDesativar ? 'Segunda Confirmação' : 'Confirmar Desativação'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="px-6 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-700 font-bold mb-2">Atenção - Ação Importante</p>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  <li>O aluno não poderá mais acessar o portal da família</li>
                  <li>A matrícula será considerada inativa</li>
                  <li>O histórico será mantido para consulta</li>
                </ul>
              </div>
          </div>
          
          <DialogFooter className="p-6 bg-slate-50 mt-4 flex gap-3">
            {!confirmacaoDesativar ? (
              <>
                <Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold shadow-none border-0" onClick={() => setShowDesativarDialog(false)}>Cancelar</Button>
                <Button className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 h-11 font-bold shadow-md text-white border-0" onClick={() => setConfirmacaoDesativar(true)}>Continuar</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold shadow-none border-0" onClick={() => setConfirmacaoDesativar(false)}>Voltar</Button>
                <Button className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 h-11 font-bold shadow-md text-white border-0" onClick={confirmarDesativacao} disabled={atualizarAluno.isPending}>
                  {atualizarAluno.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirmar Desativação'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Radar (Eye action) */}
      <RadarEvasaoModal
        aluno={selectedRadarAluno}
        isOpen={isRadarModalOpen}
        onClose={() => setIsRadarModalOpen(false)}
        isProfessor={isProfessor}
      />
    </div>
  )
}

export function AlunosListPageWeb() {
  const { authUser } = useAuth()
  const { data: radarData } = useRadarCompleto()
  const { data: alertasProfessorData } = useAlertasProfessor()

  const isProfessor = authUser?.isProfessor || false
  const alertasData = isProfessor ? (alertasProfessorData || []) : (radarData || [])

  return (
    <AlertasProvider radarData={alertasData}>
      <AlunosListPageContent isProfessor={isProfessor} />
    </AlertasProvider>
  )
}
