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

  // Cria um Set com IDs de alunos com matrícula ativa para consulta rápida
  const alunosComMatriculaIds = useMemo(() => {
    return new Set(matriculasAtivas?.map(m => m.aluno_id) || [])
  }, [matriculasAtivas])

  const alunosFiltrados = useMemo(() => {
    const list = (alunos as any[])?.filter((a) =>
      a.nome_completo.toLowerCase().includes(busca.toLowerCase())
    ).map((aluno) => {
      // Encontrar o CPF do responsável financeiro para agrupamento
      const respFinanceiro = aluno.aluno_responsavel?.find((v: any) => v.is_financeiro);
      return {
        ...aluno,
        temMatricula: alunosComMatriculaIds.has(aluno.id),
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
  }, [alunos, busca, alunosComMatriculaIds])

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
          <Card className="rounded-[2.5rem] border-0 bg-white shadow-sm overflow-hidden p-6 ring-1 ring-zinc-50">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                   <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total de Alunos</p>
                   <p className="text-2xl font-black text-zinc-900">{alunos?.length || 0}</p>
                </div>
             </div>
          </Card>

          <Card className="rounded-[2.5rem] border-0 bg-white shadow-sm overflow-hidden p-6 ring-1 ring-zinc-50">
             <div className="flex items-center gap-4 text-emerald-600">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                   <Shield className="h-6 w-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/50">Matriculados</p>
                   <p className="text-2xl font-black">{alunosComMatriculaIds.size}</p>
                </div>
             </div>
          </Card>

          <Card className="rounded-[2.5rem] border-0 bg-white shadow-sm overflow-hidden p-6 ring-1 ring-zinc-50">
             <div className="flex items-center gap-4 text-amber-600">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                   <FileX className="h-6 w-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/50">Sem Matrícula</p>
                   <p className="text-2xl font-black">{alunosSemMatriculaCount}</p>
                </div>
             </div>
          </Card>

          <Card className="rounded-[2.5rem] border-0 bg-rose-50/50 shadow-sm overflow-hidden p-6 ring-1 ring-rose-100">
             <div className="flex items-center gap-4 text-rose-600">
                <div className="h-12 w-12 rounded-2xl bg-rose-100 flex items-center justify-center">
                   <Users className="h-6 w-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-rose-600/50">Irmãos Detectados</p>
                   <p className="text-2xl font-black">{gruposMultiIrmaos.length} Famílias</p>
                </div>
             </div>
          </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Gerenciamento de Alunos</h1>
          <p className="text-zinc-500 font-medium">Visualize e gerencie todos os estudantes da sua escola</p>
        </div>
        <Button 
           onClick={() => navigate('/alunos/novo')}
           className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6 rounded-2xl shadow-xl shadow-indigo-100 font-bold transition-all hover:-translate-y-0.5"
        >
          <Plus className="mr-2 h-5 w-5" /> Adicionar Aluno
        </Button>
      </div>

      <Card className="border border-zinc-100 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="p-6 border-b border-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="relative w-full max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                   placeholder="Buscar por nome ou CPF..."
                   className="pl-12 h-12 bg-zinc-50/50 border-0 focus-visible:ring-2 focus-visible:ring-indigo-500/20 rounded-2xl font-medium"
                   value={busca}
                   onChange={(e) => setBusca(e.target.value)}
                />
             </div>
             
             {/* Filtros Ativos / Alertas Rápidos */}
             {gruposMultiIrmaos.length > 0 && (
               <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                     {gruposMultiIrmaos.length} famílias com múltiplos alunos detectadas
                  </p>
               </div>
             )}
          </div>

          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 font-black uppercase tracking-widest text-[10px] text-zinc-400 pl-8">Aluno</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-zinc-400">Responsável / Família</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-zinc-400">Matrícula</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-zinc-400 text-center">Status</TableHead>
                <TableHead className="text-right py-4 font-black uppercase tracking-widest text-[10px] text-zinc-400 pr-8">Ferramentas</TableHead>
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
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:scale-105 transition-transform overflow-hidden relative border border-zinc-200 shadow-sm">
                           {aluno.foto_url ? (
                             <img src={aluno.foto_url} className="w-full h-full object-cover" />
                           ) : (
                             <UserCircle className="h-8 w-8" />
                           )}
                           {aluno.desconto_valor && (
                             <div className="absolute top-0 right-0 bg-rose-500 text-white p-1 rounded-bl-lg flex items-center justify-center" title="Aluno com Desconto">
                                <Percent className="h-2 w-2" />
                             </div>
                           )}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-800 text-base">{aluno.nome_completo}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">{aluno.cpf || 'CPF não cadastrado'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div>
                          <p className="font-bold text-zinc-700 text-sm">{aluno.financeiroNome}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{aluno.financeiroCpf}</p>
                             {temIrmao && (
                               <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[8px] font-black border-0 rounded px-1.5 leading-none">
                                  MULTIFAMILIA
                               </Badge>
                             )}
                          </div>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                          <div className={cn(
                             "h-2 w-2 rounded-full",
                             aluno.temMatricula ? "bg-emerald-500" : "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                          )} />
                          <p className={cn(
                             "text-[10px] font-black uppercase tracking-tighter",
                             aluno.temMatricula ? "text-emerald-700" : "text-amber-700"
                          )}>
                             {aluno.temMatricula ? 'Ativa 2024' : 'Sem Matrícula'}
                          </p>
                       </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "rounded-xl px-4 py-1.5 text-[10px] font-black uppercase border-0 tracking-widest shadow-none",
                        aluno.status === 'ativo' ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-400"
                      )}>
                        {aluno.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-indigo-500 hover:bg-indigo-50 rounded-xl"
                          onClick={() => setAlunoDesconto(aluno)}
                          title="Gerenciar Desconto"
                        >
                          <Percent className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-zinc-400 hover:bg-zinc-100 rounded-xl"
                          onClick={() => setAlunoAutorizacoes(aluno)}
                          title="Gerenciar Autorizações"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-zinc-400 hover:bg-zinc-100 rounded-xl"
                          onClick={() => navigate(`/alunos/${aluno.id}`)}
                          title="Ver Detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-rose-500 hover:bg-rose-50 rounded-xl"
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
                <p className="text-xl font-black text-zinc-300">Nenhum aluno encontrado.</p>
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
        isOpen={!!alunoAutorizacoes} 
        onClose={() => setAlunoAutorizacoes(null)} 
        studentId={alunoAutorizacoes?.id} 
      />

      {/* Dialog de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
               <AlertCircle className="h-7 w-7 text-rose-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">Confirmar Exclusão</DialogTitle>
            <DialogDescription className="text-zinc-500 font-medium pt-2">
              Você tem certeza que deseja excluir <strong>{alunoParaExcluir?.nome_completo}</strong>? 
              <br/><br/>
              Esta ação é definitiva e apagará todo o histórico acadêmico e financeiro do aluno. 
              <strong> Recomenda-se apenas desativar o cadastro</strong> para manter os registros históricos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-8 flex gap-3">
            <Button 
               variant="ghost" 
               className="flex-1 rounded-2xl h-12 font-bold" 
               onClick={() => setShowDeleteDialog(false)}
            >
               Manter Aluno
            </Button>
            <Button 
               className="flex-1 rounded-2xl bg-rose-600 hover:bg-rose-700 h-12 font-bold shadow-xl shadow-rose-100" 
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
