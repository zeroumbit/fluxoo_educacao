import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
Sheet,
SheetContent,
SheetHeader,
SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AnimatePresence,motion } from 'framer-motion'
import {
Activity,
AlertCircle,
AlertTriangle,
Award,
BookOpen,
Cake,
CalendarCheck,
ChevronRight,
ClipboardList,
Sparkles,
Stethoscope,
TrendingDown,
Users,
X,
} from 'lucide-react'
import { useState } from 'react'

export type InsightType = 'urgent' | 'anomaly' | 'update' | 'positive' | 'bncc' | 'pos-reinforcement' | 'pedagogic-alert'
export type InsightGroup = 'now' | 'pending' | 'alert' | 'class-health' | 'done'

export type DailyInsight = {
  id: string
  type: InsightType
  group?: InsightGroup
  title: string
  description: string
  actionLabel?: string
  actionCallback?: () => void
  secondaryActionLabel?: string
  secondaryActionCallback?: () => void
  suggestedBNCCCode?: string
  messageTemplate?: 'elogio' | 'alerta'
  alunoId?: string
  alunoNome?: string
}

export type AssistantSummary = {
  aulasHoje: number
  chamadasPendentes: number
  diariosPendentes: number
  alertasAtivos: number
  turmasAtencao: number
  proximaAula?: {
    turma: string
    disciplina: string
    horario?: string
  }
}

interface SmartAssistantProps {
  insights: DailyInsight[]
  summary?: AssistantSummary
  isLoading?: boolean
  professorName: string
  onApplyBNCC?: (code: string) => void
  onOpenMessaging?: (config: { template: 'elogio' | 'alerta'; alunoId: string; message: string }) => void
}

const groupLabels: Record<InsightGroup, string> = {
  now: 'Agora',
  pending: 'Pendencias',
  alert: 'Alertas',
  'class-health': 'Turmas',
  done: 'Em dia',
}

const groupOrder: InsightGroup[] = ['now', 'pending', 'alert', 'class-health', 'done']

const priority: Record<InsightType, number> = {
  urgent: 1,
  'pedagogic-alert': 2,
  bncc: 3,
  'pos-reinforcement': 4,
  anomaly: 5,
  update: 6,
  positive: 7,
}

const cardMotion = {
  initial: { opacity: 0, y: 14, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.98 },
}

function InsightIcon({ type }: { type: InsightType }) {
  switch (type) {
    case 'urgent':
      return <AlertCircle className="w-5 h-5 text-red-600" />
    case 'anomaly':
      return <TrendingDown className="w-5 h-5 text-amber-600" />
    case 'update':
      return <Stethoscope className="w-5 h-5 text-blue-600" />
    case 'positive':
      return <Cake className="w-5 h-5 text-emerald-600" />
    case 'bncc':
      return <BookOpen className="w-5 h-5 text-slate-600" />
    case 'pos-reinforcement':
      return <Award className="w-5 h-5 text-emerald-600" />
    case 'pedagogic-alert':
      return <AlertTriangle className="w-5 h-5 text-amber-600" />
    default:
      return <Sparkles className="w-5 h-5 text-zinc-600" />
  }
}

function insightCardStyle(type: InsightType) {
  const styles: Record<InsightType, string> = {
    urgent: 'bg-red-50 border-red-100 ring-1 ring-red-100',
    anomaly: 'bg-amber-50 border-amber-100',
    update: 'bg-blue-50 border-blue-100',
    positive: 'bg-emerald-50 border-emerald-100',
    bncc: 'bg-slate-50 border-slate-200',
    'pos-reinforcement': 'bg-emerald-50 border-emerald-100',
    'pedagogic-alert': 'bg-amber-50 border-amber-100',
  }

  return styles[type]
}

function InsightBadge({ type }: { type: InsightType }) {
  if (type === 'urgent') {
    return (
      <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase font-bold tracking-wider shrink-0 bg-red-600">
        Urgente
      </Badge>
    )
  }

  if (type === 'pedagogic-alert') {
    return (
      <Badge variant="outline" className="h-5 px-1.5 text-[10px] uppercase font-bold tracking-wider shrink-0 border-amber-200 text-amber-700 bg-amber-50">
        Atencao
      </Badge>
    )
  }

  if (type === 'update') {
    return (
      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] uppercase font-bold tracking-wider shrink-0 bg-blue-100 text-blue-700">
        Hoje
      </Badge>
    )
  }

  return null
}

export function SmartAssistant({
  insights,
  summary,
  isLoading = false,
  professorName,
  onApplyBNCC,
  onOpenMessaging,
}: SmartAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasOpenedToday, setHasOpenedToday] = useState(false)

  const urgentCount = insights.filter(i => i.type === 'urgent' || i.type === 'pedagogic-alert').length
  const showBadge = urgentCount > 0 && !hasOpenedToday

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && !hasOpenedToday) setHasOpenedToday(true)
  }

  const sortedInsights = [...insights].sort((a, b) => (priority[a.type] || 99) - (priority[b.type] || 99))
  const groupedInsights = groupOrder
    .map(group => ({
      group,
      items: sortedInsights.filter(insight => (insight.group || 'alert') === group),
    }))
    .filter(section => section.items.length > 0)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  const executeInsightAction = (insight: DailyInsight) => {
    if (insight.type === 'bncc' && insight.suggestedBNCCCode && onApplyBNCC) {
      onApplyBNCC(insight.suggestedBNCCCode)
    } else if (insight.messageTemplate && insight.alunoId && onOpenMessaging) {
      const message = insight.messageTemplate === 'elogio'
        ? `O aluno ${insight.alunoNome || '[Nome]'} teve uma excelente evolucao academica recentemente.`
        : `Notei uma queda de rendimento recente do aluno ${insight.alunoNome || '[Nome]'} nas atividades.`

      onOpenMessaging({
        template: insight.messageTemplate,
        alunoId: insight.alunoId,
        message,
      })
    } else {
      insight.actionCallback?.()
    }

    setIsOpen(false)
  }

  return (
    <>
      <motion.div
        className="fixed bottom-10 right-6 z-30"
        initial={{ opacity: 0, y: 18, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      >
        <motion.button
          onClick={() => handleOpenChange(true)}
          className={cn(
            'relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-white shadow-2xl',
            'outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-zinc-900'
          )}
          whileHover={{ scale: 1.06, rotate: -2 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Assistente Pessoal do Professor"
        >
          <motion.span
            className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-zinc-900 to-blue-700 opacity-80"
            animate={{ rotate: [0, 8, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.span
            className="absolute -inset-6 bg-white/20 blur-xl"
            animate={{ x: ['-60%', '60%'], opacity: [0, 0.8, 0] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.span
            animate={{ rotate: [0, 12, -8, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            <Sparkles className="h-6 w-6" />
          </motion.span>

          <AnimatePresence>
            {showBadge && (
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 20 }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white"
              >
                {urgentCount}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col bg-zinc-50 border-l border-zinc-200">
          <SheetHeader className="p-6 pb-4 bg-white border-b border-zinc-100 flex-none sticky top-0 z-10 text-left">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <SheetTitle className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                <motion.span
                  animate={{ rotate: [0, 10, -6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                </motion.span>
                Assistente Pessoal
              </SheetTitle>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-zinc-100" onClick={() => handleOpenChange(false)}>
                <X className="w-5 h-5 text-zinc-500" />
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2">
              <p className="text-lg font-medium text-zinc-800">
                {greeting}, Prof. {professorName.split(' ')[0]}
              </p>
              <p className="text-sm font-medium text-zinc-500 capitalize">
                {todayFormatted}
              </p>
            </motion.div>

            {summary && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-5 grid grid-cols-3 gap-2"
              >
                <SummaryTile icon={CalendarCheck} label="Aulas" value={summary.aulasHoje} tone="zinc" />
                <SummaryTile icon={ClipboardList} label="Pend." value={summary.chamadasPendentes + summary.diariosPendentes} tone="amber" />
                <SummaryTile icon={Activity} label="Alertas" value={summary.alertasAtivos} tone="red" />
              </motion.div>
            )}

            {summary?.proximaAula && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.16, type: 'spring', stiffness: 300, damping: 24 }}
                className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Proxima aula</p>
                </div>
                <p className="mt-1 text-sm font-bold text-indigo-950">
                  {summary.proximaAula.horario ? `${summary.proximaAula.horario} - ` : ''}{summary.proximaAula.disciplina}
                </p>
                <p className="text-xs font-medium text-indigo-700">{summary.proximaAula.turma}</p>
              </motion.div>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <motion.div key="loading" className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {[1, 2, 3].map(item => (
                    <div key={item} className="h-28 animate-pulse rounded-2xl bg-white border border-zinc-100" />
                  ))}
                </motion.div>
              ) : insights.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="flex flex-col items-center justify-center h-40 text-center px-4"
                >
                  <Sparkles className="w-8 h-8 text-zinc-300 mb-3" />
                  <p className="text-sm font-medium text-zinc-500">Tudo em dia. Sem novos alertas no momento.</p>
                </motion.div>
              ) : (
                groupedInsights.map((section, sectionIndex) => (
                  <motion.section
                    key={section.group}
                    layout
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: sectionIndex * 0.04 }}
                  >
                    <p className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                      {groupLabels[section.group]}
                    </p>

                    {section.items.map((insight, index) => (
                      <motion.div
                        key={insight.id}
                        layout
                        {...cardMotion}
                        transition={{ type: 'spring', stiffness: 360, damping: 28, delay: index * 0.035 }}
                        whileHover={{ y: -2 }}
                        className={cn('flex flex-col p-4 rounded-2xl border bg-white shadow-sm transition-colors', insightCardStyle(insight.type))}
                      >
                        <div className="flex items-start gap-3">
                          <motion.div
                            className="mt-0.5 shrink-0"
                            animate={insight.type === 'urgent' ? { scale: [1, 1.12, 1] } : undefined}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            <InsightIcon type={insight.type} />
                          </motion.div>
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-[15px] text-zinc-900 leading-tight">{insight.title}</h4>
                              <InsightBadge type={insight.type} />
                            </div>
                            <p className="text-[14px] text-zinc-600 leading-snug">{insight.description}</p>

                            <div className="pt-2 flex flex-wrap gap-2">
                              {insight.actionLabel && (
                                <Button
                                  variant={insight.type === 'urgent' ? 'default' : 'secondary'}
                                  size="sm"
                                  onClick={() => executeInsightAction(insight)}
                                  className={cn(
                                    'h-9 text-xs font-bold rounded-xl',
                                    insight.type === 'urgent' && 'bg-red-600 hover:bg-red-700 text-white',
                                    insight.type === 'pos-reinforcement' && 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  )}
                                >
                                  {insight.actionLabel}
                                  <ChevronRight className="w-4 h-4 ml-1 opacity-70" />
                                </Button>
                              )}

                              {insight.secondaryActionLabel && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    insight.secondaryActionCallback?.()
                                    setIsOpen(false)
                                  }}
                                  className="h-9 text-xs font-bold text-zinc-500 rounded-xl hover:bg-zinc-100"
                                >
                                  {insight.secondaryActionLabel}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.section>
                ))
              )}
            </AnimatePresence>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CalendarCheck
  label: string
  value: number
  tone: 'zinc' | 'amber' | 'red'
}) {
  const classes = {
    zinc: 'border-zinc-100 bg-zinc-50 text-zinc-900 [&_svg]:text-zinc-500 [&_small]:text-zinc-400',
    amber: 'border-amber-100 bg-amber-50 text-amber-800 [&_svg]:text-amber-600 [&_small]:text-amber-600',
    red: 'border-red-100 bg-red-50 text-red-800 [&_svg]:text-red-600 [&_small]:text-red-600',
  }

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      className={cn('rounded-2xl border p-3', classes[tone])}
    >
      <Icon className="h-4 w-4" />
      <p className="mt-2 text-lg font-black leading-none">{value}</p>
      <small className="mt-1 block text-[10px] font-bold uppercase tracking-wider">{label}</small>
    </motion.div>
  )
}
