import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Users, DollarSign, CalendarCheck, Pencil, TrendingUp, Calculator, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Turma } from '../types'
import { useDisciplinas, useProfessoresTurma, useAtribuicoes, useGradeTurma, useTurmaBilling, useContarAlunosTurma } from '../hooks'
import { useAuth } from '@/modules/auth/AuthContext'
import { toast } from 'sonner'
import { MensalidadeLoteDialog } from './MensalidadeLoteDialog'
import { cn } from '@/lib/utils'

interface TabDadosGeraisProps {
  turma: Turma;
}

export function TabDadosGerais({ turma }: TabDadosGeraisProps) {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const [isMensalidadeDialogOpen, setIsMensalidadeDialogOpen] = useState(false)
  const isAtiva = turma.status === 'ativa'
  
  const { data: dbAtribuicoes = [] } = useAtribuicoes(turma.id)
  const { data: dbGrade = [] } = useGradeTurma(turma.id)
  const { data: realTotalAlunos = 0 } = useContarAlunosTurma(turma.id)
  const { isUpdating } = useTurmaBilling()

  const atribuicoes = (dbAtribuicoes || []) as any[]
  const gradeItems = (dbGrade || []) as any[]

  // Calculate real counts from actual data
  // 1. Unique disciplines assigned to this turma
  const disciplinasNaTurma = new Set(atribuicoes.map((at: any) => at.disciplina_id))
  // 2. Unique professors assigned to this turma
  const professoresNaTurma = new Set(atribuicoes.map((at: any) => at.professor_id))
  // 3. Weekly classes from schedule
  const totalAulasSemana = gradeItems.length

  const numDisciplinas = disciplinasNaTurma.size
  const numProfessores = professoresNaTurma.size

  // Capacity logic
  const totalAlunos = realTotalAlunos
  const capacidadeMaxima = turma.max_alunos ?? turma.capacidade_maxima ?? turma.capacidade ?? 0
  const vagasDisponiveis = Math.max(0, capacidadeMaxima - totalAlunos)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Informações Principais */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Informações da Turma</h3>
                <p className="text-slate-400 text-xs font-medium">Dados fundamentais e capacidade</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl h-10 font-bold text-xs gap-2 border-slate-100">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome da Turma</p>
                <p className="text-lg font-black text-slate-800 leading-none">{turma.nome}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Turno</p>
                <div className="flex pt-1">
                    <Badge className="bg-indigo-50 border-indigo-100/50 text-indigo-600 font-black text-[10px] px-3 py-1 uppercase tracking-widest rounded-lg">
                    {turma.turno || 'Não definido'}
                    </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sala / Espaço</p>
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-2 w-2 rounded-full bg-slate-300" />
                  <p className="text-base font-black text-slate-700 leading-none">{turma.sala || '—'}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ocupação / Capacidade</p>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex -space-x-1">
                     {[...Array(Math.min(3, totalAlunos))].map((_, i) => (
                        <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                            <Users size={10} className="text-slate-400" />
                        </div>
                     ))}
                  </div>
                  <p className="text-base font-black text-slate-800 leading-none">
                    {totalAlunos} / {capacidadeMaxima} <span className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">alunos</span>
                  </p>
                </div>
                <div className="pt-1">
                    {vagasDisponiveis > 0 ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 uppercase tracking-widest">
                            {vagasDisponiveis} vagas disponíveis
                        </span>
                    ) : capacidadeMaxima > 0 ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-50 text-red-500 uppercase tracking-widest">
                            Turma Lotada
                        </span>
                    ) : null}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mensalidade</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">
                    {turma.valor_mensalidade 
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(turma.valor_mensalidade)
                      : 'Sob consulta'
                    }
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status Acadêmico</p>
                <div className="flex pt-1">
                    <Badge className={cn(
                        "font-black text-[10px] px-3 py-1 uppercase tracking-widest rounded-lg border",
                        isAtiva 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                            : 'bg-slate-50 border-slate-100 text-slate-400'
                    )}>
                    {turma.status || 'ativa'}
                    </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo da Grade — dados dinâmicos */}
        <Card className="rounded-[2rem] border-0 bg-slate-900 text-white shadow-xl shadow-slate-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <CalendarCheck size={120} className="text-white" />
          </div>
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black tracking-tight">Resumo Acadêmico</h3>
                <p className="text-slate-400 text-sm font-medium">Cronograma e disciplinas vigentes</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Disciplinas</p>
                <p className="text-3xl font-black leading-none">{numDisciplinas}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Vinculadas</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Professores</p>
                <p className="text-3xl font-black leading-none">{numProfessores}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Atuantes</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Aulas/Semana</p>
                <p className="text-3xl font-black leading-none text-emerald-400">{totalAulasSemana}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">No cronograma</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações e Informações Complementares */}
      <div className="space-y-6">
        <Card className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
          <CardContent className="p-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Ações Rápidas</h3>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/frequencia', { state: { turmaId: turma.id } })}
                className="w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest gap-3 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 justify-start px-6"
              >
                <CalendarCheck className="h-4 w-4" />
                Lançar Frequência
              </Button>
              <Button 
                onClick={() => navigate('/notas', { state: { turmaId: turma.id } })}
                className="w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest gap-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-100 shadow-sm justify-start px-6"
              >
                <TrendingUp className="h-4 w-4" />
                Desempenho Geral
              </Button>
              <Button 
                onClick={() => setIsMensalidadeDialogOpen(true)}
                disabled={isUpdating}
                className="w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest gap-3 bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-100 shadow-sm justify-start px-6"
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                Mensalidade em Lote
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
          <CardContent className="p-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Localização Principal</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-inner">
                  <Clock className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-base font-black text-slate-800 leading-tight">{turma.sala || 'Ambiente Externo'}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base de Operações</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <MensalidadeLoteDialog 
        isOpen={isMensalidadeDialogOpen}
        onClose={() => setIsMensalidadeDialogOpen(false)}
        turmaId={turma.id}
        turmaNome={turma.nome}
        valorAtual={turma.valor_mensalidade || undefined}
      />
    </div>
  )
}
