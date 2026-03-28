import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  Calendar,
  Settings,
  BookOpen,
  Clock,
  DollarSign,
  ChevronRight
} from 'lucide-react'
import type { Turma } from '../types'
import { cn } from '@/lib/utils'
import { useAuth } from '@/modules/auth/AuthContext'

interface TurmaCardProps {
  turma: Turma;
  alunosCount: number;
  onViewAlunos: () => void;
  onViewGrade: () => void;
  onManage: () => void;
}

export function TurmaCard({ turma, alunosCount, onViewAlunos, onViewGrade, onManage }: TurmaCardProps) {
  const isAtiva = turma.status === 'ativa'
  const { authUser } = useAuth()

  return (
    <Card className="group border-0 shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
      <CardContent className="p-0">
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 shadow-lg",
                isAtiva
                  ? "bg-gradient-to-br from-teal-400 to-emerald-500 shadow-teal-200/50"
                  : "bg-gradient-to-br from-slate-300 to-slate-400 shadow-slate-200/50"
              )}>
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1">
                  {turma.nome}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border-0",
                    isAtiva ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                  )}>
                    {isAtiva ? 'Ativa' : 'Inativa'}
                  </Badge>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {turma.turno}
                  </span>
                </div>
              </div>
            </div>
            {!authUser?.isProfessor && (
              <button
                onClick={onManage}
                className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100/50">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-3 w-3 text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário</span>
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {turma.horario_inicio && turma.horario_fim 
                  ? `${turma.horario_inicio} - ${turma.horario_fim}` 
                  : ((turma as any).horario || turma.sala || '—')}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100/50">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-3 w-3 text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alunos</span>
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {alunosCount}/{turma.capacidade_maxima || 30} <span className="text-[10px] text-slate-400 font-medium">({(turma.capacidade_maxima || 30) - alunosCount} vagas)</span>
              </p>
            </div>
          </div>

          {!authUser?.isProfessor && (
          <div className="flex items-center justify-between px-1">
             <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {turma.valor_mensalidade
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(turma.valor_mensalidade)
                    : 'R$ 0,00'}
                </span>
             </div>
             <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                <div
                   className="h-full bg-indigo-500 rounded-full"
                   style={{ width: `${Math.min(100, (alunosCount / (turma.capacidade_maxima || 30)) * 100)}%` }}
                />
             </div>
          </div>
          )}
        </div>

        <div className="p-3 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2">
           {!authUser?.isProfessor ? (
             <>
               <Button
                variant="ghost"
                size="sm"
                onClick={onViewAlunos}
                className="rounded-xl h-11 font-bold text-xs gap-2 hover:bg-white hover:shadow-sm"
               >
                  <Users size={16} className="text-indigo-500" />
                  Alunos
               </Button>
               <Button
                variant="ghost"
                size="sm"
                onClick={onViewGrade}
                className="rounded-xl h-11 font-bold text-xs gap-2 hover:bg-white hover:shadow-sm"
               >
                  <Calendar size={16} className="text-teal-500" />
                  Grade
               </Button>
               <Button
                variant="ghost"
                size="sm"
                onClick={onManage}
                className="rounded-xl h-11 font-bold text-xs gap-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
               >
                  Gerir
                  <ChevronRight size={14} />
               </Button>
             </>
           ) : (
             <Button
              variant="ghost"
              size="sm"
              onClick={onManage}
              className="rounded-xl h-11 font-bold text-xs gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shadow-sm col-span-3"
             >
                <BookOpen size={16} />
                Visualizar Disciplina
                <ChevronRight size={14} />
             </Button>
           )}
        </div>
      </CardContent>
    </Card>
  )
}
