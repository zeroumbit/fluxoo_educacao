import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Info, 
  Users, 
  GraduationCap, 
  CalendarDays,
  FileText,
  MessageSquare,
  BarChart3,
  Pencil
} from 'lucide-react'
import { useTurmaStore } from '../store'
import { TabDadosGerais } from './TabDadosGerais'
import { TabAlunos } from './TabAlunos'
import { TabProfessores } from './TabProfessores'
import { TabGradeHoraria } from './TabGradeHoraria'

interface TurmaDetailProps {
  turmaId: string;
  initialTab?: string;
}

export function TurmaDetail({ turmaId, initialTab = 'dados' }: TurmaDetailProps) {
  const { turmas } = useTurmaStore()
  const turma = turmas.find(t => t.id === turmaId)

  if (!turma) return null

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-[2rem] h-auto mb-8 grid grid-cols-2 md:grid-cols-4 gap-2">
          <TabsTrigger 
            value="dados" 
            className="rounded-[1.5rem] py-4 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 font-black text-xs uppercase tracking-widest gap-2"
          >
            <Info size={16} />
            Dados Gerais
          </TabsTrigger>
          <TabsTrigger 
            value="alunos" 
            className="rounded-[1.5rem] py-4 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 font-black text-xs uppercase tracking-widest gap-2"
          >
            <Users size={16} />
            Alunos
          </TabsTrigger>
          <TabsTrigger 
            value="professores" 
            className="rounded-[1.5rem] py-4 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 font-black text-xs uppercase tracking-widest gap-2"
          >
            <GraduationCap size={16} />
            Professores
          </TabsTrigger>
          <TabsTrigger 
            value="grade" 
            className="rounded-[1.5rem] py-4 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 font-black text-xs uppercase tracking-widest gap-2"
          >
            <CalendarDays size={16} />
            Grade Horária
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="mt-0 focus-visible:ring-0">
          <TabDadosGerais turma={turma} />
        </TabsContent>

        <TabsContent value="alunos" className="mt-0 focus-visible:ring-0">
          <TabAlunos turmaId={turma.id} />
        </TabsContent>

        <TabsContent value="professores" className="mt-0 focus-visible:ring-0">
          <TabProfessores turmaId={turma.id} />
        </TabsContent>

        <TabsContent value="grade" className="mt-0 focus-visible:ring-0">
          <TabGradeHoraria turmaId={turma.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
