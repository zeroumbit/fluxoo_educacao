import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlunos } from '../hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Search, Loader2, UserCircle, Eye } from 'lucide-react'

export function AlunosListPage() {
  const { data: alunos, isLoading } = useAlunos()
  const [busca, setBusca] = useState('')
  const navigate = useNavigate()

  const alunosFiltrados = alunos?.filter((a) =>
    a.nome_completo.toLowerCase().includes(busca.toLowerCase())
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
          <p className="text-muted-foreground">
            {alunos?.length || 0} aluno(s) cadastrado(s)
          </p>
        </div>
        <Button
          onClick={() => navigate('/alunos/novo')}
          className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Aluno
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar aluno..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabela */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Data Nasc.</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Ações</TableHead>
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
                        <p className="font-medium">{aluno.nome_completo}</p>
                        {aluno.nome_social && (
                          <p className="text-xs text-muted-foreground">{aluno.nome_social}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{aluno.data_nascimento || '—'}</TableCell>
                  <TableCell>{aluno.cpf || '—'}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        aluno.status === 'ativo'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-zinc-100 text-zinc-600'
                      }
                    >
                      {aluno.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
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
