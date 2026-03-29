import { useState } from 'react'
import { useAvisosPortal, useNotificacaoSonoraAvisos } from '../../hooks'
import { usePortalContext } from '../../context'
import { Badge } from '@/components/ui/badge'
import { Megaphone, BellRing, ChevronDown, Clock, AlertTriangle, ArrowLeft } from 'lucide-react'
import { format, parseISO, isAfter, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

// Helper de vibração (Haptic Feedback - padrão nativo)
const vibrate = (ms: number | number[] = 20) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

// Helper de vigência
function avisoEstaAtivo(aviso: { data_fim?: string | null }): boolean {
  if (!aviso.data_fim) return true
  const hoje = startOfDay(new Date())
  const fim = startOfDay(parseISO(aviso.data_fim))
  return isAfter(fim, hoje) || fim.getTime() === hoje.getTime()
}

// --- SKELETON LOADING (Padrão iOS/Android) ---
const AvisosSkeleton = () => (
  <div className="space-y-4 animate-pulse p-4 pt-[env(safe-area-inset-top,24px)]">
    {/* Header Skeleton */}
    <div className="h-8 w-32 bg-slate-200/60 rounded-lg mb-4" />
    {/* Banner Skeleton */}
    <div className="h-32 bg-slate-900/40 rounded-[28px]" />
    {/* Cards Skeleton */}
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-32 bg-slate-50 border border-slate-100 rounded-[24px]" />
      ))}
    </div>
  </div>
)

interface AvisoPortalCardProps {
  aviso: any
  expirado?: boolean
  expandedId: string | null
  onToggleExpand: (id: string) => void
}

// Card de Aviso - Padrão Nativo iOS/Android
function AvisoPortalCard({ aviso, expirado = false, expandedId, onToggleExpand }: AvisoPortalCardProps) {
  const isGeral = !aviso.turma_id
  const isExpanded = expandedId === aviso.id

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group"
    >
      <div
        className={cn(
          'bg-white border border-slate-100 shadow-sm transition-all duration-300 rounded-[24px] overflow-hidden cursor-pointer active:scale-[0.98] touch-manipulation min-h-[48px]',
          expirado ? 'bg-slate-50/50 grayscale-[0.8]' : 'bg-white hover:border-slate-200'
        )}
        onClick={() => {
          vibrate(15); // Haptic feedback no tap
          onToggleExpand(aviso.id);
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`Aviso: ${aviso.titulo}${expirado ? ' (Arquivado)' : ''}`}
      >
        <div className="p-4 flex items-start gap-4">
          {/* Ícone - 48px touch target */}
          <div
            className={cn(
              'w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0 transition-all shadow-sm',
              expirado
                ? 'bg-slate-100 text-slate-400'
                : isGeral
                  ? 'bg-teal-50 text-teal-500 border border-teal-100'
                  : 'bg-indigo-50 text-indigo-500 border border-indigo-100'
            )}
            aria-hidden="true"
          >
            {expirado
              ? <Clock className="w-6 h-6" />
              : isGeral
                ? <Megaphone className="w-6 h-6" />
                : <BellRing className="w-6 h-6" />
            }
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Badge e Título */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border-0 shadow-sm min-h-[24px]',
                    expirado
                      ? 'bg-slate-200 text-slate-500'
                      : isGeral
                        ? 'bg-teal-500 text-white'
                        : 'bg-indigo-500 text-white'
                  )}
                >
                  {isGeral ? 'Geral' : `${aviso.turma?.nome ?? 'Turma'}`}
                </Badge>
                {expirado && (
                  <Badge className="bg-red-100 text-red-500 text-[10px] font-bold uppercase border-0 px-2.5 py-1 min-h-[24px]">
                    Arquivado
                  </Badge>
                )}
              </div>

              {/* Título - Body iOS / Body Medium Material */}
              <h3
                className={cn(
                  'text-[15px] font-bold tracking-tight leading-tight transition-colors',
                  expirado ? 'text-slate-400' : 'text-slate-800'
                )}
              >
                {aviso.titulo}
              </h3>
            </div>

            {/* Conteúdo Expansível */}
            <AnimatePresence>
              <motion.p
                layout
                className={cn(
                  'text-[14px] font-medium leading-relaxed transition-all',
                  expirado ? 'text-slate-400' : 'text-slate-500',
                  !isExpanded ? 'line-clamp-2' : ''
                )}
              >
                {aviso.conteudo}
              </motion.p>
            </AnimatePresence>

            {/* Footer: Data e Chevron */}
            <div className="pt-2 flex items-center justify-between gap-3">
              {/* Data - Caption iOS / Label Small Material */}
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-slate-300" aria-hidden="true" />
                  {format(new Date(aviso.created_at), "dd/MM", { locale: ptBR })}
                </span>
                {aviso.data_fim && (
                  <span className={cn(
                    'flex items-center gap-1.5',
                    expirado ? 'text-red-300' : 'text-amber-500'
                  )}>
                    {expirado ? 'Até' : 'Exp.'} {format(parseISO(aviso.data_fim), 'dd/MM')}
                  </span>
                )}
              </div>

              {/* Chevron - 40px touch target */}
              <div
                className={cn(
                  'w-10 h-10 rounded-[12px] flex items-center justify-center transition-all bg-slate-50 text-slate-300 border border-slate-100',
                  isExpanded && 'rotate-180 bg-slate-900 border-slate-900 text-white shadow-md'
                )}
                aria-hidden="true"
              >
                <ChevronDown size={18} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Helper de iniciais
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export function PortalAvisosPageV2Mobile() {
  const { alunoSelecionado, selecionarAluno, vinculos, isMultiAluno, isLoading: loadingCtx } = usePortalContext()
  const { data: avisos, isLoading } = useAvisosPortal()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Hook de notificação sonora quando chegarem novos avisos
  useNotificacaoSonoraAvisos()

  const handleToggle = (id: string) => setExpandedId(prev => prev === id ? null : id)

  if (loadingCtx || isLoading) return <AvisosSkeleton />

  const avisosAtivos = (avisos ?? []).filter((a: any) => avisoEstaAtivo(a))
  const avisosExpirados = (avisos ?? []).filter((a: any) => !avisoEstaAtivo(a))

  return (
    <div className="flex flex-col gap-6 px-4 pt-[env(safe-area-inset-top,20px)] pb-32 mt-4">
      
      {/* 1. Header - Padrão iOS Large Title / Material Top App Bar */}
      <header className="flex items-center gap-4 pt-4 pb-2">
        {/* Back Button - 48px touch target */}
        <button
          onClick={() => window.history.back()}
          className="w-12 h-12 flex items-center justify-center rounded-[16px] bg-slate-50 text-slate-500 active:bg-slate-100 transition-colors touch-manipulation min-h-[48px] min-w-[48px]"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-6 h-6" aria-hidden="true" />
        </button>
        
        <div className="flex flex-col flex-1">
          {/* Large Title - iOS / Headline Small - Material */}
          <h1 className="text-[28px] font-bold text-slate-800 tracking-tight leading-[34px]">
            Avisos
          </h1>
          {/* Caption - iOS Caption 1 / Material Body Small */}
          <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
            Mural da Escola
          </p>
        </div>
      </header>

      {/* 2. Cards de Alunos (Filtro) - Scroll Horizontal */}
      {isMultiAluno && (
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar" role="region" aria-label="Selecionar aluno">
          {vinculos.map((v: any) => (
            <motion.button
              key={v.aluno?.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                vibrate(10);
                selecionarAluno(v);
              }}
              className={cn(
                "flex items-center gap-3 p-3 pr-4 rounded-[20px] border transition-all cursor-pointer active:scale-96 touch-manipulation min-h-[48px] flex-shrink-0",
                alunoSelecionado?.id === v.aluno?.id
                  ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200"
                  : "bg-white border-slate-100 text-slate-800 hover:border-teal-200"
              )}
              aria-pressed={alunoSelecionado?.id === v.aluno?.id}
              aria-label={`Selecionar ${v.aluno?.nome_completo?.split(' ')[0] || 'aluno'}`}
            >
              {/* Avatar - 48px */}
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-base font-bold shrink-0",
                  alunoSelecionado?.id === v.aluno?.id
                    ? "bg-teal-500 text-white"
                    : "bg-teal-50 text-teal-600"
                )}
                aria-hidden="true"
              >
                {v.aluno?.nome_completo ? getInitials(v.aluno.nome_completo) : 'A'}
              </div>
              
              <div className="flex flex-col min-w-0 pr-1">
                {/* Title - iOS Caption / Material Label */}
                <h4
                  className={cn(
                    "text-[14px] font-bold tracking-tight leading-none truncate",
                    alunoSelecionado?.id === v.aluno?.id ? "text-white" : "text-slate-800"
                  )}
                >
                  {v.aluno?.nome_completo?.split(' ')[0] || 'Aluno'}
                </h4>
                {/* Caption - iOS Caption 2 / Material Label Small */}
                <p
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wide mt-1 opacity-60",
                    alunoSelecionado?.id === v.aluno?.id ? "text-teal-300" : "text-slate-400"
                  )}
                >
                  {v.aluno?.turma?.nome || 'S/ Turma'}
                </p>
              </div>
              
              {/* Indicator */}
              {alunoSelecionado?.id === v.aluno?.id && (
                <div
                  className="ml-auto w-2 h-2 rounded-full bg-teal-400 animate-pulse shrink-0"
                  aria-hidden="true"
                />
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* 3. Renderização Condicional do Conteúdo */}
      {!alunoSelecionado ? (
        // Empty State - Padrão iOS/Android
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-6">
          <div
            className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center shadow-inner"
            aria-hidden="true"
          >
            <Megaphone className="w-10 h-10 text-slate-200" />
          </div>
          <div className="space-y-2">
            {/* Title 2 - iOS / Title Medium - Material */}
            <h2 className="text-[20px] font-bold text-slate-800 tracking-tight">
              Mural de Avisos
            </h2>
            {/* Body - iOS Body / Material Body Medium */}
            <p className="text-[15px] font-medium text-slate-400 max-w-[280px] mx-auto">
              Selecione um aluno para ver os comunicados da turma.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* 4. Banner - Padrão Material Design Card Elevated */}
          <div
            className="bg-zinc-900 rounded-[28px] p-5 text-white relative overflow-hidden shadow-lg"
            role="region"
            aria-label="Informações do aluno"
          >
            <div
              className="absolute right-0 top-0 opacity-5 -mr-12 -mt-12 pointer-events-none"
              aria-hidden="true"
            >
              <Megaphone size={200} />
            </div>
            
            <div className="flex items-start gap-4 relative z-10">
              {/* Ícone - 48px */}
              <div
                className="w-12 h-12 rounded-[16px] bg-teal-500/20 flex items-center justify-center text-teal-400 shrink-0 border border-white/10"
                aria-hidden="true"
              >
                <BellRing size={24} />
              </div>
              
              <div className="flex-1">
                {/* Caption - iOS Caption 1 / Material Label Medium */}
                <h4 className="text-[11px] font-bold text-teal-400 uppercase tracking-wide mb-1 leading-tight">
                  Canal Direto
                </h4>
                {/* Body - iOS Body / Material Body Medium */}
                <p className="text-[14px] font-medium text-slate-300 leading-relaxed">
                  Comunicados para{' '}
                  <strong className="text-white">
                    {alunoSelecionado.nome_completo?.split(' ')[0]}
                  </strong>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* 5. Empty State - Sem Avisos */}
          {(!avisos || avisos.length === 0) && (
            <div
              className="py-16 text-center space-y-5 bg-white rounded-[28px] border-2 border-dashed border-slate-100"
              role="status"
              aria-live="polite"
            >
              <div
                className="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center mx-auto text-slate-200"
                aria-hidden="true"
              >
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-[18px] font-bold text-slate-800 tracking-tight">
                  Tudo calmo por aqui
                </h3>
                <p className="text-[14px] font-medium text-slate-400 max-w-[240px] mx-auto">
                  Não há novos avisos no momento.
                </p>
              </div>
            </div>
          )}

          {/* 6. Avisos Ativos */}
          {avisosAtivos.length > 0 && (
            <div className="flex flex-col gap-4">
              {/* Header da Seção */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-sm shadow-teal-500/50"
                    aria-hidden="true"
                  />
                  <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide leading-none">
                    Novidades
                  </h3>
                </div>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full uppercase tracking-wide">
                  {avisosAtivos.length} {avisosAtivos.length === 1 ? 'Aviso' : 'Avisos'}
                </span>
              </div>

              {/* Lista de Cards */}
              <div className="flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                  {avisosAtivos.map(aviso => (
                    <AvisoPortalCard
                      key={aviso.id}
                      aviso={aviso}
                      expandedId={expandedId}
                      onToggleExpand={handleToggle}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* 7. Histórico (Expirados) */}
          {avisosExpirados.length > 0 && (
            <div className="flex flex-col gap-4 mt-2">
              {/* Header da Seção */}
              <div className="flex items-center gap-2 border-t border-slate-100 pt-6 px-1">
                <Clock className="w-4 h-4 text-slate-300" aria-hidden="true" />
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide leading-none">
                  Histórico Arquivado ({avisosExpirados.length})
                </h3>
              </div>

              {/* Lista de Cards Expirados */}
              <div className="flex flex-col gap-3">
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
        </>
      )}
    </div>
  )
}
