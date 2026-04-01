import React, { useState, useEffect } from 'react'
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
  Search,
  BarChart3,
  FileText,
  Eye,
  Pencil,
  Loader2,
  Users,
  ShieldCheck,
  X,
  User
} from 'lucide-react'
import { useTurmaStore } from '../store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAlunos } from '@/modules/alunos/hooks'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTurmas } from '../hooks'
import { useMatriculaAtivaDoAluno, useAtualizarMatricula } from '@/modules/academico/hooks'

interface TabAlunosProps {
  turmaId: string;
}

export function TabAlunos({ turmaId }: TabAlunosProps) {
  const navigate = useNavigate()
  const { alunos, setAlunos } = useTurmaStore()
  const { data: dbAlunos, isLoading } = useAlunos()
  const [busca, setBusca] = useState('')
  
  // Estado para transferência de turma
  const [selectedAlunoForTransfer, setSelectedAlunoForTransfer] = useState<any>(null)
  const [newTurmaId, setNewTurmaId] = useState<string>('')
  
  const { data: turmas } = useTurmas()
  const { data: matriculaAtiva } = useMatriculaAtivaDoAluno(selectedAlunoForTransfer?.id)
  const atualizarMatricula = useAtualizarMatricula()

  useEffect(() => {
    if (dbAlunos) setAlunos(dbAlunos as any)
  }, [dbAlunos, setAlunos])

  const alunosDaTurma = alunos.filter((a: any) => 
    (a.turma_atual?.id === turmaId || a.turma_id === turmaId) &&
    a.nome_completo.toLowerCase().includes(busca.toLowerCase())
  )

  const handleTransfer = async () => {
    if (!selectedAlunoForTransfer || !newTurmaId || !matriculaAtiva) {
      toast.error('Selecione uma turma de destino.')
      return
    }

    const turmaDestino = turmas?.find((t: any) => t.id === newTurmaId)
    if (!turmaDestino) return

    try {
      await atualizarMatricula.mutateAsync({
        id: matriculaAtiva.id,
        data: {
          turma_id: newTurmaId,
          serie_ano: turmaDestino.nome
        }
      })
      toast.success('Aluno transferido com sucesso!')
      setSelectedAlunoForTransfer(null)
      setNewTurmaId('')
    } catch (error) {
      console.error('Erro na transferência:', error)
      toast.error('Erro ao transferir aluno.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Alunos Matriculados</h3>
           </div>
           <p className="text-slate-500 text-sm font-medium">
              {isLoading ? 'Carregando...' : `${alunosDaTurma.length} ${alunosDaTurma.length === 1 ? 'aluno' : 'alunos'} nesta turma`}
           </p>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <Input
            placeholder="Buscar aluno..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-11 h-12 rounded-xl border-slate-100 bg-white shadow-sm focus:ring-2 focus:ring-indigo-50/50 font-medium"
          />
        </div>
      </div>

      <Card className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="pl-8 h-14 text-[11px] font-black uppercase tracking-widest text-slate-400">Aluno</TableHead>
              <TableHead className="h-14 text-[11px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
              <TableHead className="h-14 text-[11px] font-black uppercase tracking-widest text-slate-400">Matrícula</TableHead>
              <TableHead className="pr-8 h-14 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-slate-100">
                <TableCell colSpan={4} className="h-48 text-center">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-indigo-200" />
                  <p className="text-slate-400 font-bold mt-4 text-sm uppercase tracking-widest">Sincronizando dados...</p>
                </TableCell>
              </TableRow>
            ) : alunosDaTurma.length === 0 ? (
              <TableRow className="border-slate-100">
                <TableCell colSpan={4} className="h-48 text-center">
                  <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nenhum aluno encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              alunosDaTurma.map((aluno: any) => (
                <TableRow key={aluno.id} className="border-slate-100 hover:bg-slate-50/30 transition-colors group">
                  <TableCell className="pl-8 py-5">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 rounded-2xl border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                        <AvatarImage src={aluno.foto_url} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 font-black text-sm">
                          {aluno.nome_completo.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-black text-slate-800 tracking-tight leading-none mb-1.5">{aluno.nome_completo}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">RA: {aluno.id.slice(0, 8).toUpperCase()}</span>
                           {aluno.pcd && (
                              <Badge className="bg-blue-50 text-blue-600 border-0 text-[8px] font-black uppercase h-4 px-1.5 rounded-sm">PCD</Badge>
                           )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`shadow-none font-black text-[9px] uppercase tracking-widest px-2.5 py-1 border-0 ${
                      aluno.status === 'ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {aluno.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 font-bold text-xs tabular-nums tracking-tight">
                    {aluno.matricula || '—'}
                  </TableCell>
                  <TableCell className="pr-8 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/notas`, { state: { alunoId: aluno.id, turmaId } })}
                        className="h-10 w-10 rounded-xl text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all"
                        title="Desempenho Acadêmico"
                      >
                        <BarChart3 className="h-4.5 w-4.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toast.info('Módulo de Ocorrências em breve')}
                        className="h-10 w-10 rounded-xl text-teal-600 hover:bg-teal-50 hover:text-teal-700 transition-all"
                        title="Registrar Ocorrência"
                      >
                        <FileText className="h-4.5 w-4.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/alunos/${aluno.id}`)}
                        className="h-10 w-10 rounded-xl text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all"
                        title="Ver Perfil Completo"
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedAlunoForTransfer(aluno)}
                        className="h-10 w-10 rounded-xl text-amber-500 hover:bg-amber-50 hover:text-amber-600 transition-all"
                        title="Mudar de Turma"
                      >
                        <Pencil className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog de Transferência de Turma */}
      <Dialog open={!!selectedAlunoForTransfer} onOpenChange={(open) => !open && setSelectedAlunoForTransfer(null)}>
        <DialogContent showCloseButton={false} className="max-w-[450px] p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl">
          <div className="p-8">
            <DialogHeader className="mb-8">
              <div className="flex items-center justify-end">
                <Button variant="ghost" size="icon" onClick={() => setSelectedAlunoForTransfer(null)} className="h-10 w-10 rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-50">
                  <X size={20} />
                </Button>
              </div>
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight mt-4">Mudar Turma do Aluno</DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500 mt-2">
                Movendo <span className="font-black text-slate-800">{selectedAlunoForTransfer?.nome_completo}</span> para um novo ambiente acadêmico.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Turma Atual</p>
                  <p className="font-black text-slate-700 uppercase tracking-tighter">
                    {turmas?.find((t: any) => t.id === turmaId)?.nome || 'Não definida'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Turma de Destino</label>
                <Select value={newTurmaId} onValueChange={setNewTurmaId}>
                  <SelectTrigger className="w-full h-16 rounded-2xl border-slate-200 bg-white border-2 font-black px-6 text-slate-800 focus:ring-0 focus:border-indigo-500 transition-all uppercase tracking-tighter">
                    <SelectValue placeholder="Selecione a nova turma..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl font-black p-2">
                    {turmas?.filter((t: any) => t.id !== turmaId).map((t: any) => (
                      <SelectItem key={t.id} value={t.id} className="rounded-xl py-3 uppercase tracking-tighter cursor-pointer focus:bg-indigo-50 focus:text-indigo-600">
                        {t.nome} <span className="ml-2 font-bold opacity-40">({t.turno})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedAlunoForTransfer(null)}
                  className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleTransfer}
                  disabled={atualizarMatricula.isPending || !newTurmaId}
                  className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {atualizarMatricula.isPending ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : 'Confirmar Mudança'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
