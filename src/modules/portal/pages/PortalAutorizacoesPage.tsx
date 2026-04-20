import React, { useState, useRef, useEffect } from 'react'
import { usePortalContext } from '../context'
import { useResponsavel } from '../hooks'
import { useAutorizacoesPortal, useResponderAutorizacao } from '@/modules/autorizacoes/hooks'
import { CATEGORIA_LABELS, CATEGORIA_CORES } from '@/modules/autorizacoes/service'
import {
  ShieldCheck, ShieldOff, Shield, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Clock, Loader2, ScrollText,
  BookOpen, ChevronRight, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { BotaoVoltar } from '../components/BotaoVoltar'

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

export function PortalAutorizacoesPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const { alunoSelecionado, tenantId, isMultiAluno } = usePortalContext()
  const { data: responsavel } = useResponsavel()
  const { data: autorizacoes = [], isLoading } = useAutorizacoesPortal(alunoSelecionado?.id || null)
  const responder = useResponderAutorizacao()

  const [modalItem, setModalItem] = useState<AutorizacaoModelo | null>(null)
  const [acao, setAcao] = useState<'autorizar' | 'revogar' | null>(null)
  const [textoLido, setTextoLido] = useState(false)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [_showConfirm, _setShowConfirm] = useState(false)
  const textoRef = useRef<HTMLDivElement>(null)

  // Detecta quando o responsável rolou até o fim do texto
  useEffect(() => {
    const el = textoRef.current
    if (!el || !modalItem) return
    setScrolledToBottom(false)
    setTextoLido(false)

    const handleScroll = () => {
      if (!el || acao !== 'autorizar') return
      
      const currentPosition = el.scrollTop + el.clientHeight
      const bottomThreshold = el.scrollHeight - 50

      if (currentPosition >= bottomThreshold) {
        setScrolledToBottom(true)
        setTextoLido(true)
      }
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    
    const checkImmediate = () => {
      if (acao !== 'autorizar') return
      const isShort = el.scrollHeight <= el.clientHeight + 20
      if (isShort) {
        setScrolledToBottom(true)
        setTextoLido(true)
      }
    }

    // Executa após um pequeno delay para garantir que o layout foi renderizado
    const timer = setTimeout(checkImmediate, 100)
    
    return () => {
      el.removeEventListener('scroll', handleScroll)
      clearTimeout(timer)
    }
  }, [modalItem])

  const handleAbrirModal = (item: AutorizacaoModelo, acaoTipo: 'autorizar' | 'revogar') => {
    vibrate(20)
    setModalItem(item)
    setAcao(acaoTipo)
    // Se for revogação, já liberamos o botão direto
    if (acaoTipo === 'revogar') {
      setTextoLido(true)
      setScrolledToBottom(true)
    } else {
      setTextoLido(false)
      setScrolledToBottom(false)
    }
  }

  const handleConfirmar = async () => {
    if (!modalItem || !responsavel || !alunoSelecionado || !tenantId) return
    if (acao === 'autorizar' && !textoLido) {
      toast.warning('Por favor, leia o termo completo antes de autorizar.')
      return
    }

    try {
      await responder.mutateAsync({
        tenant_id: tenantId,
        modelo_id: modalItem.id,
        aluno_id: alunoSelecionado.id,
        responsavel_id: responsavel.id,
        aceita: acao === 'autorizar',
        texto_lido: textoLido,
      })

      toast.success(
        acao === 'autorizar'
          ? `✅ "${modalItem.titulo}" autorizado com sucesso.`
          : `🚫 "${modalItem.titulo}" revogado.`,
        { duration: 5000 }
      )
      setModalItem(null)
      setAcao(null)
    } catch {
      toast.error('Erro ao salvar sua resposta. Tente novamente.')
    }
  }

  // Define ordem fixa para categorias obrigatórias
  const ORDEM_OBRIGATORIAS = ['matricula', 'conduta', 'saude']

  // Agrupa por categoria
  const agrupadas = (autorizacoes as AutorizacaoModelo[]).reduce((acc: Record<string, AutorizacaoModelo[]>, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = []
    acc[item.categoria].push(item)
    return acc
  }, {})

  // Ordena categorias: obrigatórias primeiro na ordem definida, depois mantém ordem original
  const categoriasOrdenadas = Object.keys(agrupadas).sort((a, b) => {
    const aIndex = ORDEM_OBRIGATORIAS.indexOf(a)
    const bIndex = ORDEM_OBRIGATORIAS.indexOf(b)
    
    // Se ambas são obrigatórias, ordena pela ORDEM_OBRIGATORIAS
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    
    // Se apenas uma é obrigatória, ela vem primeiro
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    
    // Se nenhuma é obrigatória, mantém a ordem original (0)
    return 0
  })

  const totalAutorizadas = (autorizacoes as AutorizacaoModelo[]).filter(a => a.aceita === true).length
  const totalRecusadas = (autorizacoes as AutorizacaoModelo[]).filter(a => a.aceita === false).length
  const totalPendentes = (autorizacoes as AutorizacaoModelo[]).filter(a => a.aceita === null).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
      </div>
    )
  }

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <Shield className="h-16 w-16 text-slate-200" />
        <p className="font-bold text-slate-600">Selecione um aluno para ver as autorizações.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-32">
      {!hideHeader && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-3">
            <BotaoVoltar />
            <div className="flex flex-col gap-1 items-start text-left">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">Autorizações</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie as autorizações de <strong>{alunoSelecionado.nome_completo}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <div className="rounded-2xl md:rounded-[2rem] bg-emerald-50 border border-emerald-100 p-4 md:p-8 text-center">
          <p className="text-3xl md:text-5xl font-black text-emerald-600">{totalAutorizadas}</p>
          <p className="text-[10px] md:text-xs font-bold text-emerald-700 uppercase tracking-widest mt-1">Autorizadas</p>
        </div>
        <div className="rounded-2xl md:rounded-[2rem] bg-amber-50 border border-amber-100 p-4 md:p-8 text-center">
          <p className="text-3xl md:text-5xl font-black text-amber-600">{totalPendentes}</p>
          <p className="text-[10px] md:text-xs font-bold text-amber-700 uppercase tracking-widest mt-1">Pendentes</p>
        </div>
        <div className="rounded-2xl md:rounded-[2rem] bg-red-50 border border-red-100 p-4 md:p-8 text-center">
          <p className="text-3xl md:text-5xl font-black text-red-600">{totalRecusadas}</p>
          <p className="text-[10px] md:text-xs font-bold text-red-700 uppercase tracking-widest mt-1">Revogadas</p>
        </div>
      </div>

      {/* Aviso */}
      <Card className="border-0 shadow-none bg-amber-50 border border-amber-100 rounded-2xl md:rounded-[2.5rem]">
        <CardContent className="flex items-start gap-3 py-6 md:p-10">
          <AlertTriangle className="h-5 w-5 md:h-8 md:w-8 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-800 text-sm md:text-base">Sobre as autorizações</p>
            <p className="text-xs md:text-sm text-amber-700 leading-relaxed md:max-w-3xl">
              Para autorizar um item, você deve ler o texto completo do termo. Você pode revogar qualquer autorização quando quiser, exceto as obrigatórias para a matrícula. Todas as ações são registradas com data e hora para fins jurídicos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lista por categoria */}
      {categoriasOrdenadas.length === 0 ? (
        <Card className="border-0 shadow-sm md:rounded-[3rem] bg-white p-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
            <Shield className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Tudo pronto!</h3>
            <p className="font-semibold text-slate-500 max-w-sm">
              Nenhuma autorização pendente ou cadastrada para <strong>{alunoSelecionado.nome_completo}</strong> neste momento.
            </p>
          </div>
        </Card>
      ) : (
        categoriasOrdenadas.map((categoria) => {
        const itens = agrupadas[categoria]
        const cores = CATEGORIA_CORES[categoria] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
        return (
          <Card key={categoria} className="border-0 shadow-md md:rounded-[3rem] overflow-hidden">
            <CardHeader className="pb-3 pt-8 px-6 md:px-12">
              <div className="flex items-center gap-2">
                <Badge className={cn('text-[10px] uppercase tracking-widest font-black border', cores.bg, cores.text, cores.border)}>
                  {CATEGORIA_LABELS[categoria] || categoria}
                </Badge>
                <span className="text-xs text-slate-400 font-medium">
                  {itens.filter(i => i.aceita === true).length}/{itens.length} autorizados
                </span>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-slate-50 px-6 md:px-12 pb-8">
              {itens.map((item) => {
                const isAutorizado = item.aceita === true
                const isRecusado = item.aceita === false
                const isPendente = item.aceita === null

                return (
                  <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between py-6 md:py-8 gap-5 md:gap-4 transition-all">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={cn(
                        "mt-1 h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                        isAutorizado ? 'bg-emerald-50' : isRecusado ? 'bg-red-50' : 'bg-slate-50'
                      )}>
                        {isAutorizado ? (
                          <ShieldCheck className="h-6 w-6 text-emerald-600" />
                        ) : isRecusado ? (
                          <ShieldOff className="h-6 w-6 text-red-500" />
                        ) : (
                          <Clock className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 text-base leading-tight flex items-center gap-2 flex-wrap mb-1">
                          {item.titulo}
                          {item.obrigatoria && (
                            <Badge className="text-[8px] md:text-[9px] bg-red-50 text-red-600 border border-red-100 font-black uppercase tracking-wider h-5 md:h-6">
                              Obrigatório
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs md:text-sm text-slate-500 leading-relaxed line-clamp-2 md:line-clamp-1">{item.descricao_curta}</p>
                        {item.data_resposta && (
                          <p className="text-[10px] md:text-xs text-slate-400 mt-2 font-medium">
                             <CheckCircle2 size={12} className="inline mr-1" />
                             {isAutorizado ? 'Autorizado' : 'Revogado'} em {new Date(item.data_resposta).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                      {isAutorizado ? (
                        <Button
                          size="lg"
                          onClick={() => handleAbrirModal(item, 'revogar')}
                          className={cn(
                            "w-full md:w-auto h-12 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all",
                            item.obrigatoria
                              ? 'bg-slate-100 text-slate-400 border-0 md:bg-transparent md:border md:border-slate-100'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border-0 active:scale-95 md:bg-white md:border md:border-slate-200 md:text-slate-500 md:hover:bg-slate-50'
                          )}
                        >
                          Revogar Autorização
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          onClick={() => handleAbrirModal(item, 'autorizar')}
                          className="w-full md:w-auto h-12 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <ShieldCheck size={18} />
                          {isPendente ? 'Autorizar' : 'Reautorizar'}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })
    )}

      {/* Modal de Leitura e Confirmação */}
      <Dialog open={!!modalItem} onOpenChange={(open) => !open && setModalItem(null)}>
        <DialogContent className="w-full h-full max-w-none m-0 rounded-none border-0 p-0 md:p-6 md:rounded-2xl md:max-w-2xl md:h-auto md:max-h-[90vh] flex flex-col overflow-hidden">
            <VisuallyHidden.Root>
              <DialogTitle>{acao === 'autorizar' ? 'Autorizar' : 'Revogar'} - {modalItem?.titulo}</DialogTitle>
              <DialogDescription>Termo de consentimento e leitura obrigatória.</DialogDescription>
            </VisuallyHidden.Root>

            <div className="flex-1 flex flex-col min-h-0 bg-white">
              {/* Header Nativo */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-50">
                 <div className="flex items-center gap-3">
                    <div className={cn("hidden md:flex w-10 h-10 rounded-xl items-center justify-center", acao === 'autorizar' ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-600')}>
                      {acao === 'autorizar' ? <ShieldCheck size={20} /> : <ShieldOff size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg md:text-xl leading-tight uppercase tracking-tight md:normal-case md:tracking-normal">
                        {acao === 'autorizar' ? 'Autorizar' : 'Revogar'}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest md:hidden">Instrumento de Consentimento</p>
                    </div>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setModalItem(null)} className="rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
                   <X size={20} />
                 </Button>
              </div>

              <div className="px-6 pt-8 pb-4">
                 <h4 className="font-black text-slate-800 text-2xl md:text-xl leading-snug text-left">
                   {modalItem?.titulo}
                 </h4>
              </div>

            {acao === 'revogar' ? (
              <div className="px-6 space-y-4 py-4">
                <div className="bg-red-50 border border-red-100 rounded-3xl p-6">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="h-6 w-6 text-red-600 shrink-0 mt-1" />
                    <div className="space-y-2">
                       <p className="font-bold text-red-900 text-base">Você está revogando esta autorização</p>
                       <p className="text-sm text-red-700 leading-relaxed">
                         Ao confirmar, você <strong>desautoriza</strong> a escola de realizar a ação descrita neste termo de <em>"{modalItem?.descricao_curta}"</em>.
                       </p>
                       <div className="pt-2 border-t border-red-100">
                          <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest leading-normal">Ação registrada com data e hora para fins jurídicos.</p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5 min-h-0 flex-1 px-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <BookOpen className="h-4 w-4 text-emerald-500" />
                  Leia com atenção
                </div>
              
              {/* Texto com scroll */}
              <div
                ref={textoRef}
                className="bg-slate-50 rounded-2xl border border-slate-100 p-6 text-sm text-slate-700 leading-relaxed overflow-y-auto flex-1 min-h-[200px] max-h-[350px] prose prose-sm w-full box-border"
              >
                {modalItem?.texto_completo}
              </div>

              {!scrolledToBottom && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600 font-bold">
                  <ChevronDown className="h-4 w-4 animate-bounce" />
                  Role até o final do texto para habilitar a confirmação
                </p>
              )}

              {scrolledToBottom && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  Texto lido — você pode confirmar a autorização
                </div>
              )}
            </div>
          )}

          <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 space-y-3">
            <Button
              onClick={handleConfirmar}
              disabled={responder.isPending || (acao === 'autorizar' && !textoLido)}
              className={cn(
                "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg",
                acao === 'autorizar'
                  ? 'bg-teal-500 text-white shadow-teal-500/20'
                  : 'bg-slate-700 text-white shadow-slate-700/30'
              )}
            >
              {responder.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : acao === 'autorizar' ? (
                'Confirmar Aceite Agora'
              ) : (
                'Confirmar Revogação'
              )}
            </Button>
            <Button variant="ghost" onClick={() => setModalItem(null)} className="w-full text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:bg-transparent">
              Voltar sem autorizar
            </Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
