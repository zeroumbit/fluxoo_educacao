import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Search, 
  GraduationCap, 
  Trash2, 
  Eye, 
  AlertTriangle,
  Clock,
  ChevronRight,
  BookOpen
} from 'lucide-react'
import { useTurmaStore } from '../store'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useFuncionarios } from '@/modules/funcionarios/hooks'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface TabProfessoresProps {
  turmaId: string;
}

export function TabProfessores({ turmaId }: TabProfessoresProps) {
  const { professores, disciplinas, professor_turma, atribuirProfessor, removerAtribuicao, setProfessores } = useTurmaStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { data: dbFuncionarios, isLoading: loadingProfessores } = useFuncionarios()

  useEffect(() => {
     if (dbFuncionarios) {
       const professoresMapped = dbFuncionarios
         .filter((f: any) => f.areas_acesso?.includes('Pedagógico') || f.funcao?.toLowerCase().includes('professor'))
         .map((f: any) => ({
           id: f.id,
           nome: f.nome_completo,
           especialidades: [],
           carga_horaria_maxima: 40,
           ativo: f.status === 'ativo',
           avatar_url: f.foto_url
         }))
       setProfessores(professoresMapped)
     }
  }, [dbFuncionarios, setProfessores])

  // Atribuições desta turma
  const atribuicoes = professor_turma.filter(at => at.turma_id === turmaId)

  // Disciplinas que ainda não têm professor
  const disciplinasSemProfessor = disciplinas.filter(d => 
    !atribuicoes.some(at => at.disciplina_id === d.id)
  )

  const handleAtribuir = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const disciplinaId = formData.get('disciplina') as string
    const professorId = formData.get('professor') as string
    const cargaHoraria = Number(formData.get('carga'))

    if (!disciplinaId || !professorId) {
      toast.error('Selecione disciplina e professor')
      return
    }

    atribuirProfessor({
      turma_id: turmaId,
      disciplina_id: disciplinaId,
      professor_id: professorId,
      carga_horaria_semanal: cargaHoraria,
      data_inicio: new Date().toISOString(),
      data_fim: null,
      status: 'ativo'
    })

    toast.success('Professor atribuído com sucesso!')
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
           <h3 className="text-xl font-black text-slate-900 tracking-tight">Corpo Docente</h3>
           <p className="text-slate-500 text-sm font-medium">Gestão de professores por disciplina nesta turma</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-lg shadow-slate-200">
              <Plus size={18} />
              Atribuir Professor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[500px] p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl">
            <div className="p-8">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Atribuir Professor</DialogTitle>
                <p className="text-slate-500 font-medium italic mt-1">Vínculo acadêmico disciplina-professor</p>
              </DialogHeader>

              <form onSubmit={handleAtribuir} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Disciplina</label>
                  <Select name="disciplina">
                    <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50 border-2 font-bold px-5 uppercase tracking-tighter">
                      <SelectValue placeholder="Selecione a disciplina" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl font-bold">
                       {disciplinas.map(d => (
                         <SelectItem key={d.id} value={d.id} className="uppercase tracking-tighter">{d.nome}</SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Professor</label>
                  <Select name="professor">
                    <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50 border-2 font-bold px-5 uppercase tracking-tighter">
                      <SelectValue placeholder="Selecione o professor" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl font-bold">
                       {professores.map(p => (
                         <SelectItem key={p.id} value={p.id} className="uppercase tracking-tighter">{p.nome}</SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-400 font-medium ml-1">
                    Professor não está na lista? <button type="button" className="text-indigo-600 font-bold hover:underline">Cadastrar novo</button>
                  </p>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Carga Horária Semanal</label>
                   <div className="flex items-center gap-4">
                      <Input 
                        name="carga" 
                        type="number" 
                        defaultValue="4" 
                        className="w-24 h-14 rounded-2xl border-slate-100 bg-slate-50 border-2 font-black text-center"
                      />
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Aulas / Semana</span>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 h-14 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-100"
                  >
                    Atribuir
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {loadingProfessores ? (
           <div className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-300" />
              <p className="text-slate-400 font-bold mt-4">Carregando corpo docente...</p>
           </div>
        ) : atribuicoes.length === 0 && disciplinasSemProfessor.length === 0 ? (
           <div className="py-12 bg-white rounded-[2rem] border border-dashed border-slate-200 text-center">
              <GraduationCap className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-400 font-bold">Nenhum professor vinculado.</p>
           </div>
        ) : null}

        {/* Professores Vinculados */}
        {atribuicoes.map((at) => {
          const professor = professores.find(p => p.id === at.professor_id)
          const disciplina = disciplinas.find(d => d.id === at.disciplina_id)
          if (!professor || !disciplina) return null

          return (
            <Card key={at.id} className="border-0 shadow-sm border border-slate-100 rounded-[2rem] overflow-hidden group">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 rounded-2xl border-2 border-slate-50 shadow-sm">
                      <AvatarImage src={professor.avatar_url} />
                      <AvatarFallback className="bg-indigo-50 text-indigo-600 font-black text-lg">
                        {professor.nome[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                         <h4 className="font-black text-slate-800 tracking-tight leading-none">{professor.nome}</h4>
                         <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 pt-0.5 rounded-full bg-slate-50 text-slate-400 border-slate-200">Professor</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="flex items-center gap-1">
                            <BookOpen size={12} className="text-indigo-400" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{disciplina.nome}</span>
                         </div>
                         <div className="flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{at.carga_horaria_semanal} aulas/unidade</span>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-slate-50 hover:bg-white hover:shadow-sm text-slate-400 hover:text-indigo-600 transition-all">
                      <Eye size={18} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        removerAtribuicao(at.id)
                        toast.success('Vínculo removido!')
                      }}
                      className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Disciplinas Pendentes */}
        {disciplinasSemProfessor.length > 0 && (
          <div className="mt-8 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 ml-4 flex items-center gap-2">
              <AlertTriangle size={12} />
              Disciplinas pendentes de professor
            </h4>
            <div className="grid gap-3">
              {disciplinasSemProfessor.map((d) => (
                <div key={d.id} className="p-6 bg-amber-50/50 border border-amber-100 rounded-[2rem] flex items-center justify-between group hover:bg-amber-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-amber-500 shadow-sm border border-amber-200 group-hover:scale-110 transition-transform">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h5 className="font-black text-amber-900 tracking-tight leading-none mb-1 uppercase tracking-tighter">{d.nome}</h5>
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest opacity-60">Sem professor atribuído</span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsModalOpen(true)}
                    className="h-10 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 font-black text-[10px] uppercase tracking-widest gap-2"
                  >
                    Atribuir Agora
                    <ChevronRight size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
