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
import { Plus, Search, Loader2, UserCircle, Eye, Trash2, Edit2, AlertCircle, FileX } from 'lucide-react'
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

export function AlunosListPage() {
  const { data: alunos, isLoading } = useAlunos()
  const { data: matriculasAtivas } = useMatriculasAtivas()
  const [busca, setBusca] = useState('')
  const navigate = useNavigate()
  const excluirAluno = useExcluirAluno()

  const [alunoParaExcluir, setAlunoParaExcluir] = useState<any | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Cria um Set com IDs de alunos com matrícula ativa para consulta rápida
  const alunosComMatriculaIds = useMemo(() => {
    return new Set(matriculasAtivas?.map(m => m.aluno_id) || [])
  }, [matriculasAtivas])

  const alunosFiltrados = useMemo(() => {
    return (alunos as any[])?.filter((a) =>
      a.nome_completo.toLowerCase().includes(busca.toLowerCase())
    ).map((aluno) => ({
      ...aluno,
      temMatricula: alunosComMatriculaIds.has(aluno.id),
    }))
  }, [alunos, busca, alunosComMatriculaIds])

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
      toast.success('Aluno removido com sucesso!')
    } catch (err: any) {
      toast.error('Erro ao remover aluno: ' + err.message)
    } finally {
      setShowDeleteDialog(false)
      setAlunoParaExcluir(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alunos</h1>
          <p className="text-muted-foreground">
            {alunos?.length || 0} aluno(s) cadastrado(s)
            {alunosSemMatriculaCount > 0 && (
              <span className="text-amber-600 font-medium ml-2">
                · {alunosSemMatriculaCount} sem matrícula
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={() => navigate('/alunos/novo')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-xl"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Aluno
        </Button>
      </div>

      {/* Alerta de alunos sem matrícula */}
      {alunosSemMatriculaCount > 0 && (
        <Card className="border-0 shadow-md bg-amber-50 ring-1 ring-amber-200">
          <CardContent className="py-4 flex items-start gap-4">
            <FileX className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">
                {alunosSemMatriculaCount} aluno(s) sem matrícula ativa
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Estes alunos estão cadastrados mas não podem receber frequência. Regularize as matrículas na tela de Matrícula.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar aluno por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10 h-11 rounded-xl"
        />
      </div>

      {/* Tabela */}
      <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Data Nasc.</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alunosFiltrados?.map((aluno) => (
                <TableRow
                  key={aluno.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => navigate(`/alunos/${aluno.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center border border-indigo-100/50">
                        <UserCircle className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900 flex items-center gap-2 flex-wrap">
                          {aluno.nome_completo}
                          {aluno.filiais?.nome_unidade && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-zinc-50 border-zinc-200 text-zinc-600 font-medium">
                              {aluno.filiais.nome_unidade}
                            </Badge>
                          )}
                          {!aluno.temMatricula && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-amber-50 border-amber-200 text-amber-700 font-medium">
                              <FileX className="h-3 w-3 mr-1" />
                              Sem Matrícula
                            </Badge>
                          )}
                        </p>
                        {aluno.nome_social && (
                          <p className="text-xs text-muted-foreground font-medium">{aluno.nome_social}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-600 font-medium">{aluno.data_nascimento || '—'}</TableCell>
                  <TableCell className="text-zinc-600 font-medium">{aluno.cpf || '—'}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "rounded-lg px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider shadow-sm",
                        aluno.status === 'ativo'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                      )}
                    >
                      {aluno.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        onClick={(e) => { e.stopPropagation(); navigate(`/alunos/${aluno.id}`); }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        onClick={(e) => { e.stopPropagation(); navigate(`/alunos/${aluno.id}?edit=true`); }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-zinc-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        onClick={(e) => handleExcluir(aluno, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {(!alunosFiltrados || alunosFiltrados.length === 0) && (
            <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
              <div className="h-20 w-20 rounded-full bg-zinc-50 flex items-center justify-center mb-4">
                <Search className="h-10 w-10 text-zinc-200" />
              </div>
              <p className="font-medium text-zinc-500 text-lg">Nenhum aluno encontrado.</p>
              <p className="text-sm">Tente ajustar sua busca ou cadastrar um novo aluno.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Você tem certeza?</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Esta ação removerá permanentemente o aluno <strong>{alunoParaExcluir?.nome_completo}</strong> e todos os seus vínculos do sistema. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)} className="rounded-xl border-zinc-200">Cancelar</Button>
            <Button 
              onClick={confirmarExclusao}
              variant="destructive"
              className="bg-destructive hover:bg-destructive/90 text-white rounded-xl shadow-lg shadow-destructive/20"
            >
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
