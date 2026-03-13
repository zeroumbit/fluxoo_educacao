import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlunos, useExcluirAluno } from '../hooks'
import { useMatriculasAtivas } from '@/modules/academico/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Search, Loader2, UserCircle, Eye, Trash2, Edit2, AlertCircle, FileX, Shield, Percent, Users } from 'lucide-react'
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

export function AlunosListPageWeb() {
  const { data: alunos, isLoading } = useAlunos()
  const { data: matriculasAtivas } = useMatriculasAtivas()
  const [busca, setBusca] = useState('')
  const navigate = useNavigate()
  const excluirAluno = useExcluirAluno()

  const [alunoParaExcluir, setAlunoParaExcluir] = useState<any | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [alunoAutorizacoes, setAlunoAutorizacoes] = useState<any | null>(null)
  const [alunoDesconto, setAlunoDesconto] = useState<any | null>(null)

  // Cria um Map com IDs de alunos com matrícula ativa para consulta rápida (inclui ano_letivo)
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
      // Encontrar o CPF do responsável financeiro para agrupamento
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

    // Ordenar para manter alunos com mesmo responsável juntos
    return list?.sort((a, b) => {
       if (a.financeiroCpf === b.financeiroCpf) {
         return a.nome_completo.localeCompare(b.nome_completo);
       }
       return a.financeiroCpf.localeCompare(b.financeiroCpf);
    });
  }, [alunos, busca, alunosComMatriculaMap])

  // Detectar múltiplos alunos por responsável
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

  const alunosSemMatriculaCount = alunosFiltrados?.filter(a => !a.temMatricula).length || 0

  const handleExcluir = (aluno: any, e: React.MouseEvent) => {
    e.stopPropagation()
    if (aluno.status === 'ativo') {
      toast.error('Não é possível excluir um aluno ativo. Desative-o primeiro ou verifique a normalização.', {
        description: 'Alunos ativos não podem ser removidos por segurança.',
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
      })
      return
    }
    setAlunoParaExcluir(aluno)
    setShowDeleteDialog(true)
  }

  const confirmarExclusao = async () => {
    if (!alunoParaExcluir) return
    try {
      await excluirAluno.mutateAsync(alunoParaExcluir.id)
      toast.success('Aluno removido com sucesso.')
      setShowDeleteDialog(false)
      setAlunoParaExcluir(null)
    } catch (err: any) {
      toast.error('Erro ao excluir aluno: ' + err.message)
    }
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
      {/* Cards de Resumo */}
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
                   <p className="text-2xl font-bold text-amber-700">{alunosSemMatriculaCount}</p>
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gerenciamento de Alunos</h1>
          <p className="text-muted-foreground">Visualize e gerencie todos os estudantes da sua escola</p>
        </div>
        <Button 
           onClick={() => navigate('/alunos/novo')}
           className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md font-bold px-6 h-11"
        >
          <Plus className="mr-2 h-4 w-4" /> Adicionar Aluno
        </Button>
      </div>

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
             
             {/* Filtros Ativos / Alertas Rápidos */}
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
                <TableHead className="text-right py-4 font-bold text-slate-800 pr-8">Ações</TableHead>
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
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform overflow-hidden relative border border-slate-200">
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

          {alunosFiltrados?.length === 0 && (
             <div className="py-24 text-center">
                <Users className="h-16 w-16 text-zinc-100 mx-auto mb-4" />
                <p className="text-xl font-bold text-zinc-300">Nenhum aluno encontrado.</p>
                <p className="text-zinc-400 mt-1">Refine sua busca ou cadastre um novo aluno.</p>
             </div>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
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
              <p className="text-sm text-slate-600 font-bold mb-3">Esta ação irá:</p>
              <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside">
                <li>Excluir cobranças do aluno (se houver)</li>
                <li>Excluir matrículas (se houver)</li>
                <li>Remover vínculos com responsáveis (se houver)</li>
                <li>Aí sim excluir o aluno</li>
              </ol>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Esta ação é definitiva e apagará todo o histórico acadêmico e financeiro do aluno.
              <strong> Recomenda-se apenas desativar o cadastro</strong> para manter os registros históricos.
            </p>
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
               className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 h-11 font-bold shadow-md"
               onClick={confirmarExclusao}
            >
               Excluir Definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
