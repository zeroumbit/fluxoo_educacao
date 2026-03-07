import React, { useState, useRef, useEffect } from 'react'
import { usePortalContext } from '../context'
import { useResponsavel } from '../hooks'
import { useAutorizacoesPortal, useResponderAutorizacao } from '@/modules/autorizacoes/hooks'
import { CATEGORIA_LABELS, CATEGORIA_CORES } from '@/modules/autorizacoes/service'
import {
  ShieldCheck, ShieldOff, Shield, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Clock, Loader2, ScrollText,
  BookOpen, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

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

export function PortalAutorizacoesPage() {
  const { alunoSelecionado, tenantId } = usePortalContext()
  const { data: responsavel } = useResponsavel()
  const { data: autorizacoes = [], isLoading } = useAutorizacoesPortal(alunoSelecionado?.id || null)
  const responder = useResponderAutorizacao()

  const [modalItem, setModalItem] = useState<AutorizacaoModelo | null>(null)
  const [acao, setAcao] = useState<'autorizar' | 'revogar' | null>(null)
  const [textoLido, setTextoLido] = useState(false)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const textoRef = useRef<HTMLDivElement>(null)

  // Detecta quando o responsável rolou até o fim do texto
  useEffect(() => {
    const el = textoRef.current
    if (!el || !modalItem) return
    setScrolledToBottom(false)
    setTextoLido(false)

    const handleScroll = () => {
      const isBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 24
      if (isBottom) {
        setScrolledToBottom(true)
        setTextoLido(true)
      }
    }
    el.addEventListener('scroll', handleScroll)
    // Para textos curtos que não precisam scrollar
    if (el.scrollHeight <= el.clientHeight + 24) {
      setScrolledToBottom(true)
      setTextoLido(true)
    }
    return () => el.removeEventListener('scroll', handleScroll)
  }, [modalItem])

  const handleAbrirModal = (item: AutorizacaoModelo, acaoTipo: 'autorizar' | 'revogar') => {
    setModalItem(item)
    setAcao(acaoTipo)
    setShowConfirm(false)
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Autorizações</h1>
        <p className="text-muted-foreground">
          Gerencie as autorizações de <strong>{alunoSelecionado.nome_completo}</strong>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-center">
          <p className="text-3xl font-black text-emerald-600">{totalAutorizadas}</p>
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mt-1">Autorizadas</p>
        </div>
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-center">
          <p className="text-3xl font-black text-amber-600">{totalPendentes}</p>
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mt-1">Pendentes</p>
        </div>
        <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-center">
          <p className="text-3xl font-black text-red-600">{totalRecusadas}</p>
          <p className="text-xs font-bold text-red-700 uppercase tracking-wider mt-1">Não Autorizadas</p>
        </div>
      </div>

      {/* Aviso */}
      <Card className="border-0 shadow-none bg-amber-50 border border-amber-100 rounded-2xl">
        <CardContent className="flex items-start gap-3 py-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800 text-sm">Sobre as autorizações</p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Para autorizar um item, você deve ler o texto completo do termo. Você pode revogar qualquer autorização quando quiser, exceto as obrigatórias para a matrícula. Todas as ações são registradas com data e hora para fins jurídicos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lista por categoria */}
      {categoriasOrdenadas.map((categoria) => {
        const itens = agrupadas[categoria]
        const cores = CATEGORIA_CORES[categoria] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
        return (
          <Card key={categoria} className="border-0 shadow-md">
            <CardHeader className="pb-3 pt-6">
              <div className="flex items-center gap-2">
                <Badge className={cn('text-[10px] uppercase tracking-widest font-black border', cores.bg, cores.text, cores.border)}>
                  {CATEGORIA_LABELS[categoria] || categoria}
                </Badge>
                <span className="text-xs text-slate-400">
                  {itens.filter(i => i.aceita === true).length}/{itens.length} autorizados
                </span>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-slate-50">
              {itens.map((item) => {
                const isAutorizado = item.aceita === true
                const isRecusado = item.aceita === false
                const isPendente = item.aceita === null

                return (
                  <div key={item.id} className="flex items-center justify-between py-4 gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn(
                        "mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                        isAutorizado ? 'bg-emerald-50' : isRecusado ? 'bg-red-50' : 'bg-slate-50'
                      )}>
                        {isAutorizado ? (
                          <ShieldCheck className="h-5 w-5 text-emerald-600" />
                        ) : isRecusado ? (
                          <ShieldOff className="h-5 w-5 text-red-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-sm leading-tight flex items-center gap-1 flex-wrap">
                          {item.titulo}
                          {item.obrigatoria && (
                            <Badge className="text-[9px] bg-red-50 text-red-600 border border-red-100 font-black uppercase tracking-wider">
                              Obrigatório
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.descricao_curta}</p>
                        {item.data_resposta && (
                          <p className="text-[10px] text-slate-400 mt-1">
                            {isAutorizado ? 'Autorizado' : 'Revogado'} em {new Date(item.data_resposta).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isAutorizado ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => !item.obrigatoria && handleAbrirModal(item, 'revogar')}
                          disabled={item.obrigatoria}
                          className={cn(
                            "rounded-xl text-xs font-bold",
                            item.obrigatoria
                              ? 'opacity-50 cursor-not-allowed border-slate-100 text-slate-400'
                              : 'border-red-100 text-red-600 hover:bg-red-50'
                          )}
                        >
                          Revogar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAbrirModal(item, 'autorizar')}
                          className="rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 shadow-md shadow-teal-500/20"
                        >
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
      })}

      {/* Modal de Leitura e Confirmação */}
      <Dialog open={!!modalItem} onOpenChange={(open) => !open && setModalItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {acao === 'autorizar' ? (
                <ShieldCheck className="h-5 w-5 text-teal-500" />
              ) : (
                <ShieldOff className="h-5 w-5 text-red-500" />
              )}
              {acao === 'autorizar' ? 'Autorizar' : 'Revogar Autorização'}
            </DialogTitle>
            <DialogDescription className="font-semibold text-slate-700 text-base mt-1">
              {modalItem?.titulo}
            </DialogDescription>
          </DialogHeader>

          {acao === 'revogar' ? (
            <div className="space-y-4 py-4">
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-800">Você está revogando esta autorização</p>
                    <p className="text-sm text-red-700 mt-1 leading-relaxed">
                      Ao confirmar, você <strong>desautoriza</strong> a escola de realizar a ação descrita neste termo: <em>"{modalItem?.descricao_curta}"</em>.
                    </p>
                    <p className="text-xs text-red-600 mt-2">Esta ação fica registrada com data e hora para fins jurídicos. Você pode reautorizar a qualquer momento.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 min-h-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <BookOpen className="h-4 w-4" />
                Leia o termo completo antes de autorizar
              </div>
              
              {/* Texto com scroll */}
              <div
                ref={textoRef}
                className="bg-slate-50 rounded-2xl border border-slate-100 p-5 text-sm text-slate-700 leading-relaxed overflow-y-auto flex-1 min-h-[200px] max-h-[300px] prose prose-sm"
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

          <DialogFooter className="gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setModalItem(null)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmar}
              disabled={
                responder.isPending ||
                (acao === 'autorizar' && !textoLido)
              }
              className={cn(
                "rounded-xl font-bold",
                acao === 'autorizar'
                  ? 'bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-500/20'
                  : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20'
              )}
            >
              {responder.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : acao === 'autorizar' ? (
                'Confirmar Autorização'
              ) : (
                'Confirmar Revogação'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
