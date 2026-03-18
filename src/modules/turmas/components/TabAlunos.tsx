import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  Search,
  BarChart3,
  FileText,
  UserCircle,
  ShieldCheck,
  Loader2
} from 'lucide-react'
import { useTurmaStore } from '../store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAlunos } from '@/modules/alunos/hooks'
import { useEffect, useState } from 'react'

interface TabAlunosProps {
  turmaId: string;
}

export function TabAlunos({ turmaId }: TabAlunosProps) {
  const { alunos, setAlunos } = useTurmaStore()
  const { data: dbAlunos, isLoading } = useAlunos()
  const [busca, setBusca] = useState('')

  useEffect(() => {
    if (dbAlunos) setAlunos(dbAlunos as any)
  }, [dbAlunos, setAlunos])

  // Filtra alunos que têm turma_atual.id igual ao turmaId OU turma_id direto
  const alunosDaTurma = alunos.filter((a: any) => 
    (a.turma_atual?.id === turmaId || a.turma_id === turmaId) &&
    a.nome_completo.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Alunos Matriculados</h3>
           </div>
           <p className="text-slate-500 text-sm font-medium">
              {alunosDaTurma.length} {alunosDaTurma.length === 1 ? 'aluno' : 'alunos'} nesta turma
           </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar aluno..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-11 h-12 rounded-xl border-slate-100 bg-white shadow-sm focus:ring-indigo-50 font-medium"
          />
        </div>
      </div>

      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-100">
              <TableHead className="font-bold text-slate-500">Aluno</TableHead>
              <TableHead className="font-bold text-slate-500">Status</TableHead>
              <TableHead className="font-bold text-slate-500">Matrícula</TableHead>
              <TableHead className="text-right font-bold text-slate-500">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-slate-100">
                <TableCell colSpan={4} className="h-32 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-300" />
                  <p className="text-slate-400 font-bold mt-2 text-sm">Carregando alunos...</p>
                </TableCell>
              </TableRow>
            ) : alunosDaTurma.length === 0 ? (
              <TableRow className="border-slate-100">
                <TableCell colSpan={4} className="h-32 text-center">
                  <Users className="h-12 w-12 mx-auto mb-2 text-slate-200" />
                  <p className="text-slate-400 font-bold text-sm">Nenhum aluno matriculado nesta turma</p>
                </TableCell>
              </TableRow>
            ) : (
              alunosDaTurma.map((aluno: any) => (
                <TableRow key={aluno.id} className="border-slate-100 hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-xl border border-slate-100">
                        <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-sm">
                          {aluno.nome_completo.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-slate-800">{aluno.nome_completo}</p>
                        {aluno.cpf && <p className="text-xs text-slate-400">CPF: {aluno.cpf}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={aluno.status === 'ativo' ? 'bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase tracking-wider' : 'bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider'}>
                      {aluno.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {aluno.matricula || '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-3 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Desempenho
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-3 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-teal-50 hover:text-teal-600"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Ocorrências
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-3 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-slate-50 hover:text-slate-600"
                      >
                        <UserCircle className="h-4 w-4 mr-1" />
                        Perfil
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
