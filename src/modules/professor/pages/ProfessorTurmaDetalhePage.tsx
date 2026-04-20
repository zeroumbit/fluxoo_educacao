import { useParams, useNavigate } from 'react-router-dom'
import { useDetalhesTurma } from '../hooks'
import { useAuth } from '@/modules/auth/AuthContext'
import {
  ArrowLeft,
  Loader2,
  Users,
  Clock,
  BookOpen,
  Calendar,
  Eye,
  GraduationCap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function ProfessorTurmaDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const { data: turma, isLoading, error } = useDetalhesTurma(id)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    )
  }

  if (error || !turma) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <Users className="w-10 h-10 text-red-300" />
        </div>
        <h3 className="text-lg font-semibold text-red-700 mb-2">Turma não encontrada</h3>
        <p className="text-sm text-red-400 text-center max-w-sm mb-6">
          Você não tem permissão para acessar esta turma ou ela não existe.
        </p>
        <Button variant="outline" onClick={() => navigate('/professores/turmas')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar às turmas
        </Button>
      </div>
    )
  }

  const freq = turma.percentual_presenca

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/professores/turmas')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{turma.nome}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="outline" className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {turma.disciplina?.nome || 'Disciplina'}
            </Badge>
            <span className="text-sm text-slate-500">
              {turma.turno || ' período'}
            </span>
          </div>
        </div>
      </div>

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
            <div className="text-3xl font-bold text-slate-900">
              {turma.total_alunos}
            </div>
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
              {freq > 0 ? `${freq.toFixed(1)}%` : '—'}
            </div>
            {freq > 0 && (
              <Badge variant={freq >= 75 ? 'default' : 'secondary'} className="mt-2">
                {freq >= 75 ? 'Acima da meta' : 'Atenção'}
              </Badge>
            )}
          </CardContent>
        </Card>

        </div>

      {/* Tabs */}
      <Tabs defaultValue="alunos" className="w-full">
        <TabsList>
          <TabsTrigger value="alunos" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Alunos
          </TabsTrigger>
          <TabsTrigger value="GradeHoraria" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Grade Horária
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alunos" className="mt-4">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Aluno</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {turma.alunos?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-12 text-slate-400">
                      Nenhum aluno matriculado nesta turma
                    </TableCell>
                  </TableRow>
                ) : (
                  turma.alunos?.map((aluno: any) => (
                    <TableRow key={aluno.id} className="hover:bg-slate-50/50">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                            {aluno.foto_url ? (
                              <img
                                src={aluno.foto_url}
                                alt={aluno.nome}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium text-slate-500">
                                {aluno.nome?.charAt(0)}
                              </span>
                            )}
                          </div>
                          <span className="font-medium text-slate-900">{aluno.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Ativo
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/professores/alunos/${aluno.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="GradeHoraria" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Grade Horária da Turma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 text-center py-8">
                Em breve: Grade horária da turma.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ProfessorTurmaDetalhePage