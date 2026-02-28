import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlunos } from '../hooks'
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
import { Plus, Search, Loader2, UserCircle } from 'lucide-react'

export function AlunosListPage() {
  const { data: alunos, isLoading } = useAlunos()
  const [busca, setBusca] = useState('')
  const navigate = useNavigate()

  const alunosFiltrados = alunos?.filter((aluno) =>
    aluno.nome.toLowerCase().includes(busca.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alunos</h1>
          <p className="text-muted-foreground">Gerencie os alunos da escola</p>
        </div>
        <Button
          onClick={() => navigate('/alunos/novo')}
          className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Aluno
        </Button>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <CardTitle className="text-sm text-muted-foreground ml-auto">
              {alunosFiltrados?.length || 0} aluno(s)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Turma</TableHead>
                <TableHead className="hidden md:table-cell">Responsável</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alunosFiltrados?.map((aluno) => (
                <TableRow
                  key={aluno.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/alunos/${aluno.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                        <UserCircle className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium">{aluno.nome}</p>
                        <p className="text-xs text-muted-foreground md:hidden">
                          {(aluno as Record<string, unknown>).turmas
                            ? ((aluno as Record<string, unknown>).turmas as { nome: string }).nome
                            : 'Sem turma'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {(aluno as Record<string, unknown>).turmas ? (
                      <Badge variant="secondary">
                        {((aluno as Record<string, unknown>).turmas as { nome: string; turno: string }).nome} -{' '}
                        {((aluno as Record<string, unknown>).turmas as { nome: string; turno: string }).turno}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sem turma</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {(aluno as Record<string, unknown>).responsaveis
                      ? ((aluno as Record<string, unknown>).responsaveis as { nome: string }).nome
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={aluno.status === 'ativo' ? 'default' : 'secondary'}
                      className={
                        aluno.status === 'ativo'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                          : ''
                      }
                    >
                      {aluno.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {(!alunosFiltrados || alunosFiltrados.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <UserCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p>Nenhum aluno encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
