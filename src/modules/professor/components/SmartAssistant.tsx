import React, { useState } from 'react'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, 
  AlertCircle, 
  TrendingDown, 
  Stethoscope, 
  Cake, 
  ChevronRight,
  BookOpen,
  Award,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ==========================================
// TIPAGENS 
// ==========================================

export type InsightType = 'urgent' | 'anomaly' | 'update' | 'positive' | 'bncc' | 'pos-reinforcement' | 'pedagogic-alert'

export type DailyInsight = {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  actionLabel?: string;
  actionCallback?: () => void;
  // Fase 2.0 - Ações de 1-Clique
  secondaryActionLabel?: string;
  secondaryActionCallback?: () => void;
  suggestedBNCCCode?: string;
  messageTemplate?: 'elogio' | 'alerta';
  alunoId?: string;
  alunoNome?: string;
}

interface SmartAssistantProps {
  insights: DailyInsight[]
  professorName: string
  onApplyBNCC?: (code: string) => void
  onOpenMessaging?: (config: { template: 'elogio' | 'alerta'; alunoId: string; message: string }) => void
}

const InsightIcon = ({ type }: { type: InsightType }) => {
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

const InsightCardStyles = {
  urgent: "bg-red-50 border-red-100",
  anomaly: "bg-amber-50 border-amber-100",
  update: "bg-blue-50 border-blue-100",
  positive: "bg-emerald-50 border-emerald-100",
  bncc: "bg-slate-50 border-slate-200",
  'pos-reinforcement': "bg-emerald-50 border-emerald-100",
  'pedagogic-alert': "bg-amber-50 border-amber-100",
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export function SmartAssistant({ 
  insights, 
  professorName,
  onApplyBNCC,
  onOpenMessaging
}: SmartAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasOpenedToday, setHasOpenedToday] = useState(false)

  // Conta apenas ações urgentes para o badge
  const urgentCount = insights.filter(i => i.type === 'urgent').length
  const showBadge = urgentCount > 0 && !hasOpenedToday

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && !hasOpenedToday) {
      setHasOpenedToday(true)
    }
  }

  // Ordena os insights por prioridade
  const sortedInsights = [...insights].sort((a, b) => {
    const priority = { 'urgent': 1, 'pedagogic-alert': 2, 'bncc': 3, 'pos-reinforcement': 4, 'anomaly': 5, 'update': 6, 'positive': 7 }
    return (priority[a.type as keyof typeof priority] || 99) - (priority[b.type as keyof typeof priority] || 99)
  })

  // Saudação contextual
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <>
      {/* FAB - Botão Flutuante */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => handleOpenChange(true)}
          className={cn(
            "relative flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-2xl transition-transform hover:scale-105 active:scale-95",
            "outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-zinc-900"
          )}
          aria-label="Assistente Pessoal do Professor"
        >
          <Sparkles className="h-6 w-6" />
          
          {showBadge && (
            <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in">
              {urgentCount}
            </div>
          )}
        </button>
      </div>

      {/* Drawer / Bottom Sheet */}
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col bg-zinc-50 border-l border-zinc-200"
        >
          {/* Header da Gaveta */}
          <SheetHeader className="p-6 pb-4 bg-white border-b border-zinc-100 flex-none sticky top-0 z-10 text-left">
            <SheetTitle className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Assistente Pessoal
            </SheetTitle>
            <div className="mt-2">
              <p className="text-lg font-medium text-zinc-800">
                {greeting}, Prof. {professorName.split(' ')[0]}
              </p>
              <p className="text-sm font-medium text-zinc-500 capitalize">
                {todayFormatted}
              </p>
            </div>
          </SheetHeader>

          {/* Lista de Insights (Scrollável) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
            {insights.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                <Sparkles className="w-8 h-8 text-zinc-300 mb-3" />
                <p className="text-sm font-medium text-zinc-500">
                  Tudo em dia! Sem novos alertas no momento.
                </p>
              </div>
            ) : (
              sortedInsights.map((insight) => (
                <div 
                  key={insight.id}
                  className={cn(
                    "flex flex-col p-4 rounded-2xl border bg-white shadow-sm transition-all",
                    InsightCardStyles[insight.type as keyof typeof InsightCardStyles]
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      <InsightIcon type={insight.type as InsightType} />
                    </div>
                    
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-[15px] text-zinc-900 leading-tight">
                          {insight.title}
                        </h4>
                        {insight.type === 'urgent' && (
                          <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase font-bold tracking-wider shrink-0 bg-red-600">
                            Urgente
                          </Badge>
                        )}
                        {insight.type === 'update' && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] uppercase font-bold tracking-wider shrink-0 bg-blue-100 text-blue-700">
                            Novo
                          </Badge>
                        )}
                        {insight.type === 'pedagogic-alert' && (
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px] uppercase font-bold tracking-wider shrink-0 border-amber-200 text-amber-700 bg-amber-50">
                            Atenção
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-[14px] text-zinc-600 leading-snug">
                        {insight.description}
                      </p>
                      
                      {/* Bloco de Botões de Ação */}
                      <div className="pt-2 flex flex-wrap gap-2">
                        {insight.actionLabel && (
                          <Button 
                            variant={insight.type === 'urgent' ? 'default' : 'secondary'}
                            size="sm"
                            onClick={() => {
                              if (insight.type === 'bncc' && insight.suggestedBNCCCode && onApplyBNCC) {
                                onApplyBNCC(insight.suggestedBNCCCode)
                              } else if (insight.messageTemplate && insight.alunoId && onOpenMessaging) {
                                const baseMsg = insight.messageTemplate === 'elogio' 
                                  ? `Olá responsável! O aluno ${insight.alunoNome || '[Nome]'} teve uma excelente evolução acadêmica recentemente. Parabéns pelo desempenho!`
                                  : `Olá responsável. Notei uma queda de rendimento recente do aluno ${insight.alunoNome || '[Nome]'} em minhas atividades. Seria bom conversarmos.`
                                
                                onOpenMessaging({ 
                                  template: insight.messageTemplate, 
                                  alunoId: insight.alunoId,
                                  message: baseMsg 
                                })
                              } else {
                                insight.actionCallback?.()
                              }
                              setIsOpen(false)
                            }}
                            className={cn(
                              "h-9 text-xs font-bold rounded-xl",
                              insight.type === 'urgent' && "bg-red-600 hover:bg-red-700 text-white",
                              insight.type === 'pos-reinforcement' && "bg-emerald-600 hover:bg-emerald-700 text-white"
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
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
