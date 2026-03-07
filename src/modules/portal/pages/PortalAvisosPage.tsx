import { useState } from 'react'
import { useAvisosPortal } from '../hooks'
import { usePortalContext } from '../context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Megaphone, BellRing, ChevronDown, ChevronUp, Clock, CheckCircle2 } from 'lucide-react'
import { format, parseISO, isAfter, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { SeletorAluno } from '../components/SeletorAluno'
import { cn } from '@/lib/utils'

// Helper de vigência
function avisoEstaAtivo(aviso: { data_fim?: string | null }): boolean {
  if (!aviso.data_fim) return true
  const hoje = startOfDay(new Date())
  const fim = startOfDay(parseISO(aviso.data_fim))
  return isAfter(fim, hoje) || fim.getTime() === hoje.getTime()
}

// ---------------------------------------------------------------------------
// Card de Aviso — Portal
// ---------------------------------------------------------------------------
interface AvisoPortalCardProps {
  aviso: any
  expirado?: boolean
  expandedId: string | null
  onToggleExpand: (id: string) => void
}

function AvisoPortalCard({ aviso, expirado = false, expandedId, onToggleExpand }: AvisoPortalCardProps) {
  const isGeral = !aviso.turma_id
  const isExpanded = expandedId === aviso.id

  return (
    <Card className={cn(
      'border overflow-hidden transition-all',
      expirado
        ? 'border-slate-100 bg-slate-50/50 opacity-60 hover:opacity-80 shadow-none'
        : 'border-[#E2E8F0] shadow-sm hover:shadow-md bg-white'
    )}>
      <CardContent className="p-0">
        <div className="flex items-stretch">
          {/* Barra lateral colorida */}
          <div className={cn(
            'w-1.5 shrink-0',
            expirado ? 'bg-zinc-200' : (isGeral ? 'bg-[#14B8A6]' : 'bg-[#3B82F6]')
          )} />

          <div className="p-6 flex items-start gap-5 flex-1">
            {/* Ícone */}
            <div className={cn(
              'h-11 w-11 rounded-xl flex items-center justify-center shrink-0',
              expirado ? 'bg-zinc-100' : (isGeral ? 'bg-[#CCFBF1]' : 'bg-blue-50')
            )}>
              {expirado
                ? <Clock className="h-5 w-5 text-zinc-400" />
                : isGeral
                  ? <Megaphone className="h-5 w-5 text-[#14B8A6]" />
                  : <BellRing className="h-5 w-5 text-blue-500" />
              }
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <h3 className={cn(
                  'text-base font-bold leading-tight tracking-tight',
                  expirado ? 'text-slate-400' : 'text-[#1E293B]'
                )}>
                  {aviso.titulo}
                </h3>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn(
                      'whitespace-nowrap px-3 py-1 font-bold text-[10px] uppercase tracking-widest border',
                      expirado
                        ? 'bg-zinc-50 text-zinc-400 border-zinc-200'
                        : isGeral
                          ? 'bg-teal-50 text-[#14B8A6] border-teal-100'
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                    )}
                  >
                    {isGeral ? 'Comunicado Geral' : `Turma: ${aviso.turma?.nome ?? ''}`}
                  </Badge>
                  {expirado && (
                    <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-200 bg-zinc-50">
                      Expirado
                    </Badge>
                  )}
                </div>
              </div>

              <p className={cn(
                'text-sm whitespace-pre-wrap leading-relaxed',
                expirado ? 'text-slate-400' : 'text-[#64748B]',
                !isExpanded ? 'line-clamp-3' : ''
              )}>
                {aviso.conteudo}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-50 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <div className="flex items-center gap-4">
                  <span>
                    Publicado em {format(new Date(aviso.created_at), "dd 'de' MMMM", { locale: ptBR })} às {format(new Date(aviso.created_at), 'HH:mm')}
                  </span>
                  {aviso.data_fim && (
                    <span className={cn(
                      'flex items-center gap-1',
                      expirado ? 'text-red-400' : 'text-amber-500'
                    )}>
                      <Clock className="h-3 w-3" />
                      {expirado ? 'Encerrou' : 'Encerra'} em {format(parseISO(aviso.data_fim), 'dd/MM/yyyy')}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleExpand(aviso.id)}
                  className={cn(
                    'font-bold text-xs rounded-full gap-1 h-7 px-3',
                    expirado ? 'text-zinc-400 hover:bg-zinc-100' : 'text-[#14B8A6] hover:bg-[#F0FDFA]'
                  )}
                >
                  {isExpanded ? (
                    <><span>Ver menos</span><ChevronUp className="h-3.5 w-3.5" /></>
                  ) : (
                    <><span>Ver mais</span><ChevronDown className="h-3.5 w-3.5" /></>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------
export function PortalAvisosPage() {
  const { alunoSelecionado, isMultiAluno } = usePortalContext()
  const { data: avisos, isLoading } = useAvisosPortal()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleToggle = (id: string) => setExpandedId(prev => prev === id ? null : id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#14B8A6]" />
      </div>
    )
  }

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Megaphone className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-[#1E293B]">Selecione um aluno</h2>
      </div>
    )
  }

  // Separação por vigência
  const avisosAtivos = (avisos ?? []).filter(a => avisoEstaAtivo(a as any))
  const avisosExpirados = (avisos ?? []).filter(a => !avisoEstaAtivo(a as any))

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-[#1E293B]">Mural de Avisos</h2>
      </div>

      {isMultiAluno && <SeletorAluno />}

      {/* Lista vazia */}
      {(!avisos || avisos.length === 0) && (
        <Card className="border border-[#E2E8F0] border-dashed bg-slate-50/50">
          <CardContent className="py-20 text-center text-slate-500">
            <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
              <Megaphone className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-[#1E293B]">Mural Vazio</h3>
            <p className="mt-2 text-sm max-w-xs mx-auto">Não há comunicados para a turma deste aluno.</p>
          </CardContent>
        </Card>
      )}

      {/* Avisos Ativos */}
      {avisosAtivos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#14B8A6]" />
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
              Comunicados ativos ({avisosAtivos.length})
            </h3>
          </div>
          <div className="space-y-4">
            {avisosAtivos.map(aviso => (
              <AvisoPortalCard
                key={aviso.id}
                aviso={aviso}
                expandedId={expandedId}
                onToggleExpand={handleToggle}
              />
            ))}
          </div>
        </div>
      )}

      {/* Avisos Expirados */}
      {avisosExpirados.length > 0 && (
        <div className="space-y-3 mt-6">
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <Clock className="h-4 w-4 text-slate-300" />
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              Histórico · Expirados ({avisosExpirados.length})
            </h3>
          </div>
          <div className="space-y-4">
            {avisosExpirados.map(aviso => (
              <AvisoPortalCard
                key={aviso.id}
                aviso={aviso}
                expirado
                expandedId={expandedId}
                onToggleExpand={handleToggle}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
