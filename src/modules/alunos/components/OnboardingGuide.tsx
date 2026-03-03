import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, ArrowRight, X, Building2, BookOpen, Users, UserCog } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface OnboardingGuideProps {
  status: {
    perfilCompleto: boolean
    possuiFilial: boolean
    possuiTurma: boolean
    possuiAluno: boolean
  }
}

export function OnboardingGuide({ status }: OnboardingGuideProps) {
  const [dismissed, setDismissed] = useState(false)

  const steps = [
    {
      id: 'perfil',
      title: 'Completar Perfil da Escola',
      description: 'Preencha os dados cadastrais e endereço da instituição.',
      href: '/perfil-escola',
      done: status.perfilCompleto,
      icon: UserCog,
    },
    {
      id: 'filial',
      title: 'Verificar Unidades/Filiais',
      description: 'Sua matriz foi criada, verifique os dados ou adicione novas unidades.',
      href: '/filiais',
      done: status.possuiFilial,
      icon: Building2,
    },
    {
      id: 'turma',
      title: 'Criar Primeira Turma',
      description: 'Cadastre as turmas para organizar seus alunos.',
      href: '/turmas',
      done: status.possuiTurma,
      icon: BookOpen,
    },
    {
      id: 'aluno',
      title: 'Cadastrar Primeiro Aluno',
      description: 'Inicie a gestão acadêmica registrando seu primeiro aluno.',
      href: '/alunos/novo',
      done: status.possuiAluno,
      icon: Users,
    },
  ]

  const totalSteps = steps.length
  const completedSteps = steps.filter((s) => s.done).length
  const progressPercent = (completedSteps / totalSteps) * 100
  const allDone = completedSteps === totalSteps

  if (allDone || dismissed) return null

  return (
    <Card className="border border-zinc-100 shadow-sm bg-white overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 rounded-[2rem]">
      <CardHeader className="pb-4 border-b border-zinc-50 flex flex-row items-center justify-between px-8 pt-8">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black text-zinc-900 tracking-tight">Guia de Configuração Inicial</CardTitle>
          <p className="text-sm text-zinc-500 font-medium">Siga estes passos para começar a usar o Fluxoo Educação</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setDismissed(true)}
          className="text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full h-10 w-10 transition-all"
        >
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="space-y-3">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            <span>Seu Progresso de Configuração</span>
            <span className="text-indigo-600">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-1.5 bg-zinc-100" indicatorClassName="bg-indigo-600 transition-all duration-1000" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <Link 
              key={step.id} 
              to={step.href}
              className={cn(
                "group relative flex flex-col p-6 transition-all duration-300 border-2",
                step.done 
                  ? "bg-zinc-50/50 border-zinc-100 opacity-60" 
                  : "bg-white border-zinc-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1",
                "rounded-[1.5rem]"
              )}
            >
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 shadow-sm",
                step.done 
                  ? "bg-emerald-50 text-emerald-600" 
                  : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
              )}>
                {step.done ? <CheckCircle2 className="h-6 w-6" /> : <step.icon className="h-6 w-6" />}
              </div>
              
              <div className="space-y-1">
                <h4 className={cn(
                  "text-sm font-bold leading-tight tracking-tight",
                  step.done ? "text-zinc-500" : "text-zinc-900"
                )}>
                  {step.title}
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2">
                  {step.description}
                </p>
              </div>

              {!step.done && (
                <div className="mt-4 flex items-center text-[10px] font-bold text-indigo-600 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                  Começar agora <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              )}
              
              {step.done && (
                <div className="absolute top-4 right-4 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
