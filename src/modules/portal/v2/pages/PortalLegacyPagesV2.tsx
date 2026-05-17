import { Badge } from '@/components/ui/badge'
import { SeletorAluno } from '@/modules/portal/components/SeletorAluno'
import { usePortalContext } from '@/modules/portal/context'
import { PortalAgendaPage } from '@/modules/portal/pages/PortalAgendaPage'
import { PortalAutorizacoesPage } from '@/modules/portal/pages/PortalAutorizacoesPage'
import { PortalBoletimPage } from '@/modules/portal/pages/PortalBoletimPage'
import { PortalFilaVirtualPage } from '@/modules/portal/pages/PortalFilaVirtualPage'
import { PortalFrequenciaPage } from '@/modules/portal/pages/PortalFrequenciaPage'
import { PortalLivrosPage } from '@/modules/portal/pages/PortalLivrosPage'
import {
  BookOpen,
  CalendarDays,
  CarFront,
  ClipboardCheck,
  GraduationCap,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'

type PortalV2ShellProps = {
  title: string
  subtitle: string
  badge: string
  icon: LucideIcon
  children: ReactNode
}

function PortalV2Shell({ title, subtitle, badge, icon: Icon, children }: PortalV2ShellProps) {
  const { alunoSelecionado, isMultiAluno } = usePortalContext()

  return (
    <div className="space-y-6 pb-8 md:pb-0 animate-in fade-in duration-500">
      <header className="rounded-[28px] md:rounded-[32px] bg-white border border-slate-100 shadow-sm p-5 md:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <Badge className="mb-2 bg-slate-900 text-white border-0 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                {badge}
              </Badge>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                {title}
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1 max-w-2xl">
                {subtitle}
                {alunoSelecionado?.nome_completo ? ` de ${alunoSelecionado.nome_social || alunoSelecionado.nome_completo}` : ''}
              </p>
            </div>
          </div>

          {isMultiAluno && (
            <div className="w-full xl:w-[320px]">
              <SeletorAluno />
            </div>
          )}
        </div>
      </header>

      {children}
    </div>
  )
}

export function PortalFrequenciaV2() {
  return (
    <PortalV2Shell
      title="Frequência"
      subtitle="Acompanhe presença, faltas e justificativas"
      badge="Acadêmico"
      icon={ClipboardCheck}
    >
      <PortalFrequenciaPage hideHeader />
    </PortalV2Shell>
  )
}

export function PortalBoletimV2() {
  return (
    <PortalV2Shell
      title="Boletim"
      subtitle="Veja médias, faltas e resultados por bimestre"
      badge="Notas"
      icon={GraduationCap}
    >
      <PortalBoletimPage hideHeader />
    </PortalV2Shell>
  )
}

export function PortalAgendaV2() {
  return (
    <PortalV2Shell
      title="Agenda"
      subtitle="Eventos, reuniões, provas e datas importantes"
      badge="Calendário"
      icon={CalendarDays}
    >
      <PortalAgendaPage hideHeader />
    </PortalV2Shell>
  )
}

export function PortalFilaVirtualV2() {
  return (
    <PortalV2Shell
      title="Fila Virtual"
      subtitle="Avise a escola quando estiver chegando para buscar o aluno"
      badge="Retirada"
      icon={CarFront}
    >
      <PortalFilaVirtualPage hideHeader />
    </PortalV2Shell>
  )
}

export function PortalLivrosV2() {
  return (
    <PortalV2Shell
      title="Livros e Materiais"
      subtitle="Consulte o acervo e os materiais vinculados à turma"
      badge="Acervo"
      icon={BookOpen}
    >
      <PortalLivrosPage hideHeader />
    </PortalV2Shell>
  )
}

export function PortalAutorizacoesV2() {
  return (
    <PortalV2Shell
      title="Autorizações"
      subtitle="Gerencie consentimentos e termos do aluno"
      badge="LGPD"
      icon={ShieldCheck}
    >
      <PortalAutorizacoesPage hideHeader />
    </PortalV2Shell>
  )
}
