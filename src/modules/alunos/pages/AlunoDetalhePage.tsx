import { useNavigate, useParams } from 'react-router-dom'
import { useAluno, useAtualizarAluno } from '../hooks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Loader2, UserCircle } from 'lucide-react'
import { toast } from 'sonner'

export function AlunoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: aluno, isLoading } = useAluno(id || '')
  const atualizarAluno = useAtualizarAluno()

  const toggleStatus = async () => {
    if (!aluno || !id) return
    const novoStatus = aluno.status === 'ativo' ? 'inativo' : 'ativo'
    try {
      await atualizarAluno.mutateAsync({ id, aluno: { status: novoStatus } })
      toast.success(`Aluno ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`)
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!aluno) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Aluno não encontrado.</p>
        <Button variant="link" onClick={() => navigate('/alunos')}>Voltar</Button>
      </div>
    )
  }

  const turma = (aluno as Record<string, unknown>).turmas as { nome: string; turno: string } | null
  const responsavel = (aluno as Record<string, unknown>).responsaveis as { nome: string; telefone: string | null; email: string | null; cpf: string | null; parentesco: string | null } | null

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/alunos')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button
          variant={aluno.status === 'ativo' ? 'destructive' : 'default'}
          size="sm"
          onClick={toggleStatus}
          disabled={atualizarAluno.isPending}
        >
          {aluno.status === 'ativo' ? 'Desativar' : 'Ativar'}
        </Button>
      </div>

      {/* Header do Aluno */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-200 to-blue-200 flex items-center justify-center">
              <UserCircle className="h-10 w-10 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{aluno.nome}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className={
                    aluno.status === 'ativo'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-zinc-100 text-zinc-600'
                  }
                >
                  {aluno.status}
                </Badge>
                {turma && (
                  <Badge variant="secondary">
                    {turma.nome} - {turma.turno}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Pessoais */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Data de Nascimento</p>
              <p className="font-medium">{aluno.data_nascimento || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">CPF</p>
              <p className="font-medium">{aluno.cpf || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Sexo</p>
              <p className="font-medium capitalize">{aluno.sexo || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">E-mail</p>
              <p className="font-medium">{aluno.email || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Telefone</p>
              <p className="font-medium">{aluno.telefone || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Endereço</p>
              <p className="font-medium">{aluno.endereco || '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saúde */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Dados de Saúde</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Tipo Sanguíneo</p>
              <p className="font-medium">{aluno.tipo_sanguineo || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Alergias</p>
              <p className="font-medium">{aluno.alergias || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Medicamentos</p>
              <p className="font-medium">{aluno.medicamentos || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Observações</p>
              <p className="font-medium">{aluno.observacoes_saude || '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsável */}
      {responsavel && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Responsável</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Nome</p>
                <p className="font-medium">{responsavel.nome}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Parentesco</p>
                <p className="font-medium capitalize">{responsavel.parentesco || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Telefone</p>
                <p className="font-medium">{responsavel.telefone || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">E-mail</p>
                <p className="font-medium">{responsavel.email || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
