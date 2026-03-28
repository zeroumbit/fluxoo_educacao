import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Info,
  Users,
  GraduationCap,
  CalendarDays
} from 'lucide-react'
import { useTurmaStore } from '../store'
import { TabDadosGerais } from './TabDadosGerais'
import { TabAlunos } from './TabAlunos'
import { TabProfessores } from './TabProfessores'
import { TabGradeHoraria } from './TabGradeHoraria'
import { useAuth } from '@/modules/auth/AuthContext'

interface TurmaDetailProps {
  turmaId: string;
  initialTab?: string;
}

export function TurmaDetail({ turmaId, initialTab = 'dados' }: TurmaDetailProps) {
  const { turmas } = useTurmaStore()
  const { authUser } = useAuth()
  const turma = turmas.find(t => t.id === turmaId)

  if (!turma) return null

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="bg-white border border-slate-200 rounded-lg p-1 h-auto mb-6 inline-flex gap-1">
          <TabsTrigger
            value="dados"
            className="rounded-md px-4 py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-slate-600 font-bold text-sm transition-all"
          >
            <Info size={16} className="mr-2" />
            Dados Gerais
          </TabsTrigger>
          {!authUser?.isProfessor && (
            <>
              <TabsTrigger
                value="alunos"
                className="rounded-md px-4 py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-slate-600 font-bold text-sm transition-all"
              >
                <Users size={16} className="mr-2" />
                Alunos
              </TabsTrigger>
              <TabsTrigger
                value="professores"
                className="rounded-md px-4 py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-slate-600 font-bold text-sm transition-all"
              >
                <GraduationCap size={16} className="mr-2" />
                Professores
              </TabsTrigger>
              <TabsTrigger
                value="grade"
                className="rounded-md px-4 py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-slate-600 font-bold text-sm transition-all"
              >
                <CalendarDays size={16} className="mr-2" />
                Grade Horária
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="dados" className="mt-0 focus-visible:ring-0">
          <TabDadosGerais turma={turma} />
        </TabsContent>

        {!authUser?.isProfessor && (
          <>
            <TabsContent value="alunos" className="mt-0 focus-visible:ring-0">
              <TabAlunos turmaId={turma.id} />
            </TabsContent>

            <TabsContent value="professores" className="mt-0 focus-visible:ring-0">
              <TabProfessores turmaId={turma.id} />
            </TabsContent>

            <TabsContent value="grade" className="mt-0 focus-visible:ring-0">
              <TabGradeHoraria turmaId={turma.id} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
