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
    <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-600 to-blue-700 text-white overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
      <CardHeader className="pb-2 border-b border-white/10 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold">Guia de Configuração Inicial</CardTitle>
          <p className="text-xs text-indigo-100">Siga estes passos para começar a usar o Fluxoo Educação</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setDismissed(true)}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
            <span>Seu Progresso</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-white/20" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {steps.map((step) => (
            <Link 
              key={step.id} 
              to={step.href}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl transition-all border",
                step.done 
                  ? "bg-white/10 border-white/20 opacity-70" 
                  : "bg-white border-transparent text-zinc-900 shadow-sm hover:scale-[1.02]"
              )}
            >
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                step.done ? "bg-emerald-500/20 text-emerald-400" : "bg-indigo-50 text-indigo-600"
              )}>
                {step.done ? <CheckCircle2 className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-bold leading-tight", step.done ? "text-white" : "text-zinc-900")}>
                  {step.title}
                </p>
                {!step.done && (
                  <p className="text-[10px] text-zinc-500 mt-1 line-clamp-1">{step.description}</p>
                )}
              </div>
              {!step.done && <ArrowRight className="h-4 w-4 text-zinc-400 shrink-0 self-center" />}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
