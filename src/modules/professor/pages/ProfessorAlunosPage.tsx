import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/AuthContext'
import { useSaudeTurmas, useAlunosProfessor } from '@/modules/professor/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search, Loader2, UserCheck, Eye
} from 'lucide-react'

export function ProfessorAlunosPage() {
  const { authUser } = useAuth()
  const navigate = useNavigate()
  const { data: _saudeTurmas, isLoading: loadingSaude } = useSaudeTurmas()
  const { data: alunos = [], isLoading: loadingAlunos } = useAlunosProfessor()
  const [busca, setBusca] = useState('')

  const alunosFiltrados = useMemo(() => {
    return alunos.filter((aluno: any) =>
      aluno.nome?.toLowerCase().includes(busca.toLowerCase())
    )
  }, [alunos, busca])

  if (loadingSaude || loadingAlunos) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Busca */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar aluno..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-8">Aluno</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead className="text-center">Frequência</TableHead>
              <TableHead className="text-right pr-8">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alunosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  <UserCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">Seus alunos aparecerão aqui.</p>
                </TableCell>
              </TableRow>
            ) : (
              alunosFiltrados.map((aluno: any) => {
                const freq = aluno.frequencia || 0

                return (
                  <TableRow key={aluno.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {aluno.nome?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{aluno.nome}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline">{aluno.turma_nome || '-'}</Badge>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      {freq > 0 ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                freq >= 75
                                  ? 'bg-emerald-500'
                                  : freq >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${freq}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{freq}%</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-8 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/professores/alunos/${aluno.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ProfessorAlunosPage
