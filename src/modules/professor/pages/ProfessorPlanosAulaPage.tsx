import { useState, useMemo } from 'react'
import { useAuth } from '@/modules/auth/AuthContext'
import { useAgendaDiaria } from '@/modules/professor/hooks'
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
  Plus, Search, Loader2, BookOpen, Calendar, FileText, Clock, Check, Edit
} from 'lucide-react'

export function ProfessorPlanosAulaPage() {
  const { authUser } = useAuth()
  const { data: agenda, isLoading } = useAgendaDiaria()
  const [busca, setBusca] = useState('')

  const aulasFiltradas = useMemo(() => {
    if (!agenda) return []
    return agenda.filter((aula: any) =>
      aula.turma_nome?.toLowerCase().includes(busca.toLowerCase()) ||
      aula.disciplina_nome?.toLowerCase().includes(busca.toLowerCase())
    )
  }, [agenda, busca])

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
            placeholder="Buscar por turma ou disciplina..."
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
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Sala</TableHead>
                <TableHead className="text-center">Conteúdo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aulasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">Nenhuma aula encontrada</p>
                  </TableCell>
                </TableRow>
              ) : (
                aulasFiltradas.map((aula: any) => (
                  <TableRow key={aula.grade_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm">{aula.data_aula}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{aula.hora_inicio} - {aula.hora_fim}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{aula.turma_nome}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-700">{aula.disciplina_nome}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-500">{aula.sala || '-'}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {aula.conteudo_registrado ? (
                        <Badge className="bg-emerald-600">
                          <Check className="w-3 h-3 mr-1" />
                          Registrado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfessorPlanosAulaPage
