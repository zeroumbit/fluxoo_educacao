import { useState, useMemo } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2, GraduationCap, Search, TrendingUp, TrendingDown, Users, Save
} from 'lucide-react'

export function ProfessorNotasPage() {
  const { authUser } = useAuth()
  const { data: saudeTurmas, isLoading } = useSaudeTurmas()
  const [selectedTurma, setSelectedTurma] = useState('todas')
  const [selectedBimestre, setSelectedBimestre] = useState('1')

  const turmasUnicas = useMemo(() => {
    if (!saudeTurmas) return []
    const map = new Map()
    saudeTurmas.forEach((turma: any) => {
      if (!map.has(turma.turma_id)) {
        map.set(turma.turma_id, {
          turma_id: turma.turma_id,
          turma_nome: turma.turma_nome,
          media_geral: turma.media_geral || 0,
          total_alunos: turma.total_alunos || 0,
        })
      }
    })
    return Array.from(map.values())
  }, [saudeTurmas])

  const mediaGeral = turmasUnicas.length > 0
    ? turmasUnicas.reduce((sum: number, t: any) => sum + t.media_geral, 0) / turmasUnicas.length
    : 0

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3 pt-[30px]">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Média Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{mediaGeral > 0 ? mediaGeral.toFixed(1) : '—'}</div>
            {mediaGeral > 0 && (
              <div className="flex items-center gap-1 mt-1">
                {mediaGeral >= 7 ? (
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs ${mediaGeral >= 7 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {mediaGeral >= 7 ? 'Acima da média' : 'Abaixo da média'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 pt-[30px]">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total de Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {turmasUnicas.reduce((sum: number, t: any) => sum + t.total_alunos, 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">{turmasUnicas.length} turmas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 pt-[30px]">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Turmas Aprovadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {turmasUnicas.filter((t: any) => t.media_geral >= 7).length}
            </div>
            <p className="text-xs text-slate-400 mt-1">Média ≥ 7</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2">
        <Select value={selectedTurma} onValueChange={setSelectedTurma}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas as turmas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as turmas</SelectItem>
            {turmasUnicas.map((turma: any) => (
              <SelectItem key={turma.turma_id} value={turma.turma_id}>
                {turma.turma_nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedBimestre} onValueChange={setSelectedBimestre}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1º Bimestre</SelectItem>
            <SelectItem value="2">2º Bimestre</SelectItem>
            <SelectItem value="3">3º Bimestre</SelectItem>
            <SelectItem value="4">4º Bimestre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de Notas */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-8">Aluno</TableHead>
              <TableHead className="text-center">Nota 1</TableHead>
              <TableHead className="text-center">Nota 2</TableHead>
              <TableHead className="text-center">Nota 3</TableHead>
              <TableHead className="text-center">Nota 4</TableHead>
              <TableHead className="text-center">Média</TableHead>
              <TableHead className="text-center pr-8">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12">
                <GraduationCap className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">Selecione uma turma para visualizar as notas</p>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ProfessorNotasPage
