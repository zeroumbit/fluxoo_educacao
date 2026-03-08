import React, { useState, useRef, useEffect } from 'react'
import { usePortalContext } from '../context'
import { useResponsavel } from '../hooks'
import { useAutorizacoesPortal, useResponderAutorizacao } from '@/modules/autorizacoes/hooks'
import { CATEGORIA_LABELS, CATEGORIA_CORES } from '@/modules/autorizacoes/service'
import {
  ShieldCheck, ShieldOff, Shield, ChevronDown,
  AlertTriangle, CheckCircle2, Clock, ScrollText,
  ChevronRight, ArrowLeft, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter 
} from '@/components/ui/sheet'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { SeletorAluno } from '../components/SeletorAluno'

// Helper de vibração
const vibrate = (ms: number | number[] = 20) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

type AutorizacaoModelo = {
  id: string
  titulo: string
  categoria: string
  descricao_curta: string
  texto_completo: string
  obrigatoria: boolean
  aceita: boolean | null
  texto_lido: boolean
  data_resposta: string | null
  resposta_id: string | null
}

// --- SKELETON LOADING ---
const AutorizacoesSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-32 bg-slate-900 rounded-2xl" />
    <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white border border-slate-100 rounded-xl" />)}
    </div>
    <div className="space-y-3">
        {[1, 2].map(i => <div key={i} className="h-20 bg-white border border-slate-100 rounded-2xl" />)}
    </div>
  </div>
)

export function PortalAutorizacoesPage() {
  const { alunoSelecionado, tenantId, isMultiAluno } = usePortalContext()
  const { data: responsavel } = useResponsavel()
  const { data: autorizacoes = [], isLoading } = useAutorizacoesPortal(alunoSelecionado?.id || null)
  const responder = useResponderAutorizacao()

  const [modalItem, setModalItem] = useState<AutorizacaoModelo | null>(null)
  const [acao, setAcao] = useState<'autorizar' | 'revogar' | null>(null)
  const [textoLido, setTextoLido] = useState(false)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const textoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = textoRef.current
    if (!el || !modalItem) return
    setScrolledToBottom(false)
    setTextoLido(false)

    const handleScroll = () => {
      const isBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 40
      if (isBottom) {
        setScrolledToBottom(true)
        setTextoLido(true)
      }
    }
    el.addEventListener('scroll', handleScroll)
    if (el.scrollHeight <= el.clientHeight + 40) {
      setScrolledToBottom(true)
      setTextoLido(true)
    }
    return () => el.removeEventListener('scroll', handleScroll)
  }, [modalItem])

  const handleAbrirModal = (item: AutorizacaoModelo, acaoTipo: 'autorizar' | 'revogar') => {
    vibrate(20)
    setModalItem(item)
    setAcao(acaoTipo)
  }

  const handleConfirmar = async () => {
    if (!modalItem || !responsavel || !alunoSelecionado || !tenantId) return
    
    if (acao === 'autorizar' && !textoLido) {
      vibrate([30, 30])
      toast.warning('Leia o termo completo para habilitar o aceite.')
      return
    }

    vibrate(60)
    try {
      await responder.mutateAsync({
        tenant_id: tenantId,
        modelo_id: modalItem.id,
        aluno_id: alunoSelecionado.id,
        responsavel_id: responsavel.id,
        aceita: acao === 'autorizar',
        texto_lido: textoLido,
      })

      toast.success(acao === 'autorizar' ? '✅ Autorização registrada!' : '🚫 Autorização revogada.')
      setModalItem(null)
      setAcao(null)
    } catch {
      toast.error('Ocorreu um erro ao salvar sua resposta.')
    }
  }

  const agrupadas = (autorizacoes as AutorizacaoModelo[]).reduce((acc: Record<string, AutorizacaoModelo[]>, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = []
    acc[item.categoria].push(item)
    return acc
  }, {})

  const totalAutorizadas = (autorizacoes as AutorizacaoModelo[]).filter(a => a.aceita === true).length
  const totalRecusadas = (autorizacoes as AutorizacaoModelo[]).filter(a => a.aceita === false).length
  const totalPendentes = (autorizacoes as AutorizacaoModelo[]).filter(a => a.aceita === null).length

  if (isLoading) return <AutorizacoesSkeleton />

  if (!alunoSelecionado) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-slate-200" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800">Autorizações</h2>
            <p className="text-sm text-slate-400">Selecione um aluno para gerenciar.</p>
          </div>
        </div>
    )
  }

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-500 font-sans">
      
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Autorizações</h2>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Consentimento e LGPD</p>
        </div>
        {isMultiAluno && <SeletorAluno />}
      </div>

      {/* Resumo */}
      <div className="bg-slate-900 rounded-2xl p-5 md:p-6 text-white relative overflow-hidden shadow-lg">
         <div className="absolute right-0 top-0 opacity-5 -mr-10 -mt-10 pointer-events-none">
            <ShieldCheck size={200} />
         </div>
         
         <div className="relative z-10 flex flex-col gap-5">
            <div className="flex items-start gap-3">
               <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <AlertTriangle size={16} />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-amber-400 mb-0.5">Aviso Importante</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sua autorização é essencial para atividades extracurriculares e uso de imagem.
                  </p>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                <p className="text-xl font-bold text-emerald-400 leading-none">{totalAutorizadas}</p>
                <p className="text-[8px] font-medium text-white/30 uppercase tracking-wider mt-1">Ativas</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center relative">
                <p className="text-xl font-bold text-amber-400 leading-none">{totalPendentes}</p>
                <p className="text-[8px] font-medium text-white/30 uppercase tracking-wider mt-1">Pendentes</p>
                {totalPendentes > 0 && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                <p className="text-xl font-bold text-red-400 leading-none">{totalRecusadas}</p>
                <p className="text-[8px] font-medium text-white/30 uppercase tracking-wider mt-1">Revogadas</p>
              </div>
            </div>
         </div>
      </div>

      {/* 3. Lista de Itens */}
      <div className="space-y-5">
        {Object.entries(agrupadas).map(([categoria, itens], catIdx) => {
          const cores = CATEGORIA_CORES[categoria] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
          return (
            <div key={categoria} className="space-y-3">
              <div className="flex items-center gap-2">
                 <div className={cn("h-1 w-5 rounded-full", cores.bg)} />
                 <h3 className={cn("text-xs font-bold uppercase tracking-wider", cores.text)}>
                   {CATEGORIA_LABELS[categoria] || categoria}
                 </h3>
              </div>

              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {itens.map((item, idx) => {
                    const isAutorizado = item.aceita === true
                    const config = isAutorizado ? statusConfig.pronto : item.aceita === false ? statusConfig.recusado : statusConfig.pendente
                    const StatusIcon = config.icon

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (catIdx * 0.1) + (idx * 0.05) }}
                        onClick={() => handleAbrirModal(item, isAutorizado ? 'revogar' : 'autorizar')}
                        className="group"
                      >
                        <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden active:scale-[0.98] transition-transform cursor-pointer">
                           <CardContent className="p-4 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                 <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", config.bg)}>
                                    <StatusIcon className={cn("h-5 w-5", config.color)} />
                                 </div>
                                 <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                       <h4 className="text-sm font-bold text-slate-800 truncate">
                                          {item.titulo}
                                       </h4>
                                       {item.obrigatoria && (
                                          <Badge className="bg-slate-900 border-0 text-white text-[7px] font-semibold uppercase px-1.5 h-4">
                                            Obrig.
                                          </Badge>
                                       )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.descricao_curta}</p>
                                 </div>
                              </div>
                              <ChevronRight className="text-slate-200 shrink-0" size={16} />
                           </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          )
        })}
      </div>

      {/* 4. Sheet Imersivo */}
      <Sheet open={!!modalItem} onOpenChange={(open) => !open && setModalItem(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pt-6 pb-8 border-0 shadow-2xl overflow-y-auto max-h-[90vh] focus:outline-none bg-white">
          <SheetHeader className="space-y-3">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", acao === 'autorizar' ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-600')}>
                      {acao === 'autorizar' ? <ShieldCheck size={20} /> : <ShieldOff size={20} />}
                   </div>
                   <div>
                      <SheetTitle className="text-lg font-bold text-slate-800">
                         {acao === 'autorizar' ? 'Autorizar' : 'Revogar'}
                      </SheetTitle>
                      <p className="text-[10px] text-slate-400 font-medium">Instrumento de Consentimento</p>
                   </div>
                </div>
                <button onClick={() => setModalItem(null)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                   <ArrowLeft size={16} className="rotate-90" />
                </button>
             </div>
             <div>
                <SheetDescription className="text-base font-bold text-slate-800">
                   {modalItem?.titulo}
                </SheetDescription>
             </div>
          </SheetHeader>

          <div className="py-5 space-y-5">
            {acao === 'revogar' ? (
              <div className="bg-red-50 p-5 rounded-xl border border-red-100 space-y-3">
                 <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                    <ShieldOff size={18} />
                 </div>
                 <p className="text-sm text-red-900 leading-relaxed">
                   Ao revogar, a instituição será notificada.
                 </p>
                 <div className="bg-white p-3 rounded-lg border border-red-100">
                    <p className="text-xs text-red-600">"{modalItem?.descricao_curta}"</p>
                 </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-teal-600 uppercase tracking-wider bg-teal-50 px-3 py-2 rounded-full w-fit">
                   <ScrollText size={14} />
                   Leitura Obrigatória
                </div>

                <div ref={textoRef}
                  className="bg-slate-50 rounded-xl border border-slate-100 p-5 text-sm text-slate-700 leading-relaxed overflow-y-auto min-h-[200px] max-h-[350px]">
                  {modalItem?.texto_completo}
                </div>

                <div className="flex items-center gap-3">
                   <AnimatePresence mode="wait">
                     {!scrolledToBottom ? (
                       <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-amber-500">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center animate-bounce">
                             <ChevronDown size={14} />
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider">Role até o fim</span>
                       </motion.div>
                     ) : (
                       <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 text-emerald-600">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                             <CheckCircle2 size={14} />
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider">Documento validado</span>
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="gap-3">
            <Button onClick={handleConfirmar}
              disabled={responder.isPending || (acao === 'autorizar' && !textoLido)}
              className={cn(
                "w-full h-12 rounded-xl font-semibold uppercase tracking-wider text-xs active:scale-95 transition-all",
                acao === 'autorizar' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'
              )}>
              {responder.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : acao === 'autorizar' ? 'Confirmar Aceite' : 'Revogar'}
            </Button>
            <Button variant="ghost" onClick={() => setModalItem(null)}
              className="w-full h-10 rounded-xl text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Agora Não
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Footer Navigation Back */}
      <div className="flex justify-center pt-4">
        <Button variant="ghost" onClick={() => { vibrate(10); window.history.back(); }}
          className="text-slate-400 font-semibold uppercase text-[10px] tracking-widest hover:text-teal-600 h-11 px-6 rounded-full">
          Retornar ao Portal
        </Button>
      </div>
    </div>
  )
}

const statusConfig: Record<string, { label: string, color: string, icon: any, bg: string }> = {
    pendente: { label: 'Pendente', color: 'text-amber-600', icon: Clock, bg: 'bg-amber-50' },
    pronto: { label: 'Autorizado', color: 'text-emerald-600', icon: ShieldCheck, bg: 'bg-emerald-50' },
    recusado: { label: 'Revogado', color: 'text-red-600', icon: ShieldOff, bg: 'bg-red-50' },
}
