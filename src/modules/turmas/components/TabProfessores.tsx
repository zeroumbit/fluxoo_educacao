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
  BookOpen,
  Loader2,
  CheckCircle2
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useProfessoresTurma, useDisciplinas, useAtribuicoes, useAtribuirProfessor, useRemoverAtribuicao, useTurma } from '../hooks'
import { useAuth } from '@/modules/auth/AuthContext'

interface TabProfessoresProps {
  turmaId: string;
}

export function TabProfessores({ turmaId }: TabProfessoresProps) {
  const { authUser } = useAuth()
  const [selectedDisciplina, setSelectedDisciplina] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [busca, setBusca] = useState('')
  const [professorDetails, setProfessorDetails] = useState<any>(null)
  const [atribuicaoParaRemover, setAtribuicaoParaRemover] = useState<any>(null)
  const [_showAllDisciplinas, _setShowAllDisciplinas] = useState(false)

  const { data: turma } = useTurma(turmaId)
  const { data: dbProfessores, isLoading: loadingProfessores } = useProfessoresTurma()
  const { data: dbDisciplinas } = useDisciplinas(authUser?.tenantId || '', turma?.etapa)
  const { data: instituicaoAtribuicoes, isLoading: _loadingAtribuicoes } = useAtribuicoes(turmaId)
  
  const mutationAtribuir = useAtribuirProfessor()
  const mutationRemover = useRemoverAtribuicao()

  // Fonte de verdade: React Query (NÃO Zustand store que mantém dados stale)
  const professores = dbProfessores || []
  const disciplinas = dbDisciplinas || []

  // Atribuições desta turma (vêm do banco)
  const atribuicoes = instituicaoAtribuicoes || []

  // FILTRO DE SEGURANÇA: Garantir que apenas disciplinas ativas sejam usadas
  const disciplinasAtivas = disciplinas.filter(d => d.ativa !== false)

  // Mapa de IDs de disciplinas ativas para lookup O(1)
  const idsAtivas = new Set(disciplinasAtivas.map(d => d.id))

  // Filtragem: EXCLUI atribuições cuja disciplina foi desativada
  const filteredAtribuicoes = atribuicoes.filter((at: any) => {
    if (!idsAtivas.has(at.disciplina_id)) return false
    const professor = professores.find((p: any) => p.id === at.professor_id)
    const disciplina = disciplinasAtivas.find((d: any) => d.id === at.disciplina_id)
    if (!professor || !disciplina) return false
    const searchTerm = busca.toLowerCase()
    return professor.nome.toLowerCase().includes(searchTerm) || 
           disciplina.nome.toLowerCase().includes(searchTerm)
  })

  // Disciplinas ativas que ainda não têm professor
  const disciplinasSemProfessor = disciplinasAtivas.filter(d => 
    !atribuicoes.some((at: any) => at.disciplina_id === d.id) &&
    d.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const handleAtribuir = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const disciplinaId = formData.get('disciplina') as string
    const professorId = formData.get('professor') as string
    const cargaHoraria = Number(formData.get('carga'))

    if (!disciplinaId || !professorId) {
      toast.error('Selecione disciplina e professor')
      return
    }

    try {
      await mutationAtribuir.mutateAsync({
        tenant_id: authUser?.tenantId,
        turma_id: turmaId,
        disciplina_id: disciplinaId,
        professor_id: professorId,
        carga_horaria_semanal: cargaHoraria,
        status: 'ativo'
      })

      toast.success('Professor atribuído com sucesso!')
      setIsModalOpen(false)
    } catch (error) {
      toast.error('Erro ao atribuir professor')
    }
  }

  const handleRemoverConfirm = async () => {
    if (!atribuicaoParaRemover) return
    try {
      await mutationRemover.mutateAsync(atribuicaoParaRemover.id)
      toast.success('Vínculo removido!')
      setAtribuicaoParaRemover(null)
    } catch (error) {
      toast.error('Erro ao remover vínculo')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h3 className="text-xl font-black text-slate-900 tracking-tight">Corpo Docente</h3>
           <p className="text-slate-500 text-sm font-medium">Gestão de professores por disciplina nesta turma</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              placeholder="Buscar professor ou disciplina..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 h-11 rounded-xl border-slate-100 bg-white shadow-sm focus:ring-2 focus:ring-indigo-50/50 font-medium text-xs"
            />
          </div>

          <div className="hidden md:block w-px h-8 bg-slate-100 mx-2" />
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[500px] p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Atribuir Professor</DialogTitle>
              <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-100 w-fit">
                <BookOpen size={14} className="text-indigo-600" />
                <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">
                  {selectedDisciplina?.nome || 'Disciplina'}
                </span>
              </div>
            </DialogHeader>

            <form onSubmit={handleAtribuir} className="space-y-5">
              <input type="hidden" name="disciplina" value={selectedDisciplina?.id || ''} />
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Selecionar Professor</label>
                <Select name="professor">
                  <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50 border-2 font-bold px-5 uppercase tracking-tighter">
                    <SelectValue placeholder="Escolha um docente" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-xl font-bold">
                     {professores.map(p => (
                       <SelectItem key={p.id} value={p.id} className="uppercase tracking-tighter">
                         {p.nome}{p.especialidades.length > 0 ? ` (${p.especialidades[0]})` : ''}
                       </SelectItem>
                     ))}
                  </SelectContent>
                </Select>
                {professores.length === 0 && (
                  <p className="text-[10px] text-amber-600 font-bold ml-1">
                    ⚠️ Nenhum professor encontrado.
                  </p>
                )}
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
                  disabled={mutationAtribuir.isPending}
                  className="flex-1 h-14 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-100"
                >
                  {mutationAtribuir.isPending ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : 'Confirmar Vínculo'}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {loadingProfessores ? (
          <div className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-300" />
            <p className="text-slate-400 font-bold mt-4">Carregando corpo docente...</p>
          </div>
        ) : filteredAtribuicoes.length === 0 && disciplinasSemProfessor.length === 0 ? (
          <div className="py-12 bg-white rounded-[2rem] border border-dashed border-slate-200 text-center">
            <GraduationCap className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-400 font-bold">Nenhum professor ou disciplina encontrado.</p>
          </div>
        ) : null}

        {/* Professores Vinculados */}
        {filteredAtribuicoes.map((at: any) => {
          const professor = professores.find((p: any) => p.id === at.professor_id)
          const disciplina = disciplinasAtivas.find((d: any) => d.id === at.disciplina_id)
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
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 pt-0.5 rounded-full bg-slate-50 text-slate-400 border-slate-200">
                          {professor.especialidades.length > 0 ? professor.especialidades[0] : 'Professor'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <BookOpen size={12} className="text-indigo-400" />
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{disciplina.nome}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{at.carga_horaria_semanal} aulas/semana</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setProfessorDetails({ professor, disciplina, atribuicao: at })}
                      className="h-11 w-11 rounded-xl bg-slate-50 hover:bg-white hover:shadow-sm text-slate-400 hover:text-indigo-600 transition-all"
                    >
                      <Eye size={18} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setAtribuicaoParaRemover(at)}
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
              {disciplinasSemProfessor.map((d: any) => (
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
                    onClick={() => { setSelectedDisciplina(d); setIsModalOpen(true); }}
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

      {/* DETALHES DO PROFESSOR (Dialog) */}
      <Dialog open={!!professorDetails} onOpenChange={(open) => !open && setProfessorDetails(null)}>
        <DialogContent className="max-w-[500px] p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl">
          {professorDetails && (
            <div className="p-8">
               <DialogHeader className="mb-6 flex flex-col items-center text-center">
                 <Avatar className="h-28 w-28 rounded-3xl border-4 border-slate-50 shadow-md">
                   <AvatarImage src={professorDetails.professor.avatar_url} />
                   <AvatarFallback className="bg-indigo-50 text-indigo-600 font-black text-3xl">
                     {professorDetails.professor.nome[0].toUpperCase()}
                   </AvatarFallback>
                 </Avatar>
                 <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight mt-4">{professorDetails.professor.nome}</DialogTitle>
                 <Badge className="bg-indigo-50 text-indigo-600 border-0 text-[10px] font-black uppercase tracking-widest mt-2 px-3 py-1">
                   Ativo na Plataforma
                 </Badge>
               </DialogHeader>

               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 p-6 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-2 border border-slate-100">
                   <BookOpen className="h-8 w-8 text-indigo-400 mb-1" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Disciplina Atual</span>
                   <p className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                     {professorDetails.disciplina.nome}
                   </p>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-2 border border-slate-100">
                   <Clock className="h-8 w-8 text-slate-400 mb-1" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Carga Horária</span>
                   <p className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                     {professorDetails.atribuicao.carga_horaria_semanal} aulas/semana
                   </p>
                 </div>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* REMOVER ATRIBUIÇÃO (Dialog) */}
      <Dialog open={!!atribuicaoParaRemover} onOpenChange={(open) => !open && setAtribuicaoParaRemover(null)}>
        <DialogContent className="max-w-[400px] p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl">
          <div className="p-8 text-center space-y-6">
            <div className="h-24 w-24 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="h-12 w-12 text-rose-500" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                Remover Professor?
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-3 leading-relaxed">
                Este professor será desvinculado desta disciplina e não lecionará mais para esta turma.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setAtribuicaoParaRemover(null)}
                className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 border-slate-200"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRemoverConfirm}
                disabled={mutationRemover.isPending}
                className="flex-1 h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-200"
              >
                 {mutationRemover.isPending ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : 'Confirmar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
