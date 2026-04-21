import { AdaptiveView } from '@/components/adaptive/AdaptiveView'
import { ProfessorTurmasPageMobile } from './ProfessorTurmasPage.mobile'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/AuthContext'
import { useSaudeTurmas } from '@/modules/professor/hooks'
import { useTurmas } from '@/modules/turmas/hooks'
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

export function ProfessorTurmasPage() {
  const { authUser } = useAuth()
  const navigate = useNavigate()
  const { data: saudeTurmas, isLoading: isLoadingSaude } = useSaudeTurmas()
  const { data: minhasTurmas, isLoading: isLoadingTurmas } = useTurmas()
  const [busca, setBusca] = useState('')

  const turmasUnicas = useMemo(() => {
    const map = new Map()

    // Primeiro adiciona todas as turmas vinculadas independentemente de terem dados
    if (minhasTurmas) {
      minhasTurmas.forEach((turma: any) => {
        map.set(turma.id, {
          turma_id: turma.id,
          turma_nome: turma.nome,
          total_alunos: 0,
          percentual_presenca: 0,
          media_geral: 0,
        })
      })
    }

    // Depois, sobrepõe com os dados de saúde (frequência e notas) quando existirem
    if (saudeTurmas) {
      saudeTurmas.forEach((turma: any) => {
        if (map.has(turma.turma_id)) {
          const t = map.get(turma.turma_id)
          t.total_alunos = turma.total_alunos || 0
          t.percentual_presenca = turma.percentual_presenca || 0
          t.media_geral = turma.media_geral || 0
        } else {
          map.set(turma.turma_id, {
            turma_id: turma.turma_id,
            turma_nome: turma.turma_nome,
            total_alunos: turma.total_alunos || 0,
            percentual_presenca: turma.percentual_presenca || 0,
            media_geral: turma.media_geral || 0,
          })
        }
      })
    }
    
    return Array.from(map.values()).sort((a, b) => a.turma_nome.localeCompare(b.turma_nome))
  }, [minhasTurmas, saudeTurmas])

  const turmasFiltradas = useMemo(() => {
    return turmasUnicas.filter((turma: any) =>
      turma.turma_nome.toLowerCase().includes(busca.toLowerCase())
    )
  }, [turmasUnicas, busca])

  const totalAlunos = turmasUnicas.reduce((sum: number, t: any) => sum + t.total_alunos, 0)
  const turmasComMetricas = turmasUnicas.filter((t: any) => t.total_alunos > 0)
  const mediaPresenca = turmasComMetricas.length > 0
    ? turmasComMetricas.reduce((sum: number, t: any) => sum + t.percentual_presenca, 0) / turmasComMetricas.length
    : 0

  if (isLoadingSaude || isLoadingTurmas) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    )
  }

  // Empty state quando o professor não está vinculado a nenhuma turma
  if (turmasUnicas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
          <School className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Suas turmas aparecerão aqui</h3>
        <p className="text-sm text-slate-400 text-center max-w-sm">
          Professor, assim que a gestão escolar vincular você a uma turma, ela aparecerá nesta página.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pt-6 pb-0">
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
          <CardHeader className="pt-6 pb-0">
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
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-8">Turma</TableHead>
              <TableHead className="text-center">Alunos</TableHead>
              <TableHead className="text-center">Frequência</TableHead>
              <TableHead className="text-center">Média</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right pr-8">Ações</TableHead>
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
                const temFreq = freq > 0

                return (
                  <TableRow key={turma.turma_id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <School className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{turma.turma_nome}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <span className="text-sm font-medium">{turma.total_alunos}</span>
                    </TableCell>
                    <TableCell className="text-center py-4">
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
                    <TableCell className="text-center py-4">
                      {turma.media_geral > 0 ? (
                        <span className="text-sm font-medium">{turma.media_geral.toFixed(1)}</span>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      {temFreq ? (
                        freq >= 75 ? (
                          <Badge className="bg-emerald-600">Boa</Badge>
                        ) : freq >= 50 ? (
                          <Badge variant="secondary">Regular</Badge>
                        ) : (
                          <Badge variant="destructive">Crítica</Badge>
                        )
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-8 py-4">
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
      </div>
    </div>
  )
}

function ProfessorTurmasPageWeb() {
  return <ProfessorTurmasPage />
}

export function ProfessorTurmasPageAdapter() {
  return (
    <AdaptiveView
      web={<ProfessorTurmasPageWeb />}
      mobile={<ProfessorTurmasPageMobile />}
    />
  )
}

export default ProfessorTurmasPage
