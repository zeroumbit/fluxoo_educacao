import { useParams, useNavigate } from 'react-router-dom'
import { useDetalhesAluno } from '../hooks'
import {
  ArrowLeft,
  Loader2,
  Users,
  Clock,
  BookOpen,
  Calendar,
  GraduationCap,
  User,
  AlertTriangle
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

export function ProfessorAlunoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: aluno, isLoading, error } = useDetalhesAluno(id)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    )
  }

  if (error || !aluno) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <Users className="w-10 h-10 text-red-300" />
        </div>
        <h3 className="text-lg font-semibold text-red-700 mb-2">Aluno não encontrado</h3>
        <p className="text-sm text-red-400 text-center max-w-sm mb-6">
          Você não tem acesso a este aluno ou ele não existe.
        </p>
        <Button variant="outline" onClick={() => navigate('/professores/alunos')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar aos alunos
        </Button>
      </div>
    )
  }

  const freq = aluno.percentual_presenca || 0

  return (
    <div className="space-y-6 pb-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/professores/alunos')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
            {aluno.foto_url ? (
              <img
                src={aluno.foto_url}
                alt={aluno.nome_completo}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{aluno.nome_completo}</h1>
            <div className="flex items-center gap-3 mt-1">
              {aluno.tem_vinculo ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Aluno ativo
                </Badge>
              ) : (
                <Badge variant="secondary">Sem vínculo atual</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pt-6 pb-0">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Frequência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${freq >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>
              {freq > 0 ? `${freq.toFixed(1)}%` : '—'}
            </div>
            {aluno.total_faltas > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                {aluno.total_faltas} falta{aluno.total_faltas !== 1 ? 's' : ''} de {aluno.total_aulas} aulas
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pt-6 pb-0">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Turmas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {aluno.turmas?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pt-6 pb-0">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Ingresso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">
              {aluno.data_nascimento
                ? new Date(aluno.data_nascimento).toLocaleDateString('pt-BR')
                : '—'}
            </div>
            <p className="text-xs text-slate-400 mt-1">Nascimento</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="turmas" className="w-full">
        <TabsList>
          <TabsTrigger value="turmas" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Turmas ({aluno.turmas?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="dados" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Dados Pessoais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="turmas" className="mt-4">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Turma</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!aluno.turmas?.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                      Nenhuma turma vinculada
                    </TableCell>
                  </TableRow>
                ) : (
                  aluno.turmas.map((turma: any) => (
                    <TableRow key={turma.matricula_id} className="hover:bg-slate-50/50">
                      <TableCell className="pl-6 py-4 font-medium">
                        {turma.turma_nome}
                      </TableCell>
                      <TableCell className="py-4">
                        {turma.disciplina_nome}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline">{turma.turno || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {turma.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="dados" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pt-6">
                <CardTitle className="text-base">Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Nome Completo</p>
                  <p className="font-medium">{aluno.nome_completo || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Nome Social</p>
                  <p className="font-medium">{aluno.nome_social || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Gênero</p>
                  <p className="font-medium">{aluno.genero || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Data de Nascimento</p>
                  <p className="font-medium">
                    {aluno.data_nascimento
                      ? new Date(aluno.data_nascimento).toLocaleDateString('pt-BR')
                      : '—'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pt-6">
                <CardTitle className="text-base">Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">CEP</p>
                  <p className="font-medium">{aluno.cep || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Endereço</p>
                  <p className="font-medium text-sm">
                    {aluno.logradouro
                      ? `${aluno.logradouro}, ${aluno.numero || 'S/N'} ${aluno.complemento || ''}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Bairro</p>
                  <p className="font-medium">{aluno.bairro || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Cidade/Estado</p>
                  <p className="font-medium">
                    {aluno.cidade && aluno.estado
                      ? `${aluno.cidade}/${aluno.estado}`
                      : '—'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pt-6">
                <CardTitle className="text-base text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Patologias
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aluno.patologias?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {aluno.patologias.map((p: string, i: number) => (
                      <Badge key={i} variant="destructive">{p}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Nenhuma patologia cadastrada</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pt-6">
                <CardTitle className="text-base text-amber-600">Medicamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {aluno.medicamentos?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {aluno.medicamentos.map((m: string, i: number) => (
                      <Badge key={i} variant="outline" className="bg-amber-50">{m}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Nenhum medicamento cadastrado</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
              <CardHeader className="pt-6">
                <CardTitle className="text-base">Observações de Saúde</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{aluno.observacoes_saude || 'Nenhuma observação cadastrada'}</p>
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ProfessorAlunoDetalhePage