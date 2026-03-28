import React, { useState, useMemo } from 'react'
import { 
  Users, CalendarDays, GraduationCap, Info,
  MapPin, DollarSign, BookOpen, AlertTriangle, ShieldCheck,
  BarChart3, FileText, UserCircle, Printer, Save, Pencil, X,
  Plus, Calendar, Search, Loader2, Trash2, ChevronRight, Eye, Clock,
  Calculator, CalendarCheck, TrendingUp
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

import type { Turma } from '@/lib/database.types'
import { useAlunos } from '@/modules/alunos/hooks'
import { useAuth } from '@/modules/auth/AuthContext'
import { 
  useGradeTurma, 
  useDisciplinas,
  useProfessoresTurma,
  useAtribuicoes,
  useAtribuirProfessor,
  useRemoverAtribuicao,
  useTurmaBilling
} from '../hooks'
import { toast } from 'sonner'

interface TurmaDetalhesModalMobileProps {
  turma: Turma | null;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'dados' | 'alunos' | 'professores' | 'grade';
  onEditTurma?: (turma: Turma) => void;
  onDeleteTurma?: (turma: Turma) => void;
}

const TABS = [
  { id: 'dados', label: 'Dados Gerais', icon: Info },
  { id: 'alunos', label: 'Alunos', icon: Users },
  { id: 'professores', label: 'Professores', icon: GraduationCap },
  { id: 'grade', label: 'Grade Horária', icon: CalendarDays },
] as const

export function TurmaDetalhesModalMobile({ 
  turma, isOpen, onClose, initialTab = 'dados', onEditTurma, onDeleteTurma 
}: TurmaDetalhesModalMobileProps) {
  const [activeTab, setActiveTab] = useState<'dados' | 'alunos' | 'professores' | 'grade'>(initialTab)

  // Sync initial tab when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  const { authUser } = useAuth()
  const visibleTabs = authUser?.isProfessor ? TABS.filter(t => t.id === 'dados') : TABS

  if (!turma) return null

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Gerenciamento da Turma" size="full">
      <div className="pt-4 pb-32 space-y-6">
        {/* Header (Top Bar per the requirement) */}
        <div className="flex items-center gap-4 px-2">
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center border border-indigo-100/50 shrink-0 shadow-sm">
            <BookOpen className="h-7 w-7 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[16px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{turma.nome}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="text-[8px] font-black uppercase rounded-lg px-2 h-5 bg-indigo-50 text-indigo-600 border-0">
                {turma.turno}
              </Badge>
              {turma.sala && (
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{turma.sala}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 px-1 no-scrollbar">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap",
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-800"
                )}
              >
                <Icon size={14} className={isActive ? "text-white" : "text-slate-400"} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Contents */}
        <div className="px-1">
          {activeTab === 'dados' && <TabDados turma={turma} onEdit={() => onEditTurma?.(turma)} onDelete={() => onDeleteTurma?.(turma)} />}
          {!authUser?.isProfessor && activeTab === 'alunos' && <TabAlunos turma={turma} />}
          {!authUser?.isProfessor && activeTab === 'professores' && <TabProfessores turma={turma} />}
          {!authUser?.isProfessor && activeTab === 'grade' && <TabGrade turma={turma} />}
        </div>
      </div>
    </BottomSheet>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: DADOS GERAIS
// ─────────────────────────────────────────────────────────────────────────────
function TabDados({ turma, onEdit, onDelete }: { turma: Turma, onEdit: () => void, onDelete: () => void }) {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const { updateMensalidadeTurma, isUpdating } = useTurmaBilling()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex flex-col items-center justify-center text-center space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vagas</span>
          <p className="text-xl font-black text-slate-900 dark:text-white">{turma.capacidade_maxima || '—'}</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex flex-col items-center justify-center text-center space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Mensalidade</span>
          <p className="text-xl font-black text-emerald-600">R$ {Number(turma.valor_mensalidade || 0).toFixed(2).replace('.', ',')}</p>
        </div>
        {turma.sala && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex flex-col items-center justify-center text-center space-y-1">
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sala</span>
             <p className="text-[14px] font-bold text-slate-900 dark:text-white truncate max-w-full uppercase">{turma.sala}</p>
          </div>
        )}
        {(turma as any).horario && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex flex-col items-center justify-center text-center space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Horário</span>
            <p className="text-[14px] font-bold text-slate-900 dark:text-white truncate max-w-full">{(turma as any).horario}</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ações Rápidas</p>
        <div className="grid grid-cols-1 gap-2">
          <Button 
            onClick={() => navigate('/frequencia', { state: { turmaId: turma.id } })}
            className="w-full h-14 rounded-[1.5rem] bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest gap-2"
          >
            <CalendarCheck className="h-4 w-4" />
            Lançar Frequência
          </Button>
          <Button 
            onClick={() => navigate('/notas', { state: { turmaId: turma.id } })}
            variant="outline"
            className="w-full h-14 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest gap-2 bg-white dark:bg-slate-900"
          >
            <TrendingUp className="h-4 w-4 text-slate-400" />
            Boletim da Turma
          </Button>
          {!authUser?.isProfessor && (
            <Button 
              onClick={async () => {
                if (!authUser?.tenantId) return
                const nValor = prompt('Novo valor da mensalidade?', turma.valor_mensalidade?.toString())
                if (!nValor) return
                const vNum = parseFloat(nValor.replace(',', '.'))
                if (isNaN(vNum) || vNum <= 0) { toast.error('Valor inválido'); return }

                if (confirm(`Atualizar todos os alunos para R$ ${vNum.toFixed(2)}?`)) {
                  try {
                    await updateMensalidadeTurma.mutateAsync({ turmaId: turma.id, tenantId: authUser.tenantId, valor: vNum })
                  } catch {}
                }
              }}
              disabled={isUpdating}
              variant="outline"
              className="w-full h-14 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest gap-2 bg-white dark:bg-slate-900 text-emerald-600 border-emerald-100"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              Mensalidade em Lote
            </Button>
          )}
        </div>
      </div>

      {!authUser?.isProfessor && (
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onDelete} className="flex-1 h-12 rounded-xl font-bold text-sm text-rose-500 border-rose-100">
            Excluir
          </Button>
          <Button onClick={onEdit} className="flex-1 h-12 rounded-xl bg-slate-900 font-bold text-sm text-white shadow-lg">
            Editar Dados
          </Button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: ALUNOS
// ─────────────────────────────────────────────────────────────────────────────
function TabAlunos({ turma }: { turma: Turma }) {
  const navigate = useNavigate()
  const { data: todosAlunos } = useAlunos()
  const [busca, setBusca] = useState('')

  const alunosDaTurma = useMemo(() => {
    if (!todosAlunos) return []
    return todosAlunos.filter((a: any) => 
      (a.turma_id === turma.id || a.turma_atual?.id === turma.id) &&
      a.nome_completo.toLowerCase().includes(busca.toLowerCase())
    )
  }, [todosAlunos, turma.id, busca])

  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar aluno..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-11 h-12 rounded-2xl border-0 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
        />
      </div>

      <div className="flex flex-col gap-3">
        {alunosDaTurma.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
            <Users size={32} className="mx-auto text-slate-200 mb-3" />
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nenhum aluno encontrado.</p>
          </div>
        ) : (
          alunosDaTurma.map((aluno: any) => (
            <div key={aluno.id} className="p-4 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-slate-100">
                    <AvatarFallback className="bg-indigo-50 text-indigo-600 text-xs font-bold">
                      {aluno.nome_completo.substring(0,2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-tight">{aluno.nome_completo}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Matrícula: {aluno.matricula || 'N/A'}</p>
                  </div>
                </div>
                <Badge className={aluno.status === 'ativo' ? 'bg-emerald-50 text-emerald-600 border-0 text-[8px] font-black uppercase' : 'bg-slate-50 text-slate-400 border-0 text-[8px] font-black uppercase'}>
                  {aluno.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-50 dark:border-slate-800">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/notas', { state: { alunoId: aluno.id, turmaId: turma.id } })}
                  className="h-9 rounded-lg font-bold text-[9px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 hover:bg-indigo-100/50"
                >
                  <BarChart3 size={12} className="mr-1.5" /> Desemp.
                </Button>
                <Button variant="ghost" size="sm" className="h-9 rounded-lg font-bold text-[9px] uppercase tracking-widest text-teal-600 dark:text-teal-400 bg-teal-50/50 hover:bg-teal-100/50">
                  <FileText size={12} className="mr-1.5" /> Ocorr.
                </Button>
                <Button variant="ghost" size="sm" className="h-9 rounded-lg font-bold text-[9px] uppercase tracking-widest text-slate-500 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400">
                  <UserCircle size={12} className="mr-1.5" /> Perfil
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: PROFESSORES
// ─────────────────────────────────────────────────────────────────────────────
function TabProfessores({ turma }: { turma: Turma }) {
  const { authUser } = useAuth()
  const { data: todosProfessores, isLoading: loadingProfessores } = useProfessoresTurma()
  const { data: todasDisciplinas } = useDisciplinas()
  const { data: atribuicoesDb } = useAtribuicoes(turma.id)
  
  const mutationAtribuir = useAtribuirProfessor()
  const mutationRemover = useRemoverAtribuicao()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState('')
  const [selectedProfessorId, setSelectedProfessorId] = useState('')
  const [cargaHoraria, setCargaHoraria] = useState(4)

  const [professorDetails, setProfessorDetails] = useState<any>(null)
  const [atribuicaoParaRemover, setAtribuicaoParaRemover] = useState<any>(null)

  const atribuicoes = atribuicoesDb || []
  const professores = todosProfessores || []
  const disciplinas = todasDisciplinas || []

  // Disciplinas sem professor atribuído
  const disciplinasSemProfessor = disciplinas.filter(d => 
    !atribuicoes.some((at: any) => at.disciplina_id === d.id)
  )

  const handleAtribuir = async () => {
    if (!selectedDisciplinaId || !selectedProfessorId) {
      toast.error('Selecione disciplina e professor')
      return
    }
    try {
      await mutationAtribuir.mutateAsync({
        tenant_id: authUser?.tenantId,
        turma_id: turma.id,
        disciplina_id: selectedDisciplinaId,
        professor_id: selectedProfessorId,
        carga_horaria_semanal: cargaHoraria,
        status: 'ativo'
      })
      toast.success('Professor atribuído!')
      setIsModalOpen(false)
      setSelectedDisciplinaId('')
      setSelectedProfessorId('')
      setCargaHoraria(4)
    } catch {
      toast.error('Erro ao atribuir professor')
    }
  }

  const handleRemoverConfirm = async () => {
    if (!atribuicaoParaRemover) return
    try {
      await mutationRemover.mutateAsync(atribuicaoParaRemover.id)
      toast.success('Vínculo removido!')
      setAtribuicaoParaRemover(null)
    } catch {
      toast.error('Erro ao remover vínculo')
    }
  }

  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      
      {/* List of current assignments */}
      <div className="flex flex-col gap-3">
        {loadingProfessores ? (
          <div className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-300" />
          </div>
        ) : atribuicoes.length === 0 && disciplinasSemProfessor.length === 0 ? (
          <div className="py-12 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] border border-dashed border-slate-200 text-center">
            <GraduationCap className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nenhum professor ou disciplina na base.</p>
          </div>
        ) : null}

        {atribuicoes.map((at: any) => {
          const professor = professores.find((p: any) => p.id === at.professor_id)
          const disciplina = disciplinas.find((d: any) => d.id === at.disciplina_id)
          if (!professor || !disciplina) return null

          return (
            <div 
              key={at.id} 
              className="p-4 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden"
            >
               <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border border-slate-100 shadow-sm">
                    <AvatarImage src={professor.avatar_url} />
                    <AvatarFallback className="bg-indigo-50 text-indigo-600 font-black text-sm">
                      {professor.nome[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-800 dark:text-white tracking-tight text-[13px] uppercase truncate">{professor.nome}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <BookOpen size={10} className="text-indigo-400" />
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{disciplina.nome}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-1.5 rounded-sm">
                        <Clock size={10} className="text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{at.carga_horaria_semanal}h</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setProfessorDetails({ professor, disciplina, atribuicao: at })}
                      className="h-10 w-10 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 shrink-0 transition-colors"
                    >
                      <Eye size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setAtribuicaoParaRemover(at)}
                      className="h-10 w-10 text-rose-400 hover:text-rose-600 hover:bg-rose-50 shrink-0 transition-colors"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
               </div>
            </div>
          )
        })}

        {/* Pending Disciplines */}
        {disciplinasSemProfessor.length > 0 && (
          <div className="mt-4 space-y-3">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 ml-1 flex items-center gap-2">
                <AlertTriangle size={12} /> Disciplinas sem Professor
             </h4>
             {disciplinasSemProfessor.map((d: any) => (
                <div key={d.id} className="p-4 bg-amber-50/50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-[1.5rem] flex items-center justify-between">
                  <div>
                    <h5 className="font-black text-[12px] text-amber-900 dark:text-amber-100 uppercase tracking-tighter">{d.nome}</h5>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => {
                      setSelectedDisciplinaId(d.id)
                      setIsModalOpen(true)
                    }}
                    className="h-8 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-[9px] uppercase tracking-widest px-3"
                  >
                    Atribuir
                  </Button>
                </div>
             ))}
          </div>
        )}
      </div>

      <BottomSheet 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Atribuir Professor" 
        size="half"
      >
        <div className="pt-2 pb-32 space-y-4 px-1">
           <div className="space-y-2.5">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Disciplina</label>
             <div className="h-14 w-full rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 shadow-inner flex items-center px-4">
               <span className="text-[13px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">
                 {disciplinas.find((d: any) => d.id === selectedDisciplinaId)?.nome || ''}
               </span>
             </div>
           </div>
           
           <div className="space-y-2.5">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Professor</label>
             <Select value={selectedProfessorId} onValueChange={setSelectedProfessorId}>
               <SelectTrigger className="w-full h-14 rounded-2xl text-[13px] font-bold bg-slate-50/70 border-0 shadow-inner">
                 <SelectValue placeholder="Selecione..." />
               </SelectTrigger>
               <SelectContent className="w-full rounded-2xl border-slate-100 shadow-xl">
                 {professores.map((p: any) => (
                    <SelectItem key={p.id} value={p.id} className="font-bold py-3 text-[13px]">{p.nome}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>

           <div className="space-y-2.5">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Carga Horária (Aulas/Semana)</label>
             <div className="relative w-full">
               <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
               <Input 
                 type="number" 
                 inputMode="numeric"
                 value={cargaHoraria} 
                 onChange={(e) => setCargaHoraria(Number(e.target.value))}
                 className="w-full h-14 rounded-2xl text-base font-black pl-11 bg-slate-50/70 dark:bg-slate-800/70 border-0 shadow-inner"
               />
             </div>
           </div>

           {/* Fixed Footer for safe-area usability */}
           <div className="fixed bottom-0 left-0 right-0 px-6 pt-5 pb-[calc(1.75rem+env(safe-area-inset-bottom))] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800 z-50">
             <Button 
               onClick={handleAtribuir}
               disabled={mutationAtribuir.isPending}
               className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-indigo-100"
             >
               {mutationAtribuir.isPending ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : 'Confirmar Vínculo'}
             </Button>
           </div>
        </div>
      </BottomSheet>

      {/* Professor Details Modal */}
      <BottomSheet isOpen={!!professorDetails} onClose={() => setProfessorDetails(null)} title="Perfil do Professor" size="half">
        {professorDetails && (
          <div className="pt-4 pb-32 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-24 w-24 border-4 border-slate-50 shadow-md">
                <AvatarImage src={professorDetails.professor.avatar_url} />
                <AvatarFallback className="bg-indigo-50 text-indigo-600 font-black text-2xl">
                  {professorDetails.professor.nome[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {professorDetails.professor.nome}
                </h3>
                <Badge className="bg-indigo-50 text-indigo-600 border-0 text-[10px] font-black uppercase tracking-widest mt-1">
                  Ativo na Plataforma
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6 px-4">
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1">
                <BookOpen className="h-5 w-5 text-indigo-400 mb-1" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Disciplina Atual</span>
                <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 uppercase truncate w-full">
                  {professorDetails.disciplina.nome}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1">
                <Clock className="h-5 w-5 text-slate-400 mb-1" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Carga Horária</span>
                <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 uppercase truncate w-full">
                  {professorDetails.atribuicao.carga_horaria_semanal} aulas/sem
                </p>
              </div>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Remove Assignment Modal */}
      <BottomSheet isOpen={!!atribuicaoParaRemover} onClose={() => setAtribuicaoParaRemover(null)} title="Remover Vínculo" size="peek">
        <div className="space-y-7 pt-4 text-center pb-32">
          <div className="h-20 w-20 bg-rose-50 dark:bg-rose-900/40 rounded-xl flex items-center justify-center mx-auto">
            <AlertTriangle className="h-10 w-10 text-rose-500" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
              Remover este professor?
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-3 max-w-[260px] mx-auto leading-relaxed italic">
              O professor não lecionará mais esta disciplina na turma.
            </p>
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800">
            <div className="mx-auto w-full px-6 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex gap-3">
              <Button
                variant="outline"
                onClick={() => setAtribuicaoParaRemover(null)}
                className="flex-1 h-14 rounded-xl font-bold text-[13px] uppercase tracking-widest border-slate-200"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRemoverConfirm}
                disabled={mutationRemover.isPending}
                className="flex-1 h-14 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[13px] uppercase tracking-widest shadow-lg shadow-rose-200"
              >
                 {mutationRemover.isPending ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      </BottomSheet>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: GRADE HORÁRIA
// ─────────────────────────────────────────────────────────────────────────────
function TabGrade({ turma }: { turma: Turma }) {
  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      <div className="p-8 mt-4 text-center bg-indigo-50/50 dark:bg-indigo-900/20 rounded-[2rem] border border-dashed border-indigo-200 dark:border-indigo-800">
        <CalendarDays size={40} className="mx-auto text-indigo-400 mb-4" />
        <h3 className="text-[15px] font-black text-indigo-900 dark:text-indigo-100 uppercase tracking-tight mb-2">
          Gestão de Grade Escolar
        </h3>
        <p className="text-[11px] font-bold text-indigo-600/70 dark:text-indigo-400/80 uppercase tracking-widest leading-relaxed">
          Para gerenciar e configurar a grade horária completa desta turma, por favor, utilize o sistema acessando a versão Web pelo seu computador.
        </p>
      </div>
    </div>
  )
}

