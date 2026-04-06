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
  Search, Loader2, Users, Eye, School, TrendingUp, TrendingDown, Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function ProfessorTurmasPage() {
  const { authUser } = useAuth()
  const navigate = useNavigate()
  const { data: saudeTurmas, isLoading } = useSaudeTurmas()
  const [busca, setBusca] = useState('')

  const turmasUnicas = useMemo(() => {
    if (!saudeTurmas) return []
    const map = new Map()
    saudeTurmas.forEach((turma: any) => {
      if (!map.has(turma.turma_id)) {
        map.set(turma.turma_id, {
          turma_id: turma.turma_id,
          turma_nome: turma.turma_nome,
          total_alunos: turma.total_alunos || 0,
          percentual_presenca: turma.percentual_presenca || 0,
          media_geral: turma.media_geral || 0,
        })
      }
    })
    return Array.from(map.values())
  }, [saudeTurmas])

  const turmasFiltradas = useMemo(() => {
    return turmasUnicas.filter((turma: any) =>
      turma.turma_nome.toLowerCase().includes(busca.toLowerCase())
    )
  }, [turmasUnicas, busca])

  const totalAlunos = turmasUnicas.reduce((sum: number, t: any) => sum + t.total_alunos, 0)
  const mediaPresenca = turmasUnicas.length > 0
    ? turmasUnicas.reduce((sum: number, t: any) => sum + t.percentual_presenca, 0) / turmasUnicas.length
    : 0
  const mediaGeral = turmasUnicas.length > 0
    ? turmasUnicas.reduce((sum: number, t: any) => sum + t.media_geral, 0) / turmasUnicas.length
    : 0

  const temDadosReais = turmasUnicas.length > 0 && turmasUnicas.some((t: any) => t.total_alunos > 0)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    )
  }

  // Empty state quando não há turmas
  if (!temDadosReais) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
          <School className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Suas turmas aparecerão aqui</h3>
        <p className="text-sm text-slate-400 text-center max-w-sm">
          Professor, assim que suas turmas forem cadastradas pela escola, você poderá visualizar todos os dados de alunos, frequência e médias nesta página.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total de Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{totalAlunos}</div>
            <p className="text-xs text-slate-400 mt-1">{turmasUnicas.length} turmas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Frequência Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {mediaPresenca > 0 ? `${mediaPresenca.toFixed(1)}%` : '—'}
            </div>
            {mediaPresenca > 0 && (
              <div className="flex items-center gap-1 mt-1">
                {mediaPresenca >= 75 ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600">Acima da meta</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-red-500" />
                    <span className="text-xs text-red-600">Abaixo da meta</span>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Média Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {mediaGeral > 0 ? mediaGeral.toFixed(1) : '—'}
            </div>
            {mediaGeral > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                {mediaGeral >= 7 ? 'Excelente' : mediaGeral >= 5 ? 'Regular' : 'Atenção'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar turma..."
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
                <TableHead>Turma</TableHead>
                <TableHead className="text-center">Alunos</TableHead>
                <TableHead className="text-center">Frequência</TableHead>
                <TableHead className="text-center">Média</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {turmasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Search className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">Nenhuma turma encontrada para "{busca}"</p>
                  </TableCell>
                </TableRow>
              ) : (
                turmasFiltradas.map((turma: any) => {
                  const freq = turma.percentual_presenca
                  const media = turma.media_geral
                  const temFreq = freq > 0
                  const temMedia = media > 0

                  return (
                    <TableRow key={turma.turma_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <School className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{turma.turma_nome}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium">{turma.total_alunos}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {temFreq ? (
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
                            <span className="text-sm font-medium">{freq.toFixed(1)}%</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {temMedia ? (
                          <Badge
                            variant={media >= 7 ? 'default' : media >= 5 ? 'secondary' : 'destructive'}
                          >
                            {media.toFixed(1)}
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {temFreq && temMedia ? (
                          freq >= 75 && media >= 7 ? (
                            <Badge className="bg-emerald-600">Excelente</Badge>
                          ) : freq >= 50 && media >= 5 ? (
                            <Badge variant="secondary">Regular</Badge>
                          ) : (
                            <Badge variant="destructive">Crítico</Badge>
                          )
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/professores/turmas/${turma.turma_id}`)}
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

export default ProfessorTurmasPage
