import { useNavigate, useParams } from 'react-router-dom'
import { useAluno, useAtualizarAluno } from '../hooks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  // Extrair responsáveis da relação N:N
  const vinculos = (aluno as Record<string, unknown>).aluno_responsavel as Array<{
    grau_parentesco: string | null
    responsaveis: { nome: string; cpf: string; email: string | null; telefone: string | null }
  }> | null

  const filial = (aluno as Record<string, unknown>).filiais as { nome_unidade: string } | null

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

      {/* Header */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-200 to-blue-200 flex items-center justify-center">
              <UserCircle className="h-10 w-10 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{aluno.nome_completo}</h1>
              {aluno.nome_social && (
                <p className="text-sm text-muted-foreground">Nome social: {aluno.nome_social}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge className={aluno.status === 'ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'}>
                  {aluno.status}
                </Badge>
                {filial && (
                  <Badge variant="secondary">{filial.nome_unidade}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Pessoais */}
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Dados Pessoais</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Data de Nascimento</p>
              <p className="font-medium">{aluno.data_nascimento}</p>
            </div>
            <div>
              <p className="text-muted-foreground">CPF</p>
              <p className="font-medium">{aluno.cpf || '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saúde */}
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Dados de Saúde</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Patologias</p>
              <p className="font-medium">
                {aluno.patologias && aluno.patologias.length > 0
                  ? aluno.patologias.join(', ')
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Medicamentos</p>
              <p className="font-medium">
                {aluno.medicamentos && aluno.medicamentos.length > 0
                  ? aluno.medicamentos.join(', ')
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Observações</p>
              <p className="font-medium">{aluno.observacoes_saude || '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsáveis */}
      {vinculos && vinculos.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">Responsável(is)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {vinculos.map((v, i) => (
              <div key={i} className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nome</p>
                  <p className="font-medium">{v.responsaveis.nome}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Parentesco</p>
                  <p className="font-medium capitalize">{v.grau_parentesco || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefone</p>
                  <p className="font-medium">{v.responsaveis.telefone || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">E-mail</p>
                  <p className="font-medium">{v.responsaveis.email || '—'}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
