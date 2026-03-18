import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Search, 
  BarChart3, 
  FileText, 
  UserCircle,
  ShieldCheck,
  Lock,
  Loader2
} from 'lucide-react'
import { useTurmaStore } from '../store'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAlunos } from '@/modules/alunos/hooks'
import { useEffect } from 'react'

interface TabAlunosProps {
  turmaId: string;
}

export function TabAlunos({ turmaId }: TabAlunosProps) {
  const { alunos, setAlunos } = useTurmaStore()
  const { data: dbAlunos, isLoading } = useAlunos()

  useEffect(() => {
    if (dbAlunos) setAlunos(dbAlunos as any)
  }, [dbAlunos, setAlunos])

  const alunosDaTurma = alunos.filter(a => a.turma_id === turmaId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Alunos Matriculados</h3>
           </div>
           <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
              <Lock size={12} className="text-slate-400" />
              Visualização restrita · Vínculos gerenciados pela Secretaria
           </p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar aluno matriculado..." 
            className="pl-11 h-12 rounded-2xl border-slate-100 bg-white shadow-sm focus:ring-indigo-50 font-medium"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {alunosDaTurma.map((aluno) => (
          <Card key={aluno.id} className="border-0 shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white group overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 rounded-2xl border-2 border-slate-50 shadow-sm">
                    <AvatarImage src={aluno.foto_url} />
                    <AvatarFallback className="bg-indigo-50 text-indigo-600 font-black">
                      {aluno.nome_completo.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                      {aluno.nome_completo}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Mat: {aluno.matricula}
                      </span>
                      <Badge className={aluno.status === 'ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}>
                        {aluno.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                 <Button variant="ghost" size="sm" className="flex-1 rounded-xl font-bold text-[10px] uppercase tracking-wider bg-slate-50 hover:bg-white hover:shadow-sm">
                    <BarChart3 size={14} className="mr-2 text-indigo-500" />
                    Desempenho
                 </Button>
                 <Button variant="ghost" size="sm" className="flex-1 rounded-xl font-bold text-[10px] uppercase tracking-wider bg-slate-50 hover:bg-white hover:shadow-sm">
                    <FileText size={14} className="mr-2 text-teal-500" />
                    Ocorrências
                 </Button>
                 <Button variant="ghost" size="sm" className="flex-1 rounded-xl font-bold text-[10px] uppercase tracking-wider bg-slate-50 hover:bg-white hover:shadow-sm">
                    <UserCircle size={14} className="mr-2 text-slate-500" />
                    Perfil
                 </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

       {isLoading ? (
         <div className="py-20 text-center">
           <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-300" />
           <p className="text-slate-400 font-bold mt-4">Carregando lista de alunos...</p>
         </div>
       ) : alunosDaTurma.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
           <Users className="h-12 w-12 mx-auto mb-4 text-slate-200" />
           <p className="text-slate-400 font-bold">Nenhum aluno matriculado nesta turma.</p>
        </div>
       ) : null}
    </div>
  )
}
