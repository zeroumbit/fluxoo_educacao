import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/AuthContext'
import { useSaudeTurmas } from '@/modules/professor/hooks'
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
  Plus, Search, Loader2, Users, Eye, TrendingUp, TrendingDown, AlertCircle, UserCheck
} from 'lucide-react'

export function ProfessorAlunosPage() {
  const { authUser } = useAuth()
  const navigate = useNavigate()
  const { data: saudeTurmas, isLoading } = useSaudeTurmas()
  const [busca, setBusca] = useState('')

  // TODO: Buscar alunos reais do Supabase (hook não existe ainda)
  const alunos = useMemo(() => [], [])

  const alunosFiltrados = useMemo(() => {
    return alunos.filter((aluno: any) =>
      aluno.nome?.toLowerCase().includes(busca.toLowerCase())
    )
  }, [alunos, busca])

  if (isLoading) {
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
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead className="text-center">Frequência</TableHead>
                <TableHead className="text-center">Média</TableHead>
                <TableHead className="text-center">Alertas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alunosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <UserCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">Seus alunos aparecerão aqui para você acompanhar o desempenho.</p>
                  </TableCell>
                </TableRow>
              ) : (
                alunosFiltrados.map((aluno: any) => {
                  const freq = aluno.frequencia || 0
                  const media = aluno.media || 0

                  return (
                    <TableRow key={aluno.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {aluno.nome?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{aluno.nome}</p>
                            <p className="text-xs text-slate-500">{aluno.email || 'Sem email'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{aluno.turma_nome || '-'}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
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
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={media >= 7 ? 'default' : media >= 5 ? 'secondary' : 'destructive'}
                        >
                          {media.toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {aluno.alertas > 0 ? (
                          <Badge variant="destructive">{aluno.alertas} alerta(s)</Badge>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
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
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfessorAlunosPage
