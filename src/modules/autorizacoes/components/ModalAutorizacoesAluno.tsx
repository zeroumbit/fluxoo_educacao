import React from 'react'
import { useResumoAutorizacoesPorAluno } from '@/modules/autorizacoes/hooks'
import { CATEGORIA_LABELS, CATEGORIA_CORES } from '@/modules/autorizacoes/service'
import { AdaptiveModal } from '@/components/adaptive/AdaptiveModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  alunoId: string | null
  alunoNome?: string
  open: boolean
  onClose: () => void
}

export function ModalAutorizacoesAluno({ alunoId, alunoNome, open, onClose }: Props) {
  const { data: autorizacoes = [], isLoading } = useResumoAutorizacoesPorAluno(alunoId)

  // Agrupa por categoria
  const agrupadas = (autorizacoes as any[]).reduce((acc: Record<string, any[]>, item: any) => {
    if (!acc[item.categoria]) acc[item.categoria] = []
    acc[item.categoria].push(item)
    return acc
  }, {})

  const total = autorizacoes.length
  const autorizadas = (autorizacoes as any[]).filter((a: any) => a.aceita === true).length
  const pendentes = (autorizacoes as any[]).filter((a: any) => a.aceita === null).length
  const recusadas = (autorizacoes as any[]).filter((a: any) => a.aceita === false).length

  const footerActions = (
    <Button variant="outline" onClick={onClose} className="w-full rounded-xl">
      Fechar
    </Button>
  )

  return (
    <AdaptiveModal
      open={open}
      onClose={onClose}
      title="Autorizações do Aluno"
      description={alunoNome ? `Situação das autorizações de ${alunoNome}` : 'Situação de todas as autorizações de responsáveis'}
      footer={footerActions}
      size="half"
      maxWidth="sm:max-w-[650px]"
    >
      <div className="space-y-4">
        {/* Stats rápidas */}
        <div className="flex gap-4 py-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-400"></div>
            <span className="text-sm font-bold text-slate-700">{autorizadas} autorizada(s)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-400"></div>
            <span className="text-sm font-bold text-slate-700">{pendentes} pendente(s)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-400"></div>
            <span className="text-sm font-bold text-slate-700">{recusadas} não autorizada(s)</span>
          </div>
        </div>

        {/* Barra de progresso global */}
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all"
            style={{ width: `${total > 0 ? (autorizadas / total) * 100 : 0}%` }}
          />
        </div>

        {/* Conteúdo */}
        <div className="space-y-6 pt-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
          ) : (
            Object.entries(agrupadas).map(([categoria, itens]) => {
              const cores = CATEGORIA_CORES[categoria] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
              return (
                <div key={categoria} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className={cn('text-[9px] uppercase tracking-widest font-black border', cores.bg, cores.text, cores.border)}>
                      {CATEGORIA_LABELS[categoria] || categoria}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {(itens as any[]).map((item: any) => {
                      const isAutorizado = item.aceita === true
                      const isRecusado = item.aceita === false

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center justify-between px-4 py-3 rounded-xl border text-sm",
                            isAutorizado ? 'bg-emerald-50 border-emerald-100' :
                            isRecusado ? 'bg-red-50 border-red-100' :
                            'bg-slate-50 border-slate-100'
                          )}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {isAutorizado ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            ) : isRecusado ? (
                              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                            ) : (
                              <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">{item.titulo}</p>
                              {item.data_resposta && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {isAutorizado ? 'Autorizado por' : 'Revogado por'} {item.responsavel_nome || '—'} em {new Date(item.data_resposta).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="ml-3 shrink-0">
                            {item.obrigatoria && (
                              <Badge className="text-[9px] bg-slate-100 text-slate-500 border border-slate-200 font-bold">
                                Obrigatório
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </AdaptiveModal>
  )
}
