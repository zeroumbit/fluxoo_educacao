import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { usePortalContext } from '../../context'
import { NativeHeader } from '../components/NativeHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  School,
  User,
  FileText,
  Loader2,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'
import { useTransferenciasPortal, useResponderTransferencia } from '../../hooks'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  pendente_pais: { label: 'Aguardando sua Aprovação', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock },
  pendente_destino: { label: 'Aguardando Escola Destino', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: School },
  pendente_origem: { label: 'Aguardando Escola Origem', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', icon: FileText },
  recusada: { label: 'Recusada', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', icon: XCircle },
  cancelada: { label: 'Cancelada', color: 'text-zinc-500', bg: 'bg-zinc-50', border: 'border-zinc-200', icon: XCircle },
  concluida: { label: 'Concluída', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
}

export function PortalTransferenciasV2Mobile() {
  const { alunoSelecionado } = usePortalContext()
  const { data: transferencias, isLoading } = useTransferenciasPortal()
  const responder = useResponderTransferencia()

  const [selectedTransf, setSelectedTransf] = useState<any>(null)
  const [recusando, setRecusando] = useState(false)
  const [motivoRecusa, setMotivoRecusa] = useState('')

  // Filtrar transferências do aluno selecionado
  const transferenciasAluno = React.useMemo(() => {
    if (!transferencias || !alunoSelecionado) return []
    return transferencias.filter((t: any) => t.aluno_id === alunoSelecionado.id)
  }, [transferencias, alunoSelecionado])

  const pendentes = React.useMemo(() =>
    transferenciasAluno.filter((t: any) => t.status === 'pendente_pais').length,
    [transferenciasAluno]
  )

  const handleAprovar = async (id: string) => {
    try {
      await responder.mutateAsync({ id, aprovado: true })
      toast.success('Transferência aprovada com sucesso!')
      setSelectedTransf(null)
    } catch {
      toast.error('Erro ao aprovar transferência')
    }
  }

  const handleRecusar = async (id: string) => {
    try {
      await responder.mutateAsync({ id, aprovado: false, motivoRecusa })
      toast.success('Transferência recusada')
      setSelectedTransf(null)
      setRecusando(false)
      setMotivoRecusa('')
    } catch {
      toast.error('Erro ao recusar transferência')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col bg-slate-50/50 min-h-[calc(100vh-80px)]">
        <NativeHeader title="Transferências" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-slate-50/50 min-h-[calc(100vh-80px)]">
      <NativeHeader title="Transferências" />

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Banner de Pendentes */}
        {pendentes > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-[24px] p-6 text-white shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black tracking-tight mb-1">
                  {pendentes} {pendentes === 1 ? 'Solicitação Pendente' : 'Solicitações Pendentes'}
                </h3>
                <p className="text-amber-100 text-sm font-medium">
                  {pendentes === 1
                    ? 'Você precisa analisar uma solicitação de transferência.'
                    : 'Você precisa analisar solicitações de transferência.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Lista de Transferências */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[17px] font-bold text-slate-800">
              Histórico de Transferências
            </h3>
            <Badge className="bg-slate-100 text-slate-600 border-0 text-xs font-bold px-2.5 py-1">
              {transferenciasAluno.length}
            </Badge>
          </div>

          {transferenciasAluno.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm text-center"
            >
              <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-slate-200" />
              </div>
              <h4 className="text-slate-800 font-bold text-base mb-1">Nenhuma transferência</h4>
              <p className="text-slate-400 text-sm">Nenhuma solicitação de transferência registrada para este aluno.</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {transferenciasAluno.map((t: any, i: number) => {
                const cfg = statusConfig[t.status] || statusConfig.pendente_pais
                const StatusIcon = cfg.icon
                const isPendentePais = t.status === 'pendente_pais'

                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "bg-white p-4 rounded-[20px] border shadow-sm active:scale-[0.98] transition-all cursor-pointer",
                      cfg.border
                    )}
                    onClick={() => {
                      setSelectedTransf(t)
                      setRecusando(false)
                      setMotivoRecusa('')
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                        cfg.bg
                      )}>
                        <StatusIcon className={cn("h-6 w-6", cfg.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-bold text-slate-800 text-sm truncate">
                            {t.aluno?.nome_completo || alunoSelecionado?.nome_completo}
                          </h4>
                          {isPendentePais && (
                            <Badge className="bg-amber-500 text-white border-0 text-[9px] font-bold px-2 py-0.5">
                              AÇÃO NECESSÁRIA
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 mb-2">
                          {t.escola_origem?.razao_social || 'Escola Origem'} → {t.escola_destino?.razao_social || 'Escola Destino'}
                        </p>

                        <div className="flex items-center justify-between">
                          <Badge className={`${cfg.bg} ${cfg.color} border-0 text-[9px] font-bold px-2.5 py-1 gap-1.5`}>
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {t.data_solicitacao
                              ? formatDistanceToNow(new Date(t.data_solicitacao), { locale: ptBR, addSuffix: true })
                              : ''}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-slate-300 shrink-0 mt-1" />
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </section>

        {/* Tip */}
        <section className="bg-sky-50 border border-sky-100 rounded-[20px] p-4 flex gap-3">
          <Send className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-sky-800">Como funciona?</p>
            <p className="text-xs text-sky-600 leading-relaxed mt-0.5">
              Transferências entre escolas são solicitadas pela escola de destino ou pelos responsáveis.
              Quando uma solicitação chegar para você, analise e aprove ou recuse com um motivo.
            </p>
          </div>
        </section>
      </main>

      {/* Sheet: Detalhes + Aprovação/Recusa */}
      <Sheet open={!!selectedTransf} onOpenChange={(open) => !open && setSelectedTransf(null)}>
        <SheetContent side="bottom" className="h-[92vh] rounded-t-[32px] p-0">
          {selectedTransf && (
            <>
              <SheetHeader className="p-6 pt-4">
                <SheetTitle className="text-xl font-black text-slate-900">Detalhes da Transferência</SheetTitle>
                <SheetDescription className="text-sm text-slate-500">
                  Analise a solicitação e tome uma decisão.
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Aluno */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Aluno</p>
                    <p className="font-bold text-slate-700 text-sm">
                      {selectedTransf.aluno?.nome_completo || alunoSelecionado?.nome_completo}
                    </p>
                  </div>
                </div>

                {/* Origem → Destino */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-amber-50 rounded-xl">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Origem</p>
                    <p className="text-sm font-bold text-amber-800">{selectedTransf.escola_origem?.razao_social || '—'}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Destino</p>
                    <p className="text-sm font-bold text-blue-800">{selectedTransf.escola_destino?.razao_social || '—'}</p>
                  </div>
                </div>

                {/* Motivo */}
                {selectedTransf.motivo_solicitacao && (
                  <div className="p-4 bg-zinc-50 rounded-xl">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Motivo</p>
                    <p className="text-sm text-zinc-700 leading-relaxed">{selectedTransf.motivo_solicitacao}</p>
                  </div>
                )}

                {/* Status */}
                {(() => {
                  const cfg = statusConfig[selectedTransf.status] || statusConfig.pendente_pais
                  const StatusIcon = cfg.icon
                  return (
                    <div className={cn("p-4 rounded-xl flex items-center gap-3", cfg.bg)}>
                      <StatusIcon className={cn("h-5 w-5", cfg.color)} />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Status</p>
                        <p className={cn("text-sm font-bold", cfg.color)}>{cfg.label}</p>
                      </div>
                    </div>
                  )
                })()}

                {/* Recusa */}
                {selectedTransf.observacoes_recusa && (
                  <div className="p-4 bg-rose-50 rounded-xl">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Observações de Recusa</p>
                    <p className="text-sm text-rose-700 leading-relaxed">{selectedTransf.observacoes_recusa}</p>
                  </div>
                )}

                {/* Aprovação/Recusa (só mostra se pendente_pais) */}
                {selectedTransf.status === 'pendente_pais' && recusando && (
                  <div className="space-y-3">
                    <Label className="text-sm font-bold text-slate-700">Motivo da Recusa</Label>
                    <Textarea
                      placeholder="Informe o motivo da recusa..."
                      value={motivoRecusa}
                      onChange={(e) => setMotivoRecusa(e.target.value)}
                      className="min-h-[100px] rounded-2xl resize-none"
                    />
                  </div>
                )}
              </div>

              {selectedTransf.status === 'pendente_pais' && (
                <SheetFooter className="p-6 pt-4 border-t bg-white shrink-0">
                  {!recusando ? (
                    <div className="flex gap-3 w-full">
                      <Button
                        variant="outline"
                        onClick={() => setRecusando(true)}
                        className="flex-1 h-14 rounded-2xl font-bold text-sm text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Recusar
                      </Button>
                      <Button
                        onClick={() => handleAprovar(selectedTransf.id)}
                        disabled={responder.isPending}
                        className="flex-1 h-14 rounded-2xl bg-teal-600 hover:bg-teal-700 font-bold text-sm text-white"
                      >
                        {responder.isPending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Aprovar
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-3 w-full">
                      <Button
                        variant="ghost"
                        onClick={() => { setRecusando(false); setMotivoRecusa('') }}
                        className="flex-1 h-14 rounded-2xl font-bold text-sm text-slate-400"
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={() => handleRecusar(selectedTransf.id)}
                        disabled={responder.isPending || !motivoRecusa.trim()}
                        className="flex-1 h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 font-bold text-sm text-white"
                      >
                        {responder.isPending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          'Confirmar Recusa'
                        )}
                      </Button>
                    </div>
                  )}
                </SheetFooter>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default PortalTransferenciasV2Mobile
